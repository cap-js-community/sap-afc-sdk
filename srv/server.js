"use strict";

const cds = require("@sap/cds");

process.env.SAP_AFC_SDK_PLUGIN_PACKAGE = ".";

module.exports = async (options) => {
  await require("../cds-plugin");
  return cds.server(options);
};
