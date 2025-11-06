/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");
const cds = require("@sap/cds");

const {
  projectName,
  isNode,
  readYAML,
  generateHashBrokerPassword,
  adjustYAMLDocument,
  adjustYAMLAllDocuments,
} = require("../common/util");
const YAML = require("yaml");
const shelljs = require("shelljs");

const config = require("../config.json");

const BROKER_PATH = path.join(process.cwd(), "srv/broker.json");
const CATALOG_PATH = path.join(process.cwd(), "srv/catalog.json");

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
  addXsuaaBroker();
  if (!checkXsuaaBroker()) {
    console.log(`Broker feature requires a project using xsuaa with service plan 'broker'`);
    return;
  }
  if (
    !(
      readYAML("mta.yaml")?.resources?.find(
        (r) => r?.parameters?.service === "xsuaa" && r?.parameters?.["service-plan"] === "broker",
      ) || readYAML("chart/values.yaml")?.xsuaa?.servicePlanName === "broker"
    )
  ) {
    console.log(`Broker feature requires a project using xsuaa with service plan 'broker'`);
    return false;
  }

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
  if (isNode(options)) {
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
          yaml.setIn(
            ["sap-afc-sdk", "broker", "endpoints"],
            BROKER.SBF_SERVICE_CONFIG[APP_NAME].extend_credentials.shared.endpoints,
          );
        }
        if (!yaml.getIn(["sap-afc-sdk", "broker", "oauth2-configuration", "credential-types"])) {
          yaml.setIn(
            ["sap-afc-sdk", "broker", "oauth2-configuration", "credential-types"],
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

function addXsuaaBroker() {
  const name = projectName();

  // CF
  adjustYAMLDocument("mta.yaml", (yaml) => {
    for (const resource of yaml.get("resources").items) {
      if (resource.getIn(["parameters", "service"]) === "xsuaa") {
        resource.setIn(["parameters", "service-plan"], "application");
      }
    }
    return yaml;
  });

  // Kyma
  adjustYAMLDocument("chart/values.yaml", (yaml) => {
    if (yaml.getIn(["xsuaa", "servicePlanName"])) {
      yaml.setIn(["xsuaa", "servicePlanName"], "application");
    }
    return yaml;
  });

  // cds add
  shelljs.exec(`cds add ${config.dependencies.broker.join(",")} ${config.options.cds}`);

  // CF
  adjustYAMLDocument("mta.yaml", (yaml) => {
    for (const resource of yaml.get("resources").items) {
      if (resource.getIn(["parameters", "service"]) === "xsuaa") {
        resource.setIn(["parameters", "service-plan"], "broker");
      }
    }

    // TODO: Remove (cap/issues/19545)
    for (const module of yaml.get("modules").items) {
      if (module.get("name") === `${name}-app-deployer`) {
        const requires = module.get("requires");
        if (requires && !requires.items.find((r) => r.get("name") === `${name}-auth`)) {
          requires.items.push(yaml.createNode({ name: `${name}-auth` }));
        }
      } else if (module.get("name") === `${name}-destinations`) {
        const requires = module.get("requires");
        if (requires && !requires.items.find((r) => r.get("name") === `${name}-auth`)) {
          requires.items.push(
            yaml.createNode({
              name: `${name}-auth`,
              parameters: {
                "service-key": {
                  name: `${name}-auth-key`,
                },
              },
            }),
          );
        }
        const destinations = module.getIn(["parameters", "content", "instance", "destinations"]);
        if (destinations && !destinations.items.find((d) => d.get("Name") === `${name}-auth`)) {
          destinations.items.push(
            yaml.createNode({
              Name: `${name}-auth`,
              Authentication: "OAuth2UserTokenExchange",
              ServiceInstanceName: `${name}-auth`,
              ServiceKeyName: `${name}-auth-key`,
              "sap.cloud.service": `${name}.service`,
            }),
          );
        }
      }
    }

    return yaml;
  });

  // Kyma
  adjustYAMLDocument("chart/values.yaml", (yaml) => {
    if (yaml.getIn(["xsuaa", "servicePlanName"])) {
      yaml.setIn(["xsuaa", "servicePlanName"], "broker");
    }

    // TODO: Remove (cap/issues/19545)
    const bindings = yaml.getIn(["html5-apps-deployer", "bindings"]);
    if (bindings && !bindings.get("xsuaa")) {
      bindings.set(
        "xsuaa",
        yaml.createNode({
          serviceInstanceName: "xsuaa",
        }),
      );
    }

    return yaml;
  });
}

function checkXsuaaBroker() {
  return (
    readYAML("mta.yaml")?.resources?.find(
      (r) => r?.parameters?.service === "xsuaa" && r?.parameters?.["service-plan"] === "broker",
    ) || readYAML("chart/values.yaml")?.xsuaa?.servicePlanName === "broker"
  );
}
