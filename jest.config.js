"use strict";

module.exports = {
  reporters: ["default"],
  automock: false,
  bail: false,
  clearMocks: false,
  collectCoverage: true,
  collectCoverageFrom: [
    "cds-plugin.js",
    "**/src/**/*.js",
    "**/srv/**/*.js",
    "!**/bin/**/*.js",
    "!**/java/**/*.js",
    "!**/gen/**/*.js",
    "!**/scripts/**/*.js",
  ],
  coverageDirectory: "reports/coverage/unit/",
  coverageReporters: ["lcov", "text"],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  moduleDirectories: ["node_modules"],
  modulePathIgnorePatterns: [],
  resetMocks: false,
  resetModules: false,
  testMatch: ["**/test/**/*.test.js"],
  testPathIgnorePatterns: ["/node_modules/", "/bin/", "/gen/", "/scripts/"],
  verbose: true,
  maxWorkers: 2,
  setupFilesAfterEnv: ["./jest.setupAfterEnv.js"],
  testTimeout: 60000,
};
