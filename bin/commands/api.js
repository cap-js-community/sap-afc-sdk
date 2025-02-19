/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");
const shelljs = require("shelljs");

module.exports = (action, { isNew, password }) => {
  switch (action) {
    case "key":
      manageKey(isNew, password);
      break;
  }
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
  // TODO
  const mtaPath = path.join(process.cwd(), "mta.yaml");
  if (!fs.existsSync(brokerPath)) {
    console.log(`mta.yaml not found at '$mtaPath}'. Call 'cds add mta'`);
  }
  const mta = fs.readFileSync(mtaPath, "utf8");
  const appName = /- name: (.*)\n\s*type: nodejs\n\s*path: gen\/srv/s.exec(mta)?.[1];
  const result = shelljs.exec(`cf app ${appName}`, { silent: true }).stdout;
  const route = /routes:\s*(.*)/.exec(result)?.[1];
  if (!password) {
    // prompt for password
  }
  console.log(
    `cf create-service-broker ${serviceName}-broker broker-user '${password}' https://${route}/broker --space-scoped`,
  );
  shelljs.exec(
    `cf create-service-broker ${serviceName}-broker broker-user '${password}' https://${route}/broker --space-scoped`,
  );
}
