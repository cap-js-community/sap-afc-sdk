using SchedulingMonitoringService as service from '../../srv/scheduling/monitoring-service';

annotate service.Job with @(
  UI.Identification            : [{
    $Type             : 'UI.DataFieldForAction',
    Label             : '{i18n>Cancel}',
    Action            : 'SchedulingMonitoringService.cancel',
    InvocationGrouping: #Isolated,
    Criticality       : #Negative
  }],
  UI.FieldGroup #General       : {
    $Type: 'UI.FieldGroupType',
    Data : [
      {
        $Type: 'UI.DataField',
        Value: definition_name,
      },
      {
        $Type: 'UI.DataField',
        Value: version,
      },
      {
        $Type: 'UI.DataField',
        Value: definition.description,
      },
      {
        $Type: 'UI.DataField',
        Value: definition.longDescription,
      },
      {
        $Type: 'UI.DataField',
        Value: referenceID,
      },
    ],
  },
  UI.FieldGroup #Details       : {
    $Type: 'UI.FieldGroupType',
    Data : [
      {
        $Type: 'UI.DataField',
        Value: status_code,
      },
      {
        $Type: 'UI.DataFieldWithUrl',
        Value: link,
        Url  : link,
      },
      {
        $Type: 'UI.DataField',
        Value: testRun,
      },
    ],
  },
  UI.FieldGroup #Administrative: {
    $Type: 'UI.FieldGroupType',
    Data : [
      {
        $Type: 'UI.DataField',
        Value: modifiedAt,
      },
      {
        $Type: 'UI.DataField',
        Value: modifiedBy,
      },
      {
        $Type: 'UI.DataField',
        Value: createdAt,
      },
      {
        $Type: 'UI.DataField',
        Value: createdBy,
      },
    ],
  },
  UI.FieldGroup #Capabilities  : {
    $Type: 'UI.FieldGroupType',
    Data : [
      {
        $Type: 'UI.DataField',
        Value: definition.supportsStartDateTime,
      },
      {
        $Type: 'UI.DataField',
        Value: definition.supportsTestRun,
      }
    ]
  },
  UI.HeaderFacets              : [
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>General}',
      Target: '@UI.FieldGroup#General',
    },
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>Details}',
      Target: '@UI.FieldGroup#Details',
    },
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>Administrative}',
      Target: '@UI.FieldGroup#Administrative',
    }
  ],
  UI.Facets                    : [
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>Capabilities}',
      Target: '@UI.FieldGroup#Capabilities',
    },
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>Parameters}',
      Target: 'parameters/@UI.PresentationVariant'
    },
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>Results}',
      Target: 'results/@UI.PresentationVariant'
    }
  ],
  UI.LineItem                  : [
    {
      $Type: 'UI.DataField',
      Value: ID,
    },
    {
      $Type: 'UI.DataField',
      Value: referenceID,
    },
    {
      $Type: 'UI.DataField',
      Value: definition_name,
    },
    {
      $Type: 'UI.DataField',
      Value: version,
    },
    {
      $Type: 'UI.DataField',
      Value: status_code,
    },
    {
      $Type: 'UI.DataField',
      Value: modifiedAt,
    },
    {
      $Type: 'UI.DataField',
      Value: createdAt,
    },
    {
      $Type: 'UI.DataField',
      Value: testRun,
    },
  ],
  UI.HeaderInfo                : {
    $Type         : 'UI.HeaderInfoType',
    TypeName      : '{i18n>Job}',
    TypeNamePlural: '{i18n>Jobs}',
    Title         : {
      Label: '{i18n>Job}',
      Value: ID
    },
    Description   : {Value: definition.name}
  },
  UI.PresentationVariant       : {
    Visualizations: ['@UI.LineItem'],
    SortOrder     : [{
      $Type     : 'Common.SortOrderType',
      Property  : createdAt,
      Descending: true
    }]
  },
  UI.SelectionFields           : [
    referenceID,
    definition_name,
    status_code,
    testRun
  ],
);

