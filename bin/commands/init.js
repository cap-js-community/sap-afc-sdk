/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");
const shelljs = require("shelljs");

const config = require("../config.json");
const commander = require("commander");

const { adjustJSON, adjustYAMLDocument } = require("../common/util");

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
    const packagePath = path.join(process.cwd(), "package.json");
    if (!fs.existsSync(packagePath)) {
      console.log(`Project package.json not found at '${packagePath}'.`);
      return false;
    }

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
      adjustYAMLDocument("mta.yaml", (yaml) => {
        for (const app of appStubs) {
          for (const module of yaml.get("modules").items) {
            if (module.get("path") === `node_modules/@cap-js-community/sap-afc-sdk/app/${app}`) {
              module.set("path", `app/${app}`);
              if (module.getIn(["build-parameters", "commands", 0]) === "npm i") {
                module.setIn(["build-parameters", "commands", 0], "npm ci");
              }
              break;
            }
          }
        }
        return yaml;
      });

      // Project
      adjustJSON("package.json", (json) => {
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
      adjustYAMLDocument("mta.yaml", (yaml) => {
        for (const resource of yaml.get("resources").items) {
          if (resource.getIn(["parameters", "service"]) === "xsuaa") {
            resource.setIn(["parameters", "service-plan"], "broker");
          }
        }
        for (const app of appStubs) {
          for (const module of yaml.get("modules").items) {
            if (module.get("path") === `app/${app}`) {
              module.set("path", `node_modules/@cap-js-community/sap-afc-sdk/app/${app}`);
              if (module.getIn(["build-parameters", "commands", 0]) === "npm ci") {
                module.setIn(["build-parameters", "commands", 0], "npm i");
              }
              break;
            }
          }
        }
        return yaml;
      });

      // Kyma
      const repository = process.env.CONTAINER_REPOSITORY;
      adjustYAMLDocument("chart/values.yaml", (yaml) => {
        if (process.env.GLOBAL_DOMAIN) {
          yaml.setIn(["global", "domain"], process.env.GLOBAL_DOMAIN);
        }
        if (repository) {
          yaml.setIn(["global", "image", "registry"], repository);
        }
        yaml.setIn(["srv", "expose", "enabled"], true);
        yaml.setIn(["xsuaa", "servicePlanName"], "broker");
        return yaml;
      });
      adjustYAMLDocument("containerize.yaml", (yaml) => {
        if (repository) {
          yaml.set("repository", repository);
        }
        for (const app of appStubs) {
          yaml.get("before-all").items.forEach((line, index) => {
            if (line.value.includes(`app/${app}`)) {
              yaml.setIn(
                ["before-all", index],
                line.value.replace(`app/${app}`, `node_modules/@cap-js-community/sap-afc-sdk/app/${app}`),
              );
            }
          });
        }
        return yaml;
      });

      // Approuter
      adjustJSON("app/router/xs-app.json", (json) => {
        json.websockets = { enabled: true };
      });

      return true;
    } catch (err) {
      console.error("Project initialization failed: ", err.message);
    }
    return false;
  },
};
