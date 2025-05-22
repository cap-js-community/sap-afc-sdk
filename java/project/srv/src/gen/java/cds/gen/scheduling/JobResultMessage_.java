package cds.gen.scheduling;

import com.sap.cds.ql.CdsName;
import com.sap.cds.ql.ElementRef;
import com.sap.cds.ql.StructuredType;
import com.sap.cds.ql.cqn.CqnPredicate;
import java.lang.String;
import java.time.Instant;
import java.util.function.Function;
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
public interface JobResultMessage_ extends StructuredType<JobResultMessage_> {
  String ID = "ID";

  String RESULT_ID = "result_ID";

  String SEVERITY_CODE = "severity_code";

  String CDS_NAME = "scheduling.JobResultMessage";

  @CdsName(ID)
  ElementRef<String> ID();

  JobResult_ result();

  JobResult_ result(Function<JobResult_, CqnPredicate> filter);

  @CdsName(RESULT_ID)
  ElementRef<String> result_ID();

  ElementRef<String> code();

  ElementRef<String> text();

  MessageSeverity_ severity();

  MessageSeverity_ severity(Function<MessageSeverity_, CqnPredicate> filter);

  @CdsName(SEVERITY_CODE)
  ElementRef<String> severity_code();

  ElementRef<Instant> createdAt();

  JobResultMessageTexts_ texts();

  JobResultMessageTexts_ texts(Function<JobResultMessageTexts_, CqnPredicate> filter);

  JobResultMessageTexts_ localized();

  JobResultMessageTexts_ localized(Function<JobResultMessageTexts_, CqnPredicate> filter);
}
