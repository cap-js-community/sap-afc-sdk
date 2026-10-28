"use strict";

const cds = require("@sap/cds");
const eventQueue = require("@cap-js-community/event-queue");

const { connectToWS, clearEventQueue, processQueue, wait, eventQueueEntry } = require("../helper");
const { test } = cds.test(__dirname + "/../..");

process.env.PORT = 0; // Random

let websocketService;

describe("Websocket Service", () => {
  beforeAll(async () => {
    websocketService = cds.queued(await cds.connect.to("sapafcsdk.scheduling.WebsocketService"));
  });

  beforeEach(async () => {
    await clearEventQueue();
    await test.data.reset();
  });

  it("Job Status Changed", async () => {
    const ws = await connectToWS("job-scheduling");
    let message = ws.message("jobStatusChanged");

    await websocketService.emit("jobStatusChanged", {
      IDs: ["XXX"],
      status: "running",
    });

    await processQueue("sapafcsdk.scheduling.WebsocketService.jobStatusChanged");
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
    await websocketService.emit("jobStatusChanged", {
      IDs: ["XXX"],
      status: "running",
    });

    await processQueue("sapafcsdk.scheduling.WebsocketService.jobStatusChanged");
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

    await websocketService.emit("jobStatusChanged", {
      IDs: ["XXX"],
      status: "running",
    });

    await processQueue("sapafcsdk.scheduling.WebsocketService.jobStatusChanged");
    let event = await message;
    expect(event.IDs).toEqual(["XXX"]);
    expect(event.status).toBe("running");

    ws.close();
  });

  it("Job Status Cluster Changed (different status)", async () => {
    const ws = await connectToWS("job-scheduling");
    let messages = ws.message("jobStatusChanged", 2);

    await websocketService.emit("jobStatusChanged", {
      IDs: ["XXX"],
      status: "running",
    });

    await websocketService.emit("jobStatusChanged", {
      IDs: ["ZZZ"],
      status: "completed",
    });

    await websocketService.emit("jobStatusChanged", {
      IDs: ["YYY"],
      status: "running",
    });

    await processQueue("sapafcsdk.scheduling.WebsocketService.jobStatusChanged");
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

    cds.env.requires["sapafcsdk.scheduling.WebsocketService"].queued.events.jobStatusChanged.timeBucket = cron;
    const event = eventQueue.config.events.find(
      (event) => event.subType === "sapafcsdk.scheduling.WebsocketService.jobStatusChanged",
    );
    if (event) {
      event.timeBucket = cron;
    }

    await websocketService.emit("jobStatusChanged", {
      IDs: ["XXX"],
      status: "running",
    });

    let entry = await eventQueueEntry("sapafcsdk.scheduling.WebsocketService.jobStatusChanged", undefined, "XXX");
    expect(entry.startAfter).toBeDefined();

    await websocketService.emit("jobStatusChanged", {
      IDs: ["YYY"],
      status: "running",
    });

    entry = await eventQueueEntry("sapafcsdk.scheduling.WebsocketService.jobStatusChanged", undefined, "YYY");
    expect(entry.startAfter).toBeDefined();

    await wait(1000);

    await processQueue("sapafcsdk.scheduling.WebsocketService.jobStatusChanged");
    let events = await messages;
    expect(events).toEqual({ status: "running", IDs: ["XXX", "YYY"] });
    ws.close();
  });
});
