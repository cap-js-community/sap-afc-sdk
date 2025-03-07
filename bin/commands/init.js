/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");
const shelljs = require("shelljs");

const config = require("../config.json");
const commander = require("commander");

const { adjustJSON, adjustText, replaceTextPart } = require("../common/util");

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
    module.exports.process(target);
    const options = this.opts();
    if (options.add) {
      const features = options.add.split(",").map((f) => f.trim());
      const addCommand = require("./add");
      addCommand.process(features);
    }
    console.log("Successfully initialized project.");
  },
  process: function (target) {
    try {
      target ||= config.defaultTarget;

      // Remove previous replacements
      adjustText("mta.yaml", (content) => {
        content = content.replace(/path: node_modules\/@cap-js-community\/sap-afc-sdk\/app\//g, "path: app/");
        content = content.replace(/- npm i/g, "- npm ci");
        return content;
      });

      // Create app stubs
      const appStubs = [];
      for (const app of config.apps) {
        const appPath = path.join(process.cwd(), config.appRoot, app);
        if (!fs.existsSync(appPath)) {
          fs.mkdirSync(appPath, { recursive: true });
          appStubs.push(app);
        }
      }
      // Project
      adjustJSON("package.json", (json) => {
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
      adjustText("mta.yaml", (content) => {
        content = replaceTextPart(content, "service-plan: application", "service-plan: broker");
        for (const app of appStubs) {
          const part = `path: app/${app}`;
          const replacement = `path: node_modules/@cap-js-community/sap-afc-sdk/app/${app}`;
          content = replaceTextPart(content, part, replacement);
          content = replaceTextPart(content, "- npm ci", "- npm i", replacement);
        }
        return content;
      });

      // Kyma
      adjustText("chart/values.yaml", (content) => {
        content = replaceTextPart(content, "servicePlanName: application", "servicePlanName: broker");
        return content;
      });
      adjustText("containerize.yaml", (content) => {
        content = replaceTextPart(content, "<your-container-registry>", process.env.CONTAINER_REPOSITORY || "docker.io/abc123");
        for (const app of appStubs) {
          let part = `--prefix app/${app}`;
          let replacement = `--prefix node_modules/@cap-js-community/sap-afc-sdk/app/${app}`;
          content = replaceTextPart(content, part, replacement);
          content = replaceTextPart(content, part, replacement);
          part = `cp -f app/${app}`;
          replacement = `cp -f node_modules/@cap-js-community/sap-afc-sdk/app/${app}`;
          content = replaceTextPart(content, part, replacement);
        }
        return content;
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
    } catch (err) {
      console.error(err.message);
    }
  },
};
