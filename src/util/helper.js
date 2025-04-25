"use strict";

const cds = require("@sap/cds");

function merge(objects, { array = "replace", mergeKey = "id" } = {}) {
  const isObject = (obj) => obj && typeof obj === "object";
  return objects.reduce((result, object) => {
    Object.keys(object).forEach((key) => {
      const currentValue = result[key];
      const objectValue = object[key];
      if (Array.isArray(currentValue) && Array.isArray(objectValue)) {
        if (!array || array === "replace") {
          result[key] = objectValue;
        } else if (array === "concat") {
          result[key] = currentValue.concat(...objectValue);
        } else if (array === "merge" && objectValue.length > 0 && objectValue[0][mergeKey] !== undefined) {
          for (let i = 0; i < objectValue.length; i++) {
            const objectEntry = objectValue[i];
            const currentEntry = currentValue.find((entry) => entry[mergeKey] === objectEntry[mergeKey]);
            if (currentEntry) {
              objectValue[i] = merge([currentEntry, objectEntry], { array, mergeKey });
            } else {
              currentValue.push(objectEntry);
            }
          }
        } else {
          result[key] = objectValue;
        }
      } else if (isObject(currentValue) && isObject(objectValue)) {
        result[key] = merge([currentValue, objectValue], { array, mergeKey });
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
  merge,
  isObject,
  toObject,
  wildcard,
  toMap,
  unique,
  labelLocales,
  messageLocales,
};
