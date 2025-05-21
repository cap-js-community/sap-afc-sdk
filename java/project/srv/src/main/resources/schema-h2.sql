
DROP VIEW IF EXISTS localized_SchedulingProviderService_JobResultMessage;
DROP VIEW IF EXISTS localized_SchedulingProviderService_JobParameterDefinition;
DROP VIEW IF EXISTS localized_SchedulingProviderService_JobDefinition;
DROP VIEW IF EXISTS localized_SchedulingMonitoringService_MessageSeverity;
DROP VIEW IF EXISTS localized_SchedulingMonitoringService_MappingType;
DROP VIEW IF EXISTS localized_SchedulingMonitoringService_DataType;
DROP VIEW IF EXISTS localized_SchedulingMonitoringService_ParameterType;
DROP VIEW IF EXISTS localized_SchedulingMonitoringService_ResultType;
DROP VIEW IF EXISTS localized_SchedulingMonitoringService_JobStatus;
DROP VIEW IF EXISTS localized_SchedulingMonitoringService_JobResultMessage;
DROP VIEW IF EXISTS localized_SchedulingMonitoringService_JobParameterDefinition;
DROP VIEW IF EXISTS localized_SchedulingMonitoringService_JobDefinition;
DROP VIEW IF EXISTS localized_scheduling_MessageSeverity;
DROP VIEW IF EXISTS localized_scheduling_ResultType;
DROP VIEW IF EXISTS localized_scheduling_MappingType;
DROP VIEW IF EXISTS localized_scheduling_DataType;
DROP VIEW IF EXISTS localized_scheduling_ParameterType;
DROP VIEW IF EXISTS localized_scheduling_JobStatus;
DROP VIEW IF EXISTS localized_scheduling_JobResultMessage;
DROP VIEW IF EXISTS localized_scheduling_JobParameterDefinition;
DROP VIEW IF EXISTS localized_scheduling_JobDefinition;
DROP VIEW IF EXISTS SchedulingMonitoringService_MessageSeverity_texts;
DROP VIEW IF EXISTS SchedulingMonitoringService_MappingType_texts;
DROP VIEW IF EXISTS SchedulingMonitoringService_DataType_texts;
DROP VIEW IF EXISTS SchedulingMonitoringService_ParameterType_texts;
DROP VIEW IF EXISTS SchedulingMonitoringService_ResultType_texts;
DROP VIEW IF EXISTS SchedulingMonitoringService_JobStatus_texts;
DROP VIEW IF EXISTS SchedulingMonitoringService_JobResultMessage_texts;
DROP VIEW IF EXISTS SchedulingMonitoringService_JobParameterDefinition_texts;
DROP VIEW IF EXISTS SchedulingMonitoringService_JobDefinition_texts;
DROP VIEW IF EXISTS SchedulingProviderService_JobResultMessage;
DROP VIEW IF EXISTS SchedulingProviderService_JobResult;
DROP VIEW IF EXISTS SchedulingProviderService_JobParameter;
DROP VIEW IF EXISTS SchedulingProviderService_Job;
DROP VIEW IF EXISTS SchedulingProviderService_JobParameterDefinition;
DROP VIEW IF EXISTS SchedulingProviderService_JobDefinition;
DROP VIEW IF EXISTS SchedulingMonitoringService_MessageSeverity;
DROP VIEW IF EXISTS SchedulingMonitoringService_MappingType;
DROP VIEW IF EXISTS SchedulingMonitoringService_DataType;
DROP VIEW IF EXISTS SchedulingMonitoringService_ParameterType;
DROP VIEW IF EXISTS SchedulingMonitoringService_ResultType;
DROP VIEW IF EXISTS SchedulingMonitoringService_JobStatus;
DROP VIEW IF EXISTS SchedulingMonitoringService_JobResultMessage;
DROP VIEW IF EXISTS SchedulingMonitoringService_JobResult;
DROP VIEW IF EXISTS SchedulingMonitoringService_JobParameter;
DROP VIEW IF EXISTS SchedulingMonitoringService_Job;
DROP VIEW IF EXISTS SchedulingMonitoringService_JobParameterDefinition;
DROP VIEW IF EXISTS SchedulingMonitoringService_JobDefinition;
DROP TABLE IF EXISTS scheduling_MessageSeverity_texts;
DROP TABLE IF EXISTS scheduling_ResultType_texts;
DROP TABLE IF EXISTS scheduling_MappingType_texts;
DROP TABLE IF EXISTS scheduling_DataType_texts;
DROP TABLE IF EXISTS scheduling_ParameterType_texts;
DROP TABLE IF EXISTS scheduling_JobStatus_texts;
DROP TABLE IF EXISTS scheduling_JobResultMessage_texts;
DROP TABLE IF EXISTS scheduling_JobParameterDefinition_texts;
DROP TABLE IF EXISTS scheduling_JobDefinition_texts;
DROP TABLE IF EXISTS scheduling_MessageSeverity;
DROP TABLE IF EXISTS scheduling_ResultType;
DROP TABLE IF EXISTS scheduling_MappingType;
DROP TABLE IF EXISTS scheduling_DataType;
DROP TABLE IF EXISTS scheduling_ParameterType;
DROP TABLE IF EXISTS scheduling_JobStatus;
DROP TABLE IF EXISTS scheduling_JobResultMessage;
DROP TABLE IF EXISTS scheduling_JobResult;
DROP TABLE IF EXISTS scheduling_JobParameter;
DROP TABLE IF EXISTS scheduling_Job;
DROP TABLE IF EXISTS scheduling_JobParameterDefinition;
DROP TABLE IF EXISTS scheduling_JobDefinition;
DROP TABLE IF EXISTS sap_eventqueue_Lock;
DROP TABLE IF EXISTS sap_eventqueue_Event;
DROP TABLE IF EXISTS cds_outbox_Messages;

