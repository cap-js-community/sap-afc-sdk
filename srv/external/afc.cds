namespace sap.afc;

@cds.external
service IntegrationService {

  type ExternalRequestStatus   : Integer enum {
    Open = 0;
    InProgress = 1;
    Done = 2;
    Error = 3;
  };

  type ExternalJobStatus       : String(255) enum {
    requested;
    running;
    completed;
    completedWithWarning;
    completedWithError;
    failed;
    cancelRequested;
    canceled;
  };

  type ExternalJobType         : String(255) enum {
    workflow;
    blackline;
    thirdparty;
    agent;
  };

  type ExternalResultType      : String(255) enum {
    message;
  };

  type ExternalMessageSeverity : String(255) enum {
    success;
    info;
    warning;
    error;
  };

  @readonly
  @cds.persistence.skip
  entity TaskExternalJob {
    key ID                     : UUID;
        taskId                 : UUID;
        taskName               : String(255);
        taskListId             : UUID;
        taskListName           : String(255);
        taskListInstance       : String(10);
        externalJobId          : UUID;
        externalJobGroupId     : UUID;
        externalJobName        : String(5000);
        externalJobReferenceId : String(500);
        jobStatus              : ExternalJobStatus;
        jobType                : ExternalJobType;
  };

  @insertonly
  @cds.persistence.skip
  entity TaskExternalJobInput {
        @readonly
    key ID            : UUID;

        @mandatory
        externalJobId : UUID;

        @readonly
        requestStatus : ExternalRequestStatus default #Open;

        @mandatory
        jobStatus     : ExternalJobStatus;

        results       : Composition of many TaskExternalJobInputResult
                          on results.job = $self;
  };

  @insertonly
  @cds.persistence.skip
  entity TaskExternalJobInputResult {
        @readonly
    key ID       : UUID;
        job      : Association to TaskExternalJobInput;
        name     : String(255);
        type     : ExternalResultType(255);
        messages : Composition of many TaskExternalJobInputResultMessage
                     on messages.result = $self;
  };

  @insertonly
  @cds.persistence.skip
  entity TaskExternalJobInputResultMessage {
        @readonly
    key ID        : UUID;
        result    : Association to TaskExternalJobInputResult;

        @mandatory
        code      : String(255);
        text      : String(5000);
        severity  : ExternalMessageSeverity(255);
        createdAt : Timestamp;
  };
};
