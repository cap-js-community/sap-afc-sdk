/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");

const config = require("../config.json");

const { adjustJSON, adjustYAMLAllDocument, adjustAllLines } = require("../common/util");
const { merge } = require("../../src/util/helper");

const Exclude = {
  Extensions: [],
  Files: ["ui5-afc-sdk.js"],
  Tasks: ["ui5-afc-sdk"],
};

const Files = ["appconfig/fioriSandboxConfig.json", "launchpad.html"];

module.exports = () => {
  try {
    const addedApps = [];

    for (const app of config.apps) {
      const appPath = path.join(process.cwd(), config.appRoot, app);
      if (fs.existsSync(appPath)) {
        console.log(`Folder '${appPath}' already exists and is not overwritten.`);
        continue;
      }

      const srcPath = path.join(__dirname, "../../", config.appRoot, app);
      copyFolderSync(srcPath, appPath);

      const packageJson = require(path.join(process.cwd(), "package.json"));
      adjustJSON(path.join(config.appRoot, app, "webapp/manifest.json"), (json) => {
        if (json["sap.app"]?.id && !json["sap.app"].id.startsWith(`${packageJson.name}.`)) {
          json["sap.app"] ??= {};
          json["sap.app"].id = `${packageJson.name}.${json["sap.app"].id}`;
        }
        if (!json?.["sap.cloud"]?.service) {
          const strippedAppName = packageJson.name.replace(/-/g, "");
          json["sap.cloud"] ??= {};
          json["sap.cloud"].service = `${strippedAppName}.service`;
        }
      });

      adjustYAMLAllDocument(path.join(config.appRoot, app, "ui5.yaml"), (yaml) => {
        if (yaml.get("type") === "task" && Exclude.Tasks.includes(yaml.getIn(["metadata", "name"]))) {
          return null;
        } else if (yaml.get("type") === "application") {
          const customTasks = [];
          for (const task of yaml.getIn(["builder", "customTasks"]).items) {
            if (!Exclude.Tasks.includes(task.get("name"))) {
              customTasks.push(task);
            }
          }
          yaml.setIn(["builder", "customTasks"], customTasks);
        }
        return yaml;
      });

      adjustAllLines(path.join(config.appRoot, app, "annotations.cds"), (lines) => {
        const firstLine = lines[0];
        const parts = firstLine.split("from");
        const newLine = `${parts[0].trim()} from '@cap-js-community/sap-afc-sdk/${config.appRoot}/${app}';`;
        return [newLine];
      });

      addedApps.push(app);
      console.log(`Folder '${appPath}' written.`);
    }

    const addedAppUsings = addedApps.map((app) => `using from './${app}';`);
    const indexCdsPath = path.join(process.cwd(), "app/index.cds");
    if (!fs.existsSync(indexCdsPath)) {
      fs.writeFileSync(indexCdsPath, addedAppUsings.join("\n"), "utf8");
      console.log(`File '${indexCdsPath}' written.`);
    } else {
      adjustAllLines("app/index.cds", (lines) => {
        return lines.concat(addedAppUsings);
      });
    }

    for (const file of Files) {
      const filePath = path.join(process.cwd(), config.appRoot, file);
      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.cpSync(path.join(__dirname, "../../", config.appRoot, file), filePath);
        console.log(`File '${filePath}' written.`);
      } else {
        console.log(`File '${filePath}' already exists and is not overwritten.`);
      }
    }

    const sandboxConfigFilePath = path.join(process.cwd(), config.appRoot, "appconfig/fioriSandboxConfig.json");
    const projectFioriSandboxConfig = require(sandboxConfigFilePath);
    const packageFioriSandboxConfig = require(
      path.join(__dirname, "../../", config.appRoot, "appconfig/fioriSandboxConfig.json"),
    );
    const mergedFioriSandboxConfig = merge([packageFioriSandboxConfig, projectFioriSandboxConfig], {
      array: "merge",
      mergeKey: "id",
    });
    fs.writeFileSync(sandboxConfigFilePath, JSON.stringify(mergedFioriSandboxConfig, null, 2), "utf8");
  } catch (err) {
    console.error(err.message);
  }
};

function copyFolderSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const files = fs.readdirSync(src, { withFileTypes: true });
  for (const file of files) {
    const srcPath = path.join(src, file.name);
    const destPath = path.join(dest, file.name);
    if (file.isDirectory()) {
      copyFolderSync(srcPath, destPath);
    } else if (!Exclude.Files.includes(file.name) && !Exclude.Extensions.includes(path.extname(file.name))) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
