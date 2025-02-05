#!/usr/bin/env node

/* eslint-disable no-console */
"use strict";

(async function () {
  process.argv = process.argv.map((arg) => {
    return arg.toLowerCase();
  });

  if (process.argv.length < 3) {
    console.log("Missing command argument. Available commands: 'catalog'");
    return;
  }

  const command = process.argv[2];
  let commandFn;
  switch (command) {
    case "catalog":
      commandFn = require(`./commands/${command}`);
      break;
    default:
      console.log(`Unknown command '${command}'`);
      break;
  }
  if (commandFn) {
    await commandFn();
  }
})();
