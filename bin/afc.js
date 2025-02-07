#!/usr/bin/env node

/* eslint-disable no-console */
"use strict";

const commands = ["add"];

(async function () {
  process.argv = process.argv.map((arg) => {
    return arg.toLowerCase();
  });

  if (process.argv.length < 3) {
    console.log("Missing <command> argument. Available commands: 'add'");
    return;
  }

  const command = process.argv[2];
  if (!commands.includes(command)) {
    console.log(`Unknown command '${command}'`);
    return;
  }

  if (command === "add") {
    if (process.argv.length < 4) {
      console.log("Missing <feature> argument. Available features: 'broker'");
      return;
    }
    const features = (process.argv[3] ?? "").split(",").map((f) => f.trim());
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
})();
