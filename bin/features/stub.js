/* eslint-disable no-console */
"use strict";

const path = require("path");
const { isNode, isJava, adjustJSON, copyFolderAdjusted, projectName, derivePackageName } = require("../common/util");

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
    const packageName = derivePackageName(name);
    if (isNode(options)) {
      srcFolder = path.join(__dirname, "..", "templates", Files.node);
      destFolder = path.join(process.cwd(), "srv");
    } else {
      srcFolder = path.join(__dirname, "..", "templates", Files.java);
      destFolder = path.join(process.cwd(), "srv/src/main/java/customer", packageName, "scheduling");
    }
    copyFolderAdjusted(srcFolder, destFolder, {}, (content) => {
      if (isJava(options)) {
        content = content.replace("package customer.scheduling", `package customer.${packageName}.scheduling`);
      }
      return content;
    });
    console.log(`Folder '${destFolder}' written.`);

    if (isNode(options)) {
      adjustJSON("package.json", (json) => {
        json.cds ??= {};
        json.cds.requires ??= {};
        json.cds.requires.SchedulingProcessingService ??= {};
        json.cds.requires.SchedulingProcessingService.queued ??= {};
        json.cds.requires.SchedulingProcessingService.queued.events ??= {};
        json.cds.requires.SchedulingProcessingService.queued.events.syncJob ??= {};
        if (!json.cds.requires.SchedulingProcessingService.queued.events.syncJob.cron) {
          json.cds.requires.SchedulingProcessingService.queued.events.syncJob.cron = "*/1 * * * *";
        }
      });
    }
  } catch (err) {
    console.error(err.message);
  }
};
