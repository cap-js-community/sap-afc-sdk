/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");

const config = require("../config.json");

module.exports = () => {
  try {
    for (const app of config.apps) {
      const appPath = path.join(process.cwd(), "app", app);
      if (!fs.existsSync(appPath)) {
        fs.cpSync(path.join(__dirname, `../../app/${app}`), appPath, { recursive: true });
        console.log(`Folder '${appPath}' written.`);
      } else {
        console.log(`Folder '${appPath}' already exists and is not overwritten.`);
      }
    }
  } catch (err) {
    console.error(err.message);
  }
};
