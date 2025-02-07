using scheduling from '../../db/scheduling';

@path: '/srv/job-scheduling/monitoring'
@impl: '@cap-js-community/sap-afc-sdk/srv/scheduling/monitoring-service.js'
service SchedulingMonitoringService {
    entity JobDefinition @readonly          as projection on scheduling.JobDefinition;
    entity JobParameterDefinition @readonly as projection on scheduling.JobParameterDefinition;

    entity Job @readonly                    as projection on scheduling.Job
        actions {
            @Core.OperationAvailable: {$edmJson: {$Or: [
                {$Eq: [
                    {$Path: 'in/status_code'},
                    'requested'
                ]},
                {$Eq: [
                    {$Path: 'in/status_code'},
                    'running'
                ]}
            ]}}
            action cancel() returns Job;
        };

    entity JobParameter @readonly           as projection on scheduling.JobParameter;
    entity JobStatus @readonly              as projection on scheduling.JobStatus;
    entity ParameterType @readonly          as projection on scheduling.ParameterType;
    entity DataType @readonly               as projection on scheduling.DataType;
    entity MappingType @readonly            as projection on scheduling.MappingType;
}
