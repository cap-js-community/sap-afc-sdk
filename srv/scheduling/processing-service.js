"use strict";

const cds = require("@sap/cds");
const fs = require("fs");
const path = require("path");

const BaseApplicationService = require("../common/BaseApplicationService");
const JobSchedulingError = require("./common/JobSchedulingError");
const { JobStatus, ResultType, MessageSeverity } = require("./common/codelist");
const { messageLocales } = require("../../src/util/helper");

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
    const { Job } = cds.entities("sapafcsdk.scheduling");
    const { processJob, updateJob, cancelJob, syncJob, notify } = this.operations;

    this.before([processJob, updateJob, cancelJob], async (req) => {
      const ID = req.data.ID;
      const job = await SELECT.one(Job, (job) => {
        (job`.*`,
          job.parameters((parameter) => {
            parameter`.*`;
          }));
      }).where({ ID });
      if (!job) {
        return req.reject(JobSchedulingError.jobNotFound(ID));
      }
      req.job = job;
    });

    this.on(processJob, async (req, next) => {
      const processingConfig = cds.env.requires?.["sap-afc-sdk"]?.mockProcessing;
      let results = [];
      if (processingConfig) {
        results = await this.mockJobProcessing(req, req.job, processingConfig);
      }
      await this.processJobUpdate(req, req.job, JobStatus.running, results);
    });

    this.on(updateJob, async (req, next) => {
      await this.processJobUpdate(req, req.job, req.data.status, req.data.results);
    });

    this.on(cancelJob, async (req, next) => {
      await this.processJobUpdate(req, req.job, JobStatus.canceled);
    });

    this.on(syncJob, async (req, next) => {
      const processingConfig = cds.env.requires?.["sap-afc-sdk"]?.mockProcessing;
      if (processingConfig) {
        await this.mockJobSync(req);
      }
    });

    this.on(notify, async (req, next) => {
      const processingConfig = cds.env.requires?.["sap-afc-sdk"]?.mockProcessing;
      if (processingConfig) {
        await this.mockNotification(req);
      }
    });

    return super.init();
  }

  async processJobUpdate(req, job, status, results) {
    const { Job, JobResult } = cds.entities("sapafcsdk.scheduling");
    if (!status) {
      return req.reject(JobSchedulingError.statusValueMissing());
    }
    if (!JobStatus[status]) {
      return req.reject(JobSchedulingError.invalidJobStatus(status));
    }
    let statusChanged = false;
    if (job.status_code !== status) {
      if (!(await this.checkStatusTransition(req, job, job.status_code, status))) {
        return req.reject(JobSchedulingError.statusTransitionNotAllowed(job.status_code, status));
      }
      job.status_code = status;
      await UPDATE.entity(Job)
        .set({
          status_code: status,
        })
        .where({ ID: job.ID });
      statusChanged = true;
    }
    if (results?.length > 0) {
      const insertResults = await this.checkJobResults(req, job, results);
      await INSERT.into(JobResult).entries(insertResults);
    }
    if (statusChanged) {
      const schedulingWebsocketService = await cds.connect.to("sapafcsdk.scheduling.WebsocketService");
      await schedulingWebsocketService.tx(req).emit(
        "jobStatusChanged",
        {
          IDs: [job.ID],
          status,
        },
        {
          "x-eventQueue-referenceEntityKey": job.ID,
        },
      );
    }
  }

  async checkStatusTransition(req, job, statusBefore, statusAfter) {
    return this.statusTransitions[statusBefore].includes(statusAfter);
  }

  async checkJobResults(req, job, results) {
    const locales = messageLocales();
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
            return req.reject(JobSchedulingError.linkMissing(result.type));
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
            return req.reject(JobSchedulingError.mimeTypeMissing(result.type));
          }
          if (!result.filename) {
            return req.reject(JobSchedulingError.filenameMissing(result.type));
          }
          if (!result.data) {
            return req.reject(JobSchedulingError.dataMissing(result.type));
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
            return req.reject(JobSchedulingError.messagesMissing(result.type));
          }
          for (const message of result.messages) {
            if (!message.code) {
              return req.reject(JobSchedulingError.codeMissing());
            }
            message.values ||= [];
            if (!message.text) {
              const text = cds.i18n.messages.at(message.code, cds.env.i18n.default_language, message.values);
              if (!text) {
                return req.reject(JobSchedulingError.textMissing());
              }
              message.text = text;
            }
            if (!message.texts) {
              message.texts = locales.map((locale) => {
                return {
                  locale,
                  text: cds.i18n.messages.at(message.code, locale, message.values),
                };
              });
            } else {
              for (const text of message.texts) {
                if (!text.locale) {
                  return req.reject(JobSchedulingError.localeMissing());
                }
                if (!locales.includes(text.locale)) {
                  return req.reject(JobSchedulingError.invalidLocale(text.locale));
                }
                if (!text.text) {
                  text.text = cds.i18n.messages.at(message.code, text.locale, message.values);
                }
              }
            }
            if (!message.severity) {
              return req.reject(JobSchedulingError.severityMissing());
            }
            if (!MessageSeverity[message.severity]) {
              return req.reject(JobSchedulingError.invalidMessageSeverity(message.severity));
            }
            if (!message.createdAt) {
              message.createdAt = new Date().toISOString();
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
            code: message.code,
            values: message.values,
            text: message.text,
            severity_code: message.severity,
            createdAt: message.createdAt,
            texts: message.texts
              .map((text) => {
                return {
                  locale: text.locale,
                  text: text.text,
                };
              })
              .filter((text) => text.locale && text.text),
          };
        }),
      };
    });
  }

  async mockJobProcessing(req, job, config) {
    let min = config.min ?? 0;
    let max = config.max ?? 10;
    let processingTime = (Math.floor(Math.random() * (max - min)) + min) * 1000;
    let processingStatus = config.default ?? JobStatus.completed;
    let advancedMock = false;
    if (config.status && Object.keys(config.status).length > 0) {
      advancedMock = true;
      const statuses = Object.keys(config.status);
      min = 0;
      max = statuses.reduce((sum, status) => {
        return sum + config.status[status];
      }, 0);
      const statusValue = Math.random() * (max - min) + min;
      let value = 0;
      for (const status of statuses) {
        if (value < statusValue) {
          processingStatus = status;
        }
        value += config.status[status];
      }
    }

    const durationParameter = job.parameters.find((parameter) => parameter.definition_name === "duration");
    if (durationParameter && parseFloat(durationParameter.value) > 0) {
      processingTime = parseFloat(durationParameter.value) * 1000;
    }
    const statusParameter = job.parameters.find((parameter) => parameter.definition_name === "status");
    if (statusParameter && JobStatus[statusParameter.value]) {
      processingStatus = statusParameter.value;
    }

    const ID = job.ID;
    const updateResults = [];
    switch (processingStatus) {
      case JobStatus.completed:
        updateResults.push(
          {
            type: ResultType.message,
            name: "Message",
            messages: [
              {
                code: "jobCompleted",
                severity: MessageSeverity.info,
              },
            ],
          },
          {
            type: ResultType.link,
            name: "Link",
            link: "https://sap.com",
          },
          {
            type: ResultType.data,
            name: "Data",
            filename: "log.txt",
            mimeType: "text/plain",
            data: btoa(cds.i18n.messages.at("jobCompleted")),
          },
          {
            type: ResultType.data,
            name: "Data",
            filename: "log.pdf",
            mimeType: "application/pdf",
            data: fs.readFileSync(path.join(__dirname, "./assets/log.pdf"), { encoding: "base64" }),
          },
        );
        break;
      case JobStatus.completedWithWarning:
        updateResults.push({
          type: ResultType.message,
          name: "Message",
          messages: [
            {
              code: "jobCompletedWithWarning",
              severity: MessageSeverity.warning,
              createdAt: new Date().toISOString(),
            },
          ],
        });
        break;
      case JobStatus.completedWithError:
        updateResults.push({
          type: ResultType.message,
          name: "Message",
          messages: [
            {
              code: "jobCompletedWithError",
              severity: MessageSeverity.error,
            },
          ],
        });
        break;
      case JobStatus.failed:
        updateResults.push({
          type: ResultType.message,
          name: "Message",
          messages: [
            {
              code: "jobFailed",
              severity: MessageSeverity.error,
            },
          ],
        });
        break;
    }

    await cds.queued(this).send(
      "updateJob",
      {
        ID,
        status: processingStatus,
        results: updateResults,
      },
      {
        "x-eventQueue-referenceEntityKey": ID,
        "x-eventQueue-startAfter": new Date(Date.now() + processingTime),
      },
    );

    const mockResults = [];
    if (advancedMock) {
      mockResults.push({
        type: ResultType.message,
        name: "Advanced Mocked Run",
        messages: [
          {
            code: "jobAdvancedMock",
            severity: MessageSeverity.info,
          },
        ],
      });
    } else {
      mockResults.push({
        type: ResultType.message,
        name: "Basic Mocked Run",
        messages: [
          {
            code: "jobBasicMock",
            severity: MessageSeverity.info,
          },
        ],
      });
    }
    if (job.testRun) {
      mockResults.push({
        type: ResultType.message,
        name: "Test Run",
        messages: [
          {
            code: "jobTestRun",
            severity: MessageSeverity.info,
          },
        ],
      });
    }
    return mockResults;
  }

  async mockJobSync(req) {
    cds.log("sapafcsdk/jobsync").info("periodic sync job triggered");
  }

  async mockNotification(req) {
    for (const notification of req.data.notifications) {
      cds.log("sapafcsdk/notification").info(notification);
    }
  }

  // async reportStatus(req, status) {
  //   const afc = await cds.connect.to("afc");
  //   await afc.tx(req).reportStatus(status);
  // }
};