CREATE TABLE cds_outbox_Messages (
  ID NVARCHAR(36) NOT NULL,
  timestamp TIMESTAMP(7),
  target NVARCHAR(255),
  msg NCLOB,
  attempts INTEGER DEFAULT 0,
  "PARTITION" INTEGER DEFAULT 0,
  lastError NCLOB,
  lastAttemptTimestamp TIMESTAMP(7),
  PRIMARY KEY(ID)
);


CREATE TABLE sap_eventqueue_Event (
  ID NVARCHAR(36) NOT NULL,
  type NVARCHAR(255) NOT NULL,
  subType NVARCHAR(255) NOT NULL,
  referenceEntity NVARCHAR(255),
  referenceEntityKey NVARCHAR(36),
  status INTEGER NOT NULL DEFAULT 0,
  payload NCLOB,
  attempts INTEGER NOT NULL DEFAULT 0,
  lastAttemptTimestamp TIMESTAMP(7),
  createdAt TIMESTAMP(7),
  startAfter TIMESTAMP(7),
  context NCLOB,
  error NVARCHAR(255),
  PRIMARY KEY(ID)
);


CREATE TABLE sap_eventqueue_Lock (
  createdAt TIMESTAMP(7),
  createdBy NVARCHAR(255),
  modifiedAt TIMESTAMP(7),
  modifiedBy NVARCHAR(255),
  code NVARCHAR(255) NOT NULL,
  "VALUE" NVARCHAR(255),
  CONSTRAINT sap_eventqueue_Lock_semanticKey UNIQUE (code)
);


CREATE TABLE scheduling_JobDefinition (
  name NVARCHAR(255) NOT NULL,
  description NVARCHAR(5000),
  longDescription NVARCHAR(5000),
  supportsStartDateTime BOOLEAN,
  supportsTestRun BOOLEAN,
  version NVARCHAR(255) NOT NULL,
  PRIMARY KEY(name)
);


