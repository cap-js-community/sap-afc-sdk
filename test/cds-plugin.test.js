"use strict";

const cds = require("@sap/cds");
const express = require("express");

require("../cds-plugin");

describe("CDS Plugin", () => {
  const log = cds.test.log();

  beforeAll(() => {
    cds.app = express();
    cds.app.serve = () => {
      return {
        from: () => {},
      };
    };
  });

  it("Boostrap", async () => {
    cds.env.requires["sap-afc-sdk"].broker = true;
    cds.emit("bootstrap");
    expect(log.output).toEqual(
      expect.stringMatching(/broker.json not found at '.*srv\/broker.json'. Call 'afc add broker'/s),
    );
  });
});
