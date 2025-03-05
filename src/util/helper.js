"use strict";

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

module.exports = {
  mergeDeep,
  isObject,
  toObject,
  wildcard,
};
