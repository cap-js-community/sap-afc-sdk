/* eslint-disable no-console */
"use strict";

const path = require("path");
const { copyTemplate, adjustJSON } = require("../common/util");

const Files = [
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
      json.cds.requires ??= {};
      json.cds.requires.SchedulingProcessingService ??= {};
      json.cds.requires.SchedulingProcessingService.outbox ??= {};
      json.cds.requires.SchedulingProcessingService.outbox.events ??= {};
      json.cds.requires.SchedulingProcessingService.outbox.events.syncJob ??= {};
      if (!json.cds.requires.SchedulingProcessingService.outbox.events.syncJob.cron) {
        json.cds.requires.SchedulingProcessingService.outbox.events.syncJob.cron = "*/1 * * * *";
      }
    });
  } catch (err) {
    console.error(err.message);
  }
};
