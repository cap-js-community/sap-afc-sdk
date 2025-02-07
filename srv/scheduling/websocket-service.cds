using scheduling.JobStatusCode from '../../db/scheduling';

@ws
@path: '/ws/job-scheduling'
@impl: '@cap-js-community/sap-afc-sdk/srv/scheduling/websocket-service.js'
service SchedulingWebsocketService {
    event jobStatusChanged {
        ID : UUID;
        status: JobStatusCode;
    };
}
