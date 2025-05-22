package cds.gen.schedulingprocessingservice;

import com.sap.cds.CdsData;
import com.sap.cds.Struct;
import com.sap.cds.ql.CdsName;
import java.lang.Object;
import java.lang.String;
import java.time.Instant;
import java.util.Collection;
import java.util.Map;
import javax.annotation.processing.Generated;

@CdsName("SchedulingProcessingService.JobResultMessage")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobResultMessage extends CdsData {
  String CODE = "code";

  String TEXT = "text";

  String SEVERITY = "severity";

  String CREATED_AT = "createdAt";

  String TEXTS = "texts";

  String getCode();

  void setCode(String code);

  String getText();

  void setText(String text);

  String getSeverity();

  void setSeverity(String severity);

  Instant getCreatedAt();

  void setCreatedAt(Instant createdAt);

  Collection<JobResultMessageText> getTexts();

  void setTexts(Collection<JobResultMessageText> texts);

  static JobResultMessage create() {
    return Struct.create(JobResultMessage.class);
  }

  static JobResultMessage of(Map<String, Object> map) {
    return Struct.access(map).as(JobResultMessage.class);
  }
}
