/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");
const shelljs = require("shelljs");
const commander = require("commander");
const { open } = require("openurl");
const prompt = require("prompt-sync")();

const { adjustLines, generateHashBrokerPassword } = require("../common/util");

const PLAN_NAME = "standard";
const SERVICE_SUFFIX = "api";
const SERVICE_KEY_SUFFIX = "key";

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
      .option("-s, --server <password>", "Server URL")
      .option("-p, --password <password>", "Broker password")
      .option("-a, --passcode", "Request temporary authentication code")
      .option("-i, --internal", "Fetch internal credentials")
      .option("-t, --token", "Fetch oauth token")
      .option("-b, --bearer", "Generate authorization bearer header")
      .option("-d, --destination", "Generate destination import file")
      .option("-h, --http", "Fill .http files")
      .option("-c, --clear", "Clear .http files placeholders")
      .option("-r, --reset", "Reset API management")
      .option("-l, --label [label]", "Label for instances")
      .option("-g, --generate", "Generate broker password and hash")
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
`,
      );
  },
  handle: async function (action) {
    const options = this.opts();
    await module.exports.process(action, options);
  },
  process: async function (action, options) {
    switch (action) {
      case "key":
        if (options.generate) {
          manageBroker(options);
        } else if (options.passcode) {
          managePasscode(options);
        } else if (options.reset) {
          manageClear(options);
          manageReset(options);
        } else if (options.clear) {
          manageClear(options);
        } else if (options.internal) {
          await manageInternal(options);
        } else {
          await manageKey(options);
        }
        break;
    }
  },
};

function manageBroker() {
  const brokerPassword = generateHashBrokerPassword();
  console.log(
    `Keep it safe to create broker and to fetch key after deployment: afc api key -p '${brokerPassword.clear}'`,
  );
}

function managePasscode(options) {
  const config = fetchAppInfo(options);
  const result = shelljs.exec(`cf env ${config.app}`, { silent: true }).stdout;
  config.authUrl = /"xsuaa": \[.*"credentials": \{.*"url": "(.*?)"/s.exec(result)?.[1];
  open(`${config.authUrl}/passcode`);
}

async function manageInternal(options) {
  const config = fetchAppInfo(options);
  const result = shelljs.exec(`cf env ${config.app}`, { silent: true }).stdout;
  config.authUrl = /"xsuaa": \[.*"credentials": \{.*"url": "(.*?)"/s.exec(result)?.[1];
  config.auth = stripHTTPS(config.authUrl);
  config.tokenUrl = `${config.authUrl}/oauth/token`;
  config.internalClientId = /"xsuaa": \[.*"credentials": \{.*"clientid": "(.*?)"/s.exec(result)?.[1];
  config.internalClientSecret = /"xsuaa": \[.*"credentials": \{.*"clientsecret": "(.*?)"/s.exec(result)?.[1];
  if (!(config.auth && config.internalClientId && config.internalClientSecret)) {
    console.log(`Failed to retrieve internal credentials`);
    return;
  }
  if (!options.token && !options.bearer && !options.http && !options.destination) {
    console.log(`url: ${config.tokenUrl}`);
    console.log(`clientId (internal): ${config.internalClientId}`);
    console.log(`clientSecret (internal): ${config.internalClientSecret}`);
  }
  if (options.destination) {
    createDestination(config.app, config.url, config.tokenUrl, config.internalClientId, config.internalClientSecret);
  }
  if (options.token || options.bearer || options.http) {
    config.internalToken = await fetchOAuthToken(config.authUrl, config.internalClientId, config.internalClientSecret);
    if (!config.internalToken) {
      return;
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
}

async function manageKey(options) {
  if (!cfLogin()) {
    return;
  }
  const service = cfService();
  if (!service) {
    return;
  }
  const config = fetchAppInfo(options, service);
  const broker = cfBroker(options, config);
  if (!broker) {
    return;
  }
  config.broker = broker;
  const serviceInstance = cfServiceInstance(options, config);
  if (!serviceInstance) {
    return;
  }
  config.serviceInstance = serviceInstance;
  const serviceKey = cfServiceKey(options, config);
  if (!serviceKey) {
    return;
  }
  config.serviceKey = serviceKey;
  if (!cfServiceCredentials(options, config)) {
    return;
  }
  if (!options.token && !options.bearer && !options.http && !options.destination) {
    console.log(`api: ${config.api}`);
    console.log(`auth: ${config.tokenUrl}`);
    console.log(`clientId: ${config.clientId}`);
    console.log(`clientSecret: ${config.clientSecret}`);
  }
  if (options.destination) {
    createDestination(`${config.app}-api`, config.api, config.tokenUrl, config.clientId, config.clientSecret);
  }
  if (options.token || options.bearer || options.http) {
    config.token = await fetchOAuthToken(config.authUrl, config.clientId, config.clientSecret);
    if (!config.token) {
      return;
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
}

function manageClear(options) {
  fillHTTPFiles(options, {});
}

function manageReset(options) {
  if (!cfLogin()) {
    return;
  }
  const service = cfService();
  if (!service) {
    return;
  }
  const config = fetchAppInfo(options, service);
  const broker = cfBroker(options, config, true);
  if (!broker) {
    return;
  }
  config.broker = broker;
  const serviceInstance = cfServiceInstance(options, config, true);
  if (serviceInstance) {
    config.serviceInstance = serviceInstance;
    cfDeleteServiceKeys(options, config);
    cfDeleteService(options, config);
  }
  cfDeleteBroker(options, config);
}

function fetchAppInfo(options, service) {
  let serverUrl = options.server;
  let app = service;
  // MTA
  const mtaPath = path.join(process.cwd(), "mta.yaml");
  if (fs.existsSync(mtaPath)) {
    const mta = fs.readFileSync(mtaPath, "utf8");
    app = /- name: (.*)\n\s*type: nodejs\n\s*path: gen\/srv/s.exec(mta)?.[1];
    const result = shelljs.exec(`cf app ${app}`, { silent: true }).stdout;
    serverUrl = /routes:\s*(.*)/.exec(result)?.[1];
  }
  if (!serverUrl) {
    serverUrl = prompt("Server URL: ");
  }
  serverUrl = serverUrl.startsWith("https://") ? serverUrl : `https://${serverUrl}`;
  return {
    app,
    service,
    host: stripHTTPS(serverUrl),
    url: serverUrl,
  };
}

