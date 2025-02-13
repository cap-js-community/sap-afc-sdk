using SchedulingMonitoringService as service from '../../srv/scheduling/monitoring-service';

annotate service.Job with @(
    UI.Identification     : [
        {Value: ID},
        {
            $Type             : 'UI.DataFieldForAction',
            Label             : '{i18n>Cancel}',
            Action            : 'SchedulingMonitoringService.cancel',
            InvocationGrouping: #Isolated,
            Criticality       : #Negative
        }
    ],
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
                Value: version,
            },
            {
                $Type: 'UI.DataFieldWithUrl',
                Value: link,
                Url  : link,
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
        ],
    },
    UI.HeaderFacets       : [{
        $Type : 'UI.ReferenceFacet',
        Label : '{i18n>Details}',
        Target: '@UI.FieldGroup#Details',
    }, ],
    UI.Facets             : [
        {
            $Type : 'UI.ReferenceFacet',
            Label : '{i18n>Parameters}',
            Target: 'parameters/@UI.LineItem'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : '{i18n>Results}',
            Target: 'results/@UI.LineItem'
        }
    ],
    UI.LineItem           : [
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
    ],
    UI.HeaderInfo         : {
        TypeName      : '{i18n>Job}',
        TypeNamePlural: '{i18n>Jobs}',
    },
    UI.PresentationVariant: {SortOrder: [{
        $Type     : 'Common.SortOrderType',
        Property  : createdBy,
        Descending: true
    }]},
    UI.SelectionFields    : [
        definition_name,
        status_code,
    ],
);

annotate service.Job {
    status      @Common.ValueListWithFixedValues: true  @Common.Text: status.name      @Common.TextArrangement: #TextFirst;
    link        @HTML5.LinkTarget               : '_blank';
    definition  @ValueList                      : {
        entity: 'JobDefinition',
        type  : #Fixed
    }                                                   @Common.Text: definition.name  @Common.TextArrangement: #TextFirst;
};

annotate service.Job actions {
    cancel @Common.IsActionCritical;
};

annotate service.JobParameter with @(
    UI.Identification     : [{Value: ID}, ],
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
        TypeName      : '{i18n>Job}',
        TypeNamePlural: '{i18n>Jobs}',
    },
    UI.PresentationVariant: {SortOrder: [{
        $Type     : 'Common.SortOrderType',
        Property  : definition.name,
        Descending: true
    }]},
    UI.SelectionFields    : [definition.name],
);

annotate service.JobParameterDefinition {
    type         @Common.ValueListWithFixedValues: true  @Common.Text: type.name         @Common.TextArrangement: #TextFirst;
    dataType     @Common.ValueListWithFixedValues: true  @Common.Text: dataType.name     @Common.TextArrangement: #TextFirst;
    mappingType  @Common.ValueListWithFixedValues: true  @Common.Text: mappingType.name  @Common.TextArrangement: #TextFirst;
};

annotate service.JobResult with @(
    UI.Identification     : [{Value: ID}, ],
    UI.FieldGroup #Details: {
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
                $Type: 'UI.DataFieldWithUrl',
                Value: link,
                Url  : link,
                ![@UI.Hidden] : (type.code != 'link' ? true : false)
            },
            {
                $Type: 'UI.DataField',
                Value: mimeType,
                ![@UI.Hidden] : (type.code != 'data' ? true : false)
            },
            {
                $Type: 'UI.DataField',
                Value: fileName,
                ![@UI.Hidden] : (type.code != 'data' ? true : false)
            }
        ],
    },
    UI.HeaderFacets       : [{
        $Type : 'UI.ReferenceFacet',
        Label : '{i18n>Details}',
        Target: '@UI.FieldGroup#Details',
    }, ],
    UI.Facets             : [{
        $Type         : 'UI.ReferenceFacet',
        Label         : '{i18n>Messages}',
        Target        : 'messages/@UI.LineItem',
        ![@UI.Hidden] : (type.code != 'message' ? true : false)
    }],
    UI.LineItem           : [
        {
            $Type: 'UI.DataField',
            Value: name,
        },
        {
            $Type: 'UI.DataField',
            Value: type_code,
        },
        {
            $Type: 'UI.DataFieldWithUrl',
            Value: link,
            Url  : link,
            ![@UI.Hidden] : (type.code != 'link' ? true : false)
        },
        {
            $Type: 'UI.DataField',
            Value: mimeType,
            ![@UI.Hidden] : (type.code != 'data' ? true : false)
        },
        {
            $Type: 'UI.DataField',
            Value: fileName,
            ![@UI.Hidden] : (type.code != 'data' ? true : false)
        }
    ],
    UI.HeaderInfo         : {
        TypeName      : '{i18n>JobResult}',
        TypeNamePlural: '{i18n>JobResults}',
    },
    UI.PresentationVariant: {SortOrder: [{
        $Type     : 'Common.SortOrderType',
        Property  : ID,
        Descending: true
    }]},
    UI.SelectionFields    : [ID],
);

annotate service.JobResult {
    type  @Common.ValueListWithFixedValues: true  @Common.Text: type.name  @Common.TextArrangement: #TextFirst;
    link  @HTML5.LinkTarget               : '_blank';
};

annotate service.JobResultMessage with @(
    UI.Identification     : [{Value: ID}, ],
    UI.FieldGroup #Details: {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type: 'UI.DataField',
                Value: ID,
            },
            {
                $Type: 'UI.DataField',
                Value: text,
            },
            {
                $Type: 'UI.DataField',
                Value: severity_code,
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
            Value: text,
        },
        {
            $Type: 'UI.DataField',
            Value: severity_code,
        },
    ],
    UI.HeaderInfo         : {
        TypeName      : '{i18n>JobResult}',
        TypeNamePlural: '{i18n>JobResults}',
    },
    UI.PresentationVariant: {SortOrder: [{
        $Type     : 'Common.SortOrderType',
        Property  : ID,
        Descending: true
    }]},
    UI.SelectionFields    : [ID],
);

annotate service.JobResultMessage {
    severity  @Common.ValueListWithFixedValues: true  @Common.Text: severity.name  @Common.TextArrangement: #TextFirst;
};
