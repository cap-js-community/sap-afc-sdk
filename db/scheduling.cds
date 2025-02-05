namespace scheduling;

using {
    cuid,
    managed,
    sap.common.CodeList
} from '@sap/cds/common';

entity JobDefinition {
        @title: '{i18n>Name}'
    key name        : String not null;

        @title: '{i18n>Description}'
        description : String;

        @title: '{i18n>Version}'
        version     : String not null;

        @readonly
        parameters  : Composition of many JobParameterDefinition
                          on parameters.job = $self;
};

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

entity Job : cuid, managed {
    key ID            : UUID @readonly;

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
        @title: '{i18n>Status}'
        status        : Association to JobStatus not null default 'requested'; // TODO: #requested
        parameters    : Composition of many JobParameter
                            on parameters.job = $self;
};

entity JobParameter : cuid, {
    key ID         : UUID @readonly;

        @title: '{i18n>Job}'
        job        : Association to Job not null;

        @title: '{i18n>Name}'
        definition : Association to JobParameterDefinition not null;

        @title: '{i18n>Value}'
        value      : String;
};

type JobStatusCode     : String enum {
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
}


type ParameterTypeCode : String enum {
    readOnlyValue;
    writeableValue;
    mapping;
};

entity ParameterType : CodeList {
        @title: '{i18n>ParameterType}'
    key code : ParameterTypeCode;
}

type DataTypeCode      : String enum {
    string;
    number;
    datetime;
    boolean;
};

entity DataType : CodeList {
        @title: '{i18n>DataType}'
    key code : DataTypeCode;
}

type MappingTypeCode   : String enum {
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
}
