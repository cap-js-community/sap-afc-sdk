"use strict";

const { SchedulingProviderService } = require("@cap-js-community/sap-afc-sdk");

class CustomSchedulingProviderService extends SchedulingProviderService {
  async init() {
    const { Job, JobResult } = this.entities;

    this.on("CREATE", Job, async (req, next) => {
      // Your logic goes here
      await next();
    });

    this.on(Job.actions.cancel, Job, async (req, next) => {
      // Your logic goes here
      await next();
    });

    this.on(JobResult.actions.data, JobResult, async (req, next) => {
      // Your logic goes here
      await next();
    });

    super.init();
  }
}

module.exports = CustomSchedulingProviderService;
