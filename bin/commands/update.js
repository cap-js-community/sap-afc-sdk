/* eslint-disable no-console */
"use strict";

const path = require("path");
const shelljs = require("shelljs");

const { projectName, isJava, adjustXML } = require("../common/util");

const Plugins = {
  sapafcsdk: {
    group: "com.github.cap.js.community",
    artifact: "sap-afc-sdk",
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
  handle: function () {
    const name = projectName();
    if (!name) {
      console.log(`CDS project not found`);
      return false;
    }

    console.log(`Updating project`);
    const success = module.exports.process(this.opts());
    if (success) {
      console.log("Successfully updated project.");
    } else {
      // eslint-disable-next-line n/no-process-exit
      process.exit(-1);
    }
  },
  process: function (options) {
    try {
      const version = require(path.join(__dirname, "../../package.json")).version;
      if (!isJava(options)) {
        processNode(version);
      } else {
        processJava(version);
      }
      processCommon(version);
      return true;
    } catch (err) {
      console.error("Project update failed: ", err.message);
    }
    return false;
  },
};

function processNode() {}

function processJava(version) {
  // Maven
  for (const name in Plugins) {
    const plugin = Plugins[name];
    const pluginPath = path.join(__dirname, "../builds", `${plugin.artifact}-${version}.${plugin.packaging}`);
    const args = [
      "install:install-file",
      `-Dfile=${pluginPath}`,
      `-DgroupId=${plugin.group}`,
      `-DartifactId=${plugin.artifact}`,
      `-Dversion=${version}`,
      `-Dpackaging=${plugin.packaging}`,
      `-DgeneratePom=${plugin.pom}`,
    ];
    shelljs.exec(`mvn ${args.join(" ")}`);
  }
  // POM
  adjustXML("srv/pom.xml", (xml) => {
    for (const name in Plugins) {
      const plugin = Plugins[name];
      const dependency = xml.project.dependencies[0].dependency.find(
        (dep) => dep.groupId[0] === plugin.group && dep.artifactId[0] === plugin.artifact,
      );
      if (dependency) {
        dependency.version = version;
      }
    }
    return xml;
  });
}

function processCommon() {}
