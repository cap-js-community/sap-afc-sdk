/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");
const shelljs = require("shelljs");
const config = require("../config.json");

const {
  adjustJSON,
  adjustYAMLAllDocument,
  adjustAllLines,
  copyFolderAdjusted,
  projectName,
  adjustYAMLDocument,
} = require("../common/util");
const { merge } = require("../../src/util/helper");

const Exclude = {
  extensions: [],
  files: ["ui5-afc-sdk.js"],
  tasks: ["ui5-afc-sdk"],
};
const Adjust = {
  extensions: [".js", ".json", ".xml", ".html"],
  files: [],
};
const Common = {
  extensions: [],
  files: ["appconfig/fioriSandboxConfig.json", "launchpad.html"],
};

module.exports = (options) => {
  try {
    const name = projectName();
    if (!name) {
      console.log(`CDS project not found`);
      return false;
    }

    const addedApps = [];
    for (const app of config.apps) {
      const appPath = path.join(process.cwd(), config.appRoot, app);
      if (fs.existsSync(appPath)) {
        console.log(`Folder '${appPath}' already exists and is not overwritten.`);
        continue;
      }

      addedApps.push(app);

      if (options.link) {
        const srcPath = path.join(__dirname, "../../", config.appRoot, app);
        fs.symlinkSync(srcPath, appPath, "dir");
        console.log(`Folder '${appPath}' linked.`);
      } else {
        const srcPath = path.join(__dirname, "../../", config.appRoot, app);
        copyFolderAdjusted(srcPath, appPath, Exclude, (content, srcPath) => {
          const ext = path.extname(srcPath);
          const fileName = path.basename(srcPath);
          if (Adjust.extensions.includes(ext) || Adjust.files.includes(fileName)) {
            return content.replace(/sapafcsdk/g, name);
          }
          return content;
        });

        adjustYAMLAllDocument(path.join(config.appRoot, app, "ui5.yaml"), (yaml) => {
          if (yaml.get("type") === "task" && Exclude.tasks.includes(yaml.getIn(["metadata", "name"]))) {
            return null;
          } else if (yaml.get("type") === "application") {
            const customTasks = [];
            for (const task of yaml.getIn(["builder", "customTasks"]).items) {
              if (!Exclude.tasks.includes(task.get("name"))) {
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

        console.log(`Folder '${appPath}' written.`);
      }
    }

    if (addedApps.length > 0) {
      const indexCdsPath = path.join(process.cwd(), "app/index.cds");
      if (!fs.existsSync(indexCdsPath)) {
        fs.writeFileSync(indexCdsPath, "", "utf8");
        console.log(`File '${indexCdsPath}' written.`);
      }
      const appUsings = addedApps.map((app) => `using from './${app}';`);
      adjustAllLines("app/index.cds", (lines) => {
        for (const appUsing of appUsings) {
          if (options.link) {
            lines = lines.filter((line) => !line.includes(appUsing));
          } else {
            if (!lines.includes(appUsing)) {
              lines.unshift(appUsing);
            }
          }
        }
        return lines;
      });

      adjustJSON("package.json", (json) => {
        json.sapux ??= [];
        for (const app of addedApps) {
          if (!json.sapux.includes(`app/${app}`)) {
            json.sapux.push(`app/${app}`);
          }
        }
      });

      for (const file of Common.files) {
        const filePath = path.join(process.cwd(), config.appRoot, file);
        if (!fs.existsSync(filePath)) {
          fs.mkdirSync(path.dirname(filePath), { recursive: true });
          fs.cpSync(path.join(__dirname, "../../", config.appRoot, file), filePath);
          console.log(`File '${filePath}' written.`);
        } else {
          console.log(`File '${filePath}' already exists and is not overwritten.`);
        }
      }

      // App Config
      const sandboxConfigFilePath = path.join(process.cwd(), config.appRoot, "appconfig/fioriSandboxConfig.json");
      const projectFioriSandboxConfig = require(sandboxConfigFilePath);
      const packageFioriSandboxConfig = require(
        path.join(__dirname, "../../", config.appRoot, "appconfig/fioriSandboxConfig.json"),
      );
      const mergedFioriSandboxConfig = merge([packageFioriSandboxConfig, projectFioriSandboxConfig], {
        array: "merge",
        mergeKey: "id",
      });
      const appConfigContent = JSON.stringify(mergedFioriSandboxConfig, null, 2).replace(/sapafcsdk/g, name);
      fs.writeFileSync(sandboxConfigFilePath, appConfigContent, "utf8");

      // cds add
      shelljs.exec(`cds add ${config.dependencies.app.join(",")} ${config.options.cds}`);

      // TODO: Remove (cap/issues/19545)
      adjustYAMLDocument("chart/Chart.yaml", (yaml) => {
        const dependencies = yaml.get("dependencies");
        if (dependencies && !dependencies.items.find((d) => d.get("alias") === "html5-apps-repo-runtime")) {
          dependencies.items.push({
            name: "service-instance",
            alias: "html5-apps-repo-runtime",
            version: ">0.0.0",
          });
        }
        return yaml;
      });
    }
  } catch (err) {
    console.error(err.message);
  }
};
