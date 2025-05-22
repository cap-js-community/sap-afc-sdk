package cds.gen.schedulingwebsocketservice;

import com.sap.cds.services.EventContext;
import com.sap.cds.services.EventName;
import java.lang.String;
import javax.annotation.processing.Generated;

@EventName("jobStatusChanged")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobStatusChangedContext extends EventContext {
  String CDS_NAME = "jobStatusChanged";

  JobStatusChanged getData();

  void setData(JobStatusChanged event);

  static JobStatusChangedContext create() {
    return EventContext.create(JobStatusChangedContext.class, null);
  }
}
