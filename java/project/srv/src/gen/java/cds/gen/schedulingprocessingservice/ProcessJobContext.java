package cds.gen.schedulingprocessingservice;

import com.sap.cds.ql.CdsName;
import com.sap.cds.services.EventContext;
import com.sap.cds.services.EventName;
import java.lang.Boolean;
import java.lang.String;
import javax.annotation.processing.Generated;

@EventName("processJob")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface ProcessJobContext extends EventContext {
  String ID = "ID";

  String TEST_RUN = "testRun";

  String CDS_NAME = "processJob";

  @CdsName(ID)
  String getId();

  @CdsName(ID)
  void setId(String id);

  Boolean getTestRun();

  void setTestRun(Boolean testRun);

  static ProcessJobContext create() {
    return EventContext.create(ProcessJobContext.class, null);
  }
}
