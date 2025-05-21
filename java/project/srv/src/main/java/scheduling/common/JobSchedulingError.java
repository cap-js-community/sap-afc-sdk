package scheduling.common;

import com.sap.cds.services.ErrorStatus;
import com.sap.cds.services.ErrorStatuses;
import com.sap.cds.services.ServiceException;

public class JobSchedulingError extends ServiceException {

    public JobSchedulingError(ErrorStatus errorStatus, String messageOrKey, Object... args) {
        super(errorStatus, messageOrKey, args);
    }

    public static JobSchedulingError accessOnlyViaParent() {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "accessOnlyViaParent");
    }

    public static JobSchedulingError jobNotFound(String ID) {
        return new JobSchedulingError(ErrorStatuses.NOT_FOUND, "jobNotFound", ID);
    }

    public static JobSchedulingError statusValueMissing() {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "statusValueMissing");
    }

    public static JobSchedulingError invalidJobStatus(String status) {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "invalidJobStatus", status);
    }

    public static JobSchedulingError statusTransitionNotAllowed(String statusBefore, String statusAfter) {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "statusTransitionNotAllowed", statusBefore, statusAfter);
    }

    public static JobSchedulingError invalidOption(Object value, String option) {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "invalidOption", value, option);
    }

    public static JobSchedulingError jobDefinitionNotFound(String name) {
        return new JobSchedulingError(ErrorStatuses.NOT_FOUND, "jobDefinitionNotFound", name);
    }

    public static JobSchedulingError referenceIDMissing() {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "referenceIDMissing");
    }

    public static JobSchedulingError referenceIDNoUUID(String referenceID) {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "referenceIDNoUUID", referenceID);
    }

    public static JobSchedulingError jobResultsReadOnly() {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "jobResultsReadOnly");
    }

    public static JobSchedulingError startDateTimeNotSupported(String name) {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "startDateTimeNotSupported", name);
    }

    public static JobSchedulingError jobParameterNameMissing() {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "jobParameterNameMissing");
    }

    public static JobSchedulingError jobParameterNotKnown(String name) {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "jobParameterNotKnown", name);
    }

    public static JobSchedulingError jobParameterRequired(String name) {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "jobParameterRequired", name);
    }

    public static JobSchedulingError jobParameterReadOnly(String name) {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "jobParameterReadOnly", name);
    }

    public static JobSchedulingError jobParameterValueRequired(String name) {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "jobParameterValueRequired", name);
    }

    public static JobSchedulingError jobParameterValueInvalidType(Object value, String name, String type) {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "jobParameterValueInvalidType", value, name, type);
    }

    public static JobSchedulingError jobCannotBeCanceled(String status) {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "jobCannotBeCanceled", status);
    }

    public static JobSchedulingError jobResultNotFound(String ID) {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "jobResultNotFound", ID);
    }

    public static JobSchedulingError resultNameMissing() {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "resultNameMissing");
    }

    public static JobSchedulingError resultTypeMissing() {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "resultTypeMissing");
    }

    public static JobSchedulingError invalidResultType(String resultType) {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "invalidResultType", resultType);
    }

    public static JobSchedulingError linkMissing(String resultType) {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "linkMissing", resultType);
    }

    public static JobSchedulingError mimeTypeMissing(String resultType) {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "mimeTypeMissing", resultType);
    }

    public static JobSchedulingError filenameMissing(String resultType) {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "filenameMissing", resultType);
    }

    public static JobSchedulingError dataMissing(String resultType) {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "dataMissing", resultType);
    }

    public static JobSchedulingError messagesMissing(String resultType) {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "messagesMissing", resultType);
    }

    public static JobSchedulingError codeMissing() {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "codeMissing");
    }

    public static JobSchedulingError textMissing() {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "textMissing");
    }

    public static JobSchedulingError localeMissing() {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "localeMissing");
    }

    public static JobSchedulingError invalidLocale(String locale) {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "invalidLocale", locale);
    }

    public static JobSchedulingError severityMissing() {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "severityMissing");
    }

    public static JobSchedulingError invalidMessageSeverity(String messageSeverity) {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "invalidMessageSeverity", messageSeverity);
    }

    public static JobSchedulingError linkNotAllowed(String resultType) {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "linkNotAllowed", resultType);
    }

    public static JobSchedulingError mimeTypeNotAllowed(String resultType) {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "mimeTypeNotAllowed", resultType);
    }

    public static JobSchedulingError filenameNotAllowed(String resultType) {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "filenameNotAllowed", resultType);
    }

    public static JobSchedulingError dataNotAllowed(String resultType) {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "dataNotAllowed", resultType);
    }

    public static JobSchedulingError messagesNotAllowed(String resultType) {
        return new JobSchedulingError(ErrorStatuses.BAD_REQUEST, "messagesNotAllowed", resultType);
    }

}
