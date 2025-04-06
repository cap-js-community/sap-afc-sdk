"use strict";

module.exports = {
  reporters: ["default"],
  automock: false,
  bail: false,
  clearMocks: false,
  collectCoverage: false,
  moduleDirectories: ["node_modules"],
  modulePathIgnorePatterns: [],
  resetMocks: false,
  resetModules: false,
  testMatch: ["**/test/**/*.test.js"],
  testPathIgnorePatterns: ["/templates/", "/temp/"],
  verbose: true,
  maxWorkers: 2,
  testTimeout: 60000,
};
