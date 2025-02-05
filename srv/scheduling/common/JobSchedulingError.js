"use strict";

const BaseError = require("../../common/BaseError");

class JobSchedulingError extends BaseError {
  static jobNotFound(ID) {
    return new JobSchedulingError("jobNotFound", {
      args: [ID],
      httpStatus: 404,
    });
  }

  static statusValueMissing() {
    return new JobSchedulingError("statusValueMissing", {
      args: [],
      httpStatus: 400,
    });
  }

  static invalidJobStatus(status) {
    return new JobSchedulingError("invalidJobStatus", {
      args: [status],
      httpStatus: 400,
    });
  }

  static statusTransitionNotAllowed(statusBefore, statusAfter) {
    return new JobSchedulingError("statusTransitionNotAllowed", {
      args: [statusBefore, statusAfter],
      httpStatus: 400,
    });
  }

  static invalidOptionSkip(value) {
    return new JobSchedulingError("invalidOptionSkip", {
      args: [value],
      httpStatus: 400,
    });
  }

  static invalidOptionTop(value) {
    return new JobSchedulingError("invalidOptionTop", {
      args: [value],
      httpStatus: 400,
    });
  }

  static jobDefinitionNotFound(name) {
    return new JobSchedulingError("jobDefinitionNotFound", {
      args: [name],
      httpStatus: 400,
    });
  }

  static referenceIDMissing() {
    return new JobSchedulingError("referenceIDMissing", {
      args: [],
      httpStatus: 400,
    });
  }

  static jobParameterNameMissing() {
    return new JobSchedulingError("jobParameterNameMissing", {
      args: [],
      httpStatus: 400,
    });
  }

  static jobParameterNotKnown(name) {
    return new JobSchedulingError("jobParameterNotKnown", {
      args: [name],
      httpStatus: 400,
    });
  }

  static jobParameterRequired(name) {
    return new JobSchedulingError("jobParameterRequired", {
      args: [name],
      httpStatus: 400,
    });
  }

  static jobParameterReadOnly(name) {
    return new JobSchedulingError("jobParameterReadOnly", {
      args: [name],
      httpStatus: 400,
    });
  }

  static jobParameterValueRequired(name) {
    return new JobSchedulingError("jobParameterValueRequired", {
      args: [name],
      httpStatus: 400,
    });
  }

  static jobParameterValueInvalidType(value, name, type) {
    return new JobSchedulingError("jobParameterValueInvalidType", {
      args: [value, name, type],
      httpStatus: 400,
    });
  }

  static jobCannotBeCanceled(status) {
    return new JobSchedulingError("jobCannotBeCanceled", {
      args: [status],
      httpStatus: 400,
    });
  }
}

module.exports = JobSchedulingError;
