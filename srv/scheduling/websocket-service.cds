namespace sapafcsdk.scheduling;

using sapafcsdk.scheduling.JobStatusCode from '../../db/scheduling';

@path    : 'job-scheduling'
@protocol: 'ws'
service SchedulingWebsocketService {

  event jobStatusChanged {
    IDs    : many UUID;
    status : JobStatusCode;
  };

  action eventQueueCluster.jobStatusChanged() returns {};
}
