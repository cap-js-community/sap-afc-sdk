/* eslint-disable no-console */
"use strict";

const path = require("path");
const { copyTemplate, adjustJSON } = require("../common/util");

const Files = [
  "srv/scheduling-job-sync.js",
  "srv/scheduling-processing-service.cds",
  "srv/scheduling-processing-service.js",
  "srv/scheduling-provider-service.cds",
  "srv/scheduling-provider-service.js",
];

module.exports = () => {
  try {
    const folder = path.join(process.cwd(), "srv");
    copyTemplate(folder, Files);
    adjustJSON("package.json", (json) => {
      json.cds ??= {};
      json.cds.eventQueue ??= {};
      json.cds.eventQueue.periodicEvents ??= {};
      json.cds.eventQueue.periodicEvents["SchedulingJob/Sync"] ??= {};
      if (!json.cds.eventQueue.periodicEvents["SchedulingJob/Sync"].cron) {
        json.cds.eventQueue.periodicEvents["SchedulingJob/Sync"].cron = "*/1 * * * *";
      }
      if (!json.cds.eventQueue.periodicEvents["SchedulingJob/Sync"].impl) {
        json.cds.eventQueue.periodicEvents["SchedulingJob/Sync"].impl = "./srv/scheduling-job-sync.js";
      }
    });
  } catch (err) {
    console.error(err.message);
  }
};
