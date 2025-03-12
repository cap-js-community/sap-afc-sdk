"use strict";

const cds = require("@sap/cds");

function mergeDeep(...objects) {
  const isObject = (obj) => obj && typeof obj === "object";
  return objects.reduce((result, object) => {
    Object.keys(object).forEach((key) => {
      const currentValue = result[key];
      const objectValue = object[key];
      if (Array.isArray(currentValue) && Array.isArray(objectValue)) {
        result[key] = currentValue.concat(...objectValue);
      } else if (isObject(currentValue) && isObject(objectValue)) {
        result[key] = mergeDeep(currentValue, objectValue);
      } else {
        result[key] = objectValue;
      }
    });
    return result;
  }, {});
}

function isObject(value) {
  return value !== undefined && value !== null && typeof value === "object";
}

function toObject(value) {
  return isObject(value) ? value : {};
}

function wildcard(value) {
  return value.replace(/^(\*?)(.*?)(\*?)$/, (match, starStart, token, starEnd) => {
    return `${starStart ? "%" : ""}${token}${starEnd ? "%" : ""}`;
  });
}

function toMap(array, key = "name") {
  return array.reduce((map, item) => {
    map[item[key]] = item;
    return map;
  }, {});
}

function unique(array) {
  return [...new Set(array)].sort();
}

function labelLocales() {
  cds.i18n.labels.at("");
  const locales = cds.i18n.labels.files.locales().filter((locale) => !!locale);
  locales.push(cds.env.i18n.default_language);
  return unique(locales);
}

function messageLocales() {
  cds.i18n.messages.at("");
  const locales = cds.i18n.messages.files.locales().filter((locale) => !!locale);
  locales.push(cds.env.i18n.default_language);
  return unique(locales);
}

module.exports = {
  mergeDeep,
  isObject,
  toObject,
  wildcard,
  toMap,
  unique,
  labelLocales,
  messageLocales,
};
