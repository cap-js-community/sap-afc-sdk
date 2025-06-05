"use strict";

const fs = require("fs");
const path = require("path");

module.exports = async function () {
  const packageJson = require(path.join(process.cwd(), "../../../../../package.json"));
  const manifestPath = path.join(process.cwd(), "webapp/manifest.json");
  const content = fs.readFileSync(manifestPath, "utf8");
  const manifest = JSON.parse(content);
  if (manifest["sap.app"]?.id && !manifest["sap.app"].id.startsWith(`${packageJson.name}.`)) {
    manifest["sap.app"] ??= {};
    manifest["sap.app"].id = `${packageJson.name}.${manifest["sap.app"].id}`;
  }
  if (!manifest?.["sap.cloud"]?.service) {
    const strippedAppName = packageJson.name.replace(/-/g, "");
    manifest["sap.cloud"] ??= {};
    manifest["sap.cloud"].service = `${strippedAppName}.service`;
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
};
