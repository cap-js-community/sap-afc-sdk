using scheduling from '../../db/scheduling';

@Capabilities        : {
    KeyAsSegmentSupported: true,
    BatchSupported       : false
}
@Authorization       : {
    Authorizations : [{
        $Type      : 'Auth.OAuth2ClientCredentials',
        Name       : 'oauth2',
        Description: 'To access this API, use the OAuth 2.0 client credentials grant flow.',
        Scopes     : [],
    }],
    SecuritySchemes: [{Authorization: 'oauth2'}]
}
@openapi
@protocol            : 'rest'
@(path: '/api/job-scheduling/v1')
@title               : 'SAP Advanced Financial Closing Scheduling Service Provider Interface'
@Core.LongDescription: 'The Scheduling Service Provider Interface allows the integration of third-party scheduling jobs with SAP Advanced Financial Closing. It includes the retrieval of job definitions, as well as the scheduling and synchronization of jobs.'
@impl                : '@cap-js-community/sap-afc-sdk/srv/scheduling/provider-service.js'
service SchedulingProviderService {

    @title: null
    entity JobDefinition @readonly                                as
        projection on scheduling.JobDefinition {
            *,
            parameters : redirected to JobParameterDefinition
                on parameters.jobName = $self.name
        };

    @title: null
    entity JobParameterDefinition @readonly                       as
        projection on scheduling.JobParameterDefinition {
            key name,
            key job.name         as jobName,
                *,
                description,
                dataType.code    as dataType,
                type.code        as type,
                mappingType.code as mappingType
        }
        excluding {
            job
        };

    @Capabilities.ReadRestrictions.CustomQueryOptions: [
        {
            Name       : 'skip',
            Description: 'The number of query results to skip. A value less than 0 SHALL be interpreted as 0. Example: ?skip=10'
        },
        {
            Name       : 'top',
            Description: 'Non-negative integer. Specifies the desired maximum number of query results to return per page. Example: ?top=10'
        },
        {
            Name       : 'referenceID',
            Description: 'Allows filtering of query results by referenceID. Example: ?referenceID=01234567-89ab-cdef-0123-456789abcdef'
        }
    ]
    @title                                           : null
    entity Job                                                    as
        projection on scheduling.Job {
            key ID         : String(500)  @readonly,
                definition.name as name,
                referenceID,
                startDateTime,
                version,
                status.code     as status @readonly,
                *,
                parameters : redirected to JobParameter
                on parameters.jobID = $self.ID,
                // @readonly
                results    : redirected to JobResult
                on results.jobID = $self.ID,
        }
        excluding {
            definition
        }
        actions {
            action cancel();
        };

    @title: null
    entity JobParameter                                @readonly  as
        projection on scheduling.JobParameter {
            key ID                       : String(500) @readonly,
                job.ID          as jobID : String(500) @readonly,
                definition.name as name,
                value,
                *
        }
        excluding {
            definition,
            job
        };

    @title: null
    entity JobResult                             @readonly        as
        projection on scheduling.JobResult {
            key ID                 : String(500) @readonly,
                job.ID    as jobID : String(500) @readonly,
                type.code as type,
                *,
                // @readonly
                messages           : redirected to JobResultMessage
                on messages.resultID = $self.ID,
        }
        excluding {
            job,
            type,
            data,
        }
        actions {
            function data() returns LargeBinary;
        };

    @title: null
    entity JobResultMessage                             @readonly as
        projection on scheduling.JobResultMessage {
            key ID                        : String(500) @readonly,
                result.ID     as resultID : String(500) @readonly,
                severity.code as severity,
                *
        }
        excluding {
            result,
            severity,
        };

    @Capabilities: {
        SkipSupported                : false,
        TopSupported                 : false,
        ExpandRestrictions.Expandable: false,
        SelectSupport.Supported      : false,
        SortRestrictions.Sortable    : false,
        FilterRestrictions.Filterable: false,
        CountRestrictions.Countable  : false,
        SearchRestrictions.Searchable: false,
        UpdateRestrictions.Updatable : false,
        DeleteRestrictions.Deletable : false,
        ReadRestrictions             : {
            CustomQueryOptions   : [
                {
                    Name       : 'skip',
                    Description: 'The number of query results to skip. A value less than 0 SHALL be interpreted as 0. Example: ?skip=10'
                },
                {
                    Name       : 'top',
                    Description: 'Non-negative integer. Specifies the desired maximum number of query results to return per page. Example: ?top=10'
                }
            ],
            ReadByKeyRestrictions: {CustomQueryOptions: []}
        }
    }
    aspect definition {};

    @Capabilities.ReadRestrictions.CustomQueryOptions: []
    aspect compositionDefinition : definition {};
}

extend SchedulingProviderService.JobDefinition with SchedulingProviderService.definition;
extend SchedulingProviderService.JobParameterDefinition with SchedulingProviderService.compositionDefinition;
extend SchedulingProviderService.Job with SchedulingProviderService.definition;
extend SchedulingProviderService.JobParameter with SchedulingProviderService.compositionDefinition;
extend SchedulingProviderService.JobResult with SchedulingProviderService.compositionDefinition;
extend SchedulingProviderService.JobResultMessage with SchedulingProviderService.compositionDefinition;
