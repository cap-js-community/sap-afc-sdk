/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");
const cds = require("@sap/cds");

const PATH = path.join(process.cwd(), "catalog.json");
const CATALOG = {
  services: [
    {
      id: cds.utils.uuid(),
      name: "scheduling-provider-service",
      description: "AFC Scheduling Provider Service",
      bindable: true,
      plans: [
        {
          id: cds.utils.uuid(),
          name: "standard",
          description: "Standard plan",
          free: true,
          bindable: true,
          plan_updateable: true,
        },
      ],
      metadata: {
        displayName: "AFC Scheduling Provider Service",
        longDescription: "Scheduling Provider Service for SAP Advanced Financial Closing",
      },
    },
  ],
};

module.exports = () => {
  if (fs.existsSync(PATH)) {
    console.log("File 'catalog.json' already exists and is not overwritten.");
  } else {
    fs.writeFileSync(PATH, JSON.stringify(CATALOG, null, 2));
    console.log("File 'catalog.json' written.");
  }
};
