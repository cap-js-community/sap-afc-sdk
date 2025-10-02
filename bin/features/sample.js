/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");

module.exports = (options) => {
  try {
    const testDataPath = path.join(__dirname, "../../test/data");
    const dataPath = path.join(process.cwd(), "db/data");
    fs.mkdirSync(dataPath, { recursive: true });
    const selective = options?.data !== options?.metadata;
    if (selective) {
      const files = fs.readdirSync(testDataPath, { withFileTypes: true });
      files.forEach((file) => {
        if (!file.isFile()) {
          return;
        }
        if (options?.data && file.name.includes("Definition")) {
          return;
        }
        if (options?.metadata && !file.name.includes("Definition")) {
          return;
        }
        fs.copyFileSync(path.join(testDataPath, file.name), path.join(dataPath, file.name));
      });
    } else {
      fs.cpSync(testDataPath, dataPath, { recursive: true });
    }
    console.log(`Folder '${dataPath}' written.`);
  } catch (err) {
    console.error(err.message);
  }
};
