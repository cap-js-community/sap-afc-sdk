"use strict";

const { EventQueueProcessorBase } = require("@cap-js-community/event-queue");

class PeriodicSchedulingJobSync extends EventQueueProcessorBase {
  constructor(context, eventType, eventSubType, config) {
    super(context, eventType, eventSubType, config);
  }

  // eslint-disable-next-line no-unused-vars
  async processPeriodicEvent(processContext, key, eventEntry) {
    // no-op
  }
}

module.exports = PeriodicSchedulingJobSync;
