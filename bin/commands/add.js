/* eslint-disable no-console */
"use strict";

const commander = require("commander");
module.exports = {
  dependencies: {
    test: ["sample"],
  },
  register: function (program) {
    return program
      .command("add")
      .description("Add features to project")
      .addArgument(
        new commander.Argument("<features>", "Add one or more features to an existing project (comma-separated list)"),
      )
      .option("-b, --basic", "Basic mock support (default)")
      .option("-a, --advanced", "Advanced mock support")
      .option("-j, --java", "Java based project")
      .option("-x, --xremove", "Remove feature (supported for mock)")
      .addHelpText(
        "afterAll",
        `
Features: 
  broker \t\t - expose a broker service
  stub \t\t\t - add stub implementation
  mock \t\t\t - mock job processing
  sample \t\t - add sample data
  http \t\t\t - add .http files
  test \t\t\t - add test
  app \t\t\t - add app files

Examples:
  afc add broker
  afc add broker,sample,http
  afc add stub
  afc add -x mock
`,
      );
  },
  handle: function (argument) {
    const features = (argument ?? "").split(",").map((f) => f.trim());
    const options = this.opts();
    const success = module.exports.process(features, options);
    if (!options.xremove && success) {
      console.log("Successfully added features to your project.");
    }
  },
  process: function (features, options) {
    let success = true;
    for (const feature of features) {
      if (module.exports.dependencies[feature]) {
        for (const dependency of module.exports.dependencies[feature]) {
          if (!features.includes(dependency)) {
            features.push(dependency);
          }
        }
      }
    }
    for (const feature of features) {
      let featureFn;
      try {
        if (options.xremove && !["mock"].includes(feature)) {
          console.log("Feature removal is only supported for 'mock'");
          continue;
        }
        if (!options.xremove) {
          console.log(`Adding feature '${feature}'`);
        } else {
          console.log(`Removing feature '${feature}'`);
        }
        featureFn = require(`../features/${feature}`);
      } catch {
        console.log(`Unknown feature '${feature}'`);
        continue;
      }
      try {
        const featureSuccess = featureFn(options);
        if (featureSuccess === false) {
          success = false;
        }
      } catch (err) {
        console.log(`Adding feature '${feature}' failed: ${err.message}`);
        return false;
      }
    }
    return success;
  },
};
