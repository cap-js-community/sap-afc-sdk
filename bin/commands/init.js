/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const commander = require("commander");
const path = require("path");
const shelljs = require("shelljs");
const YAML = require("yaml");

const { projectName, adjustYAMLAllDocuments, copyFileAdjusted, derivePackageName } = require("../common/util");

const config = require("../config.json");

const { isNode, adjustJSON, adjustYAMLDocument, adjustXML } = require("../common/util");

const Version = require(path.join(__dirname, "../../package.json")).version;

const Profile = {
  Default: "default",
  Basic: "basic",
};

const Runtime = {
  Node: "node",
  Java: "java",
};

const Dependencies = {
  Node: [],
  Java: [
    {
      groupId: "com.github.cap.js.community",
      artifactId: "sap-afc-sdk",
      version: Version,
    },
    {
      groupId: "org.springframework.security",
      artifactId: "spring-security-test",
      version: "6.5.5",
      scope: "test",
    },
  ],
};

module.exports = {
  register: function (program) {
    return program
      .command("init")
      .description("Initialize project for target platform")
      .addArgument(
        new commander.Argument("[target]", `Initialize project for target platform (${config.targets.join(", ")})`)
          .choices(config.targets)
          .default(config.defaults.target),
      )
      .addOption(
        new commander.Option(
          "-a, --add <features>",
          "Add one or more features to the project (comma-separated list)",
        ).choices(["app", "broker", "http", "mock", "sample", "stub", "test"]),
      )
      .addOption(
        new commander.Option("-p, --profile <profile>", "Initialization profile (default)").choices([
          "default",
          "basic",
        ]),
      )
      .option("-n, --node", "Node flavor enforced")
      .option("-j, --java", "Java flavor enforced")
      .addHelpText(
        "afterAll",
        `
Features: 
  app \t\t\t - add app files
  broker \t\t - expose a broker service
  http \t\t\t - add .http files
  mock \t\t\t - mock job processing
  sample \t\t - add sample data
  stub \t\t\t - add stub implementation
  test \t\t\t - add test

Examples:
  afc init cf
  afc init kyma
  afc init cf --add app,broker,sample,http
  afc init kyma --add app,broker,sample,http
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
        success = addCommand.process(features, {});
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
      target ||= config.defaults.target;
      const runtime = isNode(options) ? Runtime.Node : Runtime.Java;
      const profile = options?.profile ?? Profile.Default;
      processBefore(runtime, target, profile);
      if (isNode(options)) {
        processNode(target, profile);
      } else {
        processJava(target, profile);
      }
      processAfter(runtime, target, profile);
      return true;
    } catch (err) {
      console.error("Project initialization failed: ", err.message);
    }
    return false;
  },
};

function processBefore(runtime, target, profile) {
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

  // CDS add
  const excludes = (config.excludes[runtime] || []).concat(config.excludes[target] || []);
  const features = config.features[profile].common
    .concat(config.features[profile][runtime])
    .concat(config.features[profile][target])
    .filter((feature) => !excludes.includes(feature));
  shelljs.exec(`cds add ${features.join(",")} ${config.options.cds}`);
  shelljs.exec("npm install");
}

function processNode() {
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
    if (json.cds?.server?.index === undefined) {
      json.cds ??= {};
      json.cds.server ??= {};
      json.cds.server.index = true;
    }
  });
}

function processJava() {
  // cdsrc
  const cdsrc = adjustJSON(".cdsrc.json", (json) => {
    if (json.requires?.outbox?.kind !== "persistent-outbox") {
      json.requires ??= {};
      json.requires.outbox ??= {};
      json.requires.outbox.kind = "persistent-outbox";
    }
  });

  // Project
  adjustJSON("package.json", (json) => {
    json.cds ??= {};
    json.cds.requires ??= {};
    json.cds.requires["event-queue"] = false;
    if (!cdsrc) {
      if (json.cds?.requires?.outbox?.kind !== "persistent-outbox") {
        json.cds.requires.outbox ??= {};
        json.cds.requires.outbox.kind = "persistent-outbox";
      }
    }
    if (!json.scripts?.postinstall) {
      json.scripts ??= {};
      json.scripts.postinstall = "afc update";
    } else if (!json.scripts.postinstall.includes("afc update")) {
      json.scripts.postinstall += " && afc update";
    }
  });

  // POM
  adjustXML("srv/pom.xml", (xml) => {
    if (!xml.project.dependencies) {
      xml.project.dependencies = [{}];
    }
    for (const dependency of Dependencies.Java) {
      if (
        !xml.project.dependencies[0].dependency.find(
          (dep) => dep.groupId[0] === dependency.groupId && dep.artifactId[0] === dependency.artifactId,
        )
      ) {
        xml.project.dependencies[0].dependency.push(dependency);
      }
    }
    return xml;
  });

  // Application
  adjustYAMLAllDocuments("srv/src/main/resources/application.yaml", (yamls) => {
    let yaml = yamls.find((yaml) => yaml.getIn(["spring", "config.activate.on-profile"]) === "cloud");
    if (!yaml) {
      yaml = new YAML.Document();
      yaml.setIn(["spring", "config.activate.on-profile"], "cloud");
      yamls.unshift(yaml);
    }
    if (yaml.getIn(["sap-afc-sdk", "ui", "enabled"]) === undefined) {
      yaml.setIn(["sap-afc-sdk", "ui", "enabled"], true);
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
    yaml = yamls.find((yaml) => !yaml.getIn(["spring", "config.activate.on-profile"]));
    if (!yaml) {
      yaml = new YAML.Document();
      yamls.unshift(yaml);
    }
    if (yaml.getIn(["cds", "index-page", "enabled"]) == null) {
      yaml.setIn(["cds", "index-page", "enabled"], true);
    }
    if (!yaml.get("springdoc")) {
      yaml.set("springdoc", {
        "packages-to-scan": ["com.github.cap.js.community.sapafcsdk.scheduling.controllers"],
        "swagger-ui": {
          path: "/api-docs/api/job-scheduling/v1",
        },
      });
    }
    if (!yaml.getIn(["sap-afc-sdk", "broker", "enabled"])) {
      yaml.setIn(["sap-afc-sdk", "broker", "enabled"], false);
    }
    if (!yaml.getIn(["sap-afc-sdk", "syncJob", "cron"])) {
      yaml.setIn(["sap-afc-sdk", "syncJob", "cron"], "0 */1 * * * *");
    }
    return yamls;
  });

  const packageName = derivePackageName(projectName());
  copyFileAdjusted(
    path.join(__dirname, "..", "templates/java/ApplicationConfig.java"),
    path.join(process.cwd(), `srv/src/main/java/customer/${packageName}/ApplicationConfig.java`),
    (content) => {
      return content.replace("package customer;", `package customer.${packageName};`);
    },
  );

  // TODO: Remove (cap/issues/18263)
  const sourcePath = path.resolve(__dirname, "../../db/data");
  const targetPath = path.resolve(process.cwd(), "db/csv");
  if (!fs.existsSync(targetPath)) {
    fs.symlinkSync(sourcePath, targetPath, "dir");
  }
}

function processAfter() {
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
    if (yaml.getIn(["xsuaa", "servicePlanName"])) {
      yaml.setIn(["xsuaa", "servicePlanName"], "broker");
    }
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
