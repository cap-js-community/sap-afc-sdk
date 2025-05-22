package cds.gen.schedulingproviderservice;

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
@CdsName(SchedulingProviderService_.CDS_NAME)
public interface SchedulingProviderService extends CqnService {
  @CdsName(JobCancelContext.CDS_NAME)
  void cancel(Job_ ref);

  @CdsName(JobResultDataContext.CDS_NAME)
  byte[] data(JobResult_ ref);

  interface Application extends ApplicationService, SchedulingProviderService {
  }

  interface Remote extends RemoteService, SchedulingProviderService {
  }
}
