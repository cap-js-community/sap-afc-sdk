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
  BEFORE: [`cd ${tempDir}`, `npx cds init ${project}`, `cd ${project}`, "npm install ../../../"],
  CF: ["npx afc init cf"],
  KYMA: ["npx afc init kyma"],
  AFTER: ["npx afc add -a broker,stub,mock,sample,test,http"],
};

const Files = {
  ALL: ["package.json", "app/router/xs-app.json", "srv/broker.json", "srv/catalog.json"],
  CF: ["mta.yaml"],
  KYMA: ["chart/values.yaml", "containerize.yaml"],
};

describe("Build", () => {
  beforeEach(() => {
    if (fs.existsSync(workingDir)) {
      fs.rmdirSync(workingDir, { recursive: true });
    }
    fs.mkdirSync(workingDir);
  });

  afterAll(() => {
    if (fs.existsSync(workingDir)) {
      fs.rmdirSync(workingDir, { recursive: true });
    }
  });

  it("CF", async () => {
    const code = shelljs.exec([...Commands.BEFORE, ...Commands.CF, ...Commands.AFTER].join(" && ")).code;
    expect(code).toBe(0);
    for (const file of [...Files.ALL, ...Files.CF]) {
      const content = fs.readFileSync(path.join(projectDir, file), "utf8");
      expect(content).toMatchSnapshot();
    }
  });

  it("Kyma", async () => {
    const code = shelljs.exec([...Commands.BEFORE, ...Commands.KYMA, ...Commands.AFTER].join(" && ")).code;
    expect(code).toBe(0);
    for (const file of [...Files.ALL, ...Files.KYMA]) {
      const content = fs.readFileSync(path.join(projectDir, file), "utf8");
      expect(content).toMatchSnapshot();
    }
  });
});
