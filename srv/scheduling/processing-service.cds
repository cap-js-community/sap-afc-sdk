using scheduling.JobStatusCode from '../../db/scheduling';
using scheduling.ResultTypeCode from '../../db/scheduling';
using scheduling.MessageSeverityCode from '../../db/scheduling';

@protocol: 'none'
@impl    : '@cap-js-community/sap-afc-sdk/srv/scheduling/processing-service.js'
service SchedulingProcessingService {

  type JobResult {
    name     :      String not null;
    type     :      ResultTypeCode not null;
    link     :      String;
    mimeType :      String;
    filename :      String;
    data     :      LargeBinary;
    messages : many JobResultMessage;
  };

  type JobResultMessage {
    text     : String not null;
    severity : MessageSeverityCode not null;
  };

  action processJob(ID : String, testRun : Boolean);
  action updateJob(ID : String, status : JobStatusCode, results : many JobResult);
  action cancelJob(ID : String);
}
