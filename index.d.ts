export namespace sapafcsdk.scheduling {
  export type JobStatusCode =
    | "requested"
    | "running"
    | "completed"
    | "completedWithWarning"
    | "completedWithError"
    | "failed"
    | "cancelRequested"
    | "canceled";

  export type ParameterTypeCode = "readOnlyValue" | "writableValue" | "mapping";

  export type DataTypeCode = "string" | "number" | "date" | "datetime" | "boolean";

  export type MappingTypeCode =
    | "accountingPrinciple"
    | "companyCode"
    | "plant"
    | "controllingArea"
    | "fiscalPeriod"
    | "fiscalYearPeriod"
    | "fiscalYear"
    | "keyDate"
    | "chartOfAccounts"
    | "fiscalYearVariant"
    | "ledger"
    | "testRun"
    | "postingPeriodVariant"
    | "processingUser"
    | "interestedUser"
    | "userResponsible"
    | "processingUserEmail"
    | "interestedUserEmail"
    | "userResponsibleEmail"
    | "executionID"
    | "customField1"
    | "customField2"
    | "customField3"
    | "taskListID"
    | "taskListDescription"
    | "taskID"
    | "taskDescription";

  export type ResultTypeCode = "link" | "data" | "message";
  export type MessageSeverityCode = "success" | "info" | "warning" | "error";
  export type MessageSeverityNumericCode = 1 | 2 | 3 | 4;

  export interface JobDefinition {
    name: string;
    description?: string;
    longDescription?: string;
    version: string;
    vendorName?: string;
    vendorSystem?: string;
    parameters?: JobParameterDefinition[];
    texts?: JobDefinitionTexts[];
    supportsStartDateTime?: boolean;
    supportsTestRun?: boolean;
    supportsErrorOnlyRun?: boolean;
  }

  export interface JobParameterDefinition {
    job_name: string;
    name: string;
    description?: string;
    type_code?: ParameterTypeCode;
    dataType_code?: DataTypeCode;
    mappingType_code?: MappingTypeCode;
    value?: string | number | boolean;
    enumValues?: string[];
    required?: boolean;
    texts?: JobParameterDefinitionTexts[];
  }

  export interface JobDefinitionTexts {
    locale: string;
    name: string;
    description?: string;
    longDescription?: string;
  }

  export interface JobParameterDefinitionTexts {
    locale: string;
    job_name: string;
    name: string;
    description?: string;
  }

  export interface Job {
    ID: string;
    referenceID: string;
    definition_name: string;
    version: string;
    status_code: JobStatusCode;
    link?: string;
    startDateTime?: string;
    testRun?: boolean;
    errorOnlyRun?: boolean;
    parameters?: JobParameter[];
    results?: JobResult[];
    createdAt?: string;
    createdBy?: string;
    modifiedAt?: string;
    modifiedBy?: string;
  }

  export interface JobParameter {
    ID: string;
    job_ID: string;
    definition_job_name: string;
    definition_name: string;
    value?: string | number | boolean;
  }

  export interface JobResult {
    ID: string;
    job_ID: string;
    name: string;
    type_code: ResultTypeCode;
    link?: string;
    mimeType?: string;
    filename?: string;
    data?: string | Uint8Array;
    messages?: JobResultMessage[];
  }

  export interface JobResultMessage {
    ID: string;
    result_ID: string;
    code: string;
    values?: string[];
    text?: string;
    severity_code: MessageSeverityCode;
    createdAt: string;
    texts?: JobResultMessageTexts[];
  }

  export interface JobResultMessageTexts {
    locale: string;
    ID: string;
    text?: string;
  }

  export interface JobStatus {
    code: JobStatusCode;
    name?: string;
    descr?: string;
    texts?: JobStatusTexts[];
  }

  export interface JobStatusTexts {
    locale: string;
    code: JobStatusCode;
    name?: string;
    descr?: string;
  }

  export interface ParameterType {
    code: ParameterTypeCode;
    name?: string;
    descr?: string;
    texts?: ParameterTypeTexts[];
  }

  export interface ParameterTypeTexts {
    locale: string;
    code: ParameterTypeCode;
    name?: string;
    descr?: string;
  }

  export interface DataType {
    code: DataTypeCode;
    name?: string;
    descr?: string;
    texts?: DataTypeTexts[];
  }

  export interface DataTypeTexts {
    locale: string;
    code: DataTypeCode;
    name?: string;
    descr?: string;
  }

  export interface MappingType {
    code: MappingTypeCode;
    name?: string;
    descr?: string;
    texts?: MappingTypeTexts[];
  }

  export interface MappingTypeTexts {
    locale: string;
    code: MappingTypeCode;
    name?: string;
    descr?: string;
  }

  export interface ResultType {
    code: ResultTypeCode;
    name?: string;
    descr?: string;
    texts?: ResultTypeTexts[];
  }

  export interface ResultTypeTexts {
    locale: string;
    code: ResultTypeCode;
    name?: string;
    descr?: string;
  }

  export interface MessageSeverity {
    code: MessageSeverityCode;
    numericCode: MessageSeverityNumericCode;
    name?: string;
    descr?: string;
    texts?: MessageSeverityTexts[];
  }

  export interface MessageSeverityTexts {
    locale: string;
    code: MessageSeverityCode;
    name?: string;
    descr?: string;
  }

  export namespace ProcessingService {
    export const STATUS_TRANSITIONS: {
      [K in JobStatusCode]: readonly JobStatusCode[];
    };

    export type ResultTypeCode = sapafcsdk.scheduling.ResultTypeCode;
    export type MessageSeverityCode = sapafcsdk.scheduling.MessageSeverityCode;
    export type JobStatusCode = sapafcsdk.scheduling.JobStatusCode;
    export type Locale = string;

    export interface JobResult {
      name: string;
      type: ResultTypeCode;
      link?: string;
      mimeType?: string;
      filename?: string;
      data?: string;
      messages?: JobResultMessage[];
    }

    export interface JobResultMessage {
      code: string;
      values?: string[];
      text?: string;
      severity: MessageSeverityCode;
      createdAt?: string;
      texts?: JobResultMessageText[];
    }

    export interface JobResultMessageText {
      locale: Locale;
      text: string;
    }

    export interface Request {
      job: sapafcsdk.scheduling.Job;
      [key: string]: unknown;
    }
  }

  export interface ProcessingService {
    processJobUpdate(
      req: ProcessingService.Request,
      job: Job,
      status: JobStatusCode,
      results?: JobResult[],
    ): Promise<void>;
  }

  export interface ProviderService {
    downloadData(req: object, ID: string): Promise<void>;
  }

  export interface MonitoringService {}

  export interface WebsocketService {}
}

