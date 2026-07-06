/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");
const shelljs = require("shelljs");
const { isNode, isJava, adjustJSON, copyFolderAdjusted, projectName, derivePackageName } = require("../common/util");

const Files = {
  node: "node/test",
  java: "java/test",
};

const VITEST_CONFIG = `"use strict";

module.exports = {
  test: {
    globals: true,
    include: ["**/test/**/*.test.js"],
    exclude: ["**/node_modules/**"],
    testTimeout: 60000,
  },
};
`;

module.exports = (options) => {
  try {
    const name = projectName();
    if (!name) {
      console.log(`CDS project not found`);
      return false;
    }

    let srcFolder;
    let destFolder;
    const packageName = derivePackageName(name);
    if (isNode(options)) {
      srcFolder = path.join(__dirname, "..", "templates", Files.node);
      destFolder = path.join(process.cwd(), "test");
    } else {
      srcFolder = path.join(__dirname, "..", "templates", Files.java);
      destFolder = path.join(process.cwd(), "srv/src/test/java/customer", packageName, "scheduling");
    }
    copyFolderAdjusted(srcFolder, destFolder, {}, (content) => {
      if (isJava(options)) {
        content = content.replace("package customer.scheduling", `package customer.${packageName}.scheduling`);
      }
      return content;
    });
    console.log(`Folder '${destFolder}' written.`);

    if (isNode(options)) {
      shelljs.exec(`npm install --save-dev @cap-js/cds-test vitest`, { silent: true });
      const vitestConfigPath = path.join(process.cwd(), "vitest.config.js");
      if (!fs.existsSync(vitestConfigPath)) {
        fs.writeFileSync(vitestConfigPath, VITEST_CONFIG, "utf8");
        console.log(`File '${vitestConfigPath}' written.`);
      }
      adjustJSON("package.json", (json) => {
        json.scripts ??= {};
        if (!json.scripts.test) {
          json.scripts.test = "vitest run";
        }
      });
    } else {
      adjustJSON("package.json", (json) => {
        json.scripts ??= {};
        if (!json.scripts.start) {
          json.scripts.start = "mvn spring-boot:run";
        }
        if (!json.scripts.test) {
          json.scripts.test = "mvn test";
        }
        if (!json.scripts.build) {
          json.scripts.build = "mvn cds:build";
        }
      });
    }
  } catch (err) {
    console.error(err.message);
  }
};