CREATE TABLE scheduling_JobParameterDefinition (
  job_name NVARCHAR(255) NOT NULL,
  name NVARCHAR(255) NOT NULL,
  description NVARCHAR(5000),
  type_code NVARCHAR(255) NOT NULL,
  dataType_code NVARCHAR(255) NOT NULL,
  mappingType_code NVARCHAR(255),
  "VALUE" NVARCHAR(5000),
  required BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY(job_name, name)
);


CREATE TABLE scheduling_Job (
  ID NVARCHAR(36) NOT NULL,
  createdAt TIMESTAMP(7),
  createdBy NVARCHAR(255),
  modifiedAt TIMESTAMP(7),
  modifiedBy NVARCHAR(255),
  referenceID NVARCHAR(36) NOT NULL,
  startDateTime TIMESTAMP(0),
  definition_name NVARCHAR(255) NOT NULL,
  version NVARCHAR(255) NOT NULL,
  link NVARCHAR(5000),
  status_code NVARCHAR(255) NOT NULL DEFAULT 'requested',
  testRun BOOLEAN,
  PRIMARY KEY(ID)
);


CREATE TABLE scheduling_JobParameter (
  ID NVARCHAR(36) NOT NULL,
  job_ID NVARCHAR(36) NOT NULL,
  definition_job_name NVARCHAR(255) NOT NULL,
  definition_name NVARCHAR(255) NOT NULL,
  "VALUE" NVARCHAR(5000),
  PRIMARY KEY(ID),
  CONSTRAINT scheduling_JobParameter_semanticKey UNIQUE (job_ID, definition_job_name, definition_name)
);


CREATE TABLE scheduling_JobResult (
  ID NVARCHAR(36) NOT NULL,
  job_ID NVARCHAR(36) NOT NULL,
  name NVARCHAR(255) NOT NULL,
  type_code NVARCHAR(255) NOT NULL,
  link NVARCHAR(5000),
  mimeType NVARCHAR(255),
  filename NVARCHAR(5000),
  data BINARY LARGE OBJECT,
  PRIMARY KEY(ID)
);


CREATE TABLE scheduling_JobResultMessage (
  ID NVARCHAR(36) NOT NULL,
  result_ID NVARCHAR(36) NOT NULL,
  code NVARCHAR(255) NOT NULL,
  text NVARCHAR(5000) NOT NULL,
  severity_code NVARCHAR(255) NOT NULL DEFAULT 'info',
  createdAt TIMESTAMP(7) NOT NULL,
  PRIMARY KEY(ID)
);


CREATE TABLE scheduling_JobStatus (
  name NVARCHAR(255),
  descr NVARCHAR(1000),
  code NVARCHAR(255) NOT NULL,
  PRIMARY KEY(code)
);


CREATE TABLE scheduling_ParameterType (
  name NVARCHAR(255),
  descr NVARCHAR(1000),
  code NVARCHAR(255) NOT NULL,
  PRIMARY KEY(code)
);


CREATE TABLE scheduling_DataType (
  name NVARCHAR(255),
  descr NVARCHAR(1000),
  code NVARCHAR(255) NOT NULL,
  PRIMARY KEY(code)
);


CREATE TABLE scheduling_MappingType (
  name NVARCHAR(255),
  descr NVARCHAR(1000),
  code NVARCHAR(255) NOT NULL,
  PRIMARY KEY(code)
);


CREATE TABLE scheduling_ResultType (
  name NVARCHAR(255),
  descr NVARCHAR(1000),
  code NVARCHAR(255) NOT NULL,
  PRIMARY KEY(code)
);


CREATE TABLE scheduling_MessageSeverity (
  name NVARCHAR(255),
  descr NVARCHAR(1000),
  code NVARCHAR(255) NOT NULL,
  numericCode INTEGER,
  PRIMARY KEY(code)
);


CREATE TABLE scheduling_JobDefinition_texts (
  locale NVARCHAR(14) NOT NULL,
  name NVARCHAR(255) NOT NULL,
  description NVARCHAR(5000),
  longDescription NVARCHAR(5000),
  PRIMARY KEY(locale, name)
);


