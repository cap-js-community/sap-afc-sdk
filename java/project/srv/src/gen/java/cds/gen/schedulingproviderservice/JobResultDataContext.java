package cds.gen.schedulingproviderservice;

import com.sap.cds.ql.cqn.CqnSelect;
import com.sap.cds.services.EventContext;
import com.sap.cds.services.EventName;
import java.lang.String;
import javax.annotation.processing.Generated;

@EventName("data")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobResultDataContext extends EventContext {
  String CDS_NAME = "data";

  CqnSelect getCqn();

  void setCqn(CqnSelect select);

  static JobResultDataContext create() {
    return EventContext.create(JobResultDataContext.class, "SchedulingProviderService.JobResult");
  }

  void setResult(byte[] result);

  byte[] getResult();

  static JobResultDataContext create(String entityName) {
    return EventContext.create(JobResultDataContext.class, entityName);
  }
}
