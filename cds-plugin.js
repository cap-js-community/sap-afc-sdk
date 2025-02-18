"use strict";

const fs = require("fs");
const path = require("path");
const cds = require("@sap/cds");
const Broker = require("@sap/sbf");
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const { config: eventQueueConfig } = require("@cap-js-community/event-queue");
const toggles = require("@cap-js-community/feature-toggle-library");

const { mergeDeep } = require("./src/util/helper");

const config = mergeDeep(require("./config"), cds.env.requires?.["sap-afc-sdk"]?.config ?? {});

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
  let brokerConfig = {};
  const envBrokerConfig = typeof cds.env.requires?.["sap-afc-sdk"]?.broker;
  if (envBrokerConfig && typeof envBrokerConfig === "object") {
    brokerConfig = envBrokerConfig;
  }
  const brokerPath = path.join(cds.root, config.paths.broker);
  try {
    brokerConfig = mergeDeep(require(brokerPath), brokerConfig);
  } catch (err) {
    if (Object.keys(brokerConfig).length === 0) {
      cds.log("/broker").info(`broker.json not found at '${brokerPath}'. Call 'afc add broker'`);
    }
  }
  const catalogPath = brokerConfig.catalog ?? config.paths.catalog;
  for (const key in brokerConfig) {
    if (key.startsWith("SBF_")) {
      process.env[key] ??= JSON.stringify(brokerConfig[key]);
    }
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
  let uiShowLaunchpad = cds.env.requires?.["sap-afc-sdk"]?.ui?.launchpad;
  if (uiShowLaunchpad) {
    const packageRoot = cds.utils.path.resolve(
      require.resolve(path.join(process.env.CDS_PLUGIN_PACKAGE, "package.json"), { paths: [cds.root] }),
      "..",
    );
    if (!fs.existsSync(`${cds.root}/${cds.env.folders.app}appconfig/fioriSandboxConfig.json`)) {
      cds.app.serve(`${uiPath}/${config.paths.launchpad}`).from(process.env.CDS_PLUGIN_PACKAGE, "/app/launchpad.html");
      cds.app.use(`/appconfig`, express.static(`${packageRoot}/app/appconfig`));
    } else {
      serveAppConfig(packageRoot, uiPath);
      uiShowLaunchpad = false;
    }
  }
  for (const app in config.apps) {
    const uiShowApp = cds.env.requires?.["sap-afc-sdk"]?.ui?.app;
    if ((uiShowLaunchpad || uiShowApp) && !fs.existsSync(`${cds.root}/${cds.env.folders.app}${app}`)) {
      cds.app
        .serve(`${uiPath}/${app}`)
        .from(process.env.CDS_PLUGIN_PACKAGE, config.paths[app] ?? `${cds.env.folders.app}${app}/webapp`);
      cds.app
        .serve(`${uiPath}/${app}/webapp`)
        .from(process.env.CDS_PLUGIN_PACKAGE, config.paths[app] ?? `${cds.env.folders.app}${app}/webapp`);
    }
  }
}

function serveAppConfig(packageRoot, uiPath) {
  cds.app.use(`/appconfig/fioriSandboxConfig.json`, (req, res) => {
    const projectFioriSandboxConfig = require(`${cds.root}/${cds.env.folders.app}appconfig/fioriSandboxConfig.json`);
    const packageFioriSandboxConfig = require(`${packageRoot}/app/appconfig/fioriSandboxConfig.json`);
    if (uiPath) {
      for (const name in packageFioriSandboxConfig.applications ?? {}) {
        const application = packageFioriSandboxConfig.applications[name];
        application.url = `${uiPath}/${application.url}`;
      }
      for (const name in packageFioriSandboxConfig.services?.ClientSideTargetResolution?.adapter?.config?.inbounds ??
        {}) {
        const inbound = packageFioriSandboxConfig.services?.ClientSideTargetResolution?.adapter?.config?.inbounds[name];
        inbound.resolutionResult.url = `${uiPath}/${inbound.resolutionResult.url}`;
      }
    }
    const mergedFioriSandboxConfig = mergeDeep(packageFioriSandboxConfig, projectFioriSandboxConfig);
    res.send(mergedFioriSandboxConfig);
  });
}

function serveSwaggerUI() {
  const router = express.Router();
  cds.on("serving", (service) => {
    const openAPI = service.definition?.["@openapi"];
    if (openAPI) {
      const apiPath = config.paths.swaggerUi + service.path;
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

function toOpenApiDoc(req, service, name) {
  const filePath = `${name === true ? service.name : name}.${config.extensions.openapi}`;
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
  // TODO: K8S
  return process.env.VCAP_APPLICATION
    ? "https://" + JSON.parse(process.env.VCAP_APPLICATION).uris?.[0]
    : cds.server.url;
}

function authorizationUrl() {
  // TODO: IAS
  return cds.env.requires?.auth?.credentials?.url ?? config.endpoints.authentication;
}

function addLinkToIndexHtml(service, apiPath) {
  const provider = () => {
    return { href: apiPath, name: "Open API", title: "Show in Swagger UI" };
  };
  service.$linkProviders ? service.$linkProviders.push(provider) : (service.$linkProviders = [provider]);
}

function outboxServices() {
  for (const service in config.services) {
    if (cds.services[service] && cds.requires[service]?.outbox && config.services[service].outbox) {
      cds.services[service].options.outbox = cds.requires[service].outbox;
      cds.services[service] = cds.outboxed(cds.services[service]);
    }
  }
}

function handleFeatureToggles() {
  // event-queue
  for (const name in config.toggles.eventQueue) {
    const toggle = config.toggles.eventQueue[name];
    eventQueueConfig[name] = toggles.getFeatureValue(toggle);
    toggles.registerFeatureValueChangeHandler(toggle, (value) => {
      eventQueueConfig[name] = value;
    });
  }
}
