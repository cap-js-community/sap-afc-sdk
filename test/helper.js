"use strict";

const WebSocket = require("ws");

const eventQueue = require("@cap-js-community/event-queue");

const FIELDS_TO_CLEAN = [
  "ID",
  "jobID",
  "job_ID",
  "result_ID",
  "resultID",
  "createdBy",
  "createdAt",
  "modifiedBy",
  "modifiedAt",
];

const ALICE = `Basic ${Buffer.from("alice:", "utf8").toString("base64")}`;
const ZEUS = `Basic ${Buffer.from("zeus:", "utf8").toString("base64")}`;

function cleanData(data) {
  for (const row of Array.isArray(data) ? data : [data]) {
    if (row === null || row === undefined) {
      continue;
    }
    for (const field of FIELDS_TO_CLEAN) {
      delete row[field];
    }
    if (row.link && /^https?:\/\/.*launchpad\.html.*/.test(row.link)) {
      row.link = row.link.replace(/^https?:\/\/.*/, "http://localhost:4004/<ID>");
    }
    for (const key in row) {
      if (typeof row[key] === "object") {
        cleanData(row[key]);
      }
    }
  }
  return data;
}

async function processOutbox(subType) {
  await eventQueue.processEventQueue(new cds.EventContext(), "CAP_OUTBOX", subType);
}

async function eventQueueEntry(subType, referenceEntityKey, payload) {
  subType ??= "SchedulingProcessingService";
  return await SELECT.one.from("sap.eventqueue.Event").where({
    type: "CAP_OUTBOX",
    subType,
    ...(referenceEntityKey && { referenceEntityKey }),
    ...(payload && { payload: { like: `%${payload}%` } }),
  });
}

async function clearEventQueue() {
  await DELETE.from("sap.eventqueue.Event");
}

async function connectToWS(service, ID, options) {
  const url = cds.server.url.replace("http://", "ws://");
  const socket = await new Promise((resolve) => {
    const socket = new WebSocket(`${url}${options?.base || ""}/ws/${service}`, {
      headers: {
        // authorization: module.exports.authorization.default
      },
    });
    socket.on("open", () => {
      resolve(socket);
    });
  });
  if (ID) {
    await new Promise((resolve) => {
      socket.send(
        JSON.stringify({
          event: "wsContext",
          data: { context: ID },
        }),
        (result) => {
          resolve(result || null);
        },
      );
    });
  }
  await wait(100);
  return {
    close: () => {
      socket.close();
    },
    message: (event, count = 1) => {
      const messages = [];
      return new Promise((resolve) => {
        socket.on("message", (message) => {
          const payload = JSON.parse(message);
          if (payload.event === event) {
            messages.push(payload.data);
            if (messages.length === count) {
              resolve(count === 1 ? messages[0] : messages);
            }
          }
        });
      });
    },
  };
}

async function wait(milliseconds) {
  if (milliseconds <= 0) {
    return;
  }
  await new Promise(function (resolve) {
    setTimeout(resolve, milliseconds);
  });
}

module.exports = {
  authorization: {
    default: ALICE,
    alice: ALICE,
    zeus: ZEUS,
  },
  cleanData,
  clearEventQueue,
  eventQueueEntry,
  processOutbox,
  connectToWS,
  wait,
};
