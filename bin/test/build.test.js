"use strict";

const fs = require("fs");
const path = require("path");
const shelljs = require("shelljs");

const PROJECT = "afcsdk";

process.env.APPROUTER_URL = `https://${PROJECT}-approuter.cloud.sap`;
process.env.SERVER_URL = `https://${PROJECT}-srv.cloud.sap`;
process.env.BROKER_PASSWORD_HASH = "sha256:xxx=:xxx=";
process.env.BROKER_SERVICE_ID = "e25a901f-43d1-43c0-bbd6-48b9c6aecb61";
process.env.BROKER_SERVICE_PLAN_ID = "958cbd91-af93-4fdd-a793-16c82ae9e70b";
process.env.CONTAINER_REPOSITORY = `${PROJECT}.common.repositories.cloud.sap`;
process.env.GLOBAL_DOMAIN = "xxx.stage.kyma.ondemand.com";

const tempDir = "temp";
const workingDir = path.join(__dirname, "..", tempDir);
const projectDir = path.join(workingDir, PROJECT);

const Commands = {
  BEGIN: [`cd ${tempDir}`],
  CDS_NODE: [`npx cds init ${PROJECT}`],
  CDS_JAVA: [`npx cds init ${PROJECT} --java`],
  INSTALL: [`cd ${PROJECT}`, "cp ../../test/.npmrc .", "npm install"],
  AFC_CF: ["npx afc init cf"],
  AFC_KYMA: ["npx afc init kyma"],
  AFC_NODE: ["npx afc add -a app,broker,stub,mock,sample,test,http"],
  AFC_JAVA: ["npx afc add -a app,broker,stub,mock,sample,test,http"],
  END: [],
  TEST: [`cd ${PROJECT}`, "npm test"],
};

const Files = {
  COMMON: [
    "package.json",
    "app/router/xs-app.json",
    "http/scheduling/provider.cloud.http",
    "http/scheduling/provider.local.http",
  ],
  APP: [
    "app/appconfig/fioriSandboxConfig.json",
    "app/scheduling.monitoring.job/webapp/manifest.json",
    "app/scheduling.monitoring.job/webapp/Component.js",
    "app/scheduling.monitoring.job/ui5.yaml",
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
    `srv/src/main/java/customer/${PROJECT}/ApplicationConfig.java`,
    `srv/src/main/java/customer/${PROJECT}/scheduling/handlers/CustomSchedulingProcessingHandler.java`,
    `srv/src/main/java/customer/${PROJECT}/scheduling/handlers/CustomSchedulingProviderHandler.java`,
    `srv/src/test/java/customer/${PROJECT}/scheduling/handlers/SchedulingProviderHandlerTest.java`,
  ],
  CF: ["mta.yaml"],
  KYMA: ["chart/Chart.yaml", "chart/values.yaml", "containerize.yaml"],
};

const ENV = {
  NODE: "NODE",
  JAVA: "JAVA",
  CF: "CF",
  KYMA: "KYMA",
};

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
    let result = shelljs.exec(
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
    expect(cleanErr(result.stderr, ENV.NODE, ENV.CF)).toBe("");
    expect(result.code).toBe(0);
    for (const file of [...Files.COMMON, ...Files.APP, ...Files.NODE, ...Files.CF]) {
      compareFile(file);
    }
    result = shelljs.exec([...Commands.TEST].join(" && "));
    // expect(cleanErr(result.stderr, ENV.NODE, ENV.CF)).toBe("");
    expect(result.code).toBe(0);
  });

  it("Node / Kyma", async () => {
    let result = shelljs.exec(
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
    expect(cleanErr(result.stderr, ENV.NODE, ENV.KYMA)).toBe("");
    expect(result.code).toBe(0);
    for (const file of [...Files.COMMON, ...Files.APP, ...Files.NODE, ...Files.KYMA]) {
      compareFile(file);
    }
    result = shelljs.exec([...Commands.TEST].join(" && "));
    // expect(cleanErr(result.stderr, ENV.NODE, ENV.KYMA)).toBe("");
    expect(result.code).toBe(0);
  });

  it("Java / CF", async () => {
    let result = shelljs.exec(
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
    expect(cleanErr(result.stderr, ENV.JAVA, ENV.CF)).toBe("");
    expect(result.code).toBe(0);
    for (const file of [...Files.COMMON, ...Files.APP, ...Files.JAVA, ...Files.CF]) {
      compareFile(file);
    }
    result = shelljs.exec([...Commands.TEST].join(" && "));
    // expect(cleanErr(result.stderr, ENV.JAVA, ENV.CF)).toBe("");
    expect(result.code).toBe(0);
  });

  it("Java / Kyma", async () => {
    let result = shelljs.exec(
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
    expect(cleanErr(result.stderr, ENV.JAVA, ENV.KYMA)).toBe("");
    expect(result.code).toBe(0);
    for (const file of [...Files.COMMON, ...Files.APP, ...Files.JAVA, ...Files.KYMA]) {
      compareFile(file);
    }
    result = shelljs.exec([...Commands.TEST].join(" && "));
    // expect(cleanErr(result.stderr, ENV.JAVA, ENV.KYMA)).toBe("");
    expect(result.code).toBe(0);
  });
});

function cleanErr(err) {
  let lines = err.split("\n");
  lines = lines.filter((line) => !line.startsWith("npm warn EBADENGIN"));
  return lines.join("\n").trim();
}

function compareFile(file) {
  let content = fs.readFileSync(path.join(projectDir, file), "utf8");
  if (["package.json"].includes(file)) {
    const json = JSON.parse(content);
    delete json.dependencies;
    delete json.devDependencies;
    content = JSON.stringify(json, null, 2);
  }
  expect(file + "\n\n" + content).toMatchSnapshot();
}
