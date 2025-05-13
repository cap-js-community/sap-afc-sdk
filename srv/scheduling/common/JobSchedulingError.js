"use strict";

const BaseError = require("../../common/BaseError");

class JobSchedulingError extends BaseError {
  static accessOnlyViaParent() {
    return new JobSchedulingError("accessOnlyViaParent", {
      args: [],
      httpStatus: 400,
    });
  }

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

  static invalidOption(value, option) {
    return new JobSchedulingError("invalidOption", {
      args: [value, option],
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

  static referenceIDNoUUID(referenceID) {
    return new JobSchedulingError("referenceIDNoUUID", {
      args: [referenceID],
      httpStatus: 400,
    });
  }

  static jobResultsReadOnly() {
    return new JobSchedulingError("jobResultsReadOnly", {
      args: [],
      httpStatus: 400,
    });
  }

  static startDateTimeNotSupported(name) {
    return new JobSchedulingError("startDateTimeNotSupported", {
      args: [name],
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

  static jobResultNotFound(ID) {
    return new JobSchedulingError("jobResultNotFound", {
      args: [ID],
      httpStatus: 404,
    });
  }

  static resultNameMissing() {
    return new JobSchedulingError("resultNameMissing", {
      args: [],
      httpStatus: 400,
    });
  }

  static resultTypeMissing() {
    return new JobSchedulingError("resultTypeMissing", {
      args: [],
      httpStatus: 400,
    });
  }

  static invalidResultType(resultType) {
    return new JobSchedulingError("invalidResultType", {
      args: [resultType],
      httpStatus: 400,
    });
  }

  static linkMissing(resultType) {
    return new JobSchedulingError("linkMissing", {
      args: [resultType],
      httpStatus: 400,
    });
  }

  static mimeTypeMissing(resultType) {
    return new JobSchedulingError("mimeTypeMissing", {
      args: [resultType],
      httpStatus: 400,
    });
  }

  static filenameMissing(resultType) {
    return new JobSchedulingError("filenameMissing", {
      args: [resultType],
      httpStatus: 400,
    });
  }

  static dataMissing(resultType) {
    return new JobSchedulingError("dataMissing", {
      args: [resultType],
      httpStatus: 400,
    });
  }

  static messagesMissing(resultType) {
    return new JobSchedulingError("messagesMissing", {
      args: [resultType],
      httpStatus: 400,
    });
  }

  static codeMissing() {
    return new JobSchedulingError("codeMissing", {
      args: [],
      httpStatus: 400,
    });
  }

  static textMissing() {
    return new JobSchedulingError("textMissing", {
      args: [],
      httpStatus: 400,
    });
  }

  static localeMissing() {
    return new JobSchedulingError("localeMissing", {
      args: [],
      httpStatus: 400,
    });
  }

  static invalidLocale(locale) {
    return new JobSchedulingError("invalidLocale", {
      args: [locale],
      httpStatus: 400,
    });
  }

  static severityMissing() {
    return new JobSchedulingError("severityMissing", {
      args: [],
      httpStatus: 400,
    });
  }

  static invalidMessageSeverity(messageSeverity) {
    return new JobSchedulingError("invalidMessageSeverity", {
      args: [messageSeverity],
      httpStatus: 400,
    });
  }

  static linkNotAllowed(resultType) {
    return new JobSchedulingError("linkNotAllowed", {
      args: [resultType],
      httpStatus: 400,
    });
  }

  static mimeTypeNotAllowed(resultType) {
    return new JobSchedulingError("mimeTypeNotAllowed", {
      args: [resultType],
      httpStatus: 400,
    });
  }

  static filenameNotAllowed(resultType) {
    return new JobSchedulingError("filenameNotAllowed", {
      args: [resultType],
      httpStatus: 400,
    });
  }

  static dataNotAllowed(resultType) {
    return new JobSchedulingError("dataNotAllowed", {
      args: [resultType],
      httpStatus: 400,
    });
  }

  static messagesNotAllowed(resultType) {
    return new JobSchedulingError("messagesNotAllowed", {
      args: [resultType],
      httpStatus: 400,
    });
  }
}

module.exports = JobSchedulingError;
