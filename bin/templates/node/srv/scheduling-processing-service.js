"use strict";

const { SchedulingProcessingService } = require("@cap-js-community/sap-afc-sdk");

class CustomSchedulingProcessingService extends SchedulingProcessingService {
  async init() {
    const { processJob, updateJob, cancelJob, syncJob, notify } = this.operations;

    this.on(processJob, async (req, next) => {
      // Your logic goes here
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

    this.on(syncJob, async (req, next) => {
      // Your logic goes here
      await next();
    });

    this.on(notify, async (req, next) => {
      // Your logic goes here
      await next();
    });

    super.init();
  }
}

module.exports = CustomSchedulingProcessingService;
