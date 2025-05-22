/* eslint-disable no-console */
"use strict";

const path = require("path");
const { isJava, adjustJSON, copyFolderAdjusted, projectName } = require("../common/util");

const Files = {
  node: "node/srv",
  java: "java/main",
};

module.exports = (options) => {
  try {
    const name = projectName();
    if (!name) {
      console.log(`CDS project not found`);
      return false;
    }

    let srcFolder;
    let destFolder;
    if (!isJava(options)) {
      srcFolder = path.join(__dirname, "..", "templates", Files.node);
      destFolder = path.join(process.cwd(), "srv");
    } else {
      srcFolder = path.join(__dirname, "..", "templates", Files.java);
      destFolder = path.join(process.cwd(), "srv/src/main/java/customer", name, "scheduling");
    }
    copyFolderAdjusted(srcFolder, destFolder, {}, (content) => {
      if (isJava(options)) {
        content = content.replace("package customer.scheduling;", `package customer.${name}.scheduling;`);
      }
      return content;
    });
    console.log(`Folder '${destFolder}' written.`);

    if (!isJava(options)) {
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
    }
  } catch (err) {
    console.error(err.message);
  }
};
