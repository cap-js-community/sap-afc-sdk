"use strict";

const cds = require("@sap/cds");

const BaseApplicationService = require("../common/BaseApplicationService");

module.exports = class SchedulingMonitoringService extends BaseApplicationService {
  async init() {
    const { Job } = this.entities;
    const { Job: ProviderJob } = cds.entities("SchedulingProviderService");

    this.fillLink(Job, "Job", "manage");

    this.on(Job.actions.cancel, Job, async (req, next) => {
      const providerService = await cds.connect.to("SchedulingProviderService");
      const ID = req.params[0].ID;
      await providerService.tx(req).cancel(ProviderJob, ID);
      req.notify(200, "cancelJobSuccess");
      return await this.read(Job, ID);
    });

    return super.init();
  }
};
