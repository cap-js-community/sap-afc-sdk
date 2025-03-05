/* eslint-disable no-console */
"use strict";

const { adjustJSON } = require("../common/util");

module.exports = (options) => {
  try {
    adjustJSON("package.json", (json) => {
      json.cds ??= {};
      json.cds.requires ??= {};
      json.cds.requires["sap-afc-sdk"] ??= {};
      if (options.advanced) {
        json.cds.requires["sap-afc-sdk"].mockProcessing = {
          min: 0,
          max: 30,
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
    });
  } catch (err) {
    console.error(err.message);
  }
};