function cfLogin() {
  const result = shelljs.exec("cf apps", { silent: true }).stdout;
  if (!result.trim().endsWith("FAILED")) {
    return true;
  }
  console.log("Not logged in to Cloud Foundry. Call 'cf login' and try again.");
  return false;
}

function cfService() {
  const brokerPath = path.join(process.cwd(), "srv/broker.json");
  if (!fs.existsSync(brokerPath)) {
    console.log(`broker.json not found at '${brokerPath}'. Call 'afc add broker'`);
    return false;
  }
  const broker = require(brokerPath);
  const service = Object.keys(broker.SBF_SERVICE_CONFIG)[0];
  if (service) {
    return service;
  }
  console.log(`No service found in broker configuration. Call 'afc add broker'`);
}

function cfBroker(options, config, optional) {
  const serviceName = `${config.service}${options.label ? `-${options.label}` : ""}`;
  const brokerName = `${serviceName}-broker`;
  const regexBroker = new RegExp(`(${brokerName})\\s+https://`);
  const cfBrokersCommand = `cf service-brokers`;
  let result = shelljs.exec(cfBrokersCommand, { silent: true }).stdout;
  let cfBroker = regexBroker.exec(result)?.[1];
  if (!cfBroker && !optional) {
    if (!options.password) {
      options.password = prompt.hide("Broker password: ");
    }
    const cfCreateBrokerCommand = `cf create-service-broker ${brokerName} broker-user '${options.password}' ${config.url}/broker --space-scoped`;
    shelljs.exec(cfCreateBrokerCommand, { silent: true });
    result = shelljs.exec(cfBrokersCommand, { silent: true }).stdout;
    cfBroker = regexBroker.exec(result)?.[1];
  }
  if (cfBroker) {
    return brokerName;
  }
  if (!optional) {
    const cfCreateBrokerCommand = `cf create-service-broker ${brokerName} broker-user '***' ${config.url}/broker --space-scoped`;
    console.log(`Failed to create service broker via command: '${cfCreateBrokerCommand}'`);
  }
}

function cfServiceInstance(options, config, optional) {
  const serviceName = `${config.service}${options.label ? `-${options.label}` : ""}`;
  const serviceInstanceName = `${serviceName}-${SERVICE_SUFFIX}`;
  const regexService = new RegExp(`${serviceInstanceName}.*${serviceName}.*${PLAN_NAME}.*(${config.broker})`);
  const cfCreateServicesCommand = `cf services`;
  const cfServiceCommand = `cf create-service -b ${config.broker} ${serviceName} ${PLAN_NAME} ${serviceInstanceName}`;
  let result = shelljs.exec(cfCreateServicesCommand, { silent: true }).stdout;
  let cfService = regexService.exec(result)?.[1];
  if (!cfService && !optional) {
    shelljs.exec(cfServiceCommand, { silent: true });
    result = shelljs.exec(cfCreateServicesCommand, { silent: true }).stdout;
    cfService = regexService.exec(result)?.[1];
  }
  if (cfService) {
    return serviceInstanceName;
  }
  if (!optional) {
    console.log(`Failed to create service via command: '${cfServiceCommand}'`);
  }
}

