"use strict";

const cds = require("@sap/cds");
const Broker = require("@sap/sbf");
const express = require("express");

process.env.CDS_PLUGIN_PACKAGE ??= "@cap-js-community/sap-afc-sdk";

cds.on("bootstrap", () => {
  addErrorMiddleware();
  serveBroker();
  serveUIs();
});

cds.on("listening", () => {
  outboxServices();
});

function addErrorMiddleware() {
  cds.middlewares.after.unshift(handleError);
}

function handleError(err, req, res, next) {
  if (!err) {
    return next(err);
  }
  if (req.baseUrl?.startsWith("/api/")) {
    res.status(err.statusCode || 500).send({
      code: err.code || "500",
      message: err.message || "Internal Server Error",
    });
    return;
  }
  next(err);
}

function serveBroker() {
  if (cds.env.requires?.["sap-afc-sdk"]?.broker) {
    const router = express.Router();
    const broker = new Broker({
      enableAuditLog: false,
    });
    router.use("/broker", broker.app);
    cds.app.use(router);
  }
}

function serveUIs() {
  if (process.env.CDS_PLUGIN_PACKAGE === ".") {
    return;
  }
  const uiPath = cds.env.requires?.["sap-afc-sdk"]?.ui?.path;
  const uiShowFlp = cds.env.requires?.["sap-afc-sdk"]?.ui?.flp;
  const uiShowSchedulingMonitoringJob = cds.env.requires?.["sap-afc-sdk"]?.ui?.["scheduling.monitoring.job"];
  if (uiShowFlp) {
    cds.app.use(`/appconfig`, express.static(`${process.env.CDS_PLUGIN_PACKAGE}/app/appconfig`));
    cds.app.serve(`${uiPath}/flp.html`).from(process.env.CDS_PLUGIN_PACKAGE, "/app/flp.html");
  }
  if (uiShowFlp || uiShowSchedulingMonitoringJob) {
    cds.app
      .serve(`${uiPath}/scheduling.monitoring.job`)
      .from(process.env.CDS_PLUGIN_PACKAGE, "/app/scheduling.monitoring.job/webapp");
    cds.app
      .serve(`${uiPath}/scheduling.monitoring.job/webapp`)
      .from(process.env.CDS_PLUGIN_PACKAGE, "/app/scheduling.monitoring.job/webapp");
  }
}

function outboxServices() {
  if (cds.services.SchedulingProcessingService && cds.requires.SchedulingProcessingService.outbox) {
    cds.services.SchedulingProcessingService.options.outbox = cds.requires.SchedulingProcessingService.outbox;
    cds.services.SchedulingProcessingService = cds.outboxed(cds.services.SchedulingProcessingService);
  }
  if (cds.services.SchedulingWebsocketService && cds.requires.SchedulingWebsocketService.outbox) {
    cds.services.SchedulingWebsocketService.options.outbox = cds.requires.SchedulingWebsocketService.outbox;
    cds.services.SchedulingWebsocketService = cds.outboxed(cds.services.SchedulingWebsocketService);
  }
}
