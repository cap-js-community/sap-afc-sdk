/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");
const shelljs = require("shelljs");

const config = require("./config");

module.exports = (target) => {
  try {
    target ||= config.defaultTarget;
    const appStubs = [];
    for (const app of config.apps) {
      const appPath = path.join(process.cwd(), config.appRoot, app);
      if (!fs.existsSync(appPath)) {
        fs.mkdirSync(appPath, { recursive: true });
        appStubs.push(app);
      }
    }
    shelljs.exec(`cds add ${config.features[target].concat(config.features.cds).join(",")} --for production`);
    for (const app of appStubs) {
      const appPath = path.join(process.cwd(), config.appRoot, app);
      if (fs.existsSync(appPath)) {
        fs.rmSync(appPath, { recursive: true, force: true });
      }
    }
    // CF
    adjustText("mta.yaml", (content) => {
      content = replaceTextPart(content, "service-plan: application", "service-plan: broker");
      for (const app of appStubs) {
        const part = `path: app/${app}`;
        const replacement = `path: node_modules/@cap-js-community/sap-afc-sdk/app/${app}`;
        content = replaceTextPart(content, part, replacement);
        content = replaceTextPart(content, `- npm ci`, `- npm i`, replacement);
      }
      return content;
    });
    // Kyma
    adjustText("chart/values.yaml", (content) => {
      content = replaceTextPart(content, "servicePlanName: application", "servicePlanName: broker");
      // TODO: replace app stub paths in containerize
      return content;
    });
    // Approuter
    adjustJSON("app/router/xs-app.json", (json) => {
      json.routes = json.routes.filter((route) => {
        return !route.localDir;
      });
      json.websockets = { enabled: true };
    });
  } catch (err) {
    console.error(err.message);
  }
};

function adjustText(file, callback) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, "utf8");
    content = callback(content);
    fs.writeFileSync(filePath, content);
  }
}

function replaceTextPart(content, part, replacement, positionPart) {
  const position = Math.max(positionPart ? content.indexOf(positionPart) : 0, 0);
  const index = content.indexOf(part, position);
  if (index < 0) {
    return content;
  }
  return content.slice(0, index) + replacement + content.slice(index + part.length);
}

function adjustJSON(file, callback) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(content);
    callback(json);
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
  }
}
