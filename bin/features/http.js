/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");

module.exports = () => {
  try {
    fs.cpSync(path.join(__dirname, "../../http"), path.join(process.cwd(), "http"), { recursive: true });
  } catch (err) {
    console.error(err.message);
  }
};
