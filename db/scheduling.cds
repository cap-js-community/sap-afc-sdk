namespace sapafcsdk.scheduling;

using {
  cuid,
  managed,
  sap.common.CodeList
} from '@sap/cds/common';

@title: '{i18n>JobDefinition}'
entity JobDefinition {
      @title: '{i18n>Name}'
  key name                  : String(255) not null;

      @title: '{i18n>Description}'
      description           : localized String(5000);

      @title: '{i18n>LongDescription}'
      longDescription       : localized String(5000);

      @title: '{i18n>Version}'
      version               : String(255) not null;

      @title: '{i18n>VendorName}'
      vendorName            : String;

      @title: '{i18n>VendorSystem}'
      vendorSystem          : String;

      @title: '{i18n>Parameters}'
      parameters            : Composition of many JobParameterDefinition
                                on parameters.job = $self;

      @title: '{i18n>SupportsStartDateTime}'
      supportsStartDateTime : Boolean;

      @title: '{i18n>SupportsTestRun}'
      supportsTestRun       : Boolean;

      @title: '{i18n>SupportsErrorOnlyRun}'
      supportsErrorOnlyRun  : Boolean;
};

@title: '{i18n>JobParameterDefinition}'
entity JobParameterDefinition {
      @title: '{i18n>Job}'
  key job         : Association to JobDefinition not null;

      @title: '{i18n>Name}'
  key name        : String(255) not null;

      @title: '{i18n>Description}'
      description : localized String(5000);

      @title: '{i18n>ParameterType}'
      type        : Association to ParameterType not null;

      @title: '{i18n>DataType}'
      dataType    : Association to DataType not null;

      @title: '{i18n>MappingType}'
      mappingType : Association to MappingType;

      @title: '{i18n>Value}'
      value       : String(5000);

      @title: '{i18n>EnumValues}'
      enumValues  : array of String(5000);

      @title: '{i18n>Required}'
      required    : Boolean not null default false;
};

@title     : '{i18n>Job}'
@cds.search: {
  ID             : true,
  referenceID    : true,
  definition.name: true,
  version        : true,
  link           : true
}
entity Job : cuid, managed {
  @title: '{i18n>ReferenceID}'
  referenceID   : UUID not null;

  @title: '{i18n>Name}'
  definition    : Association to JobDefinition not null;

  @readonly
  @title: '{i18n>Version}'
  version       : String(255) not null;

  @readonly
  @title: '{i18n>Status}'
  status        : Association to JobStatus not null default #requested;

  @readonly
  @title: '{i18n>Link}'
  link          : String(5000);

  @title: '{i18n>StartDateTime}'
  startDateTime : DateTime;

  @readonly
  @title: '{i18n>TestRun}'
  testRun       : Boolean;

  @title: '{i18n>ErrorOnlyRun}'
  errorOnlyRun  : Boolean;

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
  value      : String(5000);
};

@title: '{i18n>JobResult}'
entity JobResult : cuid, {
  @title: '{i18n>Job}'
  job      : Association to Job not null;

  @title: '{i18n>Name}'
  name     : String(255) not null;

  @title: '{i18n>Type}'
  type     : Association to ResultType not null;

  @title: '{i18n>Link}'
  link     : String(5000);

  @title                           : '{i18n>MimeType}'
  @Core.IsMediaType
  mimeType : String(255);

  @title: '{i18n>Filename}'
  filename : String(5000);

  @title                           : '{i18n>Data}'
  @Core.MediaType                  : mimeType
  @Core.ContentDisposition.Type    : 'attachment'
  @Core.ContentDisposition.Filename: filename
  data     : LargeBinary;

  @title: '{i18n>Messages}'
  messages : Composition of many JobResultMessage
               on messages.result = $self;
};

@title: '{i18n>JobResultMessage}'
entity JobResultMessage : cuid, {
  @title: '{i18n>JobResult}'
  result    : Association to JobResult not null;

  @title: '{i18n>Code}'
  code      : String(255) not null;

  @title: '{i18n>Values}'
  values    : array of String(5000);

  @title: '{i18n>Text}'
  text      : localized String(5000) not null;

  @title: '{i18n>Severity}'
  severity  : Association to MessageSeverity not null default #info;

  @title: '{i18n>CreatedAt}'
  createdAt : Timestamp not null;
};

type JobStatusCode              : String(255) enum {
  requested;
  running;
  completed;
  completedWithWarning;
  completedWithError;
  failed;
  cancelRequested;
  canceled
};

@title: '{i18n>Status}'
entity JobStatus : CodeList {
      @title: '{i18n>Status}'
  key code : JobStatusCode;
};

type ParameterTypeCode          : String(255) enum {
  readOnlyValue;
  writableValue;
  mapping;
};

@title: '{i18n>ParameterType}'
entity ParameterType : CodeList {
      @title: '{i18n>ParameterType}'
  key code : ParameterTypeCode;
};

type DataTypeCode               : String(255) enum {
  string;
  number;
  date;
  datetime;
  boolean;
};

@title: '{i18n>DataType}'
entity DataType : CodeList {
      @title: '{i18n>DataType}'
  key code : DataTypeCode;
};

type MappingTypeCode            : String(255) enum {
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

@title: '{i18n>MappingType}'
entity MappingType : CodeList {
      @title: '{i18n>MappingType}'
  key code : MappingTypeCode;
};

type ResultTypeCode             : String(255) enum {
  link;
  data;
  message;
};

@title: '{i18n>ResultType}'
entity ResultType : CodeList {
      @title: '{i18n>ResultType}'
  key code : ResultTypeCode;
};

type MessageSeverityCode        : String(255) enum {
  success;
  info;
  warning;
  error;
};

type MessageSeverityNumericCode : Integer enum {
  success = 1;
  info = 2;
  warning = 3;
  error = 4;
};

@title: '{i18n>MessageSeverity}'
entity MessageSeverity : CodeList {
      @title: '{i18n>MessageSeverity}'
  key code        : MessageSeverityCode;

      @title: '{i18n>MessageSeverity}'
      numericCode : MessageSeverityNumericCode;
};
