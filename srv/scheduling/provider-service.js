"use strict";

const cds = require("@sap/cds");

const BaseApplicationService = require("../common/BaseApplicationService");

const { JobStatus } = require("./common/codelist");
const JobSchedulingError = require("./common/JobSchedulingError");

module.exports = class SchedulingProviderService extends BaseApplicationService {
  async init() {
    const { Job, JobParameter } = this.entities;
    const { JobDefinition: DBJobDefinition, Job: DBJob } = this.entities("scheduling");

    this.before("READ", "*", (req) => {
      delete req.query.SELECT.where;
      delete req.query.SELECT.orderBy;
      delete req.query.SELECT.columns;
      delete req.query.SELECT.limit;
      if (req.req?.query?.skip && isNaN(req.req?.query?.skip)) {
        return req.reject(JobSchedulingError.invalidOptionSkip(req.req.query.skip));
      }
      if (req.req?.query?.top && isNaN(req.req?.query?.top)) {
        return req.reject(JobSchedulingError.invalidOptionTop(req.req.query.top));
      }
      if (req.req?.query?.skip || req.req?.query?.top) {
        req.query.limit(Math.max(req.req.query.top, 1), Math.max(req.req.query.skip, 0));
      }
    });

    this.before("READ", [Job], (req) => {
      if (req.req?.query?.referenceID) {
        req.query.where({ referenceID: req.req.query.referenceID });
      }
    });

    this.before("READ", [JobParameter], (req) => {
      req.query.orderBy("jobID asc", "name asc");
    });

    this.on("CREATE", Job, async (req) => {
      // Definition
      const definitionName = req.data.name;
      const jobDefinition = await SELECT.one(DBJobDefinition, (jobDefinition) => {
        jobDefinition.name,
          jobDefinition.version,
          jobDefinition.parameters((jobParameterDefinition) => {
            jobParameterDefinition.name,
              jobParameterDefinition.type,
              jobParameterDefinition.dataType,
              jobParameterDefinition.value,
              jobParameterDefinition.required;
          });
      }).where({ name: definitionName });
      if (!jobDefinition) {
        return req.reject(JobSchedulingError.jobDefinitionNotFound(definitionName));
      }
      if (!req.data.referenceID) {
        return req.reject(JobSchedulingError.referenceIDMissing());
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
            parameter.value !== jobParameterDefinition.value
          ) {
            return req.reject(JobSchedulingError.jobParameterReadOnly(jobParameterDefinition.name));
          }
          if (parameter.value === undefined) {
            parameter.value = jobParameterDefinition.value;
          }
        }
        if (parameter.value === undefined && jobParameterDefinition.required) {
          return req.reject(JobSchedulingError.jobParameterValueRequired(parameter.name));
        }
        if (parameter.value !== null) {
          switch (jobParameterDefinition.dataType_code) {
            case "string":
            default:
              break;
            case "number":
              if (String(parseFloat(parameter.value)) !== parameter.value) {
                return req.reject(
                  JobSchedulingError.jobParameterValueInvalidType(
                    parameter.value,
                    parameter.name,
                    jobParameterDefinition.dataType_code,
                  ),
                );
              }
              break;
            case "datetime":
              if (isNaN(new Date(parameter.value).getTime())) {
                return req.reject(
                  JobSchedulingError.jobParameterValueInvalidType(
                    parameter.value,
                    parameter.name,
                    jobParameterDefinition.dataType_code,
                  ),
                );
              }
              break;
            case "boolean":
              if (!["true", "false"].includes(parameter.value)) {
                return req.reject(
                  JobSchedulingError.jobParameterValueInvalidType(
                    parameter.value,
                    parameter.name,
                    jobParameterDefinition.dataType_code,
                  ),
                );
              }
              break;
          }
          job.parameters.push({
            definition_name: parameter.name,
            definition_job_name: job.definition_name,
            value: parameter.value,
          });
        }
      }

      await INSERT.into(DBJob).entries(job);
      return await this.read(Job, job.ID);
    });

    this.after("CREATE", Job, async (data, req) => {
      delete data.parameters;
      const schedulingWebsocketService = await cds.connect.to("SchedulingWebsocketService");
      await schedulingWebsocketService.tx(req).emit("jobStatusChanged", {
        ID: data.ID,
        status: data.status,
      });

      const schedulingProcessingService = await cds.connect.to("SchedulingProcessingService");
      await schedulingProcessingService.tx(req).send(
        "processJob",
        {
          ID: data.ID,
        },
        {
          "x-eventQueue-startAfter": data.startDateTime,
          "x-eventQueue-referenceEntityKey": data.ID,
        },
      );
    });

    this.on(Job.actions.cancel, Job, async (req) => {
      const ID = req.params[0];
      const job = await SELECT.one(Job).where({ ID });
      if (!job) {
        return req.reject(JobSchedulingError.jobNotFound(ID));
      }

      if (![JobStatus.requested, JobStatus.running].includes(job.status)) {
        return req.reject(JobSchedulingError.jobCannotBeCanceled(job.status));
      }

      await UPDATE.entity(DBJob)
        .set({
          status_code: JobStatus.cancelRequested,
        })
        .where({ ID });

      const schedulingWebsocketService = await cds.connect.to("SchedulingWebsocketService");
      await schedulingWebsocketService.tx(req).emit(
        "jobStatusChanged",
        {
          ID: job.ID,
          status: JobStatus.cancelRequested,
        },
        {
          "x-eventQueue-referenceEntityKey": job.ID,
        },
      );

      const schedulingProcessingService = await cds.connect.to("SchedulingProcessingService");
      await schedulingProcessingService.tx(req).send(
        "cancelJob",
        {
          ID: job.ID,
        },
        {
          "x-eventQueue-referenceEntityKey": job.ID,
        },
      );
    });

    return super.init();
  }
};
