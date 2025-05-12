using sap.common.Locale from '@sap/cds/common';
using scheduling.JobStatusCode from '../../db/scheduling';
using scheduling.ResultTypeCode from '../../db/scheduling';
using scheduling.MessageSeverityCode from '../../db/scheduling';

@protocol: 'none'
service SchedulingProcessingService {

  type JobResult {
    name     : String(255) not null;
    type     : ResultTypeCode not null;
    link     : String(5000);

    @Core.IsMediaType
    mimeType : String(255);
    filename : String(5000);

    @Core.MediaType                  : mimeType
    @Core.ContentDisposition.Type    : 'attachment'
    @Core.ContentDisposition.Filename: filename
    data     : LargeBinary;
    messages : many JobResultMessage;
  };

  type JobResultMessage {
    code      : String(255) not null;
    text      : String(5000);
    severity  : MessageSeverityCode not null;
    createdAt : Timestamp;
    texts     : many JobResultMessageText;
  };

  type JobResultMessageText {
    locale : Locale not null;
    text   : String(5000) not null;
  };

  action processJob(ID : String(255), testRun : Boolean);
  action updateJob(ID : String(255), status : JobStatusCode, results : many JobResult);
  action cancelJob(ID : String(255));
  action syncJob();
}
