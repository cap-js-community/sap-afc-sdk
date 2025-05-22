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

  // Prepare
  shelljs.rm("-rf", "src");
  // Java
  shelljs.mkdir("-p", "src/main/java");
  shelljs.cp("-R", "../project/srv/src/gen/java/cds", "src/main/java");
  shelljs.cp("-R", "../project/srv/src/main/java/com", "src/main/java");
  shelljs.rm("-f", "src/main/java/com/github/cap/js/community/sapafcsdk/Application.java");
  // Resources
  shelljs.mkdir("-p", "src/main/resources");
  shelljs.cp("-R", "../project/srv/src/main/resources/META-INF", "src/main/resources");
  shelljs.mkdir("-p", "src/main/resources/i18n");
  shelljs.cp("-R", "../project/srv/src/main/resources/i18n/messages_*.properties", "src/main/resources/i18n");
  shelljs.mkdir("-p", "src/main/resources/scheduling/i18n");
  shelljs.cp("-R", "../project/srv/src/main/resources/scheduling/i18n/messages_*.properties", "src/main/resources/scheduling/i18n");
  shelljs.cp("-R", "../project/srv/src/main/resources/log.pdf", "src/main/resources");

  // Build
  shelljs.exec("mvn package");

  // Clean-up
  shelljs.rm("-rf", "src");
  shelljs.rm("-rf", "target");
  shelljs.rm("-r", ".flattened-pom.xml");

  shelljs.popd();

  // Copy
  if (!check) {
    shelljs.cp(sourcePath, targetPath);
    return;
  }

  // Check
  const hashSource = hashFile(sourcePath);
  if (hashSource !== hashTarget) {
    // eslint-disable-next-line no-console
    console.log(`Java maven plugin at ${targetPath} is not up-to-date.`);
    // eslint-disable-next-line n/no-process-exit
    process.exit(-1);
  }
}

function hashFile(filePath, algorithm = "sha256") {
  const fileBuffer = fs.readFileSync(filePath);
  const hash = crypto.createHash(algorithm);
  hash.update(fileBuffer);
  return hash.digest("hex");
}
