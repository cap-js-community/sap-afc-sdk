/* eslint-disable no-console */
"use strict";

const path = require("path");
const { isJava, copyFolderAdjusted } = require("../common/util");
const fs = require("fs");

const Files = {
  node: "node/srv",
  java: "java/srv"
};

module.exports = (options) => {
  try {
    const packagePath = path.join(process.cwd(), "package.json");
    if (!fs.existsSync(packagePath)) {
      console.log(`Project package.json not found at '${packagePath}'.`);
      return false;
    }
    const packageJson = require(packagePath);

    let srcFolder;
    let destFolder;
    if (!isJava(options)) {
      srcFolder = path.join(__dirname, "..", "templates", Files.node);
      destFolder = path.join(process.cwd(), "srv");
    } else {
      srcFolder = path.join(__dirname, "..", "templates", Files.java);
      destFolder = path.join(process.cwd(), "srv/src/main/java/customer", packageJson.name, "scheduling");
    }
    copyFolderAdjusted(srcFolder, destFolder, {}, (content) => {
      if (isJava(options)) {
        content = content.replace("package customer.scheduling;", `package customer.${packageJson.name}.scheduling;`);
      }
      return content;
    });
    console.log(`Folder '${destFolder}' written.`);
  } catch (err) {
    console.error(err.message);
  }
};
