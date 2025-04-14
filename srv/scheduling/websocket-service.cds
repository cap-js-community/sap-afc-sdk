using scheduling.JobStatusCode from '../../db/scheduling';

@ws
@path: 'job-scheduling'
service SchedulingWebsocketService {

  event jobStatusChanged {
    IDs    : many UUID;
    status : JobStatusCode;
  };

  action eventQueueCluster.jobStatusChanged() returns {};
}
