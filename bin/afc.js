#!/usr/bin/env node
"use strict";

const commander = require("commander");
const program = new commander.Command();

const packageJSON = require("../package.json");

const COMMANDS = ["init", "update", "add", "api"];

// TODO: Temporary
process.removeAllListeners("warning");
process.on("warning", (warning) => {
  if (["DEP0040"].includes(warning.code)) {
    return;
  }
  // eslint-disable-next-line no-console
  console.warn(warning);
});

process.argv = process.argv.map((arg) => {
  return arg.toLowerCase();
});

if (process.argv.length === 3 && (process.argv.includes("-v") || process.argv.includes("--version"))) {
  // eslint-disable-next-line no-console
  console.log(packageJSON.version);
  // eslint-disable-next-line n/no-process-exit
  process.exit(0);
}

for (const command of COMMANDS) {
  const commandFn = require(`./commands/${command}`);
  commandFn.register(program).action(async function () {
    await commandFn.handle.apply(this, arguments);
  });
}

program.unknownOption = function () {};
program.parse(process.argv);
