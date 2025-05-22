package cds.gen.schedulingprocessingservice;

import com.sap.cds.services.EventContext;
import com.sap.cds.services.EventName;
import java.lang.String;
import javax.annotation.processing.Generated;

@EventName("syncJob")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface SyncJobContext extends EventContext {
  String CDS_NAME = "syncJob";

  static SyncJobContext create() {
    return EventContext.create(SyncJobContext.class, null);
  }
}
