/* eslint-disable no-console */
"use strict";

const commander = require("commander");
module.exports = {
  register: function (program) {
    return program
      .command("add")
      .description("Add features to project")
      .addArgument(
        new commander.Argument(
          "<features>",
          "Add one or more features to an existing project (comma-separated list)",
        ).choices(["broker", "sample", "http", "app"]),
      )
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
  },
  handle: function (argument) {
    const features = (argument ?? "").split(",").map((f) => f.trim());
    module.exports.process(features);
    console.log("Successfully added features to your project.");
  },
  process: function (features) {
    for (const feature of features) {
      try {
        const featureFn = require(`../features/${feature}`);
        console.log(`Adding feature '${feature}'`);
        featureFn();
      } catch (err) {
        console.log(`Unknown feature '${feature}'`);
      }
    }
  },
};
