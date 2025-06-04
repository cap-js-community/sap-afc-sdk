/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");
const { isNode, copyFolderAdjusted } = require("../common/util");

module.exports = (options) => {
  try {
    const srcPath = path.join(__dirname, "../../http");
    const destPath = path.join(process.cwd(), "http");
    if (isNode(options)) {
      fs.cpSync(srcPath, destPath, { recursive: true });
    } else {
      copyFolderAdjusted(
        srcPath,
        destPath,
        {
          files: ["toggles.cloud.http", "toggles.local.http"],
        },
        (content) => {
          return content.replace("@port=4004", "@port=8080");
        },
      );
    }
    console.log(`Folder '${destPath}' written.`);
  } catch (err) {
    console.error(err.message);
  }
};
