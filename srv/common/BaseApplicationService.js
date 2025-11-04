"use strict";

const cds = require("@sap/cds");

const BaseError = require("../common/BaseError");
const { launchpadUrl } = require("../../src/util/url");

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

  fillLink(entity, object, action) {
    if (cds.env.requires?.["sap-afc-sdk"]?.ui?.link) {
      this.after("READ", entity, async (result, req) => {
        for (const row of result) {
          if (row.ID && row.link === null) {
            row.link = `${launchpadUrl(req)}#${object}-${action}&/${object}(${row.ID})`;
          }
        }
      });
    }
  }
};
