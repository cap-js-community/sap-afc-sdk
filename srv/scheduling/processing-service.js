"use strict";

const cds = require("@sap/cds");

const BaseApplicationService = require("../common/BaseApplicationService");

const { JobStatus } = require("./common/codelist");
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
      await this.processJobUpdate(req, req.data.status);
    });

    this.on(cancelJob, async (req, next) => {
      await this.processJobUpdate(req, JobStatus.canceled);
    });

    return super.init();
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
    const srv = cds.outboxed(this);
    return await srv.send(
      "updateJob",
      {
        ID,
        status: processingStatus,
      },
      {
        "x-eventQueue-referenceEntityKey": ID,
        "x-eventQueue-startAfter": new Date(Date.now() + processingTime),
      },
    );
  }

  async processJobUpdate(req, status) {
    const { Job } = this.entities("scheduling");
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
    if (!(await this.checkStatusTransition(req.job.status_code, status))) {
      return req.reject(JobSchedulingError.statusTransitionNotAllowed(req.job.status_code, status));
    }
    await UPDATE.entity(Job)
      .set({
        status_code: status,
      })
      .where({ ID: job.ID });

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

  async checkStatusTransition(statusBefore, statusAfter) {
    return this.statusTransitions[statusBefore].includes(statusAfter);
  }

  /*async reportStatus(status) {
    const afc = await cds.connect.to("afc");
    return await afc.reportStatus(status);
  }*/
};
