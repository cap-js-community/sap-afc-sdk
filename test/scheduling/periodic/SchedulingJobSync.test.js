"use strict";

const eventQueue = require("@cap-js-community/event-queue");

const SchedulingJobSync = require("../../../srv/scheduling/periodic/SchedulingJobSync");

describe("Periodic Scheduling Job Sync", () => {
  beforeAll(async () => {
    await eventQueue.initialize();
  });

  it("process Periodic Event", async () => {
    const instance = new SchedulingJobSync({}, "SchedulingJob", "Sync", {});
    const result = await instance.processPeriodicEvent({}, null, {});
    expect(result).toBeUndefined();
  });
});
