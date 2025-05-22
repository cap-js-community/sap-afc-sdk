package cds.gen.schedulingprocessingservice;

import com.sap.cds.ql.CdsName;
import com.sap.cds.services.EventContext;
import com.sap.cds.services.EventName;
import java.lang.String;
import java.util.Collection;
import javax.annotation.processing.Generated;

@EventName("updateJob")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface UpdateJobContext extends EventContext {
  String ID = "ID";

  String STATUS = "status";

  String RESULTS = "results";

  String CDS_NAME = "updateJob";

  @CdsName(ID)
  String getId();

  @CdsName(ID)
  void setId(String id);

  String getStatus();

  void setStatus(String status);

  Collection<JobResult> getResults();

  void setResults(Collection<JobResult> results);

  static UpdateJobContext create() {
    return EventContext.create(UpdateJobContext.class, null);
  }
}
