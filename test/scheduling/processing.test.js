"use strict";

const cds = require("@sap/cds");

const { connectToWS, clearEventQueue, eventQueueEntry, processOutbox } = require("../util/helper");
const { test } = cds.test(__dirname + "/../..");

process.env.PORT = 0; // Random

let processingService;

const ID = "3a89dfec-59f9-4a91-90fe-3c7ca7407103";

describe("Processing Service", () => {
  const log = cds.test.log();

  beforeAll(async () => {
    processingService = await cds.connect.to("SchedulingProcessingService");
  });

  beforeEach(async () => {
    await clearEventQueue();
    await test.data.reset();
  });

  it("processJob", async () => {
    const ws = await connectToWS("job-scheduling");
    let message = ws.message("jobStatusChanged");

    await expect(processingService.processJob(ID)).resolves.not.toThrow();

    await processOutbox("processing");

    let job = await SELECT.one.from("scheduling.Job").where({ ID });
    expect(job.status_code).toBe("running");

    await processOutbox("websocket");
    let event = await message;
    expect(event.ID).toBe(ID);
    expect(event.status).toBe("running");

    cds.env.requires["sap-afc-sdk"].mockProcessing = true;

    await expect(processingService.processJob(ID)).resolves.not.toThrow();

    await processOutbox("processing");

    ws.close();
  });

  it("updateJob", async () => {
    const ws = await connectToWS("job-scheduling");

    let message = ws.message("jobStatusChanged");
    await expect(processingService.updateJob(ID, "running")).resolves.not.toThrow();

    await processOutbox();
    let event = await message;
    expect(event.ID).toBe(ID);
    expect(event.status).toBe("running");

    message = ws.message("jobStatusChanged");
    await expect(processingService.updateJob(ID, "completed")).resolves.not.toThrow();

    await processOutbox();
    const job = await SELECT.one.from("scheduling.Job").where({ ID });
    expect(job.status_code).toBe("completed");
    event = await message;
    expect(event.ID).toBe(ID);
    expect(event.status).toBe("completed");

    message = ws.message("jobStatusChanged");
    await expect(processingService.updateJob(ID, "completed")).resolves.not.toThrow();
    await processOutbox();

    ws.close();
  });

  it("cancelJob", async () => {
    const ws = await connectToWS("job-scheduling");
    let message = ws.message("jobStatusChanged");

    await expect(processingService.cancelJob(ID)).resolves.not.toThrow();

    await processOutbox("processing");

    const job = await SELECT.one.from("scheduling.Job").where({ ID });
    expect(job.status_code).toBe("canceled");

    await processOutbox("websocket");
    let event = await message;
    expect(event.ID).toBe(ID);
    expect(event.status).toBe("canceled");

    ws.close();
  });

  describe("Error Situations", () => {
    it("processJob", async () => {
      await expect(processingService.processJob("XXX")).resolves.not.toThrow();
      await processOutbox("processing");
      const entry = await eventQueueEntry();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/jobNotFound.*XXX/s));
      log.clear();
      await clearEventQueue();
    });

    it("updateJob", async () => {
      await expect(processingService.updateJob("XXX")).resolves.not.toThrow();
      await processOutbox("processing");
      let entry = await eventQueueEntry();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/jobNotFound.*XXX/s));
      log.clear();
      await clearEventQueue();

      await expect(processingService.updateJob(ID)).resolves.not.toThrow();
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/statusValueMissing/s));
      log.clear();
      await clearEventQueue();

      await expect(processingService.updateJob(ID, "XXX")).resolves.not.toThrow();
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/invalidJobStatus.*XXX/s));
      log.clear();
      await clearEventQueue();

      await expect(processingService.updateJob(ID, "completed")).resolves.not.toThrow();
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/statusTransitionNotAllowed.*requested.*completed/s));
      log.clear();
      await clearEventQueue();
    });

    it("cancelJob", async () => {
      await expect(processingService.cancelJob("XXX")).resolves.not.toThrow();
      await processOutbox("processing");
      let entry = await eventQueueEntry();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/jobNotFound.*XXX/s));
      log.clear();
      await clearEventQueue();

      await expect(processingService.updateJob(ID, "running")).resolves.not.toThrow();
      await processOutbox("processing");
      log.clear();
      await clearEventQueue();
      await expect(processingService.cancelJob(ID)).resolves.not.toThrow();
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/statusTransitionNotAllowed.*running.*canceled/s));
      log.clear();
      await clearEventQueue();
    });
  });
});
