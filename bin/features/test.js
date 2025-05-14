/* eslint-disable no-console */
"use strict";

const path = require("path");
const { adjustJSON, isJava, copyFolderAdjusted } = require("../common/util");
const fs = require("fs");

const Files = {
  node: "node/test",
  java: "java/test"
};

module.exports = (options) => {
  try {
    const packagePath = path.join(process.cwd(), "package.json");
    if (!fs.existsSync(packagePath)) {
      console.log(`Project package.json not found at '${packagePath}'.`);
      return false;
    }
    const packageJson = require(packagePath);

    let srcFolder;
    let destFolder;
    if (!isJava(options)) {
      srcFolder = path.join(__dirname, "..", "templates", Files.node);
      destFolder = path.join(process.cwd(), "srv");
    } else {
      srcFolder = path.join(__dirname, "..", "templates", Files.java);
      destFolder = path.join(process.cwd(), "srv/src/test/java/customer", packageJson.name, "scheduling");
    }
    copyFolderAdjusted(srcFolder, destFolder, {}, (content) => {
      if (isJava(options)) {
        content = content.replace("package customer.scheduling;", `package customer.${packageJson.name}.scheduling;`);
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
