"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const shelljs = require("shelljs");

const Plugins = {
  file: "sap-afc-sdk-1.0.0.jar",
  folder: "java/plugin",
  source: "java/plugin/target",
  target: "bin/lib",
};

(() => {
  const check = ["--check", "-c"].includes(process.argv?.[2]);
  packagePlugin(check);
})();

function packagePlugin(check) {
  let hashTarget = "";
  const sourcePath = path.join(process.cwd(), Plugins.source, Plugins.file);
  const targetPath = path.join(process.cwd(), Plugins.target, Plugins.file);
  if (check && fs.existsSync(targetPath)) {
    hashTarget = hashFile(targetPath);
  }
  shelljs.pushd(Plugins.folder);
  shelljs.exec("mvn package");
  shelljs.popd();
  if (check) {
    const hashSource = hashFile(sourcePath);
    if (hashSource !== hashTarget) {
      // eslint-disable-next-line no-console
      console.log(`Java maven plugin at ${targetPath} is not up-to-date.`);
      // eslint-disable-next-line n/no-process-exit
      process.exit(-1);
    }
  } else {
    shelljs.cp(sourcePath, targetPath);
  }
}

function hashFile(filePath, algorithm = "sha256") {
  const fileBuffer = fs.readFileSync(filePath);
  const hash = crypto.createHash(algorithm);
  hash.update(fileBuffer);
  return hash.digest("hex");
}
