"use strict";

const fs = require("fs");
const path = require("path");
const shelljs = require("shelljs");

process.env.APPROUTER_URL = "https://afcsdk-approuter.cloud.sap";
process.env.SERVER_URL = "https://afcsdk-srv.cloud.sap";
process.env.BROKER_PASSWORD_HASH = "sha256:xxx=:xxx=";
process.env.BROKER_SERVICE_ID = "e25a901f-43d1-43c0-bbd6-48b9c6aecb61";
process.env.BROKER_SERVICE_PLAN_ID = "958cbd91-af93-4fdd-a793-16c82ae9e70b";
process.env.CONTAINER_REPOSITORY = "afcsdk.common.repositories.cloud.sap";
process.env.GLOBAL_DOMAIN = "xxx.stage.kyma.ondemand.com";

const project = "afcsdk";
const tempDir = "temp";
const workingDir = path.join(__dirname, "..", tempDir);
const projectDir = path.join(workingDir, project);

const Commands = {
  BEGIN: [`cd ${tempDir}`],
  CDS_NODE: [`npx cds init ${project}`],
  CDS_JAVA: [`npx cds init ${project} --java`],
  INSTALL: [`cd ${project}`, "npm install ../../../"],
  AFC_CF: ["npx afc init cf"],
  AFC_KYMA: ["npx afc init kyma"],
  AFC_NODE: ["npx afc add -a broker,stub,mock,sample,test,http"],
  AFC_JAVA: ["npx afc add -a app,broker,stub,mock,sample,test,http"],
  END: [], // ["npm test"]
};

const Files = {
  COMMON: [
    "package.json",
    "app/router/xs-app.json",
    "http/scheduling/provider.cloud.http",
    "http/scheduling/provider.local.http",
  ],
  NODE: [
    "srv/broker.json",
    "srv/catalog.json",
    "srv/scheduling-processing-service.cds",
    "srv/scheduling-processing-service.js",
    "srv/scheduling-provider-service.cds",
    "srv/scheduling-provider-service.js",
    "test/scheduling.provider.test.js",
  ],
  JAVA: [
    ".cdsrc.json",
    "srv/pom.xml",
    "srv/src/main/resources/application.yaml",
    "srv/src/main/java/customer/afcsdk/ApplicationConfig.java",
    "srv/src/main/java/customer/afcsdk/scheduling/CustomSchedulingProcessingHandler.java",
    "srv/src/main/java/customer/afcsdk/scheduling/CustomSchedulingProviderHandler.java",
    "srv/src/test/java/customer/afcsdk/scheduling/SchedulingProviderHandlerTest.java",
  ],
  CF: ["mta.yaml"],
  KYMA: ["chart/Chart.yaml", "chart/values.yaml", "containerize.yaml"],
};

// TODO: Temporary
process.removeAllListeners("warning");

describe("Build", () => {
  beforeEach(() => {
    if (fs.existsSync(workingDir)) {
      fs.rmSync(workingDir, { recursive: true });
    }
    fs.mkdirSync(workingDir);
  });

  afterAll(() => {
    if (fs.existsSync(workingDir)) {
      fs.rmSync(workingDir, { recursive: true });
    }
  });

  it("Node / CF", async () => {
    const result = shelljs.exec(
      [
        ...Commands.BEGIN,
        ...Commands.CDS_NODE,
        ...Commands.INSTALL,
        ...Commands.AFC_CF,
        ...Commands.AFC_CF,
        ...Commands.AFC_NODE,
        ...Commands.AFC_NODE,
        ...Commands.END,
      ].join(" && "),
    );
    expect(cleanErr(result.stderr)).toBe("");
    expect(result.code).toBe(0);
    for (const file of [...Files.COMMON, ...Files.NODE, ...Files.CF]) {
      const content = fs.readFileSync(path.join(projectDir, file), "utf8");
      expect(content).toMatchSnapshot();
    }
  });

  it("Node / Kyma", async () => {
    const result = shelljs.exec(
      [
        ...Commands.BEGIN,
        ...Commands.CDS_NODE,
        ...Commands.INSTALL,
        ...Commands.AFC_KYMA,
        ...Commands.AFC_KYMA,
        ...Commands.AFC_NODE,
        ...Commands.AFC_NODE,
        ...Commands.END,
      ].join(" && "),
    );
    expect(cleanErr(result.stderr)).toMatch(/'cds add redis' is not available for Kyma yet/);
    expect(result.code).toBe(0);
    for (const file of [...Files.COMMON, ...Files.NODE, ...Files.KYMA]) {
      const content = fs.readFileSync(path.join(projectDir, file), "utf8");
      expect(content).toMatchSnapshot();
    }
  });

  it("Java / CF", async () => {
    const result = shelljs.exec(
      [
        ...Commands.BEGIN,
        ...Commands.CDS_JAVA,
        ...Commands.INSTALL,
        ...Commands.AFC_CF,
        ...Commands.AFC_CF,
        ...Commands.AFC_JAVA,
        ...Commands.AFC_JAVA,
        ...Commands.END,
      ].join(" && "),
    );
    expect(cleanErr(result.stderr)).toBe("");
    expect(result.code).toBe(0);
    for (const file of [...Files.COMMON, ...Files.JAVA, ...Files.CF]) {
      const content = fs.readFileSync(path.join(projectDir, file), "utf8");
      expect(content).toMatchSnapshot();
    }
  });

  it("Java / Kyma", async () => {
    const result = shelljs.exec(
      [
        ...Commands.BEGIN,
        ...Commands.CDS_JAVA,
        ...Commands.INSTALL,
        ...Commands.AFC_KYMA,
        ...Commands.AFC_KYMA,
        ...Commands.AFC_JAVA,
        ...Commands.AFC_JAVA,
        ...Commands.END,
      ].join(" && "),
    );
    expect(cleanErr(result.stderr)).toBe("");
    expect(result.code).toBe(0);
    for (const file of [...Files.COMMON, ...Files.JAVA, ...Files.KYMA]) {
      const content = fs.readFileSync(path.join(projectDir, file), "utf8");
      expect(content).toMatchSnapshot();
    }
  });
});

function cleanErr(err) {
  return err.trim();
}