CREATE TABLE scheduling_JobParameterDefinition_texts (
  locale NVARCHAR(14) NOT NULL,
  job_name NVARCHAR(255) NOT NULL,
  name NVARCHAR(255) NOT NULL,
  description NVARCHAR(5000),
  PRIMARY KEY(locale, job_name, name)
);


CREATE TABLE scheduling_JobResultMessage_texts (
  locale NVARCHAR(14) NOT NULL,
  ID NVARCHAR(36) NOT NULL,
  text NVARCHAR(5000) NOT NULL,
  PRIMARY KEY(locale, ID)
);


CREATE TABLE scheduling_JobStatus_texts (
  locale NVARCHAR(14) NOT NULL,
  name NVARCHAR(255),
  descr NVARCHAR(1000),
  code NVARCHAR(255) NOT NULL,
  PRIMARY KEY(locale, code)
);


CREATE TABLE scheduling_ParameterType_texts (
  locale NVARCHAR(14) NOT NULL,
  name NVARCHAR(255),
  descr NVARCHAR(1000),
  code NVARCHAR(255) NOT NULL,
  PRIMARY KEY(locale, code)
);


CREATE TABLE scheduling_DataType_texts (
  locale NVARCHAR(14) NOT NULL,
  name NVARCHAR(255),
  descr NVARCHAR(1000),
  code NVARCHAR(255) NOT NULL,
  PRIMARY KEY(locale, code)
);


CREATE TABLE scheduling_MappingType_texts (
  locale NVARCHAR(14) NOT NULL,
  name NVARCHAR(255),
  descr NVARCHAR(1000),
  code NVARCHAR(255) NOT NULL,
  PRIMARY KEY(locale, code)
);


CREATE TABLE scheduling_ResultType_texts (
  locale NVARCHAR(14) NOT NULL,
  name NVARCHAR(255),
  descr NVARCHAR(1000),
  code NVARCHAR(255) NOT NULL,
  PRIMARY KEY(locale, code)
);


CREATE TABLE scheduling_MessageSeverity_texts (
  locale NVARCHAR(14) NOT NULL,
  name NVARCHAR(255),
  descr NVARCHAR(1000),
  code NVARCHAR(255) NOT NULL,
  PRIMARY KEY(locale, code)
);


CREATE VIEW SchedulingMonitoringService_JobDefinition AS SELECT
  JobDefinition_0.name,
  JobDefinition_0.description,
  JobDefinition_0.longDescription,
  JobDefinition_0.supportsStartDateTime,
  JobDefinition_0.supportsTestRun,
  JobDefinition_0.version
FROM scheduling_JobDefinition AS JobDefinition_0;


CREATE VIEW SchedulingMonitoringService_JobParameterDefinition AS SELECT
  JobParameterDefinition_0.job_name,
  JobParameterDefinition_0.name,
  JobParameterDefinition_0.description,
  JobParameterDefinition_0.type_code,
  JobParameterDefinition_0.dataType_code,
  JobParameterDefinition_0.mappingType_code,
  JobParameterDefinition_0."VALUE",
  JobParameterDefinition_0.required
FROM scheduling_JobParameterDefinition AS JobParameterDefinition_0;


CREATE VIEW SchedulingMonitoringService_Job AS SELECT
  Job_0.ID,
  Job_0.createdAt,
  Job_0.createdBy,
  Job_0.modifiedAt,
  Job_0.modifiedBy,
  Job_0.referenceID,
  Job_0.startDateTime,
  Job_0.definition_name,
  Job_0.version,
  Job_0.link,
  Job_0.status_code,
  Job_0.testRun,
  CASE Job_0.status_code WHEN 'requested' THEN 5 WHEN 'running' THEN 5 WHEN 'completed' THEN 3 WHEN 'completedWithWarning' THEN 2 WHEN 'completedWithError' THEN 2 WHEN 'failed' THEN 1 WHEN 'cancelRequested' THEN 0 WHEN 'canceled' THEN 0 END AS criticality
