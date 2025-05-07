"use strict";

const fs = require("fs");
const path = require("path");
const cds = require("@sap/cds");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const { StatusCodes, getReasonPhrase } = require("http-status-codes");
const toggles = require("@cap-js-community/feature-toggle-library");
const { config: eventQueueConfig } = require("@cap-js-community/event-queue");

const { merge, toObject } = require("./src/util/helper");

const config = merge([require("./config.json"), cds.env.requires?.["sap-afc-sdk"]?.config ?? {}]);

const SERVER_SUFFIX = "srv";
const APPROUTER_SUFFIX = "approuter";

process.env.SAP_AFC_SDK_PLUGIN_PACKAGE ??= "@cap-js-community/sap-afc-sdk";

cds.on("bootstrap", () => {
  secureRoutes();
  addMiddlewares();
  serveBroker();
  serveUIs();
  serveSwaggerUI();
});

cds.on("connect", (srv) => {
  if (srv.name === "db") {
    registerAfterReadJobFillLink(srv);
  }
});

cds.on("listening", () => {
  rerouteWebsocket();
  serveApiRoot();
  outboxServices();
  handleFeatureToggles();
});

function secureRoutes() {
  if (cds.env.requires?.["sap-afc-sdk"]?.api?.cors) {
    const corsOptions = toObject(cds.env.requires?.["sap-afc-sdk"]?.api?.cors);
    const origin =
      corsOptions.origin !== undefined && corsOptions.origin !== null
        ? corsOptions.origin
        : cds.env.requires.multitenancy
          ? approuterUrlRegExp()
          : approuterUrl();
    cds.app.use(
      "/api",
      cors({
        ...corsOptions,
        origin,
      }),
    );
  }
  if (serverUrl().startsWith("http://localhost")) {
    return;
  }
  if (cds.env.requires?.["sap-afc-sdk"]?.api?.csp) {
    const csp = toObject(cds.env.requires?.["sap-afc-sdk"]?.api?.csp);
    const defaultDirectives = helmet.contentSecurityPolicy.getDefaultDirectives();
    cds.app.use(
      "/api",
      helmet({
        contentSecurityPolicy: {
          directives: {
            ...defaultDirectives,
            "default-src": [
              ...(defaultDirectives["default-src"] || []),
              cds.env.requires.multitenancy ? approuterWildcardUrl() : approuterUrl(),
              serverUrl(),
              authorizationUrl(),
            ],
            ...csp,
          },
        },
      }),
    );
  }
}

function addMiddlewares() {
  cds.middlewares.after.unshift(handleError);
}

function handleError(err, req, res, next) {
  if (!err) {
    return next(err);
  }
  if (req.baseUrl?.startsWith("/api/")) {
    return handleAPIError(err, req, res);
  }
  next(err);
}

function handleAPIError(err, req, res) {
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  const codes = [err.statusCode, err.status, err.code, err];
  for (const code of codes) {
    if (!isNaN(code) && StatusCodes[String(code)]) {
      statusCode = parseInt(code);
      break;
    }
  }
  res.status(statusCode).send({
    code: String(err.code || statusCode),
    message: err.message || getReasonPhrase(statusCode),
  });
}

function serveApiRoot() {
  const result = Object.keys(cds.services).reduce((result, name) => {
    const service = cds.services[name];
    if (service?.definition?.["@openapi"] && service?.path) {
      result[service?.path] = `${serverUrl()}${service.path}`;
    }
    return result;
  }, {});
  cds.app.get(
    "/api",
    ...cds.middlewares.before,
    (req, res) => {
      res.status(200).json(result);
    },
    ...cds.middlewares.after,
  );
}

