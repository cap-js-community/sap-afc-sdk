"use strict";

const core = require("@actions/core");
const exec = require("@actions/exec");
const tc = require("@actions/tool-cache");

/*
    remember to run 'npm run package:cf' after changing this file to recreate the packed version 'index.js'
*/
const SUPPORTED_VERSIONS = ["7", "8"];

async function main() {
  try {
    // get input
    const api = core.getInput("api");
    const org = core.getInput("org", { required: true });
    const space = core.getInput("space", { required: true });
    const version = core.getInput("cf-version");

    if (!SUPPORTED_VERSIONS.includes(version)) {
      throw new Error(`CF CLI version ${version} not supported. Use one of ${SUPPORTED_VERSIONS}`);
    }

    let cachedPath = tc.find("cf-cli", version);
    if (cachedPath) {
      core.info(`Found CF CLI version ${version} in tool cache`);
    } else {
      core.startGroup("Downloading CF CLI package...");

      const downloadUrl = `https://packages.cloudfoundry.org/stable?release=linux64-binary&version=v${version}&source=github`;
      core.info(`Getting ${version} from ${downloadUrl}`);
      const downloadPath = await tc.downloadTool(downloadUrl);
      core.info(`CF CLI version ${version} was downloaded`);

      core.info("Extracting CF CLI package...");
      const cfToolExtractedPath = await tc.extractTar(downloadPath);

      core.info("Adding to cache...");
      cachedPath = await tc.cacheDir(cfToolExtractedPath, "cf-cli", version);

      core.endGroup();
    }

    core.info(`Installing CF CLI in ${cachedPath}`);
    core.addPath(cachedPath);

    await exec.exec("cf", ["install-plugin", "multiapps", "-f"]);
    await exec.exec("cf", ["-v"]);
    await exec.exec("cf", ["api", api]);
    await exec.exec("cf", ["auth"]);
    await exec.exec("cf", ["target", "-o", org, "-s", space]);

    // mbt
    await exec.exec("npm", ["install", "mbt"]);

    core.info(`Done`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

(async () => await main())();