export const JobStatus: {
  requested: "requested";
  running: "running";
  completed: "completed";
  completedWithWarning: "completedWithWarning";
  completedWithError: "completedWithError";
  failed: "failed";
  cancelRequested: "cancelRequested";
  canceled: "canceled";
};

export const ParameterType: {
  readOnlyValue: "readOnlyValue";
  writableValue: "writableValue";
  mapping: "mapping";
};

export const DataType: {
  string: "string";
  number: "number";
  date: "date";
  datetime: "datetime";
  boolean: "boolean";
};

export const MappingType: {
  accountingPrinciple: "accountingPrinciple";
  companyCode: "companyCode";
  plant: "plant";
  controllingArea: "controllingArea";
  fiscalPeriod: "fiscalPeriod";
  fiscalYearPeriod: "fiscalYearPeriod";
  fiscalYear: "fiscalYear";
  keyDate: "keyDate";
  chartOfAccounts: "chartOfAccounts";
  fiscalYearVariant: "fiscalYearVariant";
  ledger: "ledger";
  testRun: "testRun";
  postingPeriodVariant: "postingPeriodVariant";
  processingUser: "processingUser";
  interestedUser: "interestedUser";
  userResponsible: "userResponsible";
  processingUserEmail: "processingUserEmail";
  interestedUserEmail: "interestedUserEmail";
  userResponsibleEmail: "userResponsibleEmail";
  executionID: "executionID";
  customField1: "customField1";
  customField2: "customField2";
  customField3: "customField3";
  taskListID: "taskListID";
  taskListDescription: "taskListDescription";
  taskID: "taskID";
  taskDescription: "taskDescription";
}

export const ResultType: {
  link: "link";
  data: "data";
  message: "message";
};

export const MessageSeverity: {
  success: "success";
  info: "info";
  warning: "warning";
  error: "error";
};

export const MessageSeverityNumeric: {
  1: 1;
  2: 2;
  3: 3;
  4: 4;
};

export namespace BaseError {
  export const Severity: {
    Error: "E";
    Warning: "W";
    Information: "I";
    Success: "S";
  };
}

