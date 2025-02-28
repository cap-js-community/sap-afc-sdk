"use strict";

const cds = require("@sap/cds");

const { authorization, clearEventQueue } = require("./helper");
const { config: eventQueueConfig } = require("@cap-js-community/event-queue");

const log = cds.test.log();

const { GET, POST, axios, test } = cds.test(__dirname + "/..");

process.env.PORT = 0; // Random

cds.env.requires["sap-afc-sdk"].broker = true;
cds.env.requires["sap-afc-sdk"].ui.path = "/custom";
cds.env.requires["sap-afc-sdk"].broker = {
  SBF_SERVICE_CONFIG: {
    service: {
      extend_credentials: {
        shared: {
          endpoints: {
            api: "/api",
            "job-scheduling-v1": "/api/job-scheduling/v1",
          },
          "oauth2-configuration": {
            "credential-types": ["binding-secret", "x509"],
          },
        },
      },
      extend_xssecurity: {
        shared: {
          "oauth2-configuration": {
            "credential-types": ["binding-secret", "x509"],
          },
        },
      },
    },
  },
  SBF_BROKER_CREDENTIALS_HASH: {
    "broker-user": "sha256:E/VwOIZC2ZKPY+VTPCg1Mfu/bFDlxgkk9AgyrzhgpHs=:WNlnGu7jfxHGwy14BoVEiFXzp9RcwGiInauL4iOTe5E=",
  },
};

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
      expect.stringMatching(
        /\[\/broker] - Failed to start broker AssertionError \[ERR_ASSERTION]: Could not find credentials service/s,
      ),
    );
  });

  it("GET Welcome Page", async () => {
    const response = await GET("/");
    response.data = response.data.replace(/>@cap-js-community\/sap-afc-sdk (.*?)</, ">@cap-js-community/sap-afc-sdk<");
    expect(response.status).toBe(200);
    expect(response.data).toMatchSnapshot();
  });

  it("GET API Root", async () => {
    const response = await GET("/api");
    expect(response.status).toBe(200);
    for (const name in response.data) {
      response.data[name] = response.data[name].replace(/localhost:\d+/, "localhost:4004");
    }
    expect(response.data).toMatchSnapshot();
  });

  it("GET App Config", async () => {
    const response = await GET("/appconfig/fioriSandboxConfig.json");
    expect(response.status).toBe(200);
    expect(response.data).toMatchSnapshot();
  });

  it("GET Feature Toggles", async () => {
    const response = await GET("/rest/feature/state()");
    expect(response.status).toBe(200);
    expect(response.data).toMatchSnapshot();
  });

  it("POST Feature Toggles", async () => {
    let response = await POST("/rest/feature/redisUpdate", {
      key: "eventQueue/active",
      value: false,
    });
    expect(response.status).toBe(204);
    eventQueueConfig.isEventQueueActive = true;
    response = await POST("/rest/feature/redisUpdate", {
      key: "eventQueue/instanceLoadLimit",
      value: 11,
    });
    expect(response.status).toBe(204);
    eventQueueConfig.instanceLoadLimit = 11;
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
    eventQueueConfig.isEventQueueActive = false;
    response = await POST("/rest/feature/redisUpdate", {
      key: "eventQueue/instanceLoadLimit",
      value: null,
      options: {
        clearSubScopes: true,
      },
    });
    expect(response.status).toBe(204);
    eventQueueConfig.instanceLoadLimit = 5;
    response = await GET("/rest/feature/state()");
    expect(response.data).toMatchSnapshot();
  });
});
