package cds.gen.scheduling;

import com.sap.cds.CdsData;
import com.sap.cds.Struct;
import com.sap.cds.ql.CdsName;
import java.lang.Boolean;
import java.lang.Object;
import java.lang.String;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.annotation.processing.Generated;

/**
 * Aspect to capture changes by user and name
 *
 * See https://cap.cloud.sap/docs/cds/common#aspect-managed
 */
@CdsName("scheduling.Job")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface Job extends CdsData {
  String ID = "ID";

  String CREATED_AT = "createdAt";

  String CREATED_BY = "createdBy";

  String MODIFIED_AT = "modifiedAt";

  String MODIFIED_BY = "modifiedBy";

  String REFERENCE_ID = "referenceID";

  String START_DATE_TIME = "startDateTime";

  String DEFINITION = "definition";

  String DEFINITION_NAME = "definition_name";

  String VERSION = "version";

  String LINK = "link";

  String STATUS = "status";

  String STATUS_CODE = "status_code";

  String TEST_RUN = "testRun";

  String PARAMETERS = "parameters";

  String RESULTS = "results";

  @CdsName(ID)
  String getId();

  @CdsName(ID)
  void setId(String id);

  Instant getCreatedAt();

  void setCreatedAt(Instant createdAt);

  /**
   * Canonical user ID
   */
  String getCreatedBy();

  /**
   * Canonical user ID
   */
  void setCreatedBy(String createdBy);

  Instant getModifiedAt();

  void setModifiedAt(Instant modifiedAt);

  /**
   * Canonical user ID
   */
  String getModifiedBy();

  /**
   * Canonical user ID
   */
  void setModifiedBy(String modifiedBy);

  String getReferenceID();

  void setReferenceID(String referenceID);

  Instant getStartDateTime();

  void setStartDateTime(Instant startDateTime);

  JobDefinition getDefinition();

  void setDefinition(Map<String, ?> definition);

  @CdsName(DEFINITION_NAME)
  String getDefinitionName();

  @CdsName(DEFINITION_NAME)
  void setDefinitionName(String definitionName);

  String getVersion();

  void setVersion(String version);

  String getLink();

  void setLink(String link);

  JobStatus getStatus();

  void setStatus(Map<String, ?> status);

  @CdsName(STATUS_CODE)
  String getStatusCode();

  @CdsName(STATUS_CODE)
  void setStatusCode(String statusCode);

  Boolean getTestRun();

  void setTestRun(Boolean testRun);

  List<JobParameter> getParameters();

  void setParameters(List<? extends Map<String, ?>> parameters);

  List<JobResult> getResults();

  void setResults(List<? extends Map<String, ?>> results);

  Job_ ref();

  static Job create() {
    return Struct.create(Job.class);
  }

  static Job of(Map<String, Object> map) {
    return Struct.access(map).as(Job.class);
  }

  static Job create(String id) {
    Map<String, Object> keys = new HashMap<>();
    keys.put(ID, id);
    return Struct.access(keys).as(Job.class);
  }
}
