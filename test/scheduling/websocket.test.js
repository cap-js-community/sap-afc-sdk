"use strict";

const cds = require("@sap/cds");

const { connectToWS, clearEventQueue, processOutbox } = require("../util/helper");
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

    const schedulingWebsocketService = await cds.connect.to("SchedulingWebsocketService");
    await schedulingWebsocketService.emit("jobStatusChanged", {
      ID: "XXX",
      status: "running",
    });

    await processOutbox("websocket");
    let event = await message;
    expect(event.ID).toBe("XXX");
    expect(event.status).toBe("running");

    ws.close();
  });
});
