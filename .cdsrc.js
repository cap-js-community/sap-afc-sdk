"use strict";

const config = require("./config.json");
const { merge } = require("./src/util/helper");

module.exports = {
  cds: merge(
    [...config.plugins, config.paths.base].map((module) => {
      return require(`${module}/package.json`).cds;
    }),
  ),
};
