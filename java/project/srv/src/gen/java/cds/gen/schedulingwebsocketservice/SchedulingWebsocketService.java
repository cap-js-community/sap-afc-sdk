package cds.gen.schedulingwebsocketservice;

import com.sap.cds.ql.CdsName;
import com.sap.cds.services.cds.ApplicationService;
import com.sap.cds.services.cds.CqnService;
import com.sap.cds.services.cds.RemoteService;
import javax.annotation.processing.Generated;

@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
@CdsName(SchedulingWebsocketService_.CDS_NAME)
public interface SchedulingWebsocketService extends CqnService {
  @CdsName(EventQueueClusterJobStatusChangedContext.CDS_NAME)
  EventQueueClusterJobStatusChangedContext.ReturnType eventQueueCluster_jobStatusChanged();

  interface Application extends ApplicationService, SchedulingWebsocketService {
  }

  interface Remote extends RemoteService, SchedulingWebsocketService {
  }
}
