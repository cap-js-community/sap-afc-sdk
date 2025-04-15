/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");

const config = require("../config.json");

const Files = [
  "appconfig/fioriSandboxConfig.json",
  "launchpad.html"
];

module.exports = () => {
  try {
    for (const app of config.apps) {
      const appPath = path.join(process.cwd(), "app", app);
      if (!fs.existsSync(appPath)) {
        fs.cpSync(path.join(__dirname, "../../app", app), appPath, { recursive: true });
        console.log(`Folder '${appPath}' written.`);
      } else {
        console.log(`Folder '${appPath}' already exists and is not overwritten.`);
      }
    }
    for (const file of Files) {
      const filePath = path.join(process.cwd(), "app", file);
      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.cpSync(path.join(__dirname, "../../app", file), filePath);
        console.log(`File '${filePath}' written.`);
      } else {
        console.log(`File '${filePath}' already exists and is not overwritten.`);
      }
    }
  } catch (err) {
    console.error(err.message);
  }
};
