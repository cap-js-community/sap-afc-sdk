"use strict";

const BaseApplicationService = require("../common/BaseApplicationService");
const { unique } = require("../../src/util/helper");

module.exports = class SchedulingWebsocketService extends BaseApplicationService {
  async init() {
    this.on("eventQueueCluster.jobStatusChanged", async (req) => {
      return req.eventQueue.clusterByDataProperty("status", (status, entries) => {
        return {
          IDs: unique(entries.reduce((result, entry) => result.concat(entry.IDs), [])),
          status,
        };
      });
    });

    await super.init();
  }
};
