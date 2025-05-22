package cds.gen.scheduling;

import com.sap.cds.CdsData;
import com.sap.cds.Struct;
import com.sap.cds.ql.CdsName;
import java.lang.Object;
import java.lang.String;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.annotation.processing.Generated;

/**
 * Aspect for entities with canonical universal IDs
 *
 * See https://cap.cloud.sap/docs/cds/common#aspect-cuid
 */
@CdsName("scheduling.JobResultMessage")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobResultMessage extends CdsData {
  String ID = "ID";

  String RESULT = "result";

  String RESULT_ID = "result_ID";

  String CODE = "code";

  String TEXT = "text";

  String SEVERITY = "severity";

  String SEVERITY_CODE = "severity_code";

  String CREATED_AT = "createdAt";

  String TEXTS = "texts";

  String LOCALIZED = "localized";

  @CdsName(ID)
  String getId();

  @CdsName(ID)
  void setId(String id);

  JobResult getResult();

  void setResult(Map<String, ?> result);

  @CdsName(RESULT_ID)
  String getResultId();

  @CdsName(RESULT_ID)
  void setResultId(String resultId);

  String getCode();

  void setCode(String code);

  String getText();

  void setText(String text);

  MessageSeverity getSeverity();

  void setSeverity(Map<String, ?> severity);

  @CdsName(SEVERITY_CODE)
  String getSeverityCode();

  @CdsName(SEVERITY_CODE)
  void setSeverityCode(String severityCode);

  Instant getCreatedAt();

  void setCreatedAt(Instant createdAt);

  List<JobResultMessageTexts> getTexts();

  void setTexts(List<? extends Map<String, ?>> texts);

  JobResultMessageTexts getLocalized();

  void setLocalized(Map<String, ?> localized);

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
