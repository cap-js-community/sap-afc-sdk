/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");
const shelljs = require("shelljs");
const fetch = require("node-fetch");
const https = require("https");
const YAML = require("yaml");
const commander = require("commander");
const { open } = require("openurl");
const prompt = require("prompt-sync")();

const { adjustLines, generateHashBrokerPassword } = require("../common/util");

const PLAN_NAME = "standard";
const INTERNAL_SUFFIX = "internal";
const SERVICE_SUFFIX = "api";
const SERVICE_KEY_SUFFIX = "key";

const DEFAULT_VALIDITY = 365; // days

const PLACEHOLDERS = {
  host: {
    default: "<server host from cloud deployment>",
    url: true,
  },
  api: {
    default: "<api endpoint from cloud deployment>",
    url: true,
  },
  auth: {
    default: "<auth endpoint from cloud deployment>",
    url: true,
  },
  clientId: {
    default: "<xsuaa client id>",
    variable: "cfServiceKeyClientId",
  },
  clientSecret: {
    default: "<xsuaa client secret>",
    variable: "cfServiceKeyClientSecret",
  },
  token: {
    default: "<xsuaa token>",
    variable: "oauthToken",
  },
  internalClientId: {
    default: "<xsuaa internal client id>",
    variable: "internalClientId",
  },
  internalClientSecret: {
    default: "<xsuaa internal client secret>",
    variable: "internalClientSecret",
  },
  internalToken: {
    default: "<xsuaa intenral token>",
    variable: "oauthToken",
  },
};

module.exports = {
  register: function (program) {
    return program
      .command("api")
      .description("Manage API")
      .addArgument(new commander.Argument("<action>", "Manage API keys").choices(["key"]))
      .option("-n, --new [name]", "Create new API key with optional name")
      .option("-l, --label <label>", "Label for instances")
      .option("-s, --server <server-url>", "Server URL")
      .option("-p, --password <password>", "Broker password")
      .option("-a, --passcode", "Request temporary authentication code")
      .option("-i, --internal", "Fetch internal credentials")
      .option("-t, --token", "Fetch oauth token")
      .option("-b, --bearer", "Generate authorization bearer header")
      .option("-d, --destination", "Generate destination import file (json)")
      .option("-o, --properties", "Generate destination import file (txt)")
      .option("-h, --http", "Fill .http files")
      .option("-e, --endpoint <endpoint>", "API endpoint path")
      .option("-j, --jobscheduling", "Job Scheduling Provider API endpoint path")
      .option("-c, --clear", "Clear .http files placeholders")
      .option("-z, --certificate [days]", "x509 certificate (2048 bytes) days valid (default: 365)")
      .option("-r, --reset", "Reset API management")
      .option("-x, --xreset", "Reset API management")
      .option("-g, --generate", "Generate broker password and hash")
      .option("-v, --verbose", "Verbose log output")
      .addHelpText(
        "afterAll",
        `
Actions:
  key \t\t - manage service keys

Examples:
  afc api key
  afc api key --new
  afc api key -n test
  afc api key --server <server-url>
  afc api key -s <server-url>
  afc api key -h
  afc api key -h -i
  afc api key -h -c
  afc api key -d -e <endpoint>
  afc api key -d -j
`,
      );
  },
  handle: async function (action) {
    const options = this.opts();
    if (options.properties) {
      options.destination = true;
    }
    const success = await module.exports.process(action, options);
    if (success) {
      if (options.xreset || options.reset) {
        console.log("Successfully reset API management.");
      }
    } else {
      // eslint-disable-next-line n/no-process-exit
      process.exit(-1);
    }
  },
  process: async function (action, options) {
    let success = true;
    switch (action) {
      case "key":
        if (options.generate) {
          success = manageBroker(options);
        } else if (options.passcode) {
          success = managePasscode(options);
        } else if (options.reset || options.xreset) {
          success = manageClear(options) && manageReset(options);
        } else if (options.clear) {
          success = manageClear(options);
        } else if (options.internal) {
          success = await manageInternal(options);
        } else {
          success = await manageKey(options);
        }
        break;
    }
    return success;
  },
};

