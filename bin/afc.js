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
    new commander.Argument("<features>", "Add one or more features to an existing project (comma-separated list)"),
  )
  .action(addFeature)
  .addHelpText(
    "afterAll",
    `
Features: 
  broker \t\t - expose a broker service
  sample \t\t - add sample data
  http \t\t\t - add .http files

Examples:
  afc add broker
  afc add broker,sample,http
`,
  );

program.unknownOption = function () {};

program.parse();

async function initProject() {
  const options = program.opts();
  const initFn = require(`./init`);
  await initFn(options.target);
  console.log(`Initializing project`);
  if (options.add) {
    const features = options.add.split(",").map((f) => f.trim());
    await applyFeatures(features);
  }
  console.log("Successfully initialized project.");
}

async function addFeature(argument) {
  const features = (argument ?? "").split(",").map((f) => f.trim());
  await applyFeatures(features);
}

async function applyFeatures(features) {
  for (const feature of features) {
    try {
      const featureFn = require(`./features/${feature}`);
      console.log(`Applying feature '${feature}'`);
      await featureFn();
      console.log();
    } catch (err) {
      console.log(`Unknown feature '${feature}'`);
    }
  }
  console.log("Successfully added features to your project.");
}
