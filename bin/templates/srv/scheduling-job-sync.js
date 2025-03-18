"use strict";

const { PeriodicSchedulingJobSync } = require("@cap-js-community/sap-afc-sdk");

class CustomPeriodicSchedulingJobSync extends PeriodicSchedulingJobSync {
  constructor(context, eventType, eventSubType, config) {
    super(context, eventType, eventSubType, config);
  }

  // eslint-disable-next-line no-unused-vars
  async processPeriodicEvent(processContext, key, eventEntry) {
    try {
      // Your logic goes here
    } catch (err) {
      this.logger.error("Error during processing periodic event!", err);
    }
  }
}

module.exports = CustomPeriodicSchedulingJobSync;
