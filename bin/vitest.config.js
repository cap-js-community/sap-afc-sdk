"use strict";

const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  test: {
    globals: true,
    include: ["**/test/**/*.test.js"],
    exclude: ["**/node_modules/**", "**/templates/**", "**/temp/**"],
    testTimeout: 300000,
    reporters: ["default"],
    silent: true,
    pool: "threads",
    maxWorkers: 2,
  },
});