FROM scheduling_Job AS Job_0;


CREATE VIEW SchedulingMonitoringService_JobParameter AS SELECT
  JobParameter_0.ID,
  JobParameter_0.job_ID,
  JobParameter_0.definition_job_name,
  JobParameter_0.definition_name,
  JobParameter_0."VALUE"
FROM scheduling_JobParameter AS JobParameter_0;


CREATE VIEW SchedulingMonitoringService_JobResult AS SELECT
  JobResult_0.ID,
  JobResult_0.job_ID,
  JobResult_0.name,
  JobResult_0.type_code,
  JobResult_0.link,
  JobResult_0.mimeType,
  JobResult_0.filename,
  JobResult_0.data
FROM scheduling_JobResult AS JobResult_0;


CREATE VIEW SchedulingMonitoringService_JobResultMessage AS SELECT
  JobResultMessage_0.ID,
  JobResultMessage_0.result_ID,
  JobResultMessage_0.code,
  JobResultMessage_0.text,
  JobResultMessage_0.severity_code,
  JobResultMessage_0.createdAt,
  CASE JobResultMessage_0.severity_code WHEN 'error' THEN 1 WHEN 'warning' THEN 2 WHEN 'info' THEN 5 END AS criticality
FROM scheduling_JobResultMessage AS JobResultMessage_0;


CREATE VIEW SchedulingMonitoringService_JobStatus AS SELECT
  JobStatus_0.name,
  JobStatus_0.descr,
  JobStatus_0.code
FROM scheduling_JobStatus AS JobStatus_0;


CREATE VIEW SchedulingMonitoringService_ResultType AS SELECT
  ResultType_0.name,
  ResultType_0.descr,
  ResultType_0.code
FROM scheduling_ResultType AS ResultType_0;


CREATE VIEW SchedulingMonitoringService_ParameterType AS SELECT
  ParameterType_0.name,
  ParameterType_0.descr,
  ParameterType_0.code
FROM scheduling_ParameterType AS ParameterType_0;


CREATE VIEW SchedulingMonitoringService_DataType AS SELECT
  DataType_0.name,
  DataType_0.descr,
  DataType_0.code
FROM scheduling_DataType AS DataType_0;


CREATE VIEW SchedulingMonitoringService_MappingType AS SELECT
  MappingType_0.name,
  MappingType_0.descr,
  MappingType_0.code
FROM scheduling_MappingType AS MappingType_0;


CREATE VIEW SchedulingMonitoringService_MessageSeverity AS SELECT
  MessageSeverity_0.name,
  MessageSeverity_0.descr,
  MessageSeverity_0.code,
  MessageSeverity_0.numericCode
FROM scheduling_MessageSeverity AS MessageSeverity_0;


CREATE VIEW SchedulingProviderService_JobDefinition AS SELECT
  JobDefinition_0.name,
  JobDefinition_0.description,
  JobDefinition_0.longDescription,
  JobDefinition_0.supportsStartDateTime,
  JobDefinition_0.supportsTestRun,
  JobDefinition_0.version
FROM scheduling_JobDefinition AS JobDefinition_0;


CREATE VIEW SchedulingProviderService_JobParameterDefinition AS SELECT
  JobParameterDefinition_0.name,
  JobParameterDefinition_0.job_name AS jobName,
  JobParameterDefinition_0.description,
  JobParameterDefinition_0.type_code AS type,
  JobParameterDefinition_0.dataType_code AS dataType,
  JobParameterDefinition_0.mappingType_code AS mappingType,
  JobParameterDefinition_0."VALUE",
  JobParameterDefinition_0.required
FROM scheduling_JobParameterDefinition AS JobParameterDefinition_0;


CREATE VIEW SchedulingProviderService_Job AS SELECT
  Job_0.ID,
  Job_0.definition_name AS name,
  Job_0.referenceID,
  Job_0.startDateTime,
  Job_0.version,
  Job_0.status_code AS status,
  Job_0.createdAt,
  Job_0.createdBy,
  Job_0.modifiedAt,
  Job_0.modifiedBy,
  Job_0.link,
  Job_0.testRun