function serveBroker() {
  if (!cds.env.requires?.["sap-afc-sdk"]?.broker) {
    return;
  }
  let brokerConfig = toObject(cds.env.requires?.["sap-afc-sdk"]?.broker);
  const brokerPath = path.join(cds.root, config.paths.broker);
  try {
    brokerConfig = merge([require(brokerPath), brokerConfig]);
  } catch (err) {
    if (Object.keys(brokerConfig).length === 0) {
      cds.log("/broker").info(`broker.json not found at '${brokerPath}'. Call 'afc add broker'`);
    }
  }
  for (const service in brokerConfig?.SBF_SERVICE_CONFIG ?? {}) {
    const endpoints = brokerConfig?.SBF_SERVICE_CONFIG[service]?.extend_credentials?.shared?.endpoints ?? {};
    for (const endpoint in endpoints) {
      if (!/https?:\/\//.test(endpoints[endpoint])) {
        endpoints[endpoint] = `${serverUrl()}${endpoints[endpoint]}`;
      }
    }
  }
  for (const key in brokerConfig) {
    if (key.startsWith("SBF_")) {
      process.env[key] ??= JSON.stringify(brokerConfig[key]);
    }
  }
  try {
    const catalogPath = brokerConfig.catalog ?? config.paths.catalog;
    const router = express.Router();
    const Broker = require("@sap/sbf");
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
  if (process.env.SAP_AFC_SDK_PLUGIN_PACKAGE === "." && process.env.NODE_ENV !== "test") {
    return;
  }
  if (!cds.env.requires?.["sap-afc-sdk"]?.ui) {
    return;
  }
  const uiPath = cds.env.requires?.["sap-afc-sdk"]?.ui?.path;
  let uiShowLaunchpad = cds.env.requires?.["sap-afc-sdk"]?.ui?.launchpad;
  if (uiShowLaunchpad) {
    const packageRoot = cds.utils.path.resolve(
      require.resolve(path.join(process.env.SAP_AFC_SDK_PLUGIN_PACKAGE, "package.json"), { paths: [cds.root] }),
      "..",
    );
    if (!fs.existsSync(`${cds.root}/${cds.env.folders.app}appconfig/fioriSandboxConfig.json`)) {
      cds.app
        .serve(`${uiPath}/${config.paths.launchpad}`)
        .from(process.env.SAP_AFC_SDK_PLUGIN_PACKAGE, "/app/launchpad.html");
      cds.app.use(`/appconfig`, express.static(`${packageRoot}/app/appconfig`));
    } else {
      serveMergedAppConfig(packageRoot, uiPath);
    }
  }
  for (const app in config.apps) {
    const uiShowApp = cds.env.requires?.["sap-afc-sdk"]?.ui?.[app];
    if (
      (uiShowLaunchpad || uiShowApp) &&
      (!fs.existsSync(`${cds.root}/${cds.env.folders.app}${app}`) || process.env.NODE_ENV === "test")
    ) {
      if (uiShowLaunchpad) {
        cds.app
          .serve(`${uiPath}/${app}/webapp`)
          .from(process.env.SAP_AFC_SDK_PLUGIN_PACKAGE, config.paths[app] ?? `${cds.env.folders.app}${app}/webapp`);
      } else if (uiShowApp) {
        cds.app
          .serve(`${uiPath}/${app}`)
          .from(process.env.SAP_AFC_SDK_PLUGIN_PACKAGE, config.paths[app] ?? `${cds.env.folders.app}${app}/webapp`);
      }
    }
  }
}

function rerouteWebsocket() {
  cds.app.server.on("upgrade", function (req) {
    for (const app in config.apps) {
      if (req.url.startsWith(`/${app}/webapp/ws`)) {
        req.url = req.url.replace(`/${app}/webapp/ws`, "/ws");
        return;
      } else if (req.url.startsWith(`/${app}/ws`)) {
        req.url = req.url.replace(`/${app}/ws`, "/ws");
        return;
      }
    }
  });
}

function serveMergedAppConfig(packageRoot, uiPath) {
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
    const mergedFioriSandboxConfig = merge([packageFioriSandboxConfig, projectFioriSandboxConfig], {
      array: "merge",
      mergeKey: "id",
    });
    res.send(mergedFioriSandboxConfig);
  });
}

