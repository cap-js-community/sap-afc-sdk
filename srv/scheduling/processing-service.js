"use strict";

const cds = require("@sap/cds");

const BaseApplicationService = require("../common/BaseApplicationService");

const { JobStatus, JobResultType, MessageSeverity } = require("./common/codelist");
const JobSchedulingError = require("./common/JobSchedulingError");

const STATUS_TRANSITIONS = {
  [JobStatus.requested]: [JobStatus.running, JobStatus.cancelRequested, JobStatus.canceled],
  [JobStatus.running]: [
    JobStatus.completed,
    JobStatus.completedWithError,
    JobStatus.completedWithWarning,
    JobStatus.failed,
    JobStatus.cancelRequested,
  ],
  [JobStatus.completed]: [],
  [JobStatus.completedWithError]: [],
  [JobStatus.completedWithWarning]: [],
  [JobStatus.failed]: [],
  [JobStatus.cancelRequested]: [
    JobStatus.completed,
    JobStatus.completedWithError,
    JobStatus.completedWithWarning,
    JobStatus.failed,
    JobStatus.canceled,
  ],
  [JobStatus.canceled]: [],
};

module.exports = class SchedulingProcessingService extends BaseApplicationService {
  async init() {
    const { Job } = this.entities("scheduling");
    const { processJob, updateJob, cancelJob } = this.operations;

    this.statusTransitions = STATUS_TRANSITIONS;

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
    if (req.job.status_code === status) {
      return;
    }
    if (!(await this.checkStatusTransition(req, req.job.status_code, status))) {
      return req.reject(JobSchedulingError.statusTransitionNotAllowed(req.job.status_code, status));
    }
    await UPDATE.entity(Job)
      .set({
        status_code: status,
      })
      .where({ ID: job.ID });
    if (results && results.length > 0) {
      const insertResults = await this.checkJobResult(req, results);
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

  async checkJobResult(req, result) {
    const job = req.job;
    return (result || []).map((entry) => {
      if (!entry.name) {
        return req.reject(JobSchedulingError.resultNameMissing());
      }
      if (!entry.type) {
        return req.reject(JobSchedulingError.resultTypeMissing());
      }
      switch (entry.type) {
        case JobResultType.link:
          if (!entry.link) {
            return req.reject(JobSchedulingError.linkMissing());
          }
          if (entry.mimeType) {
            return req.reject(JobSchedulingError.mimeTypeNotAllowed(entry.type));
          }
          if (entry.filename) {
            return req.reject(JobSchedulingError.filenameNotAllowed(entry.type));
          }
          if (entry.data) {
            return req.reject(JobSchedulingError.dataNotAllowed(entry.type));
          }
          if (entry.messages) {
            return req.reject(JobSchedulingError.messagesNotAllowed(entry.type));
          }
          break;
        case JobResultType.data:
          if (!entry.mimeType) {
            return req.reject(JobSchedulingError.mimeTypeMissing());
          }
          if (!entry.filename) {
            return req.reject(JobSchedulingError.filenameMissing());
          }
          if (!entry.data) {
            return req.reject(JobSchedulingError.dataMissing());
          }
          if (entry.link) {
            return req.reject(JobSchedulingError.linkNotAllowed(entry.type));
          }
          if (entry.messages) {
            return req.reject(JobSchedulingError.messagesNotAllowed(entry.type));
          }
          break;
        case JobResultType.message:
          if (!(entry?.messages.length > 0)) {
            return req.reject(JobSchedulingError.messagesMissing());
          }
          for (const message of entry.messages) {
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
          if (entry.link) {
            return req.reject(JobSchedulingError.linkNotAllowed(entry.type));
          }
          if (entry.mimeType) {
            return req.reject(JobSchedulingError.mimeTypeNotAllowed(entry.type));
          }
          if (entry.filename) {
            return req.reject(JobSchedulingError.filenameNotAllowed(entry.type));
          }
          if (entry.data) {
            return req.reject(JobSchedulingError.dataNotAllowed(entry.type));
          }
          break;
        default:
          return req.reject(JobSchedulingError.invalidResultType(entry.type));
      }
      return {
        job_ID: job.ID,
        name: entry.name,
        type_code: entry.type,
        link: entry.link,
        mimeType: entry.mimeType,
        filename: entry.filename,
        data: entry.data,
        messages: (entry.messages || []).map((message) => {
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
    let processingStatus = JobStatus.completed;
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
            type: JobResultType.link,
            name: "Link",
            link: "https://www.sap.com",
          },
          {
            type: JobResultType.message,
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
      case JobStatus.completedWithError:
        results.push({
          type: JobResultType.message,
          name: "Result",
          messages: [
            {
              text: "An error occurred during job processing",
              severity: MessageSeverity.error,
            },
          ],
        });
        break;
      case JobStatus.completedWithWarning:
        results.push({
          type: JobResultType.message,
          name: "Result",
          messages: [
            {
              text: "A warning occurred during job processing",
              severity: MessageSeverity.warning,
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
