#!/usr/bin/env node
/* eslint-disable no-console */
"use strict";

const commander = require("commander");
const program = new commander.Command();

const packageJSON = require("../package.json");

process.argv = process.argv.map((arg) => {
  return arg.toLowerCase();
});

program.version(packageJSON.version, "-v, --version").usage("[command] [options]");

program
  .command("init")
  .description("Initialize project for target platform")
  .addArgument(
    new commander.Argument("[target]", "Initialize project for target platform (cf, kyma)").choices(["cf", "kyma"]),
  )
  .option("-a, --add <features>", "Add one or more features to the project (comma-separated list)")
  .action(initProject)
  .addHelpText(
    "afterAll",
    `
Features: 
  broker \t\t - expose a broker service
  sample \t\t - add sample data
  http \t\t\t - add .http files

Examples:
  afc init cf
  afc init kyma
  afc init cf --add broker,sample,http
  afc init kyma --add broker,sample,http
`,
  );

program
  .command("add")
  .description("Add features to project")
  .addArgument(
    new commander.Argument(
      "<features>",
      "Add one or more features to an existing project (comma-separated list)",
    ).choices(["broker", "sample", "http", "app"]),
  )
  .action(addFeature)
  .addHelpText(
    "afterAll",
    `
Features: 
  broker \t\t - expose a broker service
  sample \t\t - add sample data
  http \t\t\t - add .http files
  app \t\t\t - add app files

Examples:
  afc add broker
  afc add broker,sample,http
`,
  );

program
  .command("api")
  .description("Manage API")
  .addArgument(new commander.Argument("<action>", "Manage API keys").choices(["key"]))
  .option("-n, --new", "Create new API key")
  .action(manageAPI)
  .addHelpText(
    "afterAll",
    `
Actions:
  key \t\t - manage service keys

Examples:
  afc api key
  afc api key --new
  afc api key -n
`,
  );

program.unknownOption = function () {};

program.parse(process.argv);

async function initProject(target) {
  console.log(`Initializing project`);
  const initFn = require("./commands/init");
  await initFn(target);
  const options = this.opts();
  if (options.add) {
    const features = options.add.split(",").map((f) => f.trim());
    const addFn = require("./commands/add");
    await addFn(features);
  }
  console.log("Successfully initialized project.");
}

async function addFeature(argument) {
  const features = (argument ?? "").split(",").map((f) => f.trim());
  const addFn = require("./commands/add");
  await addFn(features);
  console.log("Successfully added features to your project.");
}

async function manageAPI(action) {
  const options = this.opts();
  const apiFn = require("./commands/api");
  await apiFn(action, !!options.new);
  console.log("Successfully managed API keys.");
}
