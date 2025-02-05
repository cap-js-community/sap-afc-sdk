using scheduling.JobStatusCode from '../../db/scheduling';

@protocol: 'none'
@impl    : './processing-service.js'
service SchedulingProcessingService {
    action processJob(ID: String);
    action updateJob(ID: String, status: JobStatusCode);
    action cancelJob(ID: String);
}