function manageBroker() {
  const brokerPassword = generateHashBrokerPassword();
  console.log(
    `Keep it safe to create broker and to fetch key after deployment: afc api key -p '${brokerPassword.clear}'`,
  );
  return true;
}

function managePasscode(options) {
  if (!cfLogin(options)) {
    return false;
  }
  const config = fetchAppInfo(options);
  if (!config.cf) {
    console.log("Command only supported for CF apps");
    return false;
  }
  if (!config.app) {
    config.app = prompt("App name: ");
    config.url ??= fetchServerUrl(config.app, options) || options.server;
  }
  const result = cfExec(`cf env ${config.app}`, options);
  if (result === false) {
    return false;
  }
  config.authUrl = /"xsuaa": \[.*"credentials": \{.*"url": "(.*?)"/s.exec(result)?.[1];
  open(`${config.authUrl}/passcode`);
  return true;
}

async function manageInternal(options) {
  if (!cfLogin(options)) {
    return false;
  }
  const config = fetchAppInfo(options);
  if (!config.cf) {
    console.log("Command only supported for CF apps");
    return false;
  }
  if (!config.app) {
    config.app = prompt("App name: ");
    config.url ??= fetchServerUrl(config.app, options) || options.server;
  }
  const result = cfExec(`cf env ${config.app}`, options);
  if (result === false) {
    return false;
  }
  config.certUrl = /"xsuaa": \[.*"credentials": \{.*"certurl": "(.*?)"/s.exec(result)?.[1];
  config.authUrl = config.certUrl || /"xsuaa": \[.*"credentials": \{.*"url": "(.*?)"/s.exec(result)?.[1];
  config.auth = stripHTTPS(config.authUrl);
  config.tokenUrl = `${config.authUrl}/oauth/token`;
  config.internalClientId = /"xsuaa": \[.*"credentials": \{.*"clientid": "(.*?)"/s.exec(result)?.[1];
  config.internalClientSecret = /"xsuaa": \[.*"credentials": \{.*"clientsecret": "(.*?)"/s.exec(result)?.[1];
  config.internalCertificate = /"xsuaa": \[.*"credentials": \{.*"certificate": "(.*?)"/s.exec(result)?.[1];
  config.internalKey = /"xsuaa": \[.*"credentials": \{.*"key": "(.*?)"/s.exec(result)?.[1];
  if (!(config.auth && config.internalClientId)) {
    console.log(`Failed to retrieve internal credentials`, { app: config.app });
    return false;
  }
  if (!options.token && !options.bearer && !options.http && !options.destination) {
    console.log(`url: ${config.tokenUrl}`);
    console.log(`clientId (internal): ${config.internalClientId}`);
    if (config.internalClientSecret) {
      console.log(`clientSecret (internal): ${config.internalClientSecret}`);
    }
    if (config.internalCertificate) {
      console.log(`certificate (internal): ${config.internalCertificate}`);
    }
    if (config.internalKey) {
      console.log(`key (internal): ${config.internalKey}`);
    }
  }
  if (options.destination) {
    serverUrl(config);
    const destinationName = `${config.service || config.app}${options.label ? `-${options.label}` : ""}-${INTERNAL_SUFFIX}-${SERVICE_SUFFIX}`;
    createDestination(
      destinationName,
      config.url,
      config.tokenUrl,
      config.internalClientId,
      config.internalClientSecret,
      options,
    );
  }
  if (options.token || options.bearer || options.http) {
    config.internalToken = await fetchOAuthToken(
      config.authUrl,
      config.internalClientId,
      config.internalClientSecret,
      config.internalCertificate,
      config.internalKey,
    );
    if (!config.internalToken) {
      return false;
    }
    if (options.token) {
      console.log(config.internalToken);
    }
    if (options.bearer) {
      console.log(`Authorization: Bearer ${config.internalToken}`);
    }
    if (options.http) {
      fillHTTPFiles(options, config);
    }
  }
  return true;
}

async function manageKey(options) {
  if (!cfLogin(options)) {
    return false;
  }
  const service = cfService();
  if (!service) {
    return false;
  }
  const config = fetchAppInfo(options, service);
  const broker = cfBroker(options, config);
  if (!broker) {
    return false;
  }
  config.broker = broker;
  const serviceInstance = cfServiceInstance(options, config);
  if (!serviceInstance) {
    return false;
  }
  config.serviceInstance = serviceInstance;
  const serviceKey = cfServiceKey(options, config);
  if (!serviceKey) {
    return false;
  }
  config.serviceKey = serviceKey;
  if (!cfServiceCredentials(options, config)) {
    return false;
  }
  if (!options.token && !options.bearer && !options.http && !options.destination) {
    console.log(`name: ${config.serviceKey}`);
    console.log(`api: ${config.api}`);
    console.log(`auth: ${config.tokenUrl}`);
    console.log(`clientId: ${config.clientId}`);
    if (config.clientSecret) {
      console.log(`clientSecret: ${config.clientSecret}`);
    }
    if (config.certificate) {
      console.log(`certificate: ${config.certificate}`);
    }
    if (config.key) {
      console.log(`key: ${config.key}`);
    }
  }
  if (options.destination) {
    const destinationName = `${config.service}${options.label ? `-${options.label}` : ""}-${SERVICE_SUFFIX}`;
    createDestination(destinationName, config.api, config.tokenUrl, config.clientId, config.clientSecret, options);
  }
  if (options.token || options.bearer || options.http) {
    config.token = await fetchOAuthToken(
      config.authUrl,
      config.clientId,
      config.clientSecret,
      config.certificate,
      config.key,
    );
    if (!config.token) {
      return false;
    }
    if (options.token) {
      console.log(config.token);
    }
    if (options.bearer) {
      console.log(config.api);
      console.log(`Authorization: Bearer ${config.token}`);
    }
    if (options.http) {
      fillHTTPFiles(options, config);
    }
  }
  return true;
}

function manageClear(options) {
  fillHTTPFiles(options, {}, true);
  return true;
}

function manageReset(options) {
  if (!cfLogin(options)) {
    return false;
  }
  const service = cfService();
  if (!service) {
    return false;
  }
  const config = fetchAppInfo(options, service);
  const broker = cfBroker(options, config, true);
  if (!broker) {
    return true;
  }
  let success = true;
  config.broker = broker;
  const serviceInstance = cfServiceInstance(options, config, true);
  if (serviceInstance) {
    config.serviceInstance = serviceInstance;
    if (!cfDeleteServiceKeys(options, config)) {
      success = false;
    }
    if (!cfDeleteService(options, config)) {
      success = false;
    }
  }
  if (!cfDeleteBroker(options, config)) {
    success = false;
  }
  return success;
}

function fetchAppInfo(options, service) {
  let serverUrl = options.server;
  let app = service;
  let cf = false;
  const mtaPath = path.join(process.cwd(), "mta.yaml");
  if (fs.existsSync(mtaPath)) {
    cf = true;
    const mta = fs.readFileSync(mtaPath, "utf8");
    app = /- name: (.*)\n\s*type: nodejs\n\s*path: gen\/srv/s.exec(mta)?.[1];
    if (!app) {
      app = /- name: (.*)\n\s*type: java\n\s*path: srv/s.exec(mta)?.[1];
    }
    if (app) {
      const appServerUrl = fetchServerUrl(app, options);
      if (appServerUrl) {
        serverUrl = appServerUrl;
      }
    }
  }
  serverUrl = ensureHttps(serverUrl);
  return {
    cf,
    app,
    service,
    url: serverUrl,
  };
}

function fetchServerUrl(app, options) {
  const result = cfExec(`cf app ${app}`, options);
  if (result === false) {
    return false;
  }
  return /routes:\s*(.*)/.exec(result)?.[1];
}

function cfLogin(options) {
  const result = cfExec(`cf target`, options);
  if (result !== false && !result.trim().endsWith("FAILED")) {
    return true;
  }
  console.log("Not logged in to Cloud Foundry. Call 'cf login' and try again.");
  return false;
}

function cfService() {
  const brokerPath = path.join(process.cwd(), "srv/broker.json");
  if (fs.existsSync(brokerPath)) {
    const broker = require(brokerPath);
    const service = Object.keys(broker.SBF_SERVICE_CONFIG)[0];
    if (service) {
      return service;
    }
  }
  const applicationPath = path.join(process.cwd(), "srv/src/main/resources/application.yaml");
  if (fs.existsSync(applicationPath)) {
    const content = fs.readFileSync(applicationPath, "utf8");
    for (const yaml of YAML.parseAllDocuments(content)) {
      const service = yaml?.getIn(["sap-afc-sdk", "broker", "name"]);
      if (service) {
        return service;
      }
    }
  }
  console.log(`No service found in broker configuration. Call 'afc add broker'`);
  return "";
}

function cfBroker(options, config, optional) {
  const brokerName = `${config.service}${options.label ? `-${options.label}` : ""}-broker`;
  const regexBroker = new RegExp(`(${brokerName})\\s+https://`);
  const cfBrokersCommand = `cf service-brokers`;
  const cfCreateBrokerCommandLog = `cf create-service-broker ${brokerName} broker-user '***' ${config.url}/broker --space-scoped`;
  let result = cfExec(cfBrokersCommand, options);
  if (result === false) {
    return false;
  }
  let cfBroker = regexBroker.exec(result)?.[1];
  if (!cfBroker && !optional) {
    serverUrl(config);
    if (!options.password) {
      options.password = prompt.hide("Broker password: ");
    }
    const cfCreateBrokerCommand = `cf create-service-broker ${brokerName} broker-user '${options.password}' ${config.url}/broker --space-scoped`;
    result = cfExec(cfCreateBrokerCommand, options, cfCreateBrokerCommandLog);
    if (result === false) {
      return false;
    }
    result = cfExec(cfBrokersCommand, options);
    if (result === false) {
      return false;
    }
    cfBroker = regexBroker.exec(result)?.[1];
  }
  if (cfBroker) {
    return brokerName;
  }
  if (!optional) {
    console.log(`Failed to create service broker via command: '${cfCreateBrokerCommandLog}'`);
    return false;
  }
  return "";
}

function cfServiceInstance(options, config, optional) {
  const serviceInstanceName = `${config.service}${options.label ? `-${options.label}` : ""}-${SERVICE_SUFFIX}`;
  const regexService = new RegExp(`${serviceInstanceName}.*${config.service}.*${PLAN_NAME}.*(${config.broker})`);
  const cfServicesCommand = `cf services`;
  const cfCreateServiceCommand = `cf create-service -b ${config.broker} ${config.service} ${PLAN_NAME} ${serviceInstanceName}`;
  let result = cfExec(cfServicesCommand, options);
  if (result === false) {
    return false;
  }
  let cfService = regexService.exec(result)?.[1];
  if (!cfService && !optional) {
    result = cfExec(cfCreateServiceCommand, options);
    if (result === false) {
      return false;
    }
    result = cfExec(cfServicesCommand, options);
    if (result === false) {
      return false;
    }
    cfService = regexService.exec(result)?.[1];
  }
  if (cfService) {
    return serviceInstanceName;
  }
  if (!optional) {
    console.log(`Failed to create service via command: '${cfCreateServiceCommand}'`);
    return false;
  }
  return "";
}

function cfServiceKey(options, config, optional) {
  const serviceKeyName =
    `${config.serviceInstance}-${SERVICE_KEY_SUFFIX}` +
    (options.new ? `-${options.new === true ? Date.now() : options.new}` : "");
  const regexServiceKey = new RegExp(`(${serviceKeyName})`);
  const cfServiceKeysCommand = `cf service-keys ${config.serviceInstance}`;
  let cfCreateServiceKeyCommand = `cf create-service-key ${config.serviceInstance} ${serviceKeyName}`;
  if (options.certificate) {
    const validity = options.certificate === true ? DEFAULT_VALIDITY : options.certificate;
    const config = {
      xsuaa: {
        "credential-type": "x509",
        x509: { "key-length": 2048, validity, "validity-type": "DAYS" },
      },
    };
    cfCreateServiceKeyCommand += ` -c '${JSON.stringify(config)}'`;
  }
  let result = cfExec(cfServiceKeysCommand, options);
  if (result === false) {
    return false;
  }
  let cfServiceKey = regexServiceKey.exec(result)?.[1];
  if (!cfServiceKey && !optional) {
    result = cfExec(cfCreateServiceKeyCommand, options);
    if (result === false) {
      return false;
    }
    result = cfExec(cfServiceKeysCommand, options);
    if (result === false) {
      return false;
    }
    cfServiceKey = regexServiceKey.exec(result)?.[1];
  }
  if (cfServiceKey) {
    return serviceKeyName;
  }
  if (!optional) {
    console.log(`Failed to create service key via command: '${cfCreateServiceKeyCommand}'`);
    return false;
  }
}

function cfServiceCredentials(options, config) {
  const cfServiceKeyCommand = `cf service-key ${config.serviceInstance} ${config.serviceKey}`;
  const result = cfExec(cfServiceKeyCommand, options);
  if (result === false) {
    return false;
  }
  config.certUrl = /"certurl": "(.*?)"/.exec(result)?.[1];
  config.authUrl = config.certUrl || /"url": "(.*?)"/.exec(result)?.[1];
  config.auth = stripHTTPS(config.authUrl);
  config.tokenUrl = `${config.authUrl}/oauth/token`;
  config.clientId = /"clientid": "(.*?)"/.exec(result)?.[1];
  config.clientSecret = /"clientsecret": "(.*?)"/.exec(result)?.[1];
  config.certificate = /"certificate": "(.*?)"/.exec(result)?.[1];
  config.key = /"key": "(.*?)"/.exec(result)?.[1];
  config.api = /"api": "(.*?)"/.exec(result)?.[1];
  if (options.endpoint) {
    config.api = `${config.api}/${options.endpoint}}`;
  } else if (options.jobscheduling) {
    config.api = `${config.api}/job-scheduling/v1`;
  }
  if (config.auth && config.clientId) {
    return true;
  }
  console.log(`Failed to retrieve service key via command: '${cfServiceKeyCommand}'`);
  return false;
}

function cfDeleteServiceKeys(options, config) {
  const serviceKeyPrefix = `${config.serviceInstance}-${SERVICE_KEY_SUFFIX}`;
  const cfServiceKeysCommand = `cf service-keys ${config.serviceInstance}`;
  let result = cfExec(cfServiceKeysCommand, options);
  if (result === false) {
    return false;
  }
  const lines = result.split("\n");
  for (const line of lines) {
    if (line.trim().startsWith(serviceKeyPrefix)) {
      const serviceKey = line.trim().split(" ")[0];
      const cfDeleteServiceKeyCommand = `cf delete-service-key -f ${config.serviceInstance} ${serviceKey}`;
      result = cfExec(cfDeleteServiceKeyCommand, options);
      if (result === false) {
        return false;
      }
    }
  }
  return true;
}

function cfDeleteService(options, config) {
  const cfDeleteServiceCommand = `cf delete-service -f ${config.serviceInstance}`;
  const result = cfExec(cfDeleteServiceCommand, options);
  return result !== false;
}

function cfDeleteBroker(options, config) {
  const cfDeleteServiceCommand = `cf delete-service-broker -f ${config.broker}`;
  const result = cfExec(cfDeleteServiceCommand, options);
  return result !== false;
}

function fillHTTPFiles(options, config, clear) {
  if (!clear) {
    serverUrl(config);
    config.host ??= stripHTTPS(config.url);
  }
  const httpPath = path.join(process.cwd(), "http");
  const files = fs.readdirSync(httpPath, { recursive: true });
  for (let file of files) {
    if (file.endsWith(".cloud.http")) {
      file = path.join("http", file);
      if (
        adjustLines(file, (line) => {
          for (const name in PLACEHOLDERS) {
            const placeholder = PLACEHOLDERS[name];
            if (line.startsWith("#")) {
              if (config[name] !== undefined) {
                line = line.replace(`{{${name}}}`, config[name]);
              }
            }
            if (line.startsWith(`@${name}=`)) {
              if (options.clear) {
                return `@${name}=${placeholder.default}`;
              } else if (config[name] !== undefined) {
                return `@${name}=${config[name]}`;
              }
            }
          }
          return line;
        })
      ) {
        console.log(`File '${file}' written.`);
      }
    }
  }
}

function serverUrl(config) {
  if (!config.url) {
    config.url = prompt("Server URL: ");
    config.url = ensureHttps(config.url);
  }
}

function createDestination(name, serverUrl, authUrl, clientId, clientSecret, options) {
  if (!clientSecret) {
    console.log(`Destinations only supported for client secrets`);
  }
  const destination = {
    destination: {
      Name: name,
      tokenServiceURLType: "Dedicated",
      Type: "HTTP",
      clientId: clientId,
      Authentication: "OAuth2ClientCredentials",
      clientSecret: clientSecret,
      tokenServiceURL: authUrl,
      ProxyType: "Internet",
      URL: serverUrl,
    },
  };
  if (options.properties) {
    const destinationProperties = Object.keys(destination.destination).reduce((result, key) => {
      return `${result}${key}=${destination.destination[key]}\n`;
    }, "");
    const destinationPath = path.join(process.cwd(), `default-${name}.properties`);
    fs.writeFileSync(destinationPath, destinationProperties);
    console.log(`File '${destinationPath}' written.`);
  } else {
    const destinationPath = path.join(process.cwd(), `default-${name}.json`);
    fs.writeFileSync(destinationPath, JSON.stringify(destination, null, 2));
    console.log(`File '${destinationPath}' written.`);
  }
}

async function fetchOAuthToken(url, clientId, clientSecret, certificate, key) {
  let result;
  if (clientSecret) {
    result = await fetch(`${url}/oauth/token?grant_type=client_credentials`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${btoa(clientId + ":" + clientSecret)}`,
      },
    });
  } else if (certificate && key) {
    certificate = certificate.split("\\n").join("\n");
    key = key.split("\\n").join("\n");
    const form = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
    });
    result = await fetch(`${url}/oauth/token`, {
      method: "POST",
      agent: new https.Agent({ key, cert: certificate }),
      headers: {
        "Content-type": "application/x-www-form-urlencoded",
      },
      body: form,
    });
  }
  if (result?.ok) {
    const data = await result.json();
    if (data.access_token) {
      return data.access_token;
    }
  } else {
    console.log(await result.text());
  }
  console.log("Failed to fetch OAuth token");
}

function ensureHttps(url) {
  if (url) {
    return url.startsWith("https://") ? url : `https://${url}`;
  }
  return url;
}

function stripHTTPS(url) {
  if (url?.startsWith("https://")) {
    return url.substring(8);
  }
  return url;
}

function cfExec(command, options, log) {
  const result = shelljs.exec(command, { silent: !options.verbose });
  if (result.code !== 0) {
    if (options.verbose) {
      console.log(`"${log || command}", code ${result.code}: ${result.stderr}`);
    } else {
      console.log(result.stderr);
    }
    return false;
  }
  return result.stdout;
}
