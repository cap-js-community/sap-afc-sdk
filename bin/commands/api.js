/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");
const shelljs = require("shelljs");
const commander = require("commander");
const prompt = require("prompt-sync")();

const { adjustLines } = require("../common/util");

const PLAN_NAME = "standard";
const SERVICE_SUFFIX = "api";
const SERVICE_KEY_SUFFIX = "key";

module.exports = {
  register: function (program) {
    return program
      .command("api")
      .description("Manage API")
      .addArgument(new commander.Argument("<action>", "Manage API keys").choices(["key"]))
      .option("-n, --new", "Create new API key")
      .option("-p, --password <password>", "Broker password")
      .option("-s, --server <password>", "Server URL")
      .option("-t, --token", "Fetch OAuth token")
      .option("-b, --bearer", "Generate authorization bearer header")
      .option("-d, --destination", "Generate destination import file")
      .option("-h, --http", "Fill .http files")
      .option("-i, --internal", "Fill .http files with internals (use with -h)")
      .option("-c, --clear", "Clear .http files placeholders (use with -h)")
      .addHelpText(
        "afterAll",
        `
Actions:
  key \t\t - manage service keys

Examples:
  afc api key
  afc api key --new
  afc api key -n
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
        await manageKey(options);
        break;
    }
  },
};

async function manageKey(options) {
  // Check
  const brokerPath = path.join(process.cwd(), "srv/broker.json");
  if (!fs.existsSync(brokerPath)) {
    console.log(`broker.json not found at '${brokerPath}'. Call 'afc add broker'`);
    return;
  }

  // Config
  const broker = require(brokerPath);
  const serviceName = Object.keys(broker.SBF_SERVICE_CONFIG)[0];
  if (!serviceName) {
    console.log(`No service found in broker configuration. Call 'afc add broker'`);
  }

  // Login
  let result = shelljs.exec("cf apps", { silent: true }).stdout;
  if (result.trim().endsWith("FAILED")) {
    console.log("Not logged in to Cloud Foundry. Call 'cf login' and try again.");
    return;
  }

  // Server
  let serverUrl = options.server;
  let appName = serviceName;
  const mtaPath = path.join(process.cwd(), "mta.yaml");
  if (fs.existsSync(mtaPath)) {
    const mta = fs.readFileSync(mtaPath, "utf8");
    appName = /- name: (.*)\n\s*type: nodejs\n\s*path: gen\/srv/s.exec(mta)?.[1];
    const result = shelljs.exec(`cf app ${appName}`, { silent: true }).stdout;
    serverUrl = /routes:\s*(.*)/.exec(result)?.[1];
  }
  // TODO: Kyma
  if (!serverUrl) {
    serverUrl = prompt("Server URL: ");
  }
  serverUrl = serverUrl.startsWith("https://") ? serverUrl : `https://${serverUrl}`;

  // Broker
  const brokerName = `${serviceName}-broker`;
  const regexBroker = new RegExp(`${serviceName}.*(${brokerName})`);
  const cfMarketplaceCommand = `cf marketplace -b ${brokerName}`;
  result = shelljs.exec(cfMarketplaceCommand, { silent: true }).stdout;
  let cfBroker = regexBroker.exec(result)?.[1];
  if (!cfBroker) {
    if (!options.password) {
      options.password = prompt.hide("Broker password: ");
    }
    const cfCreateBrokerCommand = `cf create-service-broker ${brokerName} broker-user '${options.password}' ${serverUrl}/broker --space-scoped`;
    shelljs.exec(cfCreateBrokerCommand, { silent: true });
    result = shelljs.exec(cfMarketplaceCommand, { silent: true }).stdout;
    cfBroker = regexBroker.exec(result)?.[1];
    if (!cfBroker) {
      console.log(`Failed to create service broker via command: '${cfCreateBrokerCommand}'`);
      return;
    }
  }

  // Service
  const serviceInstanceName = `${serviceName}-${SERVICE_SUFFIX}`;
  const regexService = new RegExp(`${serviceInstanceName}.*${serviceName}.*${PLAN_NAME}.*(${brokerName})`);
  const cfCreateServicesCommand = `cf services`;
  result = shelljs.exec(cfCreateServicesCommand, { silent: true }).stdout;
  let cfService = regexService.exec(result)?.[1];
  if (!cfService) {
    const cfServiceCommand = `cf create-service -b ${brokerName} ${serviceName} ${PLAN_NAME} ${serviceInstanceName}`;
    shelljs.exec(cfServiceCommand, { silent: true });
    result = shelljs.exec(cfCreateServicesCommand, { silent: true }).stdout;
    cfService = regexService.exec(result)?.[1];
    if (!cfService) {
      console.log(`Failed to create service via command: '${cfServiceCommand}'`);
      return;
    }
  }

  // Service Key
  const serviceKeyName = `${serviceInstanceName}-${SERVICE_KEY_SUFFIX}` + (options.new ? `-${Date.now()}` : "");
  const regexServiceKey = new RegExp(`(${serviceKeyName})`);
  const cfCreateServiceKeysCommand = `cf service-keys ${serviceInstanceName}`;
  result = shelljs.exec(cfCreateServiceKeysCommand, { silent: true }).stdout;
  let cfServiceKey = regexServiceKey.exec(result)?.[1];
  if (!cfServiceKey) {
    const cfServiceKeyCommand = `cf create-service-key ${serviceInstanceName} ${serviceKeyName}`;
    shelljs.exec(cfServiceKeyCommand, { silent: true });
    result = shelljs.exec(cfCreateServiceKeysCommand, { silent: true }).stdout;
    cfServiceKey = regexServiceKey.exec(result)?.[1];
    if (!cfServiceKey) {
      console.log(`Failed to create service key via command: '${cfServiceKeyCommand}'`);
      return;
    }
  }

  // Credentials
  const cfServiceKeyCommand = `cf service-key ${serviceInstanceName} ${serviceKeyName}`;
  result = shelljs.exec(cfServiceKeyCommand, { silent: true }).stdout;
  const cfServiceKeyClientId = /"clientid": "(.*?)"/.exec(result)?.[1];
  const cfServiceKeyClientSecret = /"clientsecret": "(.*?)"/.exec(result)?.[1];
  const cfServiceKeyAuthorizationUrl = /"url": "(.*?)"/.exec(result)?.[1];
  const cfServiceKeyOAuthTokenUrl = `${cfServiceKeyAuthorizationUrl}/oauth/token`;
  const cfServiceKeyApiUrl = /"api": "(.*?)"/.exec(result)?.[1];
  if (cfServiceKeyClientId && cfServiceKeyClientSecret && cfServiceKeyAuthorizationUrl && cfServiceKeyApiUrl) {
    console.log(`service: ${serviceName}`);
    console.log(`key: ${serviceKeyName}`);
    console.log(`apiUrl: ${cfServiceKeyApiUrl}`);
    console.log(`authorizationUrl: ${cfServiceKeyOAuthTokenUrl}`);
    console.log(`clientId: ${cfServiceKeyClientId}`);
    console.log(`clientSecret: ${cfServiceKeyClientSecret}`);
  } else {
    console.log(`Failed to retrieve service key via command: '${cfServiceKeyCommand}'`);
    return;
  }

  // Internal
  let cfInternalClientId = "";
  let cfInternalClientSecret = "";
  if (options.http && options.internal) {
    const result = shelljs.exec(`cf env ${appName}`, { silent: true }).stdout;
    cfInternalClientId = /"xsuaa": \[.*"credentials": \{.*"clientid": "(.*?)"/s.exec(result)?.[1];
    cfInternalClientSecret = /"xsuaa": \[.*"credentials": \{.*"clientsecret": "(.*?)"/s.exec(result)?.[1];
    console.log(`clientId (internal): ${cfInternalClientId}`);
    console.log(`clientSecret (internal): ${cfInternalClientSecret}`);
  }

  // OAuth
  let oauthToken = "";
  if (options.token || options.bearer || options.http) {
    const result = await fetch(`${cfServiceKeyOAuthTokenUrl}?grant_type=client_credentials`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${btoa(cfServiceKeyClientId + ":" + cfServiceKeyClientSecret)}`,
      },
    });
    if (!result.ok) {
      console.log(`Failed to fetch OAuth token`);
      return;
    }
    const data = await result.json();
    oauthToken = data.access_token;
    if (!oauthToken) {
      console.log(`Failed to fetch OAuth token`);
      return;
    }
  }
  let cfInternalToken = "";
  if (cfInternalClientId && cfInternalClientSecret) {
    const result = await fetch(`${cfServiceKeyOAuthTokenUrl}?grant_type=client_credentials`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${btoa(cfInternalClientId + ":" + cfInternalClientSecret)}`,
      },
    });
    if (!result.ok) {
      console.log(`Failed to fetch internal OAuth token`);
      return;
    }
    const data = await result.json();
    cfInternalToken = data.access_token;
    if (!cfInternalToken) {
      console.log(`Failed to fetch internal OAuth token`);
      return;
    }
  }

  // Token
  if (options.token) {
    console.log(`token: ${oauthToken}`);
  }

  // Bearer
  if (options.bearer) {
    console.log(`Authorization: Bearer ${oauthToken}`);
  }

  // .http
  if (options.http) {
    const httpPath = path.join(process.cwd(), "http");
    const files = await fs.promises.readdir(httpPath, { recursive: true });
    for (let file of files) {
      if (file.endsWith(".cloud.http")) {
        file = path.join("http", file);
        adjustLines(file, (line) => {
          if (line.startsWith("@")) {
            if (line.startsWith("@api=")) {
              return options.clear
                ? `@api=<api endpoint from cloud deployment>`
                : `@api=${stripHTTPS(cfServiceKeyApiUrl)}`;
            } else if (line.startsWith("@host")) {
              return options.clear ? `@host=<server host from cloud deployment>` : `@host=${stripHTTPS(serverUrl)}`;
            } else if (line.startsWith("@auth")) {
              return options.clear
                ? `@auth=<auth endpoint from cloud deployment>`
                : `@auth=${stripHTTPS(cfServiceKeyAuthorizationUrl)}`;
            } else if (line.startsWith("@token")) {
              return options.clear ? `@token=<xsuaa token>` : `@token=${oauthToken}`;
            } else if (line.startsWith("@clientId")) {
              return options.clear ? `@clientId=<xsuaa client id>` : `@clientId=${cfServiceKeyClientId}`;
            } else if (line.startsWith("@clientSecret")) {
              return options.clear
                ? `@clientSecret=<xsuaa client secret>`
                : `@clientSecret=${cfServiceKeyClientSecret}`;
            } else if (line.startsWith("@internalClientId")) {
              if (options.clear) {
                return `@internalClientId=<xsuaa internal client id>`;
              }
              if (cfInternalClientId) {
                return `@internalClientId=${cfInternalClientId}`;
              }
            } else if (line.startsWith("@internalClientSecret")) {
              if (options.clear) {
                return `@internalClientSecret=<xsuaa internal client secret>`;
              }
              if (cfInternalClientSecret) {
                return `@internalClientSecret=${cfInternalClientSecret}`;
              }
            } else if (line.startsWith("@internalToken")) {
              if (options.clear) {
                return `@internalToken=<xsuaa internal token>`;
              }
              if (cfInternalToken) {
                return `@internalToken=${cfInternalToken}`;
              }
            }
          }
          return line;
        });
        console.log(`File '${file}' written.`);
      }
    }
  }

  // Destination
  if (options.destination) {
    const destination = {
      destination: {
        Name: serviceKeyName,
        tokenServiceURLType: "Dedicated",
        Type: "HTTP",
        clientId: cfServiceKeyClientId,
        Authentication: "OAuth2ClientCredentials",
        clientSecret: cfServiceKeyClientSecret,
        tokenServiceURL: cfServiceKeyOAuthTokenUrl,
        ProxyType: "Internet",
        URL: cfServiceKeyApiUrl,
      },
    };
    const destinationPath = path.join(process.cwd(), `default-${serviceKeyName}.json`);
    fs.writeFileSync(destinationPath, JSON.stringify(destination, null, 2));
    console.log(`File '${destinationPath}' written.`);
  }
}

function stripHTTPS(url) {
  if (url.startsWith("https://")) {
    return url.substring(8);
  }
  return url;
}
