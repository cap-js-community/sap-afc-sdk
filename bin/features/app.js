/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");

const config = require("../config.json");
const { adjustJSON, adjustYAMLAllDocument } = require("../common/util");

const Exclude = {
  Extensions: [".cds"],
  Files: ["ui5-afc-sdk.js"],
  Tasks: ["ui5-afc-sdk"],
};

const Files = ["appconfig/fioriSandboxConfig.json", "launchpad.html"];

module.exports = () => {
  try {
    for (const app of config.apps) {
      const appPath = path.join(process.cwd(), "app", app);
      if (fs.existsSync(appPath)) {
        console.log(`Folder '${appPath}' already exists and is not overwritten.`);
        continue;
      }

      const srcPath = path.join(__dirname, "../../app", app);
      copyFolderSync(srcPath, appPath);

      const packageJson = require(path.join(process.cwd(), "package.json"));
      adjustJSON(path.join("app", app, "webapp/manifest.json"), (json) => {
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

      adjustYAMLAllDocument(path.join("app", app, "ui5.yaml"), (yaml) => {
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

      console.log(`Folder '${appPath}' written.`);
    }

    for (const file of Files) {
      const filePath = path.join(process.cwd(), "app", file);
      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.cpSync(path.join(__dirname, "../../app", file), filePath);
        console.log(`File '${filePath}' written.`);
      } else {
        console.log(`File '${filePath}' already exists and is not overwritten.`);
      }
    }
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
