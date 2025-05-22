package cds.gen.scheduling;

import com.sap.cds.ql.CdsName;
import com.sap.cds.ql.ElementRef;
import com.sap.cds.ql.StructuredType;
import com.sap.cds.ql.cqn.CqnPredicate;
import java.io.InputStream;
import java.lang.String;
import java.util.function.Function;
import javax.annotation.processing.Generated;

/**
 * Aspect for entities with canonical universal IDs
 *
 * See https://cap.cloud.sap/docs/cds/common#aspect-cuid
 */
@CdsName("scheduling.JobResult")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobResult_ extends StructuredType<JobResult_> {
  String ID = "ID";

  String JOB_ID = "job_ID";

  String TYPE_CODE = "type_code";

  String CDS_NAME = "scheduling.JobResult";

  @CdsName(ID)
  ElementRef<String> ID();

  Job_ job();

  Job_ job(Function<Job_, CqnPredicate> filter);

  @CdsName(JOB_ID)
  ElementRef<String> job_ID();

  ElementRef<String> name();

  ResultType_ type();

  ResultType_ type(Function<ResultType_, CqnPredicate> filter);

  @CdsName(TYPE_CODE)
  ElementRef<String> type_code();

  ElementRef<String> link();

  ElementRef<String> mimeType();

  ElementRef<String> filename();

  ElementRef<InputStream> data();

  JobResultMessage_ messages();

  JobResultMessage_ messages(Function<JobResultMessage_, CqnPredicate> filter);
}
