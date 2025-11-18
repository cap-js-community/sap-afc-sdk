using sapafcsdk.scheduling.MonitoringService from '../../srv/scheduling/monitoring-service';

annotate MonitoringService.Job with @(
  UI.Identification            : [{
    $Type             : 'UI.DataFieldForAction',
    Label             : '{i18n>Cancel}',
    Action            : 'MonitoringService.cancel',
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
        Value: definition.vendorName,
      },
      {
        $Type: 'UI.DataField',
        Value: definition.vendorSystem,
      }
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
        $Type: 'UI.DataField',
        Value: referenceID,
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
      {
        $Type: 'UI.DataField',
        Value: errorOnlyRun,
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
      },
      {
        $Type: 'UI.DataField',
        Value: definition.supportsErrorOnlyRun,
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
      $Type   : 'Common.SortOrderType',
      Property: createdAt,
      Descending
    }]
  },
  UI.SelectionFields           : [
    referenceID,
    definition_name,
    status_code,
    testRun,
    errorOnlyRun
  ],
);

annotate MonitoringService.Job {
  status      @Common.ValueListWithFixedValues  @Common.Text: status.name             @Common.TextArrangement: #TextFirst;
  link        @HTML5.LinkTarget: '_blank';
  definition  @ValueList: {
    entity: 'JobDefinition',
    type  : #Fixed
  }                                             @Common.Text: definition.description  @Common.TextArrangement: #TextFirst;
};

annotate MonitoringService.Job actions {
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

annotate MonitoringService.Job with @(UI.LineItem.@UI.Criticality: criticality, );

annotate MonitoringService.JobParameter with @(
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

annotate MonitoringService.JobParameter {
  job @UI.Hidden;
}

annotate MonitoringService.JobParameterDefinition {
  type         @Common.ValueListWithFixedValues  @Common.Text: type.name         @Common.TextArrangement: #TextFirst;
  dataType     @Common.ValueListWithFixedValues  @Common.Text: dataType.name     @Common.TextArrangement: #TextFirst;
  mappingType  @Common.ValueListWithFixedValues  @Common.Text: mappingType.name  @Common.TextArrangement: #TextFirst;
};

annotate MonitoringService.JobResult with @(
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

annotate MonitoringService.JobResult {
  job   @UI.Hidden;
  type  @Common.ValueListWithFixedValues  @Common.Text: type.name  @Common.TextArrangement: #TextFirst;
  link  @HTML5.LinkTarget: '_blank';
  data  @UI.Hidden;
};

annotate MonitoringService.JobResultMessage with @(
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
    TypeName      : '{i18n>JobResultMessage}',
    TypeNamePlural: '{i18n>JobResultMessages}',
    Title         : {
      Label: '{i18n>JobResultMessage}',
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

annotate MonitoringService.JobResultMessage {
  result    @UI.Hidden;
  severity  @Common.ValueListWithFixedValues  @Common.Text: severity.name  @Common.TextArrangement: #TextFirst;
};

annotate MonitoringService.MessageSeverity {
  numericCode  @Common.ValueListWithFixedValues  @Common.Text: name  @Common.TextArrangement: #TextFirst;
};

annotate MonitoringService.JobResultMessage with @(UI.LineItem.@UI.Criticality: criticality, );
