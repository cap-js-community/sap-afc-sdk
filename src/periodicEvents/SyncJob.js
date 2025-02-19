"use strict";

const { EventQueueProcessorBase } = require("@cap-js-community/event-queue");

class JobSyncEvent extends EventQueueProcessorBase {
  constructor(context, eventType, eventSubType, config) {
    super(context, eventType, eventSubType, config);
  }

  // eslint-disable-next-line no-unused-vars
  async processPeriodicEvent(processContext, key, eventEntry) {
    try {
      // no-op
    } catch (err) {
      this.logger.error("Error during processing periodic event!", err);
    }
  }
}

module.exports = JobSyncEvent;
