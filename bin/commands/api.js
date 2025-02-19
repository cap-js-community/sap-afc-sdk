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
  const name = Object.keys(broker.SBF_SERVICE_CONFIG)[0];
  if (!name) {
    console.log(`No service found in broker configuration. Call 'afc add broker'`);
  }
  shelljs.exec(
    `cf create-service-broker ${name}-broker broker-user '${password}' https://${isNew}.cfapps.sap.hana.ondemand.com/broker --space-scoped`,
  );
}
