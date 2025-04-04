/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");
const cds = require("@sap/cds");

const { generateHashBrokerPassword } = require("../common/util");

const BROKER_PATH = path.join(process.cwd(), "./srv/broker.json");
const CATALOG_PATH = path.join(process.cwd(), "./srv/catalog.json");
const APP_NAME = require(path.join(process.cwd(), "package.json"))?.name ?? "afc-scheduling-provider";

const BROKER = {
  SBF_SERVICE_CONFIG: {
    [APP_NAME]: {
      extend_credentials: {
        shared: {
          endpoints: {
            api: "/api",
            "job-scheduling-v1": "/api/job-scheduling/v1",
          },
          "oauth2-configuration": {
            "credential-types": ["binding-secret", "x509"],
          },
        },
      },
      extend_xssecurity: {
        shared: {
          "oauth2-configuration": {
            "credential-types": ["binding-secret", "x509"],
          },
        },
      },
    },
  },
  SBF_BROKER_CREDENTIALS_HASH: {
    "broker-user": "",
  },
};

const CATALOG = {
  services: [
    {
      id: cds.utils.uuid(),
      name: APP_NAME,
      description: "AFC Scheduling Provider Service",
      bindable: true,
      plans: [
        {
          id: cds.utils.uuid(),
          name: "standard",
          description: "Standard plan",
          free: true,
          bindable: true,
          plan_updateable: true,
        },
      ],
      metadata: {
        displayName: "AFC Scheduling Provider Service",
        longDescription: "Scheduling Provider Service for SAP Advanced Financial Closing",
      },
    },
  ],
};

function fileExists(path) {
  return fs.existsSync(path);
}

function writeFile(path, content) {
  if (fs.existsSync(path)) {
    console.log(`File '${path}' already exists and is not overwritten.`);
    return false;
  }
  fs.writeFileSync(path, JSON.stringify(content, null, 2));
  console.log(`File '${path}' written.`);
  return true;
}

module.exports = () => {
  // Catalog
  if (process.env.BROKER_SERVICE_ID) {
    CATALOG.services[0].id = process.env.BROKER_SERVICE_ID;
  }
  if (process.env.BROKER_SERVICE_PLAN_ID) {
    CATALOG.services[0].plans[0].id = process.env.BROKER_SERVICE_PLAN_ID;
  }
  writeFile(CATALOG_PATH, CATALOG);

  // Broker
  let brokerPassword = {};
  if (!fileExists(BROKER_PATH)) {
    if (process.env.BROKER_PASSWORD_HASH) {
      BROKER.SBF_BROKER_CREDENTIALS_HASH["broker-user"] = process.env.BROKER_PASSWORD_HASH;
    } else {
      brokerPassword = generateHashBrokerPassword();
      BROKER.SBF_BROKER_CREDENTIALS_HASH["broker-user"] = brokerPassword.hash;
    }
  }
  if (writeFile(BROKER_PATH, BROKER) && brokerPassword.clear) {
    console.log(
      `Keep it safe to create broker and to fetch key after deployment: afc api key -p '${brokerPassword.clear}'`,
    );
  }
};
