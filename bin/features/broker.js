/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");
const cds = require("@sap/cds");

const { projectName, isJava, generateHashBrokerPassword, adjustYAMLAllDocuments } = require("../common/util");
const YAML = require("yaml");

const BROKER_PATH = path.join(process.cwd(), "./srv/broker.json");
const CATALOG_PATH = path.join(process.cwd(), "./srv/catalog.json");

const APP_NAME = projectName() ?? "afc-scheduling-provider";

const BROKER_USER = "broker-user";

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
    [BROKER_USER]: "",
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

module.exports = (options) => {
  // Catalog
  if (process.env.BROKER_SERVICE_ID) {
    CATALOG.services[0].id = process.env.BROKER_SERVICE_ID;
  }
  if (process.env.BROKER_SERVICE_PLAN_ID) {
    CATALOG.services[0].plans[0].id = process.env.BROKER_SERVICE_PLAN_ID;
  }

  // Broker
  let brokerPassword = {};
  if (!fileExists(BROKER_PATH)) {
    if (process.env.BROKER_PASSWORD_HASH) {
      BROKER.SBF_BROKER_CREDENTIALS_HASH[BROKER_USER] = process.env.BROKER_PASSWORD_HASH;
    } else {
      brokerPassword = generateHashBrokerPassword();
      BROKER.SBF_BROKER_CREDENTIALS_HASH[BROKER_USER] = brokerPassword.hash;
    }
  }

  let brokerWritten = false;
  if (!isJava(options)) {
    writeFile(CATALOG_PATH, CATALOG);
    if (writeFile(BROKER_PATH, BROKER)) {
      brokerWritten = true;
    }
  } else {
    adjustYAMLAllDocuments("srv/src/main/resources/application.yaml", (yamls) => {
      let yaml = yamls.find((yaml) => !yaml.getIn(["spring", "config.activate.on-profile"]));
      if (!yaml) {
        yaml = new YAML.Document();
        yamls.unshift(yaml);
      }
      if (!yaml.getIn(["spring", "cloud", "openservicebroker"])) {
        yaml.setIn(["spring", "cloud", "openservicebroker", "catalog"], CATALOG);
      }
      if (!yaml.getIn(["sap-afc-sdk", "broker", "enabled"])) {
        if (!yaml.getIn(["sap-afc-sdk", "broker"])) {
          yaml.setIn(["sap-afc-sdk", "broker"], yaml.createNode());
        }
        yaml.setIn(["sap-afc-sdk", "broker", "enabled"], true);
        if (!yaml.getIn(["sap-afc-sdk", "broker", "name"])) {
          yaml.setIn(["sap-afc-sdk", "broker", "name"], APP_NAME);
        }
        if (!yaml.getIn(["sap-afc-sdk", "broker", "user"])) {
          yaml.setIn(["sap-afc-sdk", "broker", "user"], BROKER_USER);
        }
        if (!yaml.getIn(["sap-afc-sdk", "broker", "credentialsHash"])) {
          yaml.setIn(["sap-afc-sdk", "broker", "credentialsHash"], BROKER.SBF_BROKER_CREDENTIALS_HASH[BROKER_USER]);
        }
        if (!yaml.getIn(["sap-afc-sdk", "broker", "endpoints"])) {
          yaml.setIn(["sap-afc-sdk", "broker", "endpoints"], BROKER.SBF_SERVICE_CONFIG[APP_NAME].extend_credentials.shared.endpoints);
        }
        if (!yaml.getIn(["sap-afc-sdk", "broker", "credential-types"])) {
          yaml.setIn(
            ["sap-afc-sdk", "broker", "credential-types"],
            BROKER.SBF_SERVICE_CONFIG[APP_NAME].extend_credentials.shared["oauth2-configuration"]["credential-types"],
          );
        }
        brokerWritten = true;
      }
      return yamls;
    });
  }
  if (brokerWritten && brokerPassword.clear) {
    console.log(
      `Keep it safe to create broker and to fetch key after deployment: afc api key -p '${brokerPassword.clear}'`,
    );
  }
};
