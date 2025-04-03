/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");
const shelljs = require("shelljs");

const config = require("../config.json");
const commander = require("commander");

const { adjustJSON, adjustYAML } = require("../common/util");

module.exports = {
  register: function (program) {
    return program
      .command("init")
      .description("Initialize project for target platform")
      .addArgument(
        new commander.Argument("[target]", "Initialize project for target platform (cf, kyma)")
          .choices(["cf", "kyma"])
          .default("cf"),
      )
      .addOption(
        new commander.Option(
          "-a, --add <features>",
          "Add one or more features to the project (comma-separated list)",
        ).choices(["broker", "sample", "http", "add"]),
      )
      .addHelpText(
        "afterAll",
        `
Features: 
  broker \t\t - expose a broker service
  sample \t\t - add sample data
  http \t\t\t - add .http files
  add \t\t\t - add app files

Examples:
  afc init cf
  afc init kyma
  afc init cf --add broker,sample,http
  afc init kyma --add broker,sample,http
`,
      );
  },
  handle: function (target) {
    console.log(`Initializing project`);
    let success = module.exports.process(target);
    if (success) {
      const options = this.opts();
      if (options.add) {
        const features = options.add.split(",").map((f) => f.trim());
        const addCommand = require("./add");
        success = addCommand.process(features);
      }
    }
    if (success) {
      console.log("Successfully initialized project.");
    } else {
      // eslint-disable-next-line n/no-process-exit
      process.exit(-1);
    }
  },
  process: function (target) {
    try {
      target ||= config.defaultTarget;

      // Create app stubs
      const appStubs = [];
      for (const app of config.apps) {
        const appPath = path.join(process.cwd(), config.appRoot, app);
        if (!fs.existsSync(appPath)) {
          fs.mkdirSync(appPath, { recursive: true });
          appStubs.push(app);
        }
      }

      // Remove previous replacements
      adjustYAML("mta.yaml", (yaml) => {
        for (const app of appStubs) {
          for (const module of yaml.modules) {
            if (module.path === `node_modules/@cap-js-community/sap-afc-sdk/app/${app}`) {
              module.path = `app/${app}`;
              if (module["build-parameters"]?.commands?.[0] === "npm i") {
                module["build-parameters"].commands[0] = "npm ci";
              }
              break;
            }
          }
        }
        return yaml;
      });

      // Project
      let projectName = "";
      adjustJSON("package.json", (json) => {
        projectName = json.name;
        if (
          (process.env.APPROUTER_URL && !json.cds?.requires?.["sap-afc-sdk"]?.["[production]"]?.endpoints?.approuter) ||
          (process.env.SERVER_URL && !json.cds?.requires?.["sap-afc-sdk"]?.["[production]"]?.endpoints?.server)
        ) {
          json.cds ??= {};
          json.cds.requires ??= {};
          json.cds.requires["sap-afc-sdk"] ??= {};
          json.cds.requires["sap-afc-sdk"]["[production]"] ??= {};
          json.cds.requires["sap-afc-sdk"]["[production]"].endpoints ??= {};
          if (!json.cds.requires["sap-afc-sdk"]["[production]"].endpoints.approuter) {
            json.cds.requires["sap-afc-sdk"]["[production]"].endpoints.approuter = process.env.APPROUTER_URL;
          }
          if (!json.cds.requires["sap-afc-sdk"]["[production]"].endpoints.server) {
            json.cds.requires["sap-afc-sdk"]["[production]"].endpoints.server = process.env.SERVER_URL;
          }
        }
        json.sapux ??= [];
        for (const app of config.apps) {
          if (!json.sapux.includes(`node_modules/@cap-js-community/sap-afc-sdk/app/${app}`)) {
            json.sapux.push(`node_modules/@cap-js-community/sap-afc-sdk/app/${app}`);
          }
        }
      });

      // cds add
      shelljs.exec(`cds add ${config.features[target].concat(config.features.cds).join(",")} ${config.options.cds}`);

      // Cleanup app stubs
      for (const app of appStubs) {
        const appPath = path.join(process.cwd(), config.appRoot, app);
        if (fs.existsSync(appPath)) {
          fs.rmSync(appPath, { recursive: true, force: true });
        }
      }

      // CF
      adjustYAML("mta.yaml", (yaml) => {
        for (const resource of yaml.resources) {
          if (resource.parameters?.service === "xsuaa") {
            resource.parameters["service-plan"] = "broker";
          }
        }
        for (const app of appStubs) {
          for (const module of yaml.modules) {
            if (module.path === `app/${app}`) {
              module.path = `node_modules/@cap-js-community/sap-afc-sdk/app/${app}`;
              if (module["build-parameters"]?.commands?.[0] === "npm ci") {
                module["build-parameters"].commands[0] = "npm i";
              }
              break;
            }
          }
        }
        return yaml;
      });

      // Kyma
      const repository = process.env.CONTAINER_REPOSITORY;
      adjustYAML("chart/values.yaml", (yaml) => {
        if (process.env.GLOBAL_DOMAIN) {
          yaml.global ??= {};
          yaml.global.domain = process.env.GLOBAL_DOMAIN;
        }
        if (repository) {
          yaml.global ??= {};
          yaml.global.image ??= {};
          yaml.global.image.registry = repository;
        }
        yaml.srv ??= {};
        yaml.srv.expose ??= {};
        yaml.srv.expose.enabled = true;
        if (projectName) {
          yaml.backendDestinations ??= {};
          yaml.backendDestinations[`${projectName}-srv-api`] ??= {
            service: "srv",
          };
        }
        yaml.xsuaa ??= {};
        yaml.xsuaa.servicePlanName = "broker";
        return yaml;
      });
      adjustYAML("containerize.yaml", (yaml) => {
        if (repository) {
          yaml.repository = repository;
        }
        for (const app of appStubs) {
          for (let i = 0; i < yaml["before-all"].length; i++) {
            let line = yaml["before-all"][i];
            if (line.includes(`app/${app}`)) {
              line = line.replace(`app/${app}`, `node_modules/@cap-js-community/sap-afc-sdk/app/${app}`);
              yaml["before-all"][i] = line;
            }
          }
        }
        return yaml;
      });

      // Approuter
      adjustJSON("app/router/xs-app.json", (json) => {
        json.websockets = { enabled: true };
      });

      // Install @cap-js-community packages
      shelljs.exec(
        `npm install --save @cap-js-community/event-queue @cap-js-community/websocket @cap-js-community/feature-toggle-library`,
        { silent: true },
      );

      return true;
    } catch (err) {
      console.error("Project initialization failed: ", err.message);
    }
    return false;
  },
};
