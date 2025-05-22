package cds.gen.schedulingproviderservice;

import com.sap.cds.CdsData;
import com.sap.cds.Struct;
import com.sap.cds.ql.CdsName;
import java.lang.Object;
import java.lang.String;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import javax.annotation.processing.Generated;

/**
 * Aspect for entities with canonical universal IDs
 *
 * See https://cap.cloud.sap/docs/cds/common#aspect-cuid
 */
@CdsName("SchedulingProviderService.JobResultMessage")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobResultMessage extends CdsData {
  String ID = "ID";

  String RESULT_ID = "resultID";

  String SEVERITY = "severity";

  String CODE = "code";

  String TEXT = "text";

  String CREATED_AT = "createdAt";

  @CdsName(ID)
  String getId();

  @CdsName(ID)
  void setId(String id);

  String getResultID();

  void setResultID(String resultID);

  String getSeverity();

  void setSeverity(String severity);

  String getCode();

  void setCode(String code);

  String getText();

  void setText(String text);

  Instant getCreatedAt();

  void setCreatedAt(Instant createdAt);

  JobResultMessage_ ref();

  static JobResultMessage create() {
    return Struct.create(JobResultMessage.class);
  }

  static JobResultMessage of(Map<String, Object> map) {
    return Struct.access(map).as(JobResultMessage.class);
  }

  static JobResultMessage create(String id) {
    Map<String, Object> keys = new HashMap<>();
    keys.put(ID, id);
    return Struct.access(keys).as(JobResultMessage.class);
  }
}
