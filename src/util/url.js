"use strict";

const cds = require("@sap/cds");

const config = require("./config");

const SERVER_SUFFIX = "srv";
const APPROUTER_SUFFIX = "approuter";

let _approuterUrl;
let _serverUrl;

function approuterDomain() {
  let url = approuterUrl();
  if (url?.startsWith("https://")) {
    url = url.substring(8);
  }
  return url;
}

function approuterUrl() {
  if (_approuterUrl) {
    return _approuterUrl;
  }
  if (cds.env.requires?.["sap-afc-sdk"]?.endpoints?.approuter) {
    return (_approuterUrl = cds.env.requires["sap-afc-sdk"].endpoints.approuter);
  }
  if (process.env.VCAP_APPLICATION) {
    return (_approuterUrl = serverUrl().replace(new RegExp(`(https:\\/\\/.*?)-${SERVER_SUFFIX}(.*)`), `$1$2`));
  } else {
    return (_approuterUrl = serverUrl().replace(
      new RegExp(`(https:\\/\\/.*?)-${SERVER_SUFFIX}(.*)`),
      `$1-${APPROUTER_SUFFIX}$2`,
    ));
  }
}

function approuterWildcardUrl() {
  return `*.${approuterDomain()}`;
}

function approuterTenantUrl(req) {
  if (cds.env.requires.multitenancy) {
    const subdomain = req.user?.authInfo?.getSubdomain?.();
    if (subdomain) {
      return `https://${subdomain}${cds.env.tenant_separator ?? "."}${approuterDomain()}`;
    }
  }
  return approuterUrl();
}

function approuterUrlRegExp() {
  let url = approuterDomain();
  url = url.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
  return RegExp(url + "$");
}

function launchpadUrl(req) {
  return `${approuterTenantUrl(req)}/${config.paths.launchpad}`;
}

function authorizationUrl() {
  return cds.env.requires?.auth?.credentials?.url ?? config.endpoints.authentication;
}

function serverUrl() {
  if (_serverUrl) {
    return _serverUrl;
  }
  if (cds.env.requires?.["sap-afc-sdk"]?.endpoints?.server) {
    return (_serverUrl = cds.env.requires["sap-afc-sdk"].endpoints.server);
  }
  if (process.env.VCAP_APPLICATION) {
    const url = JSON.parse(process.env.VCAP_APPLICATION).uris?.[0];
    if (url) {
      return (_serverUrl = `https://${url}`);
    }
  }
  return (_serverUrl = cds.server.url ?? `http://localhost:${process.env.PORT || cds.env.server?.port || 4004}`);
}

module.exports = {
  approuterUrl,
  approuterWildcardUrl,
  approuterTenantUrl,
  approuterUrlRegExp,
  launchpadUrl,
  authorizationUrl,
  serverUrl,
};
