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
      .addHelpText(
        "afterAll",
        `
Actions:
  key \t\t - manage service keys

Examples:
  afc api key
  afc api key --new
  afc api key -n
`,
      );
  },
  handle: function (action) {
    const options = this.opts();
    module.exports.process(action, { isNew: options.new, password: options.password });
    console.log("Successfully managed API keys.");
  },
  process: function (action, { isNew, password }) {
    switch (action) {
      case "key":
        manageKey(isNew, password);
        break;
    }
  },
};

function manageKey(isNew, password) {
  const brokerPath = path.join(process.cwd(), "srv/broker.json");
  if (!fs.existsSync(brokerPath)) {
    console.log(`broker.json not found at '${brokerPath}'. Call 'afc add broker'`);
    return;
  }
  const broker = require(brokerPath);
  const serviceName = Object.keys(broker.SBF_SERVICE_CONFIG)[0];
  if (!serviceName) {
    console.log(`No service found in broker configuration. Call 'afc add broker'`);
  }
  const brokerName = `${serviceName}-broker`;
  const mtaPath = path.join(process.cwd(), "mta.yaml");
  if (!fs.existsSync(brokerPath)) {
    console.log(`mta.yaml not found at '$mtaPath}'. Call 'cds add mta'`);
  }
  const mta = fs.readFileSync(mtaPath, "utf8");
  const appName = /- name: (.*)\n\s*type: nodejs\n\s*path: gen\/srv/s.exec(mta)?.[1];
  let result = shelljs.exec(`cf app ${appName}`, { silent: true }).stdout;
  const route = /routes:\s*(.*)/.exec(result)?.[1];
  // Broker
  result = shelljs.exec(`cf marketplace -b ${brokerName}`, { silent: true }).stdout;
  const cfBroker = new RegExp(`${serviceName}.*(${brokerName})`).exec(result)?.[1];
  if (!cfBroker) {
    if (!password) {
      password = prompt.hide("Broker password: ");
    }
    shelljs.exec(
      `cf create-service-broker ${brokerName} broker-user '${password}' https://${route}/broker --space-scoped`,
    );
  }
  // Service
  const serviceInstanceName = `${serviceName}-${SERVICE_SUFFIX}`;
  result = shelljs.exec(`cf services`, { silent: true }).stdout;
  const cfService = new RegExp(`${serviceInstanceName}.*${serviceName}.*${PLAN_NAME}.*(${brokerName})`).exec(
    result,
  )?.[1];
  if (!cfService) {
    shelljs.exec(`cf create-service -b ${brokerName} ${serviceName} ${PLAN_NAME} ${serviceInstanceName}`);
  }
  // Service Key
  const serviceKeyName = `${serviceInstanceName}-${SERVICE_KEY_SUFFIX}`;
  result = shelljs.exec(`cf service-keys ${serviceInstanceName}`, { silent: true }).stdout;
  const cfServiceKey = new RegExp(`(${serviceKeyName})`).exec(result)?.[1];
  if (!cfServiceKey) {
    shelljs.exec(`cf create-service-key ${serviceInstanceName} ${serviceKeyName}`);
  }
  // Credentials
  result = shelljs.exec(`cf service-key ${serviceInstanceName} ${serviceKeyName}`, { silent: true }).stdout;
  const cfServiceKeyClientId = /"clientid": "(.*?)"/.exec(result)?.[1];
  const cfServiceKeyClientSecret = /"clientsecret": "(.*?)"/.exec(result)?.[1];
  console.log(`clientid: ${cfServiceKeyClientId}`);
  console.log(`clientSecret: ${cfServiceKeyClientSecret}`);
  // TODO: New key (timestamp)
}
