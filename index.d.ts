export namespace scheduling {
  export type JobStatusCode =
    | 'requested'
    | 'running'
    | 'completed'
    | 'completedWithWarning'
    | 'completedWithError'
    | 'failed'
    | 'cancelRequested'
    | 'canceled';

  export type ParameterTypeCode =
    | 'readOnlyValue'
    | 'writableValue'
    | 'mapping';

  export type DataTypeCode =
    | 'string'
    | 'number'
    | 'datetime'
    | 'boolean';

  export type MappingTypeCode =
    | 'accountingPrinciple'
    | 'companyCode'
    | 'plant'
    | 'controllingArea'
    | 'fiscalPeriod'
    | 'fiscalYearPeriod'
    | 'fiscalYear'
    | 'keyDate'
    | 'chartOfAccounts'
    | 'fiscalYearVariant'
    | 'ledger'
    | 'testRun'
    | 'postingPeriodVariant'
    | 'processingUser'
    | 'interestedUser'
    | 'userResponsible'
    | 'processingUserEmail'
    | 'interestedUserEmail'
    | 'userResponsibleEmail'
    | 'executionID'
    | 'customField1'
    | 'customField2'
    | 'customField3'
    | 'taskListID'
    | 'taskListDescription'
    | 'taskID'
    | 'taskDescription';

  export type ResultTypeCode = 'link' | 'data' | 'message';
  export type MessageSeverityCode = 'success' | 'info' | 'warning' | 'error';
  export type MessageSeverityNumericCode = 1 | 2 | 3 | 4;

  export interface JobDefinition {
    name: string;
    description?: string;
    longDescription?: string;
    supportsStartDateTime?: boolean;
    supportsTestRun?: boolean;
    version: string;
    parameters?: JobParameterDefinition[];
    texts?: JobDefinitionTexts[];
  }

  export interface JobParameterDefinition {
    job_name: string;
    name: string;
    description?: string;
    type_code?: ParameterTypeCode;
    dataType_code?: DataTypeCode;
    mappingType_code?: MappingTypeCode;
    value?: string | number | boolean;
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
    startDateTime?: string;
    definition_name: string;
    version: string;
    link?: string;
    status_code: JobStatusCode;
    testRun?: boolean;
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
    text: string;
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
}

export namespace SchedulingProcessingService {

  export const STATUS_TRANSITIONS: {
    [K in JobStatusCode]: readonly JobStatusCode[];
  };

  export type ResultTypeCode = scheduling.ResultTypeCode;
  export type MessageSeverityCode = scheduling.MessageSeverityCode;
  export type JobStatusCode = scheduling.JobStatusCode;
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
    text?: string;
    severity: MessageSeverityCode;
    createdAt?: string;
    texts?: JobResultMessageText[];
  }

  export interface JobResultMessageText {
    locale: Locale;
    text: string;
  }

  export interface SchedulingProcessingRequest {
    job: scheduling.Job;
    [key: string]: unknown;
  }

  export interface SchedulingProviderService {
    downloadData(req: object, ID: string): Promise<void>;
  }

  export interface SchedulingProcessingService {
    processJobUpdate(req: SchedulingProcessingRequest, status: JobStatusCode, results?: JobResult[]): Promise<void>;
  }

  export interface SchedulingMonitoringService {
  }

  export interface SchedulingWebsocketService {
  }
}