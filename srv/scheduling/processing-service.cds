using scheduling.JobStatusCode from '../../db/scheduling';

@protocol: 'none'
@impl    : '@cap-js-community/sap-afc-sdk/srv/scheduling/processing-service.js'
service SchedulingProcessingService {
    action processJob(ID: String);
    action updateJob(ID: String, status: JobStatusCode);
    action cancelJob(ID: String);
}
