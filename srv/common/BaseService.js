"use strict";

const cds = require("@sap/cds");

module.exports = class BaseApplicationService extends cds.Service {
  async init() {
    return super.init();
  }
};
