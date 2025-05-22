package cds.gen.schedulingmonitoringservice;

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
@CdsName("SchedulingMonitoringService.JobParameter")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobParameter extends CdsData {
  String ID = "ID";

  String JOB = "job";

  String JOB_ID = "job_ID";

  String DEFINITION = "definition";

  String DEFINITION_JOB_NAME = "definition_job_name";

  String DEFINITION_NAME = "definition_name";

  String VALUE = "value";

  @CdsName(ID)
  String getId();

  @CdsName(ID)
  void setId(String id);

  Job getJob();

  void setJob(Map<String, ?> job);

  @CdsName(JOB_ID)
  String getJobId();

  @CdsName(JOB_ID)
  void setJobId(String jobId);

  JobParameterDefinition getDefinition();

  void setDefinition(Map<String, ?> definition);

  @CdsName(DEFINITION_JOB_NAME)
  String getDefinitionJobName();

  @CdsName(DEFINITION_JOB_NAME)
  void setDefinitionJobName(String definitionJobName);

  @CdsName(DEFINITION_NAME)
  String getDefinitionName();

  @CdsName(DEFINITION_NAME)
  void setDefinitionName(String definitionName);

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
