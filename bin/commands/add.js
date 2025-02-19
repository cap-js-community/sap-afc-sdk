/* eslint-disable no-console */
"use strict";

module.exports = (features) => {
  for (const feature of features) {
    try {
      const featureFn = require(`../features/${feature}`);
      console.log(`Adding feature '${feature}'`);
      featureFn();
    } catch (err) {
      console.log(`Unknown feature '${feature}'`);
    }
  }
};
