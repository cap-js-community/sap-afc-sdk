"use strict";

const cds = require("@sap/cds");

const { merge } = require("./helper");

module.exports = merge([require("../../config.json"), cds.env.requires?.["sap-afc-sdk"]?.config ?? {}]);