annotate service.Job {
  status      @Common.ValueListWithFixedValues: true  @Common.Text: status.name             @Common.TextArrangement: #TextFirst;
  link        @HTML5.LinkTarget: '_blank';
  definition  @ValueList                      : {
    entity: 'JobDefinition',
    type  : #Fixed
  }                                                   @Common.Text: definition.description  @Common.TextArrangement: #TextFirst;
};

annotate service.Job actions {
  cancel  @Common.IsActionCritical  @Core.OperationAvailable: {$edmJson: {$Or: [
    {$Eq: [
      {$Path: 'in/status_code'},
      'requested'
    ]},
    {$Eq: [
      {$Path: 'in/status_code'},
      'running'
    ]}
  ]}}
};

annotate service.Job with @(UI.LineItem.@UI.Criticality: criticality, );

annotate service.JobParameter with @(
  UI.FieldGroup #Details: {
    $Type: 'UI.FieldGroupType',
    Data : [
      {
        $Type: 'UI.DataField',
        Value: ID,
      },
      {
        $Type: 'UI.DataField',
        Value: definition_name,
      },
      {
        $Type: 'UI.DataField',
        Value: definition.type_code,
      },
      {
        $Type: 'UI.DataField',
        Value: definition.dataType_code,
      },
      {
        $Type: 'UI.DataField',
        Value: definition.mappingType_code,
      },
      {
        $Type: 'UI.DataField',
        Value: value,
      },
    ],
  },
  UI.HeaderFacets       : [{
    $Type : 'UI.ReferenceFacet',
    Label : '{i18n>Details}',
    Target: '@UI.FieldGroup#Details',
  }, ],
  UI.LineItem           : [
    {
      $Type: 'UI.DataField',
      Value: definition_name,
    },
    {
      $Type: 'UI.DataField',
      Value: definition.type_code,
    },
    {
      $Type: 'UI.DataField',
      Value: definition.dataType_code,
    },
    {
      $Type: 'UI.DataField',
      Value: definition.mappingType_code,
    },
    {
      $Type: 'UI.DataField',
      Value: value,
    },
  ],
  UI.HeaderInfo         : {
    $Type         : 'UI.HeaderInfoType',
    TypeName      : '{i18n>JobParameter}',
    TypeNamePlural: '{i18n>JobParameters}',
    Title         : {
      Label: '{i18n>JobParameter}',
      Value: definition_name
    },
    Description   : {Value: definition.type_code}
  },
  UI.PresentationVariant: {
    Visualizations: ['@UI.LineItem'],
    SortOrder     : [{
      $Type     : 'Common.SortOrderType',
      Property  : definition_name,
      Descending: false
    }]
  },
  UI.SelectionFields    : [definition.name],
);

annotate service.JobParameter {
  job @UI.Hidden;
}

annotate service.JobParameterDefinition {
  type         @Common.ValueListWithFixedValues: true  @Common.Text: type.name         @Common.TextArrangement: #TextFirst;
  dataType     @Common.ValueListWithFixedValues: true  @Common.Text: dataType.name     @Common.TextArrangement: #TextFirst;
  mappingType  @Common.ValueListWithFixedValues: true  @Common.Text: mappingType.name  @Common.TextArrangement: #TextFirst;
};

