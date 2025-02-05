using scheduling.JobStatusCode from '../../db/scheduling';

@ws
@path: '/srv/job-scheduling/websockets'
@impl: './websocket-service.js'
service SchedulingWebsocketService {
    event jobStatusChanged {
        ID : UUID;
        status: JobStatusCode;
    };
}
