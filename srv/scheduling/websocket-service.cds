using scheduling.JobStatusCode from '../../db/scheduling';

@ws
@path: '/ws/job-scheduling'
service SchedulingWebsocketService {

  event jobStatusChanged {
    IDs    : many UUID;
    status : JobStatusCode;
  };

  action clusterQueueEntries.jobStatusChanged() returns {};
}
