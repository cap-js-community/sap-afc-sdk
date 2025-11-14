"use strict";

const cds = require("@sap/cds");
const eventQueue = require("@cap-js-community/event-queue");

const { connectToWS, clearEventQueue, processQueue, wait, eventQueueEntry } = require("../helper");
const { test } = cds.test(__dirname + "/../..");

process.env.PORT = 0; // Random

describe("Websocket Service", () => {
  beforeEach(async () => {
    await clearEventQueue();
    await test.data.reset();
  });

  it("Job Status Changed", async () => {
    const ws = await connectToWS("job-scheduling");
    let message = ws.message("jobStatusChanged");

    const schedulingWebsocketService = await cds.connect.to("sapafcsdk.scheduling.SchedulingWebsocketService");
    await schedulingWebsocketService.emit("jobStatusChanged", {
      IDs: ["XXX"],
      status: "running",
    });

    await processQueue("sapafcsdk.scheduling.SchedulingWebsocketService.jobStatusChanged");
    let event = await message;
    expect(event.IDs).toEqual(["XXX"]);
    expect(event.status).toBe("running");

    ws.close();
  });

  it("Job Status Changed (via app route)", async () => {
    const ws = await connectToWS("job-scheduling", undefined, {
      base: "/scheduling.monitoring.job",
    });
    let message = ws.message("jobStatusChanged");

    const schedulingWebsocketService = await cds.connect.to("sapafcsdk.scheduling.SchedulingWebsocketService");
    await schedulingWebsocketService.emit("jobStatusChanged", {
      IDs: ["XXX"],
      status: "running",
    });

    await processQueue("sapafcsdk.scheduling.SchedulingWebsocketService.jobStatusChanged");
    let event = await message;
    expect(event.IDs).toEqual(["XXX"]);
    expect(event.status).toBe("running");

    ws.close();
  });

  it("Job Status Changed (via webapp route)", async () => {
    const ws = await connectToWS("job-scheduling", undefined, {
      base: "/scheduling.monitoring.job/webapp",
    });
    let message = ws.message("jobStatusChanged");

    const schedulingWebsocketService = await cds.connect.to("sapafcsdk.scheduling.SchedulingWebsocketService");
    await schedulingWebsocketService.emit("jobStatusChanged", {
      IDs: ["XXX"],
      status: "running",
    });

    await processQueue("sapafcsdk.scheduling.SchedulingWebsocketService.jobStatusChanged");
    let event = await message;
    expect(event.IDs).toEqual(["XXX"]);
    expect(event.status).toBe("running");

    ws.close();
  });

  it("Job Status Cluster Changed (different status)", async () => {
    const ws = await connectToWS("job-scheduling");
    let messages = ws.message("jobStatusChanged", 2);

    const schedulingWebsocketService = await cds.connect.to("sapafcsdk.scheduling.SchedulingWebsocketService");
    await schedulingWebsocketService.emit("jobStatusChanged", {
      IDs: ["XXX"],
      status: "running",
    });

    await schedulingWebsocketService.emit("jobStatusChanged", {
      IDs: ["ZZZ"],
      status: "completed",
    });

    await schedulingWebsocketService.emit("jobStatusChanged", {
      IDs: ["YYY"],
      status: "running",
    });

    await processQueue("sapafcsdk.scheduling.SchedulingWebsocketService.jobStatusChanged");
    let events = await messages;
    events.sort((a, b) => a.status.localeCompare(b.status));
    expect(events).toEqual([
      { status: "completed", IDs: ["ZZZ"] },
      { status: "running", IDs: ["XXX", "YYY"] },
    ]);
    ws.close();
  });

  it("Job Status Cluster time bucket", async () => {
    const cron = "*/1 * * * * *";
    const ws = await connectToWS("job-scheduling");
    let messages = ws.message("jobStatusChanged");

    cds.env.requires["sapafcsdk.scheduling.SchedulingWebsocketService"].outbox.events.jobStatusChanged.timeBucket =
      cron;
    const event = eventQueue.config.events.find(
      (event) => event.subType === "sapafcsdk.scheduling.SchedulingWebsocketService.jobStatusChanged",
    );
    if (event) {
      event.timeBucket = cron;
    }

    const schedulingWebsocketService = await cds.connect.to("sapafcsdk.scheduling.SchedulingWebsocketService");
    await schedulingWebsocketService.emit("jobStatusChanged", {
      IDs: ["XXX"],
      status: "running",
    });

    let entry = await eventQueueEntry(
      "sapafcsdk.scheduling.SchedulingWebsocketService.jobStatusChanged",
      undefined,
      "XXX",
    );
    expect(entry.startAfter).toBeDefined();

    await schedulingWebsocketService.emit("jobStatusChanged", {
      IDs: ["YYY"],
      status: "running",
    });

    entry = await eventQueueEntry("sapafcsdk.scheduling.SchedulingWebsocketService.jobStatusChanged", undefined, "YYY");
    expect(entry.startAfter).toBeDefined();

    await wait(1000);

    await processQueue("sapafcsdk.scheduling.SchedulingWebsocketService.jobStatusChanged");
    let events = await messages;
    expect(events).toEqual({ status: "running", IDs: ["XXX", "YYY"] });
    ws.close();
  });
});
