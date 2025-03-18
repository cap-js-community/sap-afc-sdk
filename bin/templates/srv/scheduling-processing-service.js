"use strict";

// eslint-disable-next-line no-unused-vars
const { SchedulingProcessingService, JobStatus } = require("@cap-js-community/sap-afc-sdk");

class CustomSchedulingProcessingService extends SchedulingProcessingService {
  async init() {
    const { processJob, updateJob, cancelJob } = this.operations;

    this.on(processJob, async (req, next) => {
      // Your logic goes here. Check req.data.testRun
      // await this.processJobUpdate(req, JobStatus.completed, [{ ... }]);
      await next();
    });

    this.on(updateJob, async (req, next) => {
      // Your logic goes here
      await next();
    });

    this.on(cancelJob, async (req, next) => {
      // Your logic goes here
      await next();
    });

    super.init();
  }
}

module.exports = CustomSchedulingProcessingService;
