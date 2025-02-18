/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");

module.exports = () => {
  try {
    const httpPath = path.join(process.cwd(), "http");
    fs.cpSync(path.join(__dirname, "../../http"), httpPath, { recursive: true });
    console.log(`Folder '${httpPath}' written.`);
  } catch (err) {
    console.error(err.message);
  }
};
