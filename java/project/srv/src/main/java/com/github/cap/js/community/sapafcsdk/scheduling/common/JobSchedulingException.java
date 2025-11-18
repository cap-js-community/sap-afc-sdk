package com.github.cap.js.community.sapafcsdk.scheduling.common;

import com.sap.cds.services.ErrorStatus;
import com.sap.cds.services.ErrorStatuses;
import com.sap.cds.services.ServiceException;

public class JobSchedulingException extends ServiceException {

  private final String code;

  public JobSchedulingException(ErrorStatus errorStatus, String messageOrKey, Object... args) {
    super(errorStatus, messageOrKey, args);
    this.code = messageOrKey;
  }

  public String getCode() {
    return code;
  }

  public static JobSchedulingException accessOnlyViaParent() {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "accessOnlyViaParent");
  }

  public static JobSchedulingException accessOnlyByKey() {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "accessOnlyByKey");
  }

  public static JobSchedulingException jobNotFound(String ID) {
    return new JobSchedulingException(ErrorStatuses.NOT_FOUND, "jobNotFound", ID);
  }

  public static JobSchedulingException statusValueMissing() {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "statusValueMissing");
  }

  public static JobSchedulingException invalidJobStatus(String status) {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "invalidJobStatus", status);
  }

  public static JobSchedulingException statusTransitionNotAllowed(String statusBefore, String statusAfter) {
    return new JobSchedulingException(
      ErrorStatuses.BAD_REQUEST,
      "statusTransitionNotAllowed",
      statusBefore,
      statusAfter
    );
  }

  public static JobSchedulingException invalidOption(Object value, String option) {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "invalidOption", value, option);
  }

  public static JobSchedulingException jobDefinitionNotFound(String name) {
    return new JobSchedulingException(ErrorStatuses.NOT_FOUND, "jobDefinitionNotFound", name);
  }

  public static JobSchedulingException referenceIDMissing() {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "referenceIDMissing");
  }

  public static JobSchedulingException referenceIDNoUUID(String referenceID) {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "referenceIDNoUUID", referenceID);
  }

  public static JobSchedulingException jobResultsReadOnly() {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "jobResultsReadOnly");
  }

  public static JobSchedulingException startDateTimeNotSupported(String name) {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "startDateTimeNotSupported", name);
  }

  public static JobSchedulingException errorOnlyRunNotSupported(String name) {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "errorOnlyRunNotSupported", name);
  }

  public static JobSchedulingException jobParameterNameMissing() {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "jobParameterNameMissing");
  }

  public static JobSchedulingException jobParameterNotKnown(String name) {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "jobParameterNotKnown", name);
  }

  public static JobSchedulingException jobParameterRequired(String name) {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "jobParameterRequired", name);
  }

  public static JobSchedulingException jobParameterReadOnly(String name) {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "jobParameterReadOnly", name);
  }

  public static JobSchedulingException jobParameterValueRequired(String name) {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "jobParameterValueRequired", name);
  }

  public static JobSchedulingException jobParameterValueInvalidType(Object value, String name, String type) {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "jobParameterValueInvalidType", value, name, type);
  }

  public static JobSchedulingException jobParameterValueInvalidEnum(Object value, String name) {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "jobParameterValueInvalidEnum", value, name);
  }

  public static JobSchedulingException jobCannotBeCanceled(String status) {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "jobCannotBeCanceled", status);
  }

  public static JobSchedulingException jobResultNotFound(String ID) {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "jobResultNotFound", ID);
  }

  public static JobSchedulingException resultNameMissing() {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "resultNameMissing");
  }

  public static JobSchedulingException resultTypeMissing() {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "resultTypeMissing");
  }

  public static JobSchedulingException invalidResultType(String resultType) {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "invalidResultType", resultType);
  }

  public static JobSchedulingException linkMissing(String resultType) {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "linkMissing", resultType);
  }

  public static JobSchedulingException mimeTypeMissing(String resultType) {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "mimeTypeMissing", resultType);
  }

  public static JobSchedulingException filenameMissing(String resultType) {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "filenameMissing", resultType);
  }

  public static JobSchedulingException dataMissing(String resultType) {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "dataMissing", resultType);
  }

  public static JobSchedulingException messagesMissing(String resultType) {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "messagesMissing", resultType);
  }

  public static JobSchedulingException codeMissing() {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "codeMissing");
  }

  public static JobSchedulingException textMissing() {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "textMissing");
  }

  public static JobSchedulingException localeMissing() {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "localeMissing");
  }

  public static JobSchedulingException invalidLocale(String locale) {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "invalidLocale", locale);
  }

  public static JobSchedulingException severityMissing() {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "severityMissing");
  }

  public static JobSchedulingException invalidMessageSeverity(String messageSeverity) {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "invalidMessageSeverity", messageSeverity);
  }

  public static JobSchedulingException linkNotAllowed(String resultType) {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "linkNotAllowed", resultType);
  }

  public static JobSchedulingException mimeTypeNotAllowed(String resultType) {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "mimeTypeNotAllowed", resultType);
  }

  public static JobSchedulingException filenameNotAllowed(String resultType) {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "filenameNotAllowed", resultType);
  }

  public static JobSchedulingException dataNotAllowed(String resultType) {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "dataNotAllowed", resultType);
  }

  public static JobSchedulingException messagesNotAllowed(String resultType) {
    return new JobSchedulingException(ErrorStatuses.BAD_REQUEST, "messagesNotAllowed", resultType);
  }
}
