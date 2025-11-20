namespace sapafcsdk.scheduling;

using sapafcsdk.scheduling from '../../db/scheduling';

@Capabilities        : {
  KeyAsSegmentSupported: true,
  BatchSupported       : false
}
@Authorization       : {
  Authorizations : [
    {
      $Type      : 'Auth.OAuth2ClientCredentials',
      Name       : 'oauth2',
      Description: 'To access this API, use the OAuth 2.0 client credentials grant flow.',
      Scopes     : [],
      TokenUrl   : 'https://{subdomain}.authentication.{region}.hana.ondemand.com/oauth/token'
    },
    {
      $Type       : 'Auth.Http',
      Name        : 'bearer',
      Scheme      : 'bearer',
      BearerFormat: 'JWT',
      Description : 'To access this API, use the HTTP bearer authentication.'
    }
  ],
  SecuritySchemes: [
    {Authorization: 'oauth2'},
    {Authorization: 'bearer'}
  ]
}
@openapi             : 'SchedulingProviderV1Service'
@protocol            : 'rest'
@(path: '/api/job-scheduling/v1')
@title               : 'SAP Advanced Financial Closing Scheduling Provider Interface'
@Core.Description    : 'Defines how an application can integrate with job scheduling provider service'
@Core.LongDescription: 'The Scheduling Service Provider Interface of SAP Advanced Financial Closing allows the integration of third-party scheduling systems with SAP Advanced Financial Closing. It includes the retrieval of job definitions, as well as the scheduling and synchronization of jobs.'
service ProviderService {

  @readonly
  entity Capabilities {
    supportsNotification : Boolean;
    applicationUrl       : String;
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
      Name       : 'name',
      Description: 'Allows case-sensitive filtering of query results by search on name. Wildcard support at start and end via &ast;. Example: ?name=JOB&ast; (optional)'
    },
    {
      Name       : 'search',
      Description: 'Allows case-insensitive filtering of query results by search on name, description and long description. Example: ?search=Job (optional)'
    }
  ]
  @title                                           : null
  entity JobDefinition @readonly          as
    projection on scheduling.JobDefinition {
      *,
      parameters : redirected to JobParameterDefinition
                     on parameters.jobName = $self.name
    }
    excluding {
      texts,
      localized
    };

  @title: null
  entity JobParameterDefinition @readonly as
    projection on scheduling.JobParameterDefinition {
      key name,
      key job.name         as jobName, *,
          description,
          dataType.code    as dataType,
          type.code        as type,
          mappingType.code as mappingType
    }
    excluding {
      job,
      texts,
      localized
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
    },
    {
      Name       : 'name',
      Description: 'Allows filtering of query results by name. Example: ?name=JOB_1 (optional)'
    }
  ]
  @title                                           : null
  entity Job                              as
    projection on scheduling.Job {
      key ID         : String(255)  @readonly,
          definition.name as name,
          referenceID,
          version,
          status.code     as status @readonly, *,
          parameters : redirected to JobParameter
                         on parameters.jobID = $self.ID,
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
  entity JobParameter @readonly           as
    projection on scheduling.JobParameter {
      key ID                       : String(255) @readonly,
          job.ID          as jobID : String(255) @readonly,
          definition.name as name,
          @cds.validate: false
          value,
          *
    }
    excluding {
      definition,
      job
    };

  @title: null
  entity JobResult @readonly              as
    projection on scheduling.JobResult {
      key ID                 : String(255) @readonly,
          job.ID    as jobID : String(255) @readonly,
          type.code as type, *,
          messages           : redirected to JobResultMessage
                                 on messages.resultID = $self.ID,
    }
    excluding {
      job,
      type,
      data,
    }
    actions {
      function data() returns @Core.MediaType: 'application/octet-stream' LargeBinary;
    };

  @title: null
  entity JobResultMessage @readonly       as
    projection on scheduling.JobResultMessage {
      key ID                        : String(255) @readonly,
          result.ID     as resultID : String(255) @readonly,
          severity.code as severity, *
    }
    excluding {
      result,
      severity,
      texts,
      localized,
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

  aspect compositionDefinition : definition {};

  @Capabilities: {ReadRestrictions: {
    CustomQueryOptions   : [],
    ReadByKeyRestrictions: {CustomQueryOptions: []}
  }}
  aspect singleton : definition {};

  type NotificationName : String(255) enum {
    taskListStatusChanged;
  };

  type Notification {
    name  : NotificationName not null;
    ID    : String(255);
    value : String(5000);
  };

  action notify(notifications: many Notification);
}

extend ProviderService.Capabilities with ProviderService.singleton;
extend ProviderService.JobDefinition with ProviderService.definition;
extend ProviderService.JobParameterDefinition with ProviderService.compositionDefinition;
extend ProviderService.Job with ProviderService.definition;
extend ProviderService.JobParameter with ProviderService.compositionDefinition;
extend ProviderService.JobResult with ProviderService.compositionDefinition;
extend ProviderService.JobResultMessage with ProviderService.compositionDefinition;
