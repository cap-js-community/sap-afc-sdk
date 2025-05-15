/* eslint-disable no-console */
"use strict";

const { adjustJSON, adjustYAMLAllDocument, isJava } = require("../common/util");

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
          json.cds.requires["sap-afc-sdk"].mockProcessing = {
            min: 0,
            max: 10,
            default: "completed",
            status: {
              completed: 0.5,
              completedWithWarning: 0.2,
              completedWithError: 0.2,
              failed: 0.1,
            },
          };
        } else {
          json.cds.requires["sap-afc-sdk"].mockProcessing = true;
        }
      }
    });
  } catch (err) {
    console.error(err.message);
  }
}

function processJava(options) {
  adjustYAMLAllDocument("srv/src/main/resources/application.yaml", (yaml, index) => {
    if (index !== 0) {
      return yaml;
    }
    if (yaml.getIn(["sap-afc-sdk", "mockProcessing"])) {
      if (options.xremove) {
        yaml.deleteIn(["sap-afc-sdk", "mockProcessing"]);
      }
    } else {
      if (options.advanced) {
        yaml.setIn(["sap-afc-sdk", "mockProcessing"], {
          min: 0,
          max: 10,
          default: "completed",
          status: {
            completed: 0.5,
            completedWithWarning: 0.2,
            completedWithError: 0.2,
            failed: 0.1,
          },
        });
      } else {
        yaml.setIn(["sap-afc-sdk", "mockProcessing"], {
          default: "completed",
        });
      }
    }
  });
}
