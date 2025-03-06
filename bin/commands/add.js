/* eslint-disable no-console */
"use strict";

const commander = require("commander");
module.exports = {
  register: function (program) {
    return program
      .command("add")
      .description("Add features to project")
      .addArgument(
        new commander.Argument("<features>", "Add one or more features to an existing project (comma-separated list)"),
      )
      .option("-b, --basic", "Basic mock support (default)")
      .option("-a, --advanced", "Advanced mock support")
      .option("-x, --xremove", "Remove feature (supported for mock)")
      .addHelpText(
        "afterAll",
        `
Features: 
  broker \t\t - expose a broker service
  mock \t\t\t - mock job processing
  sample \t\t - add sample data
  http \t\t\t - add .http files
  app \t\t\t - add app files

Examples:
  afc add broker
  afc add broker,sample,http
  afc add -x mock
`,
      );
  },
  handle: function (argument) {
    const features = (argument ?? "").split(",").map((f) => f.trim());
    const options = this.opts();
    module.exports.process(features, options);
    if (!options.xremove) {
      console.log("Successfully added features to your project.");
    }
  },
  process: function (features, options) {
    for (const feature of features) {
      try {
        if (options.xremove && !["mock"].includes(feature)) {
          console.log("Feature removal is only supported for 'mock'");
          continue;
        }
        const featureFn = require(`../features/${feature}`);
        featureFn(options);
        if (!options.xremove) {
          console.log(`Adding feature '${feature}'`);
        } else {
          console.log(`Removing feature '${feature}'`);
        }
      } catch (err) {
        console.log(`Unknown feature '${feature}'`);
      }
    }
  },
};
