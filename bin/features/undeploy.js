"use strict";

const { adjustJSON } = require("../common/util");

const Entries = {
  add: ["src/gen/**/*.hdbtable"],
  remove: [],
};

module.exports = (options) => {
  adjustJSON("db/undeploy.json", (json) => {
    const entriesAdd = !options.xremove ? Entries.add : Entries.remove;
    const entriesRemove = !options.xremove ? Entries.remove : Entries.add;

    for (const entry of entriesAdd) {
      if (!json.includes(entry)) {
        json.push(entry);
      }
    }
    for (const entry of entriesRemove) {
      const index = json.indexOf(entry);
      if (index !== -1) {
        json.splice(index, 1);
      }
    }

    return json;
  });
};