FROM scheduling_Job AS Job_0;


CREATE VIEW SchedulingProviderService_JobParameter AS SELECT
  JobParameter_0.ID,
  JobParameter_0.job_ID AS jobID,
  JobParameter_0.definition_name AS name,
  JobParameter_0."VALUE"
FROM scheduling_JobParameter AS JobParameter_0;


CREATE VIEW SchedulingProviderService_JobResult AS SELECT
  JobResult_0.ID,
  JobResult_0.job_ID AS jobID,
  JobResult_0.type_code AS type,
  JobResult_0.name,
  JobResult_0.link,
  JobResult_0.mimeType,
  JobResult_0.filename
FROM scheduling_JobResult AS JobResult_0;


CREATE VIEW SchedulingProviderService_JobResultMessage AS SELECT
  JobResultMessage_0.ID,
  JobResultMessage_0.result_ID AS resultID,
  JobResultMessage_0.severity_code AS severity,
  JobResultMessage_0.code,
  JobResultMessage_0.text,
  JobResultMessage_0.createdAt
FROM scheduling_JobResultMessage AS JobResultMessage_0;


CREATE VIEW SchedulingMonitoringService_JobDefinition_texts AS SELECT
  texts_0.locale,
  texts_0.name,
  texts_0.description,
  texts_0.longDescription
FROM scheduling_JobDefinition_texts AS texts_0;


CREATE VIEW SchedulingMonitoringService_JobParameterDefinition_texts AS SELECT
  texts_0.locale,
  texts_0.job_name,
  texts_0.name,
  texts_0.description
FROM scheduling_JobParameterDefinition_texts AS texts_0;


CREATE VIEW SchedulingMonitoringService_JobResultMessage_texts AS SELECT
  texts_0.locale,
  texts_0.ID,
  texts_0.text
FROM scheduling_JobResultMessage_texts AS texts_0;


CREATE VIEW SchedulingMonitoringService_JobStatus_texts AS SELECT
  texts_0.locale,
  texts_0.name,
  texts_0.descr,
  texts_0.code
FROM scheduling_JobStatus_texts AS texts_0;


CREATE VIEW SchedulingMonitoringService_ResultType_texts AS SELECT
  texts_0.locale,
  texts_0.name,
  texts_0.descr,
  texts_0.code
FROM scheduling_ResultType_texts AS texts_0;


CREATE VIEW SchedulingMonitoringService_ParameterType_texts AS SELECT
  texts_0.locale,
  texts_0.name,
  texts_0.descr,
  texts_0.code
FROM scheduling_ParameterType_texts AS texts_0;


CREATE VIEW SchedulingMonitoringService_DataType_texts AS SELECT
  texts_0.locale,
  texts_0.name,
  texts_0.descr,
  texts_0.code
FROM scheduling_DataType_texts AS texts_0;


CREATE VIEW SchedulingMonitoringService_MappingType_texts AS SELECT
  texts_0.locale,
  texts_0.name,
  texts_0.descr,
  texts_0.code
FROM scheduling_MappingType_texts AS texts_0;


CREATE VIEW SchedulingMonitoringService_MessageSeverity_texts AS SELECT
  texts_0.locale,
  texts_0.name,
  texts_0.descr,
  texts_0.code
FROM scheduling_MessageSeverity_texts AS texts_0;


CREATE VIEW localized_scheduling_JobDefinition AS SELECT
  L_0.name,
  coalesce(localized_1.description, L_0.description) AS description,
  coalesce(localized_1.longDescription, L_0.longDescription) AS longDescription,
  L_0.supportsStartDateTime,
  L_0.supportsTestRun,
  L_0.version
FROM (scheduling_JobDefinition AS L_0 LEFT JOIN scheduling_JobDefinition_texts AS localized_1 ON localized_1.name = L_0.name AND localized_1.locale = @locale);


