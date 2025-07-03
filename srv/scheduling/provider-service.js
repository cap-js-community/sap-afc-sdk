"use strict";

const cds = require("@sap/cds");

const BaseApplicationService = require("../common/BaseApplicationService");

const { JobStatus, MappingType, DataType } = require("./common/codelist");
const JobSchedulingError = require("./common/JobSchedulingError");
const { wildcard, toMap } = require("../../src/util/helper");

const isUUID = (input) =>
  input && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input);

module.exports = class SchedulingProviderService extends BaseApplicationService {
  async init() {
    const { JobDefinition, JobParameterDefinition, Job, JobParameter, JobResult, JobResultMessage } = this.entities;
    const { JobDefinition: DBJobDefinition, Job: DBJob } = this.entities("scheduling");

    this.before("READ", [JobParameterDefinition, JobParameter, JobResultMessage], (req) => {
      if (req.subject?.ref?.length <= 1) {
        return req.reject(JobSchedulingError.accessOnlyViaParent());
      }
    });

    this.before("READ", [JobResult], (req) => {
      if (req.params.length === 0) {
        return req.reject(JobSchedulingError.accessOnlyByKey());
      }
    });

    this.before("READ", (req) => {
      req.query.SELECT.where = undefined;
      req.query.SELECT.orderBy = Object.keys(req.target.keys).reduce((orderBy, key) => {
        orderBy.push({ ref: [key], sort: "asc" });
        return orderBy;
      }, []);
      req.query.SELECT.columns = ["*"];
      delete req.query.SELECT.limit;
      if (req.req?.query?.skip && isNaN(req.req?.query?.skip)) {
        return req.reject(JobSchedulingError.invalidOption(req.req.query.skip, "skip"));
      }
      if (req.req?.query?.top && isNaN(req.req?.query?.top)) {
        return req.reject(JobSchedulingError.invalidOption(req.req.query.top, "top"));
      }
      let top = parseInt(req.req?.query?.top ?? cds.env.query.limit.max);
      top = top <= 0 ? 1 : Math.min(top, cds.env.query.limit.max);
      const skip = Math.max(parseInt(req.req?.query?.skip) || 0, 0);
      req.query.limit(top, skip);
    });

    this.before("READ", JobDefinition, (req) => {
      if (req.req?.query?.name) {
        req.query.where(`name like '${wildcard(req.req.query.name)}'`);
      }
      if (req.req?.query?.search) {
        const search = `%${req.req.query.search}%`;
        req.query
          .where(`lower(name) like lower('${search}')`)
          .or(`lower(description) like lower('${search}')`)
          .or(`lower(longDescription) like lower('${search}')`);
      }
    });

    this.before("READ", Job, (req) => {
      if (req.req?.query?.referenceID) {
        req.query.where({ referenceID: req.req.query.referenceID });
      }
      if (req.req?.query?.name) {
        req.query.where({ name: req.req.query.name });
      }
    });

    this.before("READ", [JobParameter, JobResult], (req) => {
      delete req.query.SELECT.orderBy;
      req.query.orderBy("jobID asc", "name asc");
    });

    this.before("READ", JobResultMessage, (req) => {
      delete req.query.SELECT.orderBy;
      req.query.orderBy("resultID asc", "code asc");
    });

    this.on("READ", [JobParameterDefinition, JobParameter], async (req, next) => {
      const data = await next();
      let parameters = {};
      if (req.data.jobName) {
        parameters = toMap(data);
      }
      if (req.data.jobID) {
        const job = await SELECT.one(DBJob, (job) => {
          (job.ID,
            job.definition((jobDefinition) => {
              (jobDefinition.name,
                jobDefinition.parameters((jobParameterDefinition) => {
                  (jobParameterDefinition.name, jobParameterDefinition.dataType_code.as("dataType"));
                }));
            }));
        }).where({ ID: req.data.jobID });
        parameters = toMap(job.definition.parameters);
      }
      for (const row of data) {
        if (parameters[row.name]?.dataType === DataType.boolean) {
          row.value = row.value === "true";
        } else if (parameters[row.name]?.dataType === DataType.number) {
          row.value = parseFloat(row.value);
        }
      }
    });

    this.before("CREATE", Job, async (req) => {
      // Definition
      const definitionName = req.data.name;
      const jobDefinition = await SELECT.one(DBJobDefinition, (jobDefinition) => {
        (jobDefinition`.*`,
          jobDefinition.parameters((jobParameterDefinition) => {
            jobParameterDefinition`.*`;
          }));
      }).where({ name: definitionName });
      if (!jobDefinition) {
        return req.reject(JobSchedulingError.jobDefinitionNotFound(definitionName));
      }
      // Reference ID
      if (!req.data.referenceID) {
        return req.reject(JobSchedulingError.referenceIDMissing());
      }
      if (!isUUID(req.data.referenceID)) {
        return req.reject(JobSchedulingError.referenceIDNoUUID(req.data.referenceID));
      }

      // Results
      if (req.data.results) {
        return req.reject(JobSchedulingError.jobResultsReadOnly());
      }

      // Start Date & Time
      if (req.data.startDateTime && !jobDefinition.supportsStartDateTime) {
        return req.reject(JobSchedulingError.startDateTimeNotSupported(jobDefinition.name));
      }

      // Header
      const job = {
        referenceID: req.data.referenceID,
        startDateTime: req.data.startDateTime,
        definition_name: definitionName,
        version: jobDefinition?.version,
        status_code: JobStatus.requested,
        parameters: [],
      };

      // Parameters
      const parameterDefinitions = {};
      for (const parameterDefinition of jobDefinition.parameters) {
        parameterDefinitions[parameterDefinition.name] = parameterDefinition;
      }
      const parameters = {};
      for (const parameter of req.data.parameters ?? []) {
        if (!parameter.name) {
          return req.reject(JobSchedulingError.jobParameterNameMissing());
        }
        if (!parameterDefinitions[parameter.name]) {
          return req.reject(JobSchedulingError.jobParameterNotKnown(parameter.name));
        }
        parameters[parameter.name] = parameter;
      }
      for (const jobParameterDefinition of jobDefinition.parameters) {
        const parameter = parameters[jobParameterDefinition.name];
        if (!parameter && jobParameterDefinition.required) {
          return req.reject(JobSchedulingError.jobParameterRequired(jobParameterDefinition.name));
        }
        if (!parameter) {
          continue;
        }
        if (jobParameterDefinition.type_code !== "mapping") {
          if (
            jobParameterDefinition.type_code === "readOnlyValue" &&
            parameter.value !== undefined &&
            String(parameter.value) !== String(jobParameterDefinition.value)
          ) {
            return req.reject(JobSchedulingError.jobParameterReadOnly(jobParameterDefinition.name));
          }
        }
        if (parameter.value === undefined) {
          parameter.value = jobParameterDefinition.value;
        }
        if ((parameter.value === undefined || parameter.value === null) && jobParameterDefinition.required) {
          return req.reject(JobSchedulingError.jobParameterValueRequired(parameter.name));
        }
        if (parameter.value !== undefined && parameter.value !== null) {
          let parsedValue;
          switch (jobParameterDefinition.dataType_code) {
            case "string":
            default:
              parameter.value = String(parameter.value);
              break;
            case "number":
              parsedValue = parseFloat(parameter.value);
              if (isNaN(parsedValue)) {
                return req.reject(
                  JobSchedulingError.jobParameterValueInvalidType(
                    parameter.value,
                    parameter.name,
                    jobParameterDefinition.dataType_code,
                  ),
                );
              }
              parameter.value = parsedValue;
              break;
            case "datetime":
              parsedValue = new Date(parameter.value);
              if (isNaN(parsedValue.getTime())) {
                return req.reject(
                  JobSchedulingError.jobParameterValueInvalidType(
                    parameter.value,
                    parameter.name,
                    jobParameterDefinition.dataType_code,
                  ),
                );
              }
              parameter.value = parsedValue.toISOString();
              break;
            case "boolean":
              parsedValue = String(parameter.value);
              if (!["true", "false"].includes(parsedValue)) {
                return req.reject(
                  JobSchedulingError.jobParameterValueInvalidType(
                    parameter.value,
                    parameter.name,
                    jobParameterDefinition.dataType_code,
                  ),
                );
              }
              parameter.value = parsedValue === "true";
              break;
          }
        }
        job.parameters.push({
          definition_name: parameter.name,
          definition_job_name: job.definition_name,
          value: parameter.value,
        });
      }

      if (jobDefinition.supportsTestRun) {
        const testRunParameterDefinition = jobDefinition.parameters.find((parameter) => {
          return parameter.mappingType_code === MappingType.testRun;
        });
        const testRunParameter = job.parameters.find((parameter) => {
          return parameter.definition_name === testRunParameterDefinition?.name;
        });
        job.testRun = !!testRunParameter?.value;
      }

      req.jobDefinition = jobDefinition;
      req.job = job;
    });

    this.on("CREATE", Job, async (req) => {
      await this.createJob(req, req.job);
      return await this.read(Job, req.job.ID);
    });

    this.after("CREATE", Job, async (data, req) => {
      const schedulingProcessingService = await cds.connect.to("SchedulingProcessingService");
      await schedulingProcessingService.tx(req).send(
        "processJob",
        {
          ID: data.ID,
          testRun: data.testRun,
        },
        {
          "x-eventQueue-startAfter": data.startDateTime,
          "x-eventQueue-referenceEntityKey": data.ID,
        },
      );
      const schedulingWebsocketService = await cds.connect.to("SchedulingWebsocketService");
      await schedulingWebsocketService.tx(req).emit(
        "jobStatusChanged",
        {
          IDs: [data.ID],
          status: data.status,
        },
        {
          "x-eventQueue-referenceEntityKey": data.ID,
        },
      );
      delete data.parameters;
    });

    this.before(Job.actions.cancel, Job, async (req) => {
      const ID = req.params[0].ID;
      const job = await SELECT.one(Job).where({ ID });
      if (!job) {
        return req.reject(JobSchedulingError.jobNotFound(ID));
      }
      if (![JobStatus.requested, JobStatus.running].includes(job.status)) {
        return req.reject(JobSchedulingError.jobCannotBeCanceled(job.status));
      }
      req.job = job;
    });

    this.on(Job.actions.cancel, Job, async (req) => {
      await this.updateJob(req, req.job, {
        status_code: JobStatus.cancelRequested,
      });
    });

    this.after(Job.actions.cancel, Job, async (data, req) => {
      const schedulingProcessingService = await cds.connect.to("SchedulingProcessingService");
      await schedulingProcessingService.tx(req).send(
        "cancelJob",
        {
          ID: req.job.ID,
        },
        {
          "x-eventQueue-referenceEntityKey": req.job.ID,
        },
      );
      const schedulingWebsocketService = await cds.connect.to("SchedulingWebsocketService");
      await schedulingWebsocketService.tx(req).emit(
        "jobStatusChanged",
        {
          IDs: [req.job.ID],
          status: JobStatus.cancelRequested,
        },
        {
          "x-eventQueue-referenceEntityKey": req.job.ID,
        },
      );
    });

    this.before(JobResult.actions.data, JobResult, async (req) => {
      const ID = req.params[0].ID;
      const jobResult = await SELECT.one(JobResult).where({ ID });
      if (!jobResult) {
        return req.reject(JobSchedulingError.jobResultNotFound(ID));
      }
      req.jobResult = jobResult;
    });

    this.on(JobResult.actions.data, JobResult, async (req) => {
      return await this.downloadData(req, req.jobResult.ID);
    });

    return super.init();
  }

  async createJob(req, job) {
    const { Job: DBJob } = this.entities("scheduling");
    for (const parameter of job.parameters) {
      if (parameter.value !== null) {
        parameter.value = String(parameter.value);
      }
    }
    await INSERT.into(DBJob).entries(job);
  }

  async updateJob(req, job, data) {
    const { Job: DBJob } = this.entities("scheduling");
    await UPDATE.entity(DBJob).set(data).where({ ID: job.ID });
  }

  async downloadData(req, ID) {
    const { JobResult: DBJobResult } = this.entities("scheduling");
    const { data } = await SELECT.one.from(DBJobResult).columns("data").where({ ID });
    return {
      value: data,
      $mediaContentType: req.jobResult.mimeType,
      $mediaContentDispositionFilename: req.jobResult.filename,
      $mediaContentDispositionType: DBJobResult.elements.data?.["@Core.ContentDisposition.Type"],
    };
  }
};
