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
    status        : Association to JobStatus not null default 'requested'; // TODO: #requested

    @title: '{i18n>Parameters}'
    parameters    : Composition of many JobParameter
                        on parameters.job = $self;

    @title: '{i18n>Results}'
    results       : Composition of many JobResult
                        on results.job = $self;
};

@title                    : '{i18n>JobParameter}'
@assert.unique.semanticKey: [
    job,
    definition
]
entity JobParameter : cuid, {
    @title: '{i18n>Job}'
    job        : Association to Job not null;

    @title: '{i18n>Name}'
    definition : Association to JobParameterDefinition not null;

    @title: '{i18n>Value}'
    value      : String;
};

@title                    : '{i18n>JobResult}'
@assert.unique.semanticKey: [
    job,
    name
]
entity JobResult : cuid, {
    @title: '{i18n>Job}'
    job      : Association to Job not null;

    @title: '{i18n>Name}'
    name     : String not null;

    @title: '{i18n>Type}'
    type     : Association to JobResultType not null;

    @title: '{i18n>Link}'
    link     : String;

    @title: '{i18n>MimeType}'
    mimeType : String;

    @title: '{i18n>Data}'
    fileName : String;

    @title: '{i18n>Data}'
    data : LargeBinary;

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
    severity : Association to MessageSeverity not null default 'info'; // TODO: #info
};

type JobStatusCode       : String enum {
    requested;
    running;
    completed;
    completedWithError;
    completedWithWarning;
    failed;
    cancelRequested;
    canceled
};

entity JobStatus : CodeList {
        @title: '{i18n>Status}'
    key code : JobStatusCode;
};

type ParameterTypeCode   : String enum {
    readOnlyValue;
    writableValue;
    mapping;
};

entity ParameterType : CodeList {
        @title: '{i18n>ParameterType}'
    key code : ParameterTypeCode;
};

type DataTypeCode        : String enum {
    string;
    number;
    datetime;
    boolean;
};

entity DataType : CodeList {
        @title: '{i18n>DataType}'
    key code : DataTypeCode;
};

type MappingTypeCode     : String enum {
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
};

entity MappingType : CodeList {
        @title: '{i18n>MappingType}'
    key code : MappingTypeCode;
};

type JobResultTypeCode   : String enum {
    link;
    data;
    message;
};

entity JobResultType : CodeList {
        @title: '{i18n>JobResultType}'
    key code : JobResultTypeCode;
};

type MessageSeverityCode : String enum {
    error;
    warning;
    info;
};

entity MessageSeverity : CodeList {
        @title: '{i18n>MessageSeverityType}'
    key code : MessageSeverityCode;
};
