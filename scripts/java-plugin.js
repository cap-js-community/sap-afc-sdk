"use strict";

const path = require("path");
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
  const sourcePath = path.join(process.cwd(), Plugins.source, Plugins.file);
  const targetPath = path.join(process.cwd(), Plugins.target, Plugins.file);

  shelljs.pushd(Plugins.folder);

  // Prepare
  shelljs.rm("-rf", "src");
  // - Java
  shelljs.mkdir("-p", "src/main/java");
  shelljs.cp("-R", "../project/srv/src/gen/java/cds", "src/main/java");
  shelljs.cp("-R", "../project/srv/src/main/java/com", "src/main/java");
  shelljs.rm("-f", "src/main/java/com/github/cap/js/community/sapafcsdk/Application.java");
  // - Resources
  shelljs.mkdir("-p", "src/main/resources");
  shelljs.cp("-R", "../project/srv/src/main/resources/META-INF", "src/main/resources");
  shelljs.mkdir("-p", "src/main/resources/i18n");
  shelljs.cp("-R", "../project/srv/src/main/resources/i18n/messages_*.properties", "src/main/resources/i18n");
  shelljs.mkdir("-p", "src/main/resources/scheduling/i18n");
  shelljs.cp("-R", "../project/srv/src/main/resources/scheduling/i18n/messages_*.properties", "src/main/resources/scheduling/i18n");
  shelljs.cp("-R", "../project/srv/src/main/resources/log.pdf", "src/main/resources");

  // Build
  shelljs.exec("mvn package");

  if (check) {
    // Check
    if (!compareJars(sourcePath, targetPath)) {
      // eslint-disable-next-line no-console
      console.log(`Java plugin at ${targetPath} is not up-to-date.`);
      // eslint-disable-next-line n/no-process-exit
      process.exit(-1);
    }
  } else {
    // Copy
    shelljs.cp(sourcePath, targetPath);
  }

  // Clean-up
  shelljs.rm("-rf", "src");
  shelljs.rm("-rf", "target");
  shelljs.rm("-r", ".flattened-pom.xml");

  shelljs.popd();
}

function compareJars(sourcePath, targetPath) {
  let result = true;
  shelljs.mkdir("-p", "temp");
  shelljs.pushd("temp");
  shelljs.exec(`unzip -d source ${sourcePath}`, { silent: true });
  shelljs.exec(`unzip -d target ${targetPath}`, { silent: true });
  if (shelljs.exec("diff -r source target").code !== 0) {
    result = false;
  }
  shelljs.popd();
  shelljs.rm("-rf", "temp");
  return result;
}