function serveSwaggerUI() {
  const swaggerConfig = cds.env.requires?.["sap-afc-sdk"]?.ui?.swagger;
  if (!swaggerConfig) {
    return;
  }
  const router = express.Router();
  cds.on("serving", (service) => {
    const openAPI = service.definition?.["@openapi"];
    if (openAPI) {
      if (!(swaggerConfig === true || swaggerConfig[service.name])) {
        return;
      }
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
          res.status(401).send("Unauthorized");
        },
        (req, res, next) => {
          req.swaggerDoc = toOpenApiDoc(req, service, openAPI);
          if (req.swaggerDoc) {
            return next();
          }
          res.status(404).send("Not found");
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

let _approuterUrl;
function approuterUrl() {
  if (_approuterUrl) {
    return _approuterUrl;
  }
  if (cds.env.requires?.["sap-afc-sdk"]?.endpoints?.approuter) {
    return (_approuterUrl = cds.env.requires["sap-afc-sdk"].endpoints.approuter);
  }
  if (process.env.VCAP_APPLICATION) {
    return (_approuterUrl = serverUrl().replace(new RegExp(`(https:\\/\\/.*?)-${SERVER_SUFFIX}(.*)`), `$1$2`));
  } else {
    return (_approuterUrl = serverUrl().replace(
      new RegExp(`(https:\\/\\/.*?)-${SERVER_SUFFIX}(.*)`),
      `$1-${APPROUTER_SUFFIX}$2`,
    ));
  }
}

function approuterDomain() {
  let url = approuterUrl();
  if (url?.startsWith("https://")) {
    url = url.substring(8);
  }
  return url;
}

function approuterWildcardUrl() {
  return `*.${approuterDomain()}`;
}

function approuterTenantUrl(req) {
  if (cds.env.requires.multitenancy) {
    const subdomain = req.user?.tokenInfo?.extAttributes?.zdn;
    if (subdomain) {
      return `https://${subdomain}${cds.env.tenant_separator ?? "."}${approuterDomain()}`;
    }
  }
  return approuterUrl();
}

function approuterUrlRegExp() {
  let url = approuterDomain();
  url = url.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
  return RegExp(url + "$");
}

let _serverUrl;
function serverUrl() {
  if (_serverUrl) {
    return _serverUrl;
  }
  if (cds.env.requires?.["sap-afc-sdk"]?.endpoints?.server) {
    return (_serverUrl = cds.env.requires["sap-afc-sdk"].endpoints.server);
  }
  if (process.env.VCAP_APPLICATION) {
    const url = JSON.parse(process.env.VCAP_APPLICATION).uris?.[0];
    if (url) {
      return (_serverUrl = `https://${url}`);
    }
  }
  return (_serverUrl = cds.server.url ?? `http://localhost:${process.env.PORT || cds.env.server?.port || 4004}`);
}

function authorizationUrl() {
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
  // Event-Queue
  for (const name in config.toggles.eventQueue) {
    const toggle = config.toggles.eventQueue[name];
    eventQueueConfig[name] = toggles.getFeatureValue(toggle);
    toggles.registerFeatureValueChangeHandler(toggle, (value) => {
      eventQueueConfig[name] = value;
    });
  }
}

function registerAfterReadJobFillLink(db) {
  if (!cds.env.requires?.["sap-afc-sdk"]?.ui?.link) {
    return;
  }
  db.after("READ", async (result, req) => {
    if (req.target.name.split(".").pop() !== "Job") {
      return;
    }
    result = Array.isArray(result) ? result : [result];
    for (const row of result) {
      if (row.ID && row.link === null) {
        row.link = `${approuterTenantUrl(req)}/${config.paths.launchpad}#Job-monitor&/Job(${row.ID})`;
      }
    }
  });
}

// Plugins
module.exports = (async () => {
  return await Promise.all(config.plugins.map((plugin) => require(`${plugin}/cds-plugin`)));
})();