annotate service.JobResult with @(
  UI.FieldGroup #Details : {
    $Type: 'UI.FieldGroupType',
    Data : [
      {
        $Type: 'UI.DataField',
        Value: ID,
      },
      {
        $Type: 'UI.DataField',
        Value: name,
      },
      {
        $Type: 'UI.DataField',
        Value: type_code,
      },
      {
        $Type         : 'UI.DataFieldWithUrl',
        Value         : link,
        Url           : link,
        ![@UI.Hidden] : (type.code != 'link' ? true : false)
      },
      {
        $Type         : 'UI.DataField',
        Value         : filename,
        ![@UI.Hidden] : (type.code != 'data' ? true : false)
      },
      {
        $Type         : 'UI.DataField',
        Value         : mimeType,
        ![@UI.Hidden] : (type.code != 'data' ? true : false)
      },

    ],
  },
  UI.HeaderFacets        : [{
    $Type : 'UI.ReferenceFacet',
    Label : '{i18n>Details}',
    Target: '@UI.FieldGroup#Details',
  }, ],
  UI.Facets              : [{
    $Type         : 'UI.ReferenceFacet',
    Label         : '{i18n>Messages}',
    Target        : 'messages/@UI.PresentationVariant',
    ![@UI.Hidden] : (type.code != 'message' ? true : false)
  }],
  UI.LineItem            : [
    {
      $Type: 'UI.DataField',
      Value: name,
    },
    {
      $Type: 'UI.DataField',
      Value: type_code,
    },
    {
      $Type         : 'UI.DataFieldWithUrl',
      Value         : link,
      Url           : link,
      ![@UI.Hidden] : (type.code != 'link' ? true : false)
    },
    {
      $Type         : 'UI.DataField',
      Value         : filename,
      ![@UI.Hidden] : (type.code != 'data' ? true : false)
    },
    {
      $Type         : 'UI.DataField',
      Value         : mimeType,
      ![@UI.Hidden] : (type.code != 'data' ? true : false)
    }
  ],
  UI.HeaderInfo          : {
    $Type         : 'UI.HeaderInfoType',
    TypeName      : '{i18n>JobResult}',
    TypeNamePlural: '{i18n>JobResults}',
    Title         : {
      Label: '{i18n>JobResult}',
      Value: name
    },
    Description   : {Value: type.code}
  },
  UI.PresentationVariant : {
    Visualizations: ['@UI.LineItem'],
    SortOrder     : [{
      $Type     : 'Common.SortOrderType',
      Property  : name,
      Descending: false
    }]
  },
  UI.SelectionFields     : [],
);

annotate service.JobResult {
  job   @UI.Hidden;
  type  @Common.ValueListWithFixedValues: true  @Common.Text: type.name  @Common.TextArrangement: #TextFirst;
  link  @HTML5.LinkTarget: '_blank';
  data  @UI.Hidden;
};

annotate service.JobResultMessage with @(
  UI.FieldGroup #Details: {
    $Type: 'UI.FieldGroupType',
    Data : [
      {
        $Type: 'UI.DataField',
        Value: ID,
      },
      {
        $Type                    : 'UI.DataField',
        Value                    : severity_code,
        Criticality              : criticality,
        CriticalityRepresentation: #WithIcon,
      },
      {
        $Type: 'UI.DataField',
        Value: text,
      },
    ],
  },
  UI.HeaderFacets       : [{
    $Type : 'UI.ReferenceFacet',
    Label : '{i18n>Details}',
    Target: '@UI.FieldGroup#Details',
  }, ],
  UI.LineItem           : [
    {
      $Type                    : 'UI.DataField',
      Value                    : severity.numericCode,
      Criticality              : criticality,
      CriticalityRepresentation: #WithIcon,
    },
    {
      $Type: 'UI.DataField',
      Value: code,
    },
    {
      $Type: 'UI.DataField',
      Value: text,
    },
    {
      $Type: 'UI.DataField',
      Value: createdAt,
    },
  ],
  UI.HeaderInfo         : {
    $Type         : 'UI.HeaderInfoType',
    TypeName      : '{i18n>JobResult}',
    TypeNamePlural: '{i18n>JobResults}',
    Title         : {
      Label: '{i18n>JobResult}',
      Value: text
    },
    Description   : {Value: severity.code}
  },
  UI.PresentationVariant: {
    Visualizations: ['@UI.LineItem'],
    SortOrder     : [{
      $Type     : 'Common.SortOrderType',
      Property  : createdAt,
      Descending: false
    }]
  },
  UI.SelectionFields    : [],
);

annotate service.JobResultMessage {
  result    @UI.Hidden;
  severity  @Common.ValueListWithFixedValues: true  @Common.Text: severity.name  @Common.TextArrangement: #TextFirst;
};

annotate service.MessageSeverity {
  numericCode  @Common.ValueListWithFixedValues: true  @Common.Text: name  @Common.TextArrangement: #TextFirst;
};

annotate service.JobResultMessage with @(UI.LineItem.@UI.Criticality: criticality, );
