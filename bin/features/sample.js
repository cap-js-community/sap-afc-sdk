/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");

module.exports = () => {
  try {
    fs.cpSync(path.join(__dirname, "../../test/data"), path.join(process.cwd(), "test/data"), { recursive: true });
  } catch (err) {
    console.error(err.message);
  }
};
