"use strict";

const cds = require("@sap/cds");

const url = require("../../src/util/url");

cds.test(__dirname + "/../..");

process.env.PORT = 0; // Random

describe("url", () => {
  beforeEach(() => {
    process.env.VCAP_APPLICATION = "";
    cds.env.requires["sap-afc-sdk"].endpoints.approuter = "https://approuter.example.com";
    cds.env.requires["sap-afc-sdk"].endpoints.server = "https://server.example.com";
    url.reset();
  });

  it("approuterUrl", () => {
    expect(url.approuterUrl()).toEqual("https://approuter.example.com");
    url.reset();
    cds.env.requires["sap-afc-sdk"].endpoints.approuter = "";
    cds.env.requires["sap-afc-sdk"].endpoints.server = "";
    process.env.VCAP_APPLICATION = JSON.stringify({ uris: ["server-srv-vcap.example.com"] });
    expect(url.approuterUrl()).toEqual("https://server-vcap.example.com");
  });

  it("approuterWildcardUrl", () => {
    cds.env.requires["sap-afc-sdk"].endpoints.approuter = "https://approuter.example.com";
    expect(url.approuterWildcardUrl()).toEqual("*.approuter.example.com");
    url.reset();
    cds.env.requires["sap-afc-sdk"].endpoints.approuter = "approuter.example.com";
    expect(url.approuterWildcardUrl()).toEqual("*.approuter.example.com");
  });

  it("approuterUrlRegExp", () => {
    cds.env.requires["sap-afc-sdk"].endpoints.approuter = "https://approuter.example.com";
    expect(url.approuterUrlRegExp()).toEqual(/approuter\.example\.com$/);
  });

  it("launchpadUrl", () => {
    expect(url.launchpadUrl()).toEqual("https://approuter.example.com/launchpad.html");
    expect(
      url.launchpadUrl({
        user: {
          authInfo: {
            getSubdomain: jest.fn(() => {
              return "tenant1";
            }),
          },
        },
      }),
    ).toEqual("https://approuter.example.com/launchpad.html");
    cds.env.requires.multitenancy = true;
    expect(url.launchpadUrl()).toEqual("https://approuter.example.com/launchpad.html");
    expect(
      url.launchpadUrl({
        user: {
          authInfo: {
            getSubdomain: jest.fn(() => {
              return "tenant1";
            }),
          },
        },
      }),
    ).toEqual("https://tenant1.approuter.example.com/launchpad.html");
    cds.env.requires.multitenancy = false;
  });

  it("authorizationUrl", () => {
    expect(url.authorizationUrl()).toEqual("https://authentication.sap.hana.ondemand.com");
  });

  it("serverUrl", () => {
    expect(url.serverUrl()).toEqual("https://server.example.com");
    url.reset();
    cds.env.requires["sap-afc-sdk"].endpoints.approuter = "";
    cds.env.requires["sap-afc-sdk"].endpoints.server = "";
    process.env.VCAP_APPLICATION = JSON.stringify({ uris: ["server-srv-vcap.example.com"] });
    expect(url.serverUrl()).toEqual("https://server-srv-vcap.example.com");
    url.reset();

    cds.env.requires["sap-afc-sdk"].endpoints.server = "";
    process.env.VCAP_APPLICATION = JSON.stringify({});
    expect(url.serverUrl()).toMatch(/http:\/\/localhost:.*/);
    process.env.VCAP_APPLICATION = "";
    url.reset();

    expect(url.serverUrl()).toMatch(/http:\/\/localhost:.*/);
    url.reset();

    process.env.PORT = 5000;
    cds.server.url = null;
    cds.env.server.port = 0;
    expect(url.serverUrl()).toEqual("http://localhost:5000");
    url.reset();

    process.env.PORT = 4004;
    cds.server.url = "http://localhost:4004";
    expect(url.serverUrl()).toEqual("http://localhost:4004");
    url.reset();

    cds.env.server.port = 4004;
    process.env.PORT = 0;
    cds.server.url = "http://localhost:4004";
    expect(url.serverUrl()).toEqual("http://localhost:4004");
    url.reset();

    cds.server.url = "http://localhost:1234";
    expect(url.serverUrl()).toEqual("http://localhost:1234");
    url.reset();

    process.env.PORT = "";
    cds.server.url = null;
    cds.env.server.port = 0;
    expect(url.serverUrl()).toEqual("http://localhost:4004");
    url.reset();
  });
});
