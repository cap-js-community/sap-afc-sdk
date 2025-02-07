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
      await this.updateJobStatus(req, req.data.ID, JobStatus.running);
      if (cds.env.requires?.["sap-afc-sdk"]?.mockProcessing) {
        await this.mockJobProcessing(req);
      }
    });

    this.on(updateJob, async (req, next) => {
      await this.updateJobStatus(req, req.data.ID, req.data.status);
    });

    this.on(cancelJob, async (req, next) => {
      await this.updateJobStatus(req, req.data.ID, JobStatus.canceled);
    });

    return super.init();
  }

  async mockJobProcessing(req) {
    const srv = cds.outboxed(this);
    return await srv.send(
      "updateJob",
      {
        ID: req.data.ID,
        status: JobStatus.completed,
      },
      { "x-eventQueue-startAfter": new Date(Date.now() + Math.ceil(Math.random() * 30) * 1000) },
    );
  }

  async updateJobStatus(req, ID, status) {
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
      .where({ ID });

    const schedulingWebsocketService = await cds.connect.to("SchedulingWebsocketService");
    await schedulingWebsocketService.tx(req).emit(
      "jobStatusChanged",
      {
        ID: job.ID,
        status,
      },
      {
        "x-eventqueue-referenceEntityKey": job.ID,
      },
    );
  }

  async checkStatusTransition(statusBefore, statusAfter) {
    return this.statusTransitions[statusBefore].includes(statusAfter);
  }
};