export class BaseError extends Error {
  code: string;
  args: any[];
  status?: number;
  target?: string;
  severity: typeof BaseError.Severity;
  info: Record<string, any>;
  cause?: Error;
}

export class JobSchedulingError extends BaseError {
  static accessOnlyViaParent(): JobSchedulingError;
  static accessOnlyByKey(): JobSchedulingError;
  static jobNotFound(ID: string): JobSchedulingError;
  static statusValueMissing(): JobSchedulingError;
  static invalidJobStatus(status: string): JobSchedulingError;
  static statusTransitionNotAllowed(statusBefore: string, statusAfter: string): JobSchedulingError;
  static invalidOption(value: any, option: string): JobSchedulingError;
  static jobDefinitionNotFound(name: string): JobSchedulingError;
  static referenceIDMissing(): JobSchedulingError;
  static referenceIDNoUUID(referenceID: string): JobSchedulingError;
  static jobResultsReadOnly(): JobSchedulingError;
  static startDateTimeNotSupported(name: string): JobSchedulingError;
  static errorOnlyRunNotSupported(name: string): JobSchedulingError;
  static jobParameterNameMissing(): JobSchedulingError;
  static jobParameterNotKnown(name: string): JobSchedulingError;
  static jobParameterRequired(name: string): JobSchedulingError;
  static jobParameterReadOnly(name: string): JobSchedulingError;
  static jobParameterValueRequired(name: string): JobSchedulingError;
  static jobParameterValueInvalidType(value: any, name: string, type: string): JobSchedulingError;
  static jobParameterValueInvalidEnum(value: any, name: string): JobSchedulingError;
  static jobCannotBeCanceled(status: string): JobSchedulingError;
  static jobResultNotFound(ID: string): JobSchedulingError;
  static resultNameMissing(): JobSchedulingError;
  static resultTypeMissing(): JobSchedulingError;
  static invalidResultType(resultType: string): JobSchedulingError;
  static linkMissing(resultType: string): JobSchedulingError;
  static mimeTypeMissing(resultType: string): JobSchedulingError;
  static filenameMissing(resultType: string): JobSchedulingError;
  static dataMissing(resultType: string): JobSchedulingError;
  static messagesMissing(resultType: string): JobSchedulingError;
  static codeMissing(): JobSchedulingError;
  static textMissing(): JobSchedulingError;
  static localeMissing(): JobSchedulingError;
  static invalidLocale(locale: string): JobSchedulingError;
  static severityMissing(): JobSchedulingError;
  static invalidMessageSeverity(messageSeverity: string): JobSchedulingError;
  static linkNotAllowed(resultType: string): JobSchedulingError;
  static mimeTypeNotAllowed(resultType: string): JobSchedulingError;
  static filenameNotAllowed(resultType: string): JobSchedulingError;
  static dataNotAllowed(resultType: string): JobSchedulingError;
  static messagesNotAllowed(resultType: string): JobSchedulingError;
}

export interface BaseService {
  init(): Promise<void>;
}

export interface BaseApplicationService extends BaseService {
  handle(req): Promise<void>;
}

export interface SchedulingProviderService extends  BaseApplicationService {
  createJob(req, job: sapafcsdk.scheduling.Job): Promise<void>;
  updateJob(req, job: sapafcsdk.scheduling.Job, data: sapafcsdk.scheduling.Job): Promise<void>;
  downloadData(req, ID: string): Promise<void>;
}

export interface SchedulingProviderService extends  BaseApplicationService {
  processJobUpdate(req, job: sapafcsdk.scheduling.Job, status: sapafcsdk.scheduling.JobStatusCode, results?: sapafcsdk.scheduling.JobResult[]): Promise<void>;
  checkStatusTransition(req, job: sapafcsdk.scheduling.Job, statusBefore: sapafcsdk.scheduling.JobStatusCode, statusAfter: sapafcsdk.scheduling.JobStatusCode): Promise<void>;
  checkJobResults(req, job: sapafcsdk.scheduling.Job, results: sapafcsdk.scheduling.JobResult[]): Promise<void>;
  mockJobProcessing(req, job: sapafcsdk.scheduling.Job, config: object): Promise<void>;
  mockJobSync(req): Promise<void>;
  mockNotification(req): Promise<void>;
}

export interface SchedulingMonitoringService extends  BaseApplicationService {
}

export interface SchedulingWebsocketService extends  BaseApplicationService {
}
