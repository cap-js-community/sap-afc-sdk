/* eslint-disable no-console */
"use strict";

const { adjustJSON, adjustYAMLAllDocuments, isJava } = require("../common/util");
const YAML = require("yaml");

const Mock = {
  Basic: {
    min: 0,
    max: 10,
    default: "completed",
  },
  Advanced: {
    min: 0,
    max: 10,
    default: "completed",
    status: {
      completed: 0.5,
      completedWithWarning: 0.2,
      completedWithError: 0.2,
      failed: 0.1,
    },
  },
};

module.exports = (options) => {
  if (!isJava(options)) {
    processNode(options);
  } else {
    processJava(options);
  }
};

function processNode(options) {
  try {
    adjustJSON("package.json", (json) => {
      if (options.xremove) {
        delete json.cds?.requires?.["sap-afc-sdk"]?.mockProcessing;
      } else {
        json.cds ??= {};
        json.cds.requires ??= {};
        json.cds.requires["sap-afc-sdk"] ??= {};
        if (options.advanced) {
          json.cds.requires["sap-afc-sdk"].mockProcessing = Mock.Advanced;
        } else {
          json.cds.requires["sap-afc-sdk"].mockProcessing = Mock.Basic;
        }
      }
    });
  } catch (err) {
    console.error(err.message);
  }
}

function processJava(options) {
  adjustYAMLAllDocuments("srv/src/main/resources/application.yaml", (yamls) => {
    let yaml = yamls.find((yaml) => !yaml.getIn(["spring", "config.activate.on-profile"]));
    if (!yaml) {
      yaml = new YAML.Document();
      yamls.unshift(yaml);
    }
    if (yaml.getIn(["sap-afc-sdk", "mockProcessing"])) {
      if (options.xremove) {
        yaml.deleteIn(["sap-afc-sdk", "mockProcessing"]);
      }
    } else {
      if (options.advanced) {
        yaml.setIn(["sap-afc-sdk", "mockProcessing"], Mock.Advanced);
      } else {
        yaml.setIn(["sap-afc-sdk", "mockProcessing"], Mock.Basic);
      }
    }
    return yamls;
  });
}
