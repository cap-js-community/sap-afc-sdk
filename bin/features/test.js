/* eslint-disable no-console */
"use strict";

const path = require("path");
const shelljs = require("shelljs");
const { copyTemplate, adjustJSON } = require("../common/util");

const Files = ["test/scheduling.provider.test.js"];

module.exports = () => {
  try {
    const folder = path.join(process.cwd(), "test");
    copyTemplate(folder, Files);
    shelljs.exec(`npm install --save-dev @cap-js/cds-test jest`, { silent: true });
    adjustJSON("package.json", (json) => {
      json.scripts ??= {};
      if (!json.scripts.test) {
        json.scripts.test = "jest";
      }
    });
  } catch (err) {
    console.error(err.message);
  }
};
