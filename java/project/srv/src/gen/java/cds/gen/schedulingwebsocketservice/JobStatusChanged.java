package cds.gen.schedulingwebsocketservice;

import com.sap.cds.CdsData;
import com.sap.cds.Struct;
import com.sap.cds.ql.CdsName;
import java.lang.Object;
import java.lang.String;
import java.util.Collection;
import java.util.Map;
import javax.annotation.processing.Generated;

@CdsName("SchedulingWebsocketService.jobStatusChanged")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobStatusChanged extends CdsData {
  String IDS = "IDs";

  String STATUS = "status";

  @CdsName(IDS)
  Collection<String> getIDs();

  @CdsName(IDS)
  void setIDs(Collection<String> iDs);

  String getStatus();

  void setStatus(String status);

  static JobStatusChanged create() {
    return Struct.create(JobStatusChanged.class);
  }

  static JobStatusChanged of(Map<String, Object> map) {
    return Struct.access(map).as(JobStatusChanged.class);
  }
}
