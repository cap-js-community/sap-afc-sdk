"use strict";

const cds = require("@sap/cds");

const BaseError = require("../common/BaseError");

module.exports = class BaseApplicationService extends cds.ApplicationService {
  async init() {
    return super.init();
  }

  async handle(req) {
    try {
      return await super.handle(req);
    } catch (err) {
      if (err instanceof BaseError) {
        throw err;
      }
      const status = parseInt(err.status ?? err.code);
      if (isNaN(status) || status >= 500) {
        const unexpectedError = BaseError.unexpectedError();
        cds.log("sapafcsdk/service").error(unexpectedError.name, err);
        throw unexpectedError;
      }
      throw err;
    }
  }
};
