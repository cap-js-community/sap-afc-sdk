/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");
const shelljs = require("shelljs");

const AppRoot = "app";
const Apps = ["scheduling.monitoring.job"];

const Target = {
  CF: "cf",
  KYMA: "kyma",
};

const CDSFeatures = {
  base: [
    "sqlite",
    "hana",
    "xsuaa",
    "approuter",
    "html5-repo",
    "workzone-standard",
    "connectivity",
    "destination",
    "redis",
  ],
  cf: ["mta"],
  kyma: ["helm", "containerize"],
};

const AFCFeatures = ["sample", "http", "broker"];

module.exports = (target) => {
  try {
    target ??= Target.CF;
    const appStubs = [];
    for (const app of Apps) {
      const appPath = path.join(process.cwd(), AppRoot, app);
      if (!fs.existsSync(appPath)) {
        fs.mkdirSync(appPath, { recursive: true });
        appStubs.push(appPath);
      }
    }
    shelljs.exec(`cds add ${CDSFeatures[target].concat(CDSFeatures.base).join(",")} --for production`);
    shelljs.exec(`afc add ${AFCFeatures.join(",")}`);
    for (const appPath of appStubs) {
      fs.rmSync(appPath, { recursive: true, force: true });
    }
  } catch (err) {
    console.error(err.message);
  }
};
