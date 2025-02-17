/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");

const config = require("../config");

module.exports = () => {
  try {
    for (const app of config.apps) {
      fs.cpSync(path.join(__dirname, `../../app/${app}`), path.join(process.cwd(), "app", app), { recursive: true });
    }
  } catch (err) {
    console.error(err.message);
  }
};
