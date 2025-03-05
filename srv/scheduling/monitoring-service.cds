using scheduling from '../../db/scheduling';

@path: '/odata/v4/job-scheduling/monitoring'
@impl: '@cap-js-community/sap-afc-sdk/srv/scheduling/monitoring-service.js'
service SchedulingMonitoringService {
  entity JobDefinition @readonly          as projection on scheduling.JobDefinition;
  entity JobParameterDefinition @readonly as projection on scheduling.JobParameterDefinition;

  entity Job @readonly                    as projection on scheduling.Job
    actions {
      action cancel() returns Job;
    };

  entity JobParameter @readonly           as projection on scheduling.JobParameter;
  entity JobResult @readonly              as projection on scheduling.JobResult;
  entity JobResultMessage @readonly       as projection on scheduling.JobResultMessage;
  entity JobStatus @readonly              as projection on scheduling.JobStatus;
  entity ResultType @readonly             as projection on scheduling.ResultType;
  entity ParameterType @readonly          as projection on scheduling.ParameterType;
  entity DataType @readonly               as projection on scheduling.DataType;
  entity MappingType @readonly            as projection on scheduling.MappingType;
  entity MessageSeverity @readonly        as projection on scheduling.MessageSeverity;
};

annotate SchedulingMonitoringService.JobResult {
  mimeType @Core.IsMediaType;
  data     @Core.MediaType: mimeType  @Core.ContentDisposition.Type: 'attachment'  @Core.ContentDisposition.Filename: filename;
};

extend SchedulingMonitoringService.JobResult with columns {
  @title: '{i18n>DataLink}'
  case type.code
    when
      #data
    then
      'odata/v4/job-scheduling/monitoring/JobResult(' || ID || ')/data'
    else
      null
  end as dataLink : String
};

extend SchedulingMonitoringService.JobResultMessage with columns {
  @title: '{i18n>Criticality}'
  case severity.code
    when
      #error
    then
      1
    when
      #warning
    then
      2
    when
      #info
    then
      5
  end as criticality : Integer
};
