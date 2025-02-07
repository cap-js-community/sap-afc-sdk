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
    const feature = process.argv[3];
    try {
      const featureFn = require(`./features/${feature}`);
      await featureFn();
    } catch (err) {
      console.log(`Unknown feature '${feature}'`);
    }
  }
})();
