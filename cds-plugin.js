"use strict";

const fs = require("fs");
const path = require("path");
const cds = require("@sap/cds");
const Broker = require("@sap/sbf");
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const { config } = require("@cap-js-community/event-queue");
const toggles = require("@cap-js-community/feature-toggle-library");

const { mergeDeep } = require("./src/util/helper");

const SWAGGER_UI_PATH = "/api-docs";

process.env.CDS_PLUGIN_PACKAGE ??= "@cap-js-community/sap-afc-sdk";

cds.on("bootstrap", () => {
  addErrorMiddleware();
  serveBroker();
  serveUIs();
  serveSwaggerUI();
});

cds.on("listening", () => {
  outboxServices();
  handleFeatureToggles();
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
  if (!cds.env.requires?.["sap-afc-sdk"]?.broker) {
    return;
  }
  let brokerConfig;
  let catalogPath;
  const brokerPath = path.join(cds.root, "./srv/broker.json");
  try {
    brokerConfig = require(brokerPath);
    catalogPath = brokerConfig.catalog ?? "./srv/catalog.json";
    for (const key in brokerConfig) {
      if (key.startsWith("SBF_")) {
        process.env[key] ??= JSON.stringify(brokerConfig[key]);
      }
    }
  } catch (err) {
    cds.log("/broker").info(`broker.json not found at '${brokerPath}'. Call 'afc add broker'`);
  }
  try {
    const router = express.Router();
    const broker = new Broker({
      enableAuditLog: false,
      catalog: catalogPath,
    });
    router.use("/broker", broker.app);
    cds.app.use(router);
  } catch (err) {
    cds.log("/broker").error("Failed to start broker", err);
  }
}

function serveUIs() {
  if (process.env.CDS_PLUGIN_PACKAGE === "." && process.env.NODE_ENV !== "test") {
    return;
  }
  if (!cds.env.requires?.["sap-afc-sdk"]?.ui) {
    return;
  }
  const uiPath = cds.env.requires?.["sap-afc-sdk"]?.ui?.path;
  let uiShowFlp = cds.env.requires?.["sap-afc-sdk"]?.ui?.flp;
  if (uiShowFlp) {
    const packageRoot = cds.utils.path.resolve(
      require.resolve(path.join(process.env.CDS_PLUGIN_PACKAGE, "package.json"), { paths: [cds.root] }),
      "..",
    );
    if (!fs.existsSync(`${cds.root}/app/appconfig/fioriSandboxConfig.json`)) {
      cds.app.serve(`${uiPath}/flp.html`).from(process.env.CDS_PLUGIN_PACKAGE, "/app/flp.html");
      cds.app.use(`/appconfig`, express.static(`${packageRoot}/app/appconfig`));
    } else {
      uiShowFlp = false;
      const projectFioriSandboxConfig = require(`${cds.root}/app/appconfig/fioriSandboxConfig.json`);
      const packageFioriSandboxConfig = require(`${packageRoot}/app/appconfig/fioriSandboxConfig.json`);
      if (uiPath) {
        for (const name in packageFioriSandboxConfig.applications ?? {}) {
          const application = packageFioriSandboxConfig.applications[name];
          application.url = `${uiPath}/${application.url}`;
        }
        for (const name in packageFioriSandboxConfig.services?.ClientSideTargetResolution?.adapter?.config?.inbounds ??
          {}) {
          const inbound =
            packageFioriSandboxConfig.services?.ClientSideTargetResolution?.adapter?.config?.inbounds[name];
          inbound.resolutionResult.url = `${uiPath}/${inbound.resolutionResult.url}`;
        }
      }
      const mergedFioriSandboxConfig = mergeDeep(packageFioriSandboxConfig, projectFioriSandboxConfig);
      cds.app.use(`/appconfig/fioriSandboxConfig.json`, (req, res) => {
        res.send(mergedFioriSandboxConfig);
      });
    }
  }
  const uiShowSchedulingMonitoringJob = cds.env.requires?.["sap-afc-sdk"]?.ui?.["scheduling.monitoring.job"];
  if (uiShowFlp || uiShowSchedulingMonitoringJob) {
    cds.app
      .serve(`${uiPath}/scheduling.monitoring.job`)
      .from(process.env.CDS_PLUGIN_PACKAGE, "/app/scheduling.monitoring.job/webapp");
    cds.app
      .serve(`${uiPath}/scheduling.monitoring.job/webapp`)
      .from(process.env.CDS_PLUGIN_PACKAGE, "/app/scheduling.monitoring.job/webapp");
  }
}

function serveSwaggerUI() {
  const router = express.Router();
  cds.on("serving", (service) => {
    const openAPI = service.definition?.["@openapi"];
    if (openAPI) {
      const apiPath = SWAGGER_UI_PATH + service.path;
      cds.log("/swagger").info("Serving Swagger UI for ", { service: service.name, at: apiPath });
      router.use(
        apiPath,
        ...cds.middlewares.before,
        (req, res, next) => {
          const restrict_all = cds.env.requires?.auth?.restrict_all_services !== false;
          if (!restrict_all || cds.context?.user?._is_privileged || !cds.context?.user?._is_anonymous) {
            return next();
          }
          res.send(401, "Unauthorized");
        },
        (req, res, next) => {
          req.swaggerDoc = toOpenApiDoc(req, service, openAPI);
          if (req.swaggerDoc) {
            return next();
          }
          res.send(404, "Not found");
        },
        swaggerUi.serveFiles(),
        swaggerUi.setup(null, {}),
        ...cds.middlewares.after,
      );
      addLinkToIndexHtml(service, apiPath);
    }
  });
  cds.app.use(router);
}

const openAPICache = new Map();

function toOpenApiDoc(req, service, filePath) {
  filePath = filePath === true ? `${service.name}.json` : filePath;
  if (openAPICache.has(filePath)) {
    return openAPICache.get(filePath);
  }
  let openAPI;
  const paths = [
    path.join(cds.root, filePath),
    path.join(cds.root, "openapi", filePath),
    path.join(__dirname, filePath),
    path.join(__dirname, "openapi", filePath),
  ];
  for (const path of paths) {
    if (fs.existsSync(path)) {
      openAPI = JSON.parse(fs.readFileSync(path));
      if (openAPI) {
        break;
      }
    }
  }
  if (openAPI) {
    const clientCredentials = openAPI?.components?.securitySchemes?.oauth2?.flows?.clientCredentials;
    if (clientCredentials) {
      clientCredentials.tokenUrl = authorizationUrl() + "/oauth/token";
    }
    openAPI.servers.forEach((server) => {
      if (!server.url.startsWith("https://") && !server.url.startsWith("http://")) {
        server.url = `${serverUrl()}${server.url}`;
      }
    });
    openAPICache.set(filePath, openAPI);
  }
  return openAPI;
}

function serverUrl() {
  // TODO: K8S?
  return process.env.VCAP_APPLICATION
    ? "https://" + JSON.parse(process.env.VCAP_APPLICATION).uris?.[0]
    : cds.server.url;
}

function authorizationUrl() {
  // TODO: IAS?
  return cds.env.requires?.auth?.credentials?.url ?? "https://authentication.sap.hana.ondemand.com";
}

function addLinkToIndexHtml(service, apiPath) {
  const provider = () => {
    return { href: apiPath, name: "Open API", title: "Show in Swagger UI" };
  };
  service.$linkProviders ? service.$linkProviders.push(provider) : (service.$linkProviders = [provider]);
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

function handleFeatureToggles() {
  config.isEventQueueActive = toggles.getFeatureValue("eventQueue/active");
  toggles.registerFeatureValueChangeHandler("eventQueue/active", (value) => {
    config.isEventQueueActive = value;
  });
  config.instanceLoadLimit = toggles.getFeatureValue("eventQueue/instanceLoadLimit");
  toggles.registerFeatureValueChangeHandler("eventQueue/instanceLoadLimit", (value) => {
    config.instanceLoadLimit = value;
  });
}
