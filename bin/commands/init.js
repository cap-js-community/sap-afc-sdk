/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const commander = require("commander");
const path = require("path");
const shelljs = require("shelljs");
const YAML = require("yaml");

const { projectName, adjustYAMLAllDocument } = require("../common/util");

const config = require("../config.json");

const { isJava, adjustJSON, adjustYAMLDocument, adjustXML } = require("../common/util");

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
      .option("-j, --java", "Java based project")
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
    const name = projectName();
    if (!name) {
      console.log(`CDS project not found`);
      return false;
    }

    console.log(`Initializing project`);
    let success = module.exports.process(target, this.opts());
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
  process: function (target, options) {
    try {
      target ||= config.defaultTarget;
      if (!isJava(options)) {
        processNode(target);
      } else {
        processJava(target);
      }
      processCommon(target);
      return true;
    } catch (err) {
      console.error("Project initialization failed: ", err.message);
    }
    return false;
  },
};

function processNode(target) {
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
      if (process.env.APPROUTER_URL && !json.cds.requires["sap-afc-sdk"]["[production]"].endpoints.approuter) {
        json.cds.requires["sap-afc-sdk"]["[production]"].endpoints.approuter = process.env.APPROUTER_URL;
      }
      if (process.env.SERVER_URL && !json.cds.requires["sap-afc-sdk"]["[production]"].endpoints.server) {
        json.cds.requires["sap-afc-sdk"]["[production]"].endpoints.server = process.env.SERVER_URL;
      }
    }
    json.sapux ??= [];
    for (const app of appStubs) {
      if (!json.sapux.includes(`node_modules/@cap-js-community/sap-afc-sdk/app/${app}`)) {
        json.sapux.push(`node_modules/@cap-js-community/sap-afc-sdk/app/${app}`);
      }
    }
  });

  // cds add
  shelljs.exec(`cds add ${config.features[target].concat(config.features.node).join(",")} ${config.options.cds}`);

  // Cleanup app stubs
  for (const app of appStubs) {
    const appPath = path.join(process.cwd(), config.appRoot, app);
    if (fs.existsSync(appPath)) {
      fs.rmSync(appPath, { recursive: true, force: true });
    }
  }

  // CF
  adjustYAMLDocument("mta.yaml", (yaml) => {
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
  adjustYAMLDocument("containerize.yaml", (yaml) => {
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
}

function processJava(target) {
  // POM
  adjustXML("srv/pom.xml", (xml) => {
    const dependency = {
      groupId: ["com.github.cap.js.community"],
      artifactId: ["sap-afc-sdk"],
    };
    if (!xml.project.dependencies) {
      xml.project.dependencies = [{}];
    }
    if (
      !xml.project.dependencies[0].dependency.find(
        (dep) => dep.groupId[0] === dependency.groupId[0] && dependency.artifactId[0] === dependency.artifactId[0],
      )
    ) {
      // TODO: Build plugin
      // xml.project.dependencies[0].dependency.push(dependency);
    }
    return xml;
  });

  // Application
  adjustYAMLAllDocument("srv/src/main/resources/application.yaml", (yaml, index, count) => {
    if (index !== 0) {
      return yaml;
    }
    let yamls = [yaml];
    if (count === 1 && yaml.getIn(["spring", "config.activate.on-profile"]) != null) {
      const newYaml = new YAML.Document();
      yamls = [newYaml, yaml];
      yaml = newYaml;
    }
    if (yaml.getIn(["cds", "index-page", "enabled"]) == null) {
      yaml.setIn(["cds", "index-page", "enabled"], true);
    }
    if (!yaml.get("springdoc")) {
      yaml.set(
        "springdoc",
        yaml.createNode({
          "packages-to-scan": ["scheduling.controllers"],
          "swagger-ui": {
            path: "/api-docs/api/job-scheduling/v1",
          },
        }),
      );
    }
    if (!yaml.getIn(["broker", "enabled"])) {
      yaml.setIn(["broker", "enabled"], false);
    }
    if (
      (process.env.APPROUTER_URL && !yaml.getIn(["sap-afc-sdk", "endpoints", "approuter"])) ||
      (process.env.SERVER_URL && !yaml.getIn(["sap-afc-sdk", "endpoints", "server"]))
    ) {
      if (!yaml.getIn(["sap-afc-sdk", "endpoints"])) {
        yaml.setIn(["sap-afc-sdk", "endpoints"], new YAML.YAMLMap());
      }
      if (process.env.APPROUTER_URL && !yaml.getIn(["sap-afc-sdk", "endpoints", "approuter"])) {
        yaml.setIn(["sap-afc-sdk", "endpoints", "approuter"], process.env.APPROUTER_URL);
      }
      if (process.env.SERVER_URL && !yaml.getIn(["sap-afc-sdk", "endpoints", "server"])) {
        yaml.setIn(["sap-afc-sdk", "endpoints", "server"], process.env.SERVER_URL);
      }
    }
    if (!yaml.getIn(["sap-afc-sdk", "syncJob", "cron"])) {
      yaml.setIn(["sap-afc-sdk", "syncJob", "cron"], "0 */1 * * * *");
    }
    return yamls;
  });

  // cds add
  shelljs.exec(`cds add ${config.features[target].concat(config.features.java).join(",")} ${config.options.cds}`);
}

function processCommon() {
  // CF
  adjustYAMLDocument("mta.yaml", (yaml) => {
    for (const resource of yaml.get("resources").items) {
      if (resource.getIn(["parameters", "service"]) === "xsuaa") {
        resource.setIn(["parameters", "service-plan"], "broker");
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
    return yaml;
  });

  // Approuter
  adjustJSON("app/router/xs-app.json", (json) => {
    json.websockets = { enabled: true };
  });
}
