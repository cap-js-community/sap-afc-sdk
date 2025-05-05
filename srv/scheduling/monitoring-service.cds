using scheduling from '../../db/scheduling';

@path: 'job-scheduling/monitoring'
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

extend SchedulingMonitoringService.Job with columns {
  @title: '{i18n>Criticality}'
  case status.code
    when
      #requested
    then
      5
    when
      #running
    then
      5
    when
      #completed
    then
      3
    when
      #completedWithWarning
    then
      2
    when
      #completedWithError
    then
      2
    when
      #failed
    then
      1
    when
      #cancelRequested
    then
      0
    when
      #canceled
    then
      0
  end as criticality : Integer
}

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
