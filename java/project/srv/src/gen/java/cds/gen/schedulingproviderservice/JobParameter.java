package cds.gen.schedulingproviderservice;

import com.sap.cds.CdsData;
import com.sap.cds.Struct;
import com.sap.cds.ql.CdsName;
import java.lang.Object;
import java.lang.String;
import java.util.HashMap;
import java.util.Map;
import javax.annotation.processing.Generated;

/**
 * Aspect for entities with canonical universal IDs
 *
 * See https://cap.cloud.sap/docs/cds/common#aspect-cuid
 */
@CdsName("SchedulingProviderService.JobParameter")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobParameter extends CdsData {
  String ID = "ID";

  String JOB_ID = "jobID";

  String NAME = "name";

  String VALUE = "value";

  @CdsName(ID)
  String getId();

  @CdsName(ID)
  void setId(String id);

  String getJobID();

  void setJobID(String jobID);

  String getName();

  void setName(String name);

  String getValue();

  void setValue(String value);

  JobParameter_ ref();

  static JobParameter create() {
    return Struct.create(JobParameter.class);
  }

  static JobParameter of(Map<String, Object> map) {
    return Struct.access(map).as(JobParameter.class);
  }

  static JobParameter create(String id) {
    Map<String, Object> keys = new HashMap<>();
    keys.put(ID, id);
    return Struct.access(keys).as(JobParameter.class);
  }
}
