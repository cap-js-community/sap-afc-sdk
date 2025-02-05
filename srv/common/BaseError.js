"use strict";

const cds = require("@sap/cds");
const VError = require("verror");
const util = require("util");

const UNEXPECTED_ERROR = "unexpectedError";

const Severity = {
  Error: "E",
  Warning: "W",
  Information: "I",
  Success: "S",
};

class BaseError extends VError {
  constructor(code, { args, httpStatus, target, severity, cause, info = {} } = {}) {
    code ??= UNEXPECTED_ERROR;
    super(
      {
        name: code,
        ...(cause && { cause: toError(cause) }),
        info,
      },
      code,
    );
    this.code = code;
    this.args = code !== UNEXPECTED_ERROR ? (args ?? []) : [cds.context.id];
    this.status = httpStatus;
    this.target = target;
    this.severity = severity ?? Severity.Error;
  }

  get info() {
    return VError.info(this);
  }

  static unexpectedError() {
    return new BaseError(UNEXPECTED_ERROR, {
      httpStatus: 500,
    });
  }
}

const isError = (e) => e instanceof Error || Object.prototype.toString.call(e) === "[object Error]";

const toError = (e) => {
  if (isError(e)) {
    return e;
  }
  return new Error(util.inspect(e));
};

BaseError.Severity = Severity;

BaseError.isError = isError;
BaseError.toError = toError;

module.exports = BaseError;