function cfServiceKey(options, config, optional) {
  const serviceKeyName =
    `${config.serviceInstance}-${SERVICE_KEY_SUFFIX}` +
    (options.new ? `-${options.new === true ? Date.now() : options.new}` : "");
  const regexServiceKey = new RegExp(`(${serviceKeyName})`);
  const cfCreateServiceKeyCommand = `cf service-keys ${config.serviceInstance}`;
  const cfServiceKeyCommand = `cf create-service-key ${config.serviceInstance} ${serviceKeyName}`;
  let result = shelljs.exec(cfCreateServiceKeyCommand, { silent: true }).stdout;
  let cfServiceKey = regexServiceKey.exec(result)?.[1];
  if (!cfServiceKey && !optional) {
    shelljs.exec(cfServiceKeyCommand, { silent: true });
    result = shelljs.exec(cfCreateServiceKeyCommand, { silent: true }).stdout;
    cfServiceKey = regexServiceKey.exec(result)?.[1];
  }
  if (cfServiceKey) {
    return serviceKeyName;
  }
  if (!optional) {
    console.log(`Failed to create service key via command: '${cfServiceKeyCommand}'`);
  }
}

function cfServiceCredentials(options, config) {
  const cfServiceKeyCommand = `cf service-key ${config.serviceInstance} ${config.serviceKey}`;
  const result = shelljs.exec(cfServiceKeyCommand, { silent: true }).stdout;
  config.authUrl = /"url": "(.*?)"/.exec(result)?.[1];
  config.auth = stripHTTPS(config.authUrl);
  config.tokenUrl = `${config.authUrl}/oauth/token`;
  config.clientId = /"clientid": "(.*?)"/.exec(result)?.[1];
  config.clientSecret = /"clientsecret": "(.*?)"/.exec(result)?.[1];
  config.api = /"api": "(.*?)"/.exec(result)?.[1];
  if (config.auth && config.clientId && config.clientSecret) {
    return true;
  }
  console.log(`Failed to retrieve service key via command: '${cfServiceKeyCommand}'`);
}

function cfDeleteServiceKeys(options, config) {
  const serviceKeyPrefix = `${config.serviceInstance}-${SERVICE_KEY_SUFFIX}`;
  const cfCreateServiceKeysCommand = `cf service-keys ${config.serviceInstance}`;
  let result = shelljs.exec(cfCreateServiceKeysCommand, { silent: true }).stdout;
  const lines = result.split("\n");
  for (const line of lines) {
    if (line.trim().startsWith(serviceKeyPrefix)) {
      const serviceKey = line.trim().split(" ")[0];
      const cfDeleteServiceKeyCommand = `cf delete-service-key -f ${config.serviceInstance} ${serviceKey}`;
      shelljs.exec(cfDeleteServiceKeyCommand, { silent: true }).stdout;
    }
  }
}

function cfDeleteService(options, config) {
  const cfDeleteServiceCommand = `cf delete-service -f ${config.serviceInstance}`;
  shelljs.exec(cfDeleteServiceCommand, { silent: true }).stdout;
}

function cfDeleteBroker(options, config) {
  const cfDeleteServiceCommand = `cf delete-service-broker -f ${config.broker}`;
  shelljs.exec(cfDeleteServiceCommand, { silent: true }).stdout;
}

function fillHTTPFiles(options, config) {
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

function createDestination(name, serverUrl, authUrl, clientId, clientSecret) {
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
  const destinationPath = path.join(process.cwd(), `default-${name}.json`);
  fs.writeFileSync(destinationPath, JSON.stringify(destination, null, 2));
  console.log(`File '${destinationPath}' written.`);
}

async function fetchOAuthToken(url, clientId, clientSecret) {
  const result = await fetch(`${url}/oauth/token?grant_type=client_credentials`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${btoa(clientId + ":" + clientSecret)}`,
    },
  });
  if (result.ok) {
    const data = await result.json();
    if (data.access_token) {
      return data.access_token;
    }
  }
  console.log("Failed to fetch OAuth token");
}

function stripHTTPS(url) {
  if (url?.startsWith("https://")) {
    return url.substring(8);
  }
  return url;
}
