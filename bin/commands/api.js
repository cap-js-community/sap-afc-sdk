/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");
const shelljs = require("shelljs");
const commander = require("commander");
const prompt = require("prompt-sync")();

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
`,
      );
  },
  handle: function (action) {
    const options = this.opts();
    module.exports.process(action, options);
  },
  process: function (action, options) {
    switch (action) {
      case "key":
        manageKey(options);
        break;
    }
  },
};

function manageKey(options) {
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
  const mtaPath = path.join(process.cwd(), "mta.yaml");
  if (fs.existsSync(mtaPath)) {
    const mta = fs.readFileSync(mtaPath, "utf8");
    const appName = /- name: (.*)\n\s*type: nodejs\n\s*path: gen\/srv/s.exec(mta)?.[1];
    const result = shelljs.exec(`cf app ${appName}`, { silent: true }).stdout;
    serverUrl = /routes:\s*(.*)/.exec(result)?.[1];
  }
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
  if (cfServiceKeyClientId && cfServiceKeyClientSecret) {
    console.log(`name: ${serviceKeyName}`);
    console.log(`clientid: ${cfServiceKeyClientId}`);
    console.log(`clientsecret: ${cfServiceKeyClientSecret}`);
    console.log();
    console.log("Successfully managed API keys.");
  } else {
    console.log(`Failed to retrieve service key via command: '${cfServiceKeyCommand}'`);
  }
}
