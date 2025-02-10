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

Example:
  afc add broker,sample
`,
  );

program.unknownOption = function () {};

program.parse();

async function addFeature(argument) {
  const features = (argument ?? "").split(",").map((f) => f.trim());
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
}
