package cds.gen.schedulingmonitoringservice;

import com.sap.cds.ql.CdsName;
import com.sap.cds.services.cds.ApplicationService;
import com.sap.cds.services.cds.CqnService;
import com.sap.cds.services.cds.RemoteService;
import com.sap.cds.services.draft.DraftService;
import javax.annotation.processing.Generated;

@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
@CdsName(SchedulingMonitoringService_.CDS_NAME)
public interface SchedulingMonitoringService extends CqnService {
  @CdsName(JobCancelContext.CDS_NAME)
  Job cancel(Job_ ref);

  interface Application extends ApplicationService, SchedulingMonitoringService {
  }

  interface Remote extends RemoteService, SchedulingMonitoringService {
  }

  interface Draft extends DraftService, SchedulingMonitoringService {
  }
}
