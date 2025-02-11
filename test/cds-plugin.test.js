"use strict";

const cds = require("@sap/cds");

const { authorization, clearEventQueue } = require("./util/helper");

const log = cds.test.log();

const { GET, POST, axios, test } = cds.test(__dirname + "/..");

process.env.PORT = 0; // Random

cds.env.requires["sap-afc-sdk"].broker = true;

describe("CDS Plugin", () => {
  beforeEach(async () => {
    axios.defaults.headers = {
      Authorization: authorization.zeus,
    };
    await clearEventQueue();
    await test.data.reset();
  });

  it("Boostrap", async () => {
    expect(log.output).toEqual(
      expect.stringMatching(/broker.json not found at '.*srv\/broker.json'. Call 'afc add broker'/s),
    );
  });

  it("GET Feature Toggles", async () => {
    const response = await GET("/rest/feature/state()");
    expect(response.data).toMatchSnapshot();
  });

  it("POST Feature Toggles", async () => {
    let response = await POST("/rest/feature/redisUpdate", {
      key: "eventQueue/active",
      value: false,
    });
    expect(response.status).toBe(204);
    response = await POST("/rest/feature/redisUpdate", {
      key: "eventQueue/instanceLoadLimit",
      value: 11,
    });
    expect(response.status).toBe(204);
    response = await GET("/rest/feature/state()");
    expect(response.data).toMatchSnapshot();
  });

  it("POST Feature Toggles (remove)", async () => {
    let response = await POST("/rest/feature/redisUpdate", {
      key: "eventQueue/active",
      value: null,
      options: {
        clearSubScopes: true,
      },
    });
    expect(response.status).toBe(204);
    response = await POST("/rest/feature/redisUpdate", {
      key: "eventQueue/instanceLoadLimit",
      value: null,
      options: {
        clearSubScopes: true,
      },
    });
    expect(response.status).toBe(204);
    response = await GET("/rest/feature/state()");
    expect(response.data).toMatchSnapshot();
  });
});
