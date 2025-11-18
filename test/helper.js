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

const CAP_QUEUE = "CAP_OUTBOX";

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

async function processQueue(subType) {
  await eventQueue.processEventQueue(new cds.EventContext(), CAP_QUEUE, subType);
}

async function eventQueueEntry(subType, referenceEntityKey, payload) {
  subType ??= "sapafcsdk.scheduling.SchedulingProcessingService";
  return await SELECT.one.from("sap.eventqueue.Event").where({
    type: CAP_QUEUE,
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

async function callBatch(POST, baseUrl, requests, boundary = "boundary") {
  const payload = [];
  for (const request of requests) {
    payload.push(`--${boundary}`, "Content-Type: application/http", "");
    payload.push(`${request.method} ${request.url} HTTP/1.1`);
    payload.push(...(request.headers ?? []));
    if (request.body) {
      if (
        !request.headers.find((header) => {
          return header.startsWith("Content-Type:");
        })
      ) {
        payload.push("Content-Type: application/json");
      }
      payload.push(JSON.stringify(request.body));
    } else {
      payload.push("");
    }
  }
  payload.push(`--${boundary}--`);
  const response = await POST(baseUrl, payload.join("\r\n"), {
    headers: {
      "Content-Type": `multipart/mixed; boundary=${boundary}`,
    },
  });
  if (![200, 202].includes(response.status)) {
    const message = `Unexpected status \nActual: ${response.status}, Expected: 202`;
    throw new Error(message);
  }
  return {
    status: response.status,
    data: splitMultipartResponse(response.data, boundary),
  };
}

function splitMultipartResponse(body, boundary) {
  body = Array.isArray(body) ? body.join("") : body;
  return body
    .split(new RegExp(`(?:^|\r\n)--${boundary}(?:\r\n|--\r\n$|--$)`))
    .slice(1, -1)
    .map((part) => {
      const [_meta, ..._rest] = part.split("\r\n\r\n");
      const multipart = _meta.match(/content-type:\s*multipart\/mixed;\s*boundary=([\w-]*)/i);
      if (multipart !== null) {
        const subBoundary = multipart[1];
        return splitMultipartResponse(_rest.join("\r\n\r\n"), subBoundary);
      } else {
        const contentId = _meta.match(/content-id:\s*(\w+)/i) || undefined;
        const contentTransferEncoding = _meta.match(/content-transfer-encoding:\s*(\w+)/i) || undefined;
        const [_info, _body] = _rest;
        const body = _body && _body.startsWith("{") ? JSON.parse(_body) : _body;
        const [_status, ..._headers] = _info.split("\r\n");
        const [_statusCode, statusText] = _status.split(/\s+/).slice(1);
        const statusCode = parseInt(_statusCode);
        const headers = {};
        _headers.forEach((_header) => {
          const splitPos = _header.indexOf(": ");
          if (splitPos > 0) {
            headers[_header.slice(0, splitPos)] = _header.slice(splitPos + 2);
          }
        });
        return {
          status: statusCode,
          statusCode,
          statusText,
          headers,
          body: statusCode < 400 ? body : undefined,
          error: statusCode >= 400 ? body : undefined,
          contentId: contentId && contentId[1],
          contentTransferEncoding: contentTransferEncoding && contentTransferEncoding[1],
        };
      }
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
  processQueue,
  connectToWS,
  wait,
  callBatch,
};