CREATE VIEW localized_scheduling_JobParameterDefinition AS SELECT
  L_0.job_name,
  L_0.name,
  coalesce(localized_1.description, L_0.description) AS description,
  L_0.type_code,
  L_0.dataType_code,
  L_0.mappingType_code,
  L_0."VALUE",
  L_0.required
FROM (scheduling_JobParameterDefinition AS L_0 LEFT JOIN scheduling_JobParameterDefinition_texts AS localized_1 ON localized_1.job_name = L_0.job_name AND localized_1.name = L_0.name AND localized_1.locale = @locale);


CREATE VIEW localized_scheduling_JobResultMessage AS SELECT
  L_0.ID,
  L_0.result_ID,
  L_0.code,
  coalesce(localized_1.text, L_0.text) AS text,
  L_0.severity_code,
  L_0.createdAt
FROM (scheduling_JobResultMessage AS L_0 LEFT JOIN scheduling_JobResultMessage_texts AS localized_1 ON localized_1.ID = L_0.ID AND localized_1.locale = @locale);


CREATE VIEW localized_scheduling_JobStatus AS SELECT
  coalesce(localized_1.name, L_0.name) AS name,
  coalesce(localized_1.descr, L_0.descr) AS descr,
  L_0.code
FROM (scheduling_JobStatus AS L_0 LEFT JOIN scheduling_JobStatus_texts AS localized_1 ON localized_1.code = L_0.code AND localized_1.locale = @locale);


CREATE VIEW localized_scheduling_ParameterType AS SELECT
  coalesce(localized_1.name, L_0.name) AS name,
  coalesce(localized_1.descr, L_0.descr) AS descr,
  L_0.code
FROM (scheduling_ParameterType AS L_0 LEFT JOIN scheduling_ParameterType_texts AS localized_1 ON localized_1.code = L_0.code AND localized_1.locale = @locale);


CREATE VIEW localized_scheduling_DataType AS SELECT
  coalesce(localized_1.name, L_0.name) AS name,
  coalesce(localized_1.descr, L_0.descr) AS descr,
  L_0.code
FROM (scheduling_DataType AS L_0 LEFT JOIN scheduling_DataType_texts AS localized_1 ON localized_1.code = L_0.code AND localized_1.locale = @locale);


CREATE VIEW localized_scheduling_MappingType AS SELECT
  coalesce(localized_1.name, L_0.name) AS name,
  coalesce(localized_1.descr, L_0.descr) AS descr,
  L_0.code
FROM (scheduling_MappingType AS L_0 LEFT JOIN scheduling_MappingType_texts AS localized_1 ON localized_1.code = L_0.code AND localized_1.locale = @locale);


CREATE VIEW localized_scheduling_ResultType AS SELECT
  coalesce(localized_1.name, L_0.name) AS name,
  coalesce(localized_1.descr, L_0.descr) AS descr,
  L_0.code
FROM (scheduling_ResultType AS L_0 LEFT JOIN scheduling_ResultType_texts AS localized_1 ON localized_1.code = L_0.code AND localized_1.locale = @locale);


CREATE VIEW localized_scheduling_MessageSeverity AS SELECT
  coalesce(localized_1.name, L_0.name) AS name,
  coalesce(localized_1.descr, L_0.descr) AS descr,
  L_0.code,
  L_0.numericCode
FROM (scheduling_MessageSeverity AS L_0 LEFT JOIN scheduling_MessageSeverity_texts AS localized_1 ON localized_1.code = L_0.code AND localized_1.locale = @locale);


CREATE VIEW localized_SchedulingMonitoringService_JobDefinition AS SELECT
  JobDefinition_0.name,
  JobDefinition_0.description,
  JobDefinition_0.longDescription,
  JobDefinition_0.supportsStartDateTime,
  JobDefinition_0.supportsTestRun,
  JobDefinition_0.version
FROM localized_scheduling_JobDefinition AS JobDefinition_0;


