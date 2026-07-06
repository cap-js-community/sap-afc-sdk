"use strict";

const path = require("path");
const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  test: {
    globals: true,
    include: ["**/test/**/*.test.js"],
    exclude: ["**/node_modules/**", "**/bin/**", "**/gen/**", "**/scripts/**", "**/dist/**"],
    setupFiles: [path.join(__dirname, "vitest.setup.js")],
    testTimeout: 60000,
    reporters: ["default"],
    silent: true,
    pool: "forks",
    maxWorkers: 2,
    coverage: {
      enabled: true,
      provider: "v8",
      reporter: ["lcov", "text"],
      reportsDirectory: "reports/coverage/unit",
      include: ["cds-plugin.js", "**/src/**/*.js", "**/srv/**/*.js"],
      exclude: ["**/bin/**", "**/java/**", "**/gen/**", "**/scripts/**", "**/test/**", "**/node_modules/**"],
      thresholds: { branches: 85, functions: 95, lines: 95, statements: 95 },
    },
  },
});
