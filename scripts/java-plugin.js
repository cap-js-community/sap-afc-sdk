"use strict";

const path = require("path");
const fs = require("fs");
const shelljs = require("shelljs");
const { adjustXML } = require("../bin/common/util");

const BasePath = "com/github/cap/js/community/sapafcsdk";

const Plugins = {
  file: "sap-afc-sdk",
  extension: "jar",
  folder: "java/plugin",
  source: "java/plugin/target",
  target: "bin/builds",
};

(() => {
  const check = ["--check", "-c"].includes(process.argv?.[2]);
  packagePlugin(check);
})();

function packagePlugin(check) {
  const packagePath = path.join(process.cwd(), "package.json");
  const version = require(packagePath).version;
  const sourceFolder = path.join(process.cwd(), Plugins.source);
  const sourcePath = path.join(sourceFolder, `${Plugins.file}-${version}.${Plugins.extension}`);
  const targetFolder = path.join(process.cwd(), Plugins.target);
  const targetPath = path.join(targetFolder, `${Plugins.file}-${version}.${Plugins.extension}`);

  shelljs.pushd(Plugins.folder);

  // Prepare
  shelljs.rm("-rf", "src");
  // - Java
  shelljs.mkdir("-p", `src/main/java/${BasePath}`);
  shelljs.cp("-R", `../project/srv/src/main/java/${BasePath}`, `src/main/java/${BasePath}/../`);
  shelljs.cp("-R", `../project/srv/src/gen/java/${BasePath}/model`, `src/main/java/${BasePath}`);
  shelljs.rm("-f", `src/main/java/${BasePath}/Application.java`);
  // - Resources
  shelljs.mkdir("-p", "src/main/resources");
  shelljs.cp("-R", "../project/srv/src/main/resources/META-INF", "src/main/resources");
  shelljs.mkdir("-p", "src/main/resources/i18n");
  shelljs.cp("-R", "../project/srv/src/main/resources/i18n/messages_*.properties", "src/main/resources/i18n");
  shelljs.mkdir("-p", "src/main/resources/scheduling/i18n");
  shelljs.cp(
    "-R",
    "../project/srv/src/main/resources/scheduling/i18n/messages_*.properties",
    "src/main/resources/scheduling/i18n",
  );
  shelljs.rm("-rf", "../../app/**/node_modules");
  shelljs.cp("-R", "../../app", "src/main/resources");
  shelljs.cp("-R", "../../openapi", "src/main/resources");
  shelljs.cp("-R", "../project/srv/src/main/resources/log.pdf", "src/main/resources");
  shelljs.cp("-R", "../project/srv/src/gen/resources/META-INF/cds4j-codegen", "src/main/resources/META-INF");

  // POM.xml
  adjustXML("pom.xml", (xml) => {
    xml.project.properties[0].revision = version;
    return xml;
  });

  // Build
  shelljs.exec("mvn package");

  // Check
  let success = true;
  if (fs.existsSync(targetPath) && compareJars(sourcePath, targetPath)) {
    // eslint-disable-next-line no-console
    console.log(`Java plugin at ${targetPath} is up-to-date.`);
  } else {
    if (check) {
      // eslint-disable-next-line no-console
      console.log(`Java plugin at ${targetPath} is not up-to-date.`);
      success = false;
    } else {
      // Remove previous versions
      shelljs.rm("-f", path.join(targetFolder, `${Plugins.file}-*.${Plugins.extension}`));
      // Copy
      shelljs.cp(sourcePath, targetPath);
      // eslint-disable-next-line no-console
      console.log(`Java plugin at ${targetPath} was updated.`);
    }
  }

  // Clean-up
  shelljs.rm("-rf", "src");
  shelljs.rm("-rf", "target");
  shelljs.rm("-r", ".flattened-pom.xml");

  shelljs.popd();

  if (!success) {
    // eslint-disable-next-line n/no-process-exit
    process.exit(-1);
  }
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
