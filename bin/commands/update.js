/* eslint-disable no-console */
"use strict";

const path = require("path");
const shelljs = require("shelljs");

const { projectName } = require("../common/util");

const config = require("../config.json");

const { isJava } = require("../common/util");

const Plugins = {
  sapafcsdk: {
    file: "sap-afc-sdk-1.0.0.jar",
    group: "com.github.cap.js.community",
    artifact: "sap-afc-sdk",
    version: "1.0.0",
    packaging: "jar",
    pom: true,
  },
};

module.exports = {
  register: function (program) {
    return program
      .command("update")
      .description("Update project")
      .option("-j, --java", "Java based project")
      .addHelpText(
        "afterAll",
        `
Examples:
  afc update
`,
      );
  },
  handle: function (target) {
    const name = projectName();
    if (!name) {
      console.log(`CDS project not found`);
      return false;
    }

    console.log(`Updating project`);
    const success = module.exports.process(target, this.opts());
    if (success) {
      console.log("Successfully updated project.");
    } else {
      // eslint-disable-next-line n/no-process-exit
      process.exit(-1);
    }
  },
  process: function (target, options) {
    try {
      target ||= config.defaultTarget;
      if (!isJava(options)) {
        processNode(target);
      } else {
        processJava(target);
      }
      processCommon(target);
      return true;
    } catch (err) {
      console.error("Project update failed: ", err.message);
    }
    return false;
  },
};

function processNode() {}

function processJava() {
  for (const name in Plugins) {
    const plugin = Plugins[name];
    const pluginPath = path.join(__dirname, "../lib", plugin.file);
    const args = [
      "install:install-file",
      `-Dfile=${pluginPath}`,
      `-DgroupId=${plugin.group}`,
      `-DartifactId=${plugin.artifact}`,
      `-Dversion=${plugin.version}`,
      `-Dpackaging=${plugin.packaging}`,
      `-DgeneratePom=${plugin.pom}`,
    ];
    shelljs.exec(`mvn ${args.join(" ")}`);
  }
}

function processCommon() {}
