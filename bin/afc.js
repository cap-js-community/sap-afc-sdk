#!/usr/bin/env node
"use strict";

const commander = require("commander");
const program = new commander.Command();

const packageJSON = require("../package.json");

const COMMANDS = ["init", "add", "api"];

process.argv = process.argv.map((arg) => {
  return arg.toLowerCase();
});

program.version(packageJSON.version, "-v, --version").usage("[command] [options]");

for (const command of COMMANDS) {
  const commandFn = require(`./commands/${command}`);
  commandFn.register(program).action(function () {
    commandFn.handle.apply(this, arguments);
  });
}

program.unknownOption = function () {};
program.parse(process.argv);
