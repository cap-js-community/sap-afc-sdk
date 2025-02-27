namespace scheduling;

using {
  cuid,
  managed,
  sap.common.CodeList
} from '@sap/cds/common';

@title: '{i18n>JobDefinition}'
entity JobDefinition {
      @title: '{i18n>Name}'
  key name        : String not null;

      @title: '{i18n>Description}'
      description : String;

      @title: '{i18n>Version}'
      version     : String not null;

      @readonly
      @title: '{i18n>Parameters}'
      parameters  : Composition of many JobParameterDefinition
                      on parameters.job = $self;
};

@title: '{i18n>JobParameterDefinition}'
entity JobParameterDefinition {
      @title: '{i18n>Name}'
  key name        : String;

      @title: '{i18n>Job}'
  key job         : Association to JobDefinition not null;

      @title: '{i18n>Description}'
      description : String;

      @title: '{i18n>ParameterType}'
      type        : Association to ParameterType not null;

      @title: '{i18n>DataType}'
      dataType    : Association to DataType not null;

      @title: '{i18n>MappingType}'
      mappingType : Association to MappingType;

      @title: '{i18n>Value}'
      value       : String;

      @title: '{i18n>Required}'
      required    : Boolean not null default false;
};

@title: '{i18n>Job}'
entity Job : cuid, managed {
  @title: '{i18n>ReferenceID}'
  referenceID   : UUID not null;

  @title: '{i18n>StartDateTime}'
  startDateTime : DateTime;

  @title: '{i18n>Name}'
  definition    : Association to JobDefinition not null;

  @readonly
  @title: '{i18n>Version}'
  version       : String not null;

  @readonly
  @title: '{i18n>Link}'
  link          : String;

  @readonly
  @title: '{i18n>Status}'
  status        : Association to JobStatus not null default 'requested'; // #requested

  @title: '{i18n>Parameters}'
  parameters    : Composition of many JobParameter
                    on parameters.job = $self;

  @title: '{i18n>Results}'
  results       : Composition of many JobResult
                    on results.job = $self;
};

@assert.unique.semanticKey: [
  job,
  definition
]
@title                    : '{i18n>JobParameter}'
entity JobParameter : cuid, {
  @title: '{i18n>Job}'
  job        : Association to Job not null;

  @title: '{i18n>Name}'
  definition : Association to JobParameterDefinition not null;

  @title: '{i18n>Value}'
  value      : String;
};

@assert.unique.semanticKey: [
  job,
  name
]
@title                    : '{i18n>JobResult}'
entity JobResult : cuid, {
  @title: '{i18n>Job}'
  job      : Association to Job not null;

  @title: '{i18n>Name}'
  name     : String not null;

  @title: '{i18n>Type}'
  type     : Association to ResultType not null;

  @title: '{i18n>Link}'
  link     : String;

  @title: '{i18n>MimeType}'
  mimeType : String;

  @title: '{i18n>Data}'
  filename : String;

  @title: '{i18n>Data}'
  data     : LargeBinary;

  @title: '{i18n>Messages}'
  messages : Composition of many JobResultMessage
               on messages.result = $self;
};

@title: '{i18n>JobResultMessage}'
entity JobResultMessage : cuid, {
  @title: '{i18n>JobResult}'
  result   : Association to JobResult not null;

  @title: '{i18n>Message}'
  text     : String not null;

  @title: '{i18n>Severity}'
  severity : Association to MessageSeverity not null default 'info'; // #info
};

type JobStatusCode              : String enum {
  requested;
  running;
  completed;
  completedWithWarning;
  completedWithError;
  failed;
  cancelRequested;
  canceled
};

entity JobStatus : CodeList {
      @title: '{i18n>Status}'
  key code : JobStatusCode;
};

type ParameterTypeCode          : String enum {
  readOnlyValue;
  writableValue;
  mapping;
};

entity ParameterType : CodeList {
      @title: '{i18n>ParameterType}'
  key code : ParameterTypeCode;
};

type DataTypeCode               : String enum {
  string;
  number;
  datetime;
  boolean;
};

entity DataType : CodeList {
      @title: '{i18n>DataType}'
  key code : DataTypeCode;
};

type MappingTypeCode            : String enum {
  accountingPrinciple;
  companyCode;
  plant;
  controllingArea;
  fiscalPeriod;
  fiscalYearPeriod;
  fiscalYear;
  keyDate;
  chartOfAccounts;
  fiscalYearVariant;
  ledger;
  testRun;
  postingPeriodVariant;
  processingUser;
  interestedUser;
  userResponsible;
  processingUserEmail;
  interestedUserEmail;
  userResponsibleEmail;
  executionID;
  customField1;
  customField2;
  customField3;
  taskListID;
  taskListDescription;
  taskID;
  taskDescription;
};

entity MappingType : CodeList {
      @title: '{i18n>MappingType}'
  key code : MappingTypeCode;
};

type ResultTypeCode             : String enum {
  link;
  data;
  message;
};

entity ResultType : CodeList {
      @title: '{i18n>ResultType}'
  key code : ResultTypeCode;
};

type MessageSeverityCode        : String enum {
  success;
  info;
  warning;
  error;
};

type MessageSeverityNumericCode : Integer enum {
  success = 1;
  info    = 2;
  warning = 3;
  error   = 4;
};

entity MessageSeverity : CodeList {
      @title: '{i18n>MessageSeverity}'
  key code        : MessageSeverityCode;

      @title: '{i18n>MessageSeverity}'
      numericCode : MessageSeverityNumericCode;
};