CREATE VIEW localized_SchedulingMonitoringService_JobParameterDefinition AS SELECT
  JobParameterDefinition_0.job_name,
  JobParameterDefinition_0.name,
  JobParameterDefinition_0.description,
  JobParameterDefinition_0.type_code,
  JobParameterDefinition_0.dataType_code,
  JobParameterDefinition_0.mappingType_code,
  JobParameterDefinition_0."VALUE",
  JobParameterDefinition_0.required
FROM localized_scheduling_JobParameterDefinition AS JobParameterDefinition_0;


CREATE VIEW localized_SchedulingMonitoringService_JobResultMessage AS SELECT
  JobResultMessage_0.ID,
  JobResultMessage_0.result_ID,
  JobResultMessage_0.code,
  JobResultMessage_0.text,
  JobResultMessage_0.severity_code,
  JobResultMessage_0.createdAt,
  CASE JobResultMessage_0.severity_code WHEN 'error' THEN 1 WHEN 'warning' THEN 2 WHEN 'info' THEN 5 END AS criticality
FROM localized_scheduling_JobResultMessage AS JobResultMessage_0;


CREATE VIEW localized_SchedulingMonitoringService_JobStatus AS SELECT
  JobStatus_0.name,
  JobStatus_0.descr,
  JobStatus_0.code
FROM localized_scheduling_JobStatus AS JobStatus_0;


CREATE VIEW localized_SchedulingMonitoringService_ResultType AS SELECT
  ResultType_0.name,
  ResultType_0.descr,
  ResultType_0.code
FROM localized_scheduling_ResultType AS ResultType_0;


CREATE VIEW localized_SchedulingMonitoringService_ParameterType AS SELECT
  ParameterType_0.name,
  ParameterType_0.descr,
  ParameterType_0.code
FROM localized_scheduling_ParameterType AS ParameterType_0;


CREATE VIEW localized_SchedulingMonitoringService_DataType AS SELECT
  DataType_0.name,
  DataType_0.descr,
  DataType_0.code
FROM localized_scheduling_DataType AS DataType_0;


CREATE VIEW localized_SchedulingMonitoringService_MappingType AS SELECT
  MappingType_0.name,
  MappingType_0.descr,
  MappingType_0.code
FROM localized_scheduling_MappingType AS MappingType_0;


CREATE VIEW localized_SchedulingMonitoringService_MessageSeverity AS SELECT
  MessageSeverity_0.name,
  MessageSeverity_0.descr,
  MessageSeverity_0.code,
  MessageSeverity_0.numericCode
FROM localized_scheduling_MessageSeverity AS MessageSeverity_0;


CREATE VIEW localized_SchedulingProviderService_JobDefinition AS SELECT
  JobDefinition_0.name,
  JobDefinition_0.description,
  JobDefinition_0.longDescription,
  JobDefinition_0.supportsStartDateTime,
  JobDefinition_0.supportsTestRun,
  JobDefinition_0.version
FROM localized_scheduling_JobDefinition AS JobDefinition_0;


CREATE VIEW localized_SchedulingProviderService_JobParameterDefinition AS SELECT
  JobParameterDefinition_0.name,
  JobParameterDefinition_0.job_name AS jobName,
  JobParameterDefinition_0.description,
  JobParameterDefinition_0.type_code AS type,
  JobParameterDefinition_0.dataType_code AS dataType,
  JobParameterDefinition_0.mappingType_code AS mappingType,
  JobParameterDefinition_0."VALUE",
  JobParameterDefinition_0.required
FROM localized_scheduling_JobParameterDefinition AS JobParameterDefinition_0;


CREATE VIEW localized_SchedulingProviderService_JobResultMessage AS SELECT
  JobResultMessage_0.ID,
  JobResultMessage_0.result_ID AS resultID,
  JobResultMessage_0.severity_code AS severity,
  JobResultMessage_0.code,
  JobResultMessage_0.text,
  JobResultMessage_0.createdAt
FROM localized_scheduling_JobResultMessage AS JobResultMessage_0;

