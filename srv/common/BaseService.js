"use strict";

const cds = require("@sap/cds");

module.exports = class BaseService extends cds.Service {
  async init() {
    return super.init();
  }
};
