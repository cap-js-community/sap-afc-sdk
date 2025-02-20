"use strict";

const cds = require("@sap/cds");
const { Readable } = require("stream");
const { text } = require("node:stream/consumers");

const BaseApplicationService = require("../common/BaseApplicationService");

const { JobStatus, ResultType, MessageSeverity } = require("./common/codelist");
const JobSchedulingError = require("./common/JobSchedulingError");

const STATUS_TRANSITIONS = {
  [JobStatus.requested]: [JobStatus.running, JobStatus.cancelRequested, JobStatus.canceled],
  [JobStatus.running]: [
    JobStatus.completed,
    JobStatus.completedWithWarning,
    JobStatus.completedWithError,
    JobStatus.failed,
    JobStatus.cancelRequested,
  ],
  [JobStatus.completed]: [],
  [JobStatus.completedWithWarning]: [],
  [JobStatus.completedWithError]: [],
  [JobStatus.failed]: [],
  [JobStatus.cancelRequested]: [
    JobStatus.completed,
    JobStatus.completedWithWarning,
    JobStatus.completedWithError,
    JobStatus.failed,
    JobStatus.canceled,
  ],
  [JobStatus.canceled]: [],
};

module.exports = class SchedulingProcessingService extends BaseApplicationService {
  constructor(...args) {
    super(...args);
    this.statusTransitions = STATUS_TRANSITIONS;
  }

  async init() {
    const { Job } = this.entities("scheduling");
    const { processJob, updateJob, cancelJob } = this.operations;

    this.before([processJob, updateJob, cancelJob], async (req) => {
      const ID = req.data.ID;
      const job = await SELECT.one(Job).where({ ID });
      if (!job) {
        return req.reject(JobSchedulingError.jobNotFound(ID));
      }
      req.job = job;
    });

    this.on(processJob, async (req, next) => {
      await this.processJobUpdate(req, JobStatus.running);
      const processingConfig = cds.env.requires?.["sap-afc-sdk"]?.mockProcessing;
      if (processingConfig) {
        await this.mockJobProcessing(req, processingConfig);
      }
    });

    this.on(updateJob, async (req, next) => {
      await this.processJobUpdate(req, req.data.status, req.data.results);
    });

    this.on(cancelJob, async (req, next) => {
      await this.processJobUpdate(req, JobStatus.canceled);
    });

    return super.init();
  }

  async processJobUpdate(req, status, results) {
    const { Job, JobResult } = this.entities("scheduling");
    const job = req.job;
    if (!status) {
      return req.reject(JobSchedulingError.statusValueMissing());
    }
    if (!JobStatus[status]) {
      return req.reject(JobSchedulingError.invalidJobStatus(status));
    }
    if (job.status_code === status) {
      return;
    }
    if (!(await this.checkStatusTransition(req, job.status_code, status))) {
      return req.reject(JobSchedulingError.statusTransitionNotAllowed(job.status_code, status));
    }
    await UPDATE.entity(Job)
      .set({
        status_code: status,
      })
      .where({ ID: job.ID });
    if (results && results.length > 0) {
      for (const result of results) {
        if (result.data) {
          if (Buffer.isBuffer(result.data)) {
            result.data = btoa(result.data);
          } else if (result.data instanceof Readable) {
            result.data = btoa(await text(result.data));
          }
        }
      }
      const insertResults = await this.checkJobResults(req, results);
      await INSERT.into(JobResult).entries(insertResults);
    }
    const schedulingWebsocketService = await cds.connect.to("SchedulingWebsocketService");
    await schedulingWebsocketService.tx(req).emit(
      "jobStatusChanged",
      {
        ID: job.ID,
        status,
      },
      {
        "x-eventQueue-referenceEntityKey": job.ID,
      },
    );
  }

  async checkStatusTransition(req, statusBefore, statusAfter) {
    return this.statusTransitions[statusBefore].includes(statusAfter);
  }

  async checkJobResults(req, results) {
    const job = req.job;
    return results.map((result) => {
      if (!result.name) {
        return req.reject(JobSchedulingError.resultNameMissing());
      }
      if (!result.type) {
        return req.reject(JobSchedulingError.resultTypeMissing());
      }
      switch (result.type) {
        case ResultType.link:
          if (!result.link) {
            return req.reject(JobSchedulingError.linkMissing());
          }
          if (result.mimeType) {
            return req.reject(JobSchedulingError.mimeTypeNotAllowed(result.type));
          }
          if (result.filename) {
            return req.reject(JobSchedulingError.filenameNotAllowed(result.type));
          }
          if (result.data) {
            return req.reject(JobSchedulingError.dataNotAllowed(result.type));
          }
          if (result.messages) {
            return req.reject(JobSchedulingError.messagesNotAllowed(result.type));
          }
          break;
        case ResultType.data:
          if (!result.mimeType) {
            return req.reject(JobSchedulingError.mimeTypeMissing());
          }
          if (!result.filename) {
            return req.reject(JobSchedulingError.filenameMissing());
          }
          if (!result.data) {
            return req.reject(JobSchedulingError.dataMissing());
          }
          if (result.link) {
            return req.reject(JobSchedulingError.linkNotAllowed(result.type));
          }
          if (result.messages) {
            return req.reject(JobSchedulingError.messagesNotAllowed(result.type));
          }
          break;
        case ResultType.message:
          if (!(result?.messages?.length > 0)) {
            return req.reject(JobSchedulingError.messagesMissing());
          }
          for (const message of result.messages) {
            if (!message.text) {
              return req.reject(JobSchedulingError.textMissing());
            }
            if (!message.severity) {
              return req.reject(JobSchedulingError.severityMissing());
            }
            if (!MessageSeverity[message.severity]) {
              return req.reject(JobSchedulingError.invalidMessageSeverity(message.severity));
            }
          }
          if (result.link) {
            return req.reject(JobSchedulingError.linkNotAllowed(result.type));
          }
          if (result.mimeType) {
            return req.reject(JobSchedulingError.mimeTypeNotAllowed(result.type));
          }
          if (result.filename) {
            return req.reject(JobSchedulingError.filenameNotAllowed(result.type));
          }
          if (result.data) {
            return req.reject(JobSchedulingError.dataNotAllowed(result.type));
          }
          break;
        default:
          return req.reject(JobSchedulingError.invalidResultType(result.type));
      }
      return {
        job_ID: job.ID,
        name: result.name,
        type_code: result.type,
        link: result.link,
        mimeType: result.mimeType,
        filename: result.filename,
        data: result.data,
        messages: (result.messages || []).map((message) => {
          return {
            text: message.text,
            severity_code: message.severity,
          };
        }),
      };
    });
  }

  async mockJobProcessing(req, config) {
    let min = config.min ?? 0;
    let max = config.max ?? 30;
    const processingTime = (Math.floor(Math.random() * (max - min)) + min) * 1000;
    let processingStatus = config.default ?? JobStatus.completed;
    if (config.status && Object.keys(config.status).length > 0) {
      const statuses = Object.keys(config.status);
      min = 0;
      max = statuses.reduce((sum, status) => {
        return sum + config.status[status];
      }, 0);
      const statusValue = Math.random() * (max - min) + min;
      let value = 0;
      for (const status of statuses) {
        processingStatus = status;
        value += config.status[status];
        if (statusValue <= value) {
          break;
        }
      }
    }
    const ID = req.data.ID;
    const results = [];
    switch (processingStatus) {
      case JobStatus.completed:
        results.push(
          {
            type: ResultType.link,
            name: "Link",
            link: "https://sap.com",
          },
          {
            type: ResultType.message,
            name: "Result",
            messages: [
              {
                text: "Job completed successfully",
                severity: MessageSeverity.info,
              },
            ],
          },
        );
        break;
      case JobStatus.completedWithWarning:
        results.push({
          type: ResultType.message,
          name: "Result",
          messages: [
            {
              text: "A warning occurred during job processing",
              severity: MessageSeverity.warning,
            },
          ],
        });
        break;
      case JobStatus.completedWithError:
        results.push({
          type: ResultType.message,
          name: "Result",
          messages: [
            {
              text: "An error occurred during job processing",
              severity: MessageSeverity.error,
            },
          ],
        });
        break;
      case JobStatus.failed:
        break;
    }
    const srv = cds.outboxed(this);
    return await srv.send(
      "updateJob",
      {
        ID,
        status: processingStatus,
        results,
      },
      {
        "x-eventQueue-referenceEntityKey": ID,
        "x-eventQueue-startAfter": new Date(Date.now() + processingTime),
      },
    );
  }

  /*async reportStatus(req, status) {
    const afc = await cds.connect.to("afc");
    return await afc.tx(req).reportStatus(status);
  }*/
};
