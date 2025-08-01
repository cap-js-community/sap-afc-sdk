/* eslint-disable no-console */
"use strict";

const path = require("path");
const shelljs = require("shelljs");

const { projectName, isNode, adjustXML } = require("../common/util");

const Plugins = [
  {
    groupId: "com.github.cap.js.community",
    artifactId: "sap-afc-sdk",
    packaging: "jar",
  },
];

module.exports = {
  register: function (program) {
    return program
      .command("update")
      .description("Update project")
      .option("-n, --node", "Node flavor enforced")
      .option("-j, --java", "Java flavor enforced")
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
    const version = require(path.join(__dirname, "../../package.json")).version;
    if (isNode(options)) {
      processNode(version);
    } else {
      processJava(version);
    }
    processCommon(version);
    return true;
  },
};

function processNode() {}

function processJava(version) {
  // Maven
  for (const plugin of Plugins) {
    const pluginPath = path.join(__dirname, "../builds", `${plugin.artifactId}-${version}.${plugin.packaging}`);
    const args = [
      "install:install-file",
      `-Dfile=${pluginPath}`,
      `-DgroupId=${plugin.groupId}`,
      `-DartifactId=${plugin.artifactId}`,
      `-Dversion=${version}`,
      `-Dpackaging=${plugin.packaging}`,
    ];
    const result = shelljs.exec(`mvn ${args.join(" ")}`);
    if (result.code === 0) {
      console.log(`Successfully installed ${plugin.artifactId} version ${version} to local Maven repository.`);
    } else {
      console.error(`Failed to install ${plugin.artifactId} version ${version} to local Maven repository.`);
      // eslint-disable-next-line n/no-process-exit
      process.exit(-1);
    }
  }
  // POM
  adjustXML("srv/pom.xml", (xml) => {
    for (const plugin of Plugins) {
      const dependency = xml.project.dependencies[0].dependency.find(
        (dep) => dep.groupId[0] === plugin.groupId && dep.artifactId[0] === plugin.artifactId,
      );
      if (dependency) {
        dependency.version = version;
      }
    }
    return xml;
  });
}

function processCommon() {}
