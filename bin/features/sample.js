/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");

module.exports = () => {
  try {
    const dataPath = path.join(process.cwd(), "db/data");
    fs.cpSync(path.join(__dirname, "../../test/data"), dataPath, { recursive: true });
    console.log(`Folder '${dataPath}' written.`);
  } catch (err) {
    console.error(err.message);
  }
};
