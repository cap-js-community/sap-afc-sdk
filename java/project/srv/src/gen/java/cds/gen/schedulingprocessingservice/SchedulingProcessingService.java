package cds.gen.schedulingprocessingservice;

import com.sap.cds.ql.CdsName;
import com.sap.cds.services.cds.ApplicationService;
import com.sap.cds.services.cds.CqnService;
import com.sap.cds.services.cds.RemoteService;
import java.lang.Boolean;
import java.lang.String;
import java.util.Collection;
import javax.annotation.processing.Generated;

@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
@CdsName(SchedulingProcessingService_.CDS_NAME)
public interface SchedulingProcessingService extends CqnService {
  @CdsName(ProcessJobContext.CDS_NAME)
  void processJob(@CdsName(ProcessJobContext.ID) String id,
      @CdsName(ProcessJobContext.TEST_RUN) Boolean testRun);

  @CdsName(SyncJobContext.CDS_NAME)
  void syncJob();

  @CdsName(CancelJobContext.CDS_NAME)
  void cancelJob(@CdsName(CancelJobContext.ID) String id);

  @CdsName(UpdateJobContext.CDS_NAME)
  void updateJob(@CdsName(UpdateJobContext.ID) String id,
      @CdsName(UpdateJobContext.STATUS) String status,
      @CdsName(UpdateJobContext.RESULTS) Collection<JobResult> results);

  interface Application extends ApplicationService, SchedulingProcessingService {
  }

  interface Remote extends RemoteService, SchedulingProcessingService {
  }
}
