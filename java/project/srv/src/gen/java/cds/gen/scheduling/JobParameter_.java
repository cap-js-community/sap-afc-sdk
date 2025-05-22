package cds.gen.scheduling;

import com.sap.cds.ql.CdsName;
import com.sap.cds.ql.ElementRef;
import com.sap.cds.ql.StructuredType;
import com.sap.cds.ql.cqn.CqnPredicate;
import java.lang.String;
import java.util.function.Function;
import javax.annotation.processing.Generated;

/**
 * Aspect for entities with canonical universal IDs
 *
 * See https://cap.cloud.sap/docs/cds/common#aspect-cuid
 */
@CdsName("scheduling.JobParameter")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobParameter_ extends StructuredType<JobParameter_> {
  String ID = "ID";

  String JOB_ID = "job_ID";

  String DEFINITION_JOB_NAME = "definition_job_name";

  String DEFINITION_NAME = "definition_name";

  String CDS_NAME = "scheduling.JobParameter";

  @CdsName(ID)
  ElementRef<String> ID();

  Job_ job();

  Job_ job(Function<Job_, CqnPredicate> filter);

  @CdsName(JOB_ID)
  ElementRef<String> job_ID();

  JobParameterDefinition_ definition();

  JobParameterDefinition_ definition(Function<JobParameterDefinition_, CqnPredicate> filter);

  @CdsName(DEFINITION_JOB_NAME)
  ElementRef<String> definition_job_name();

  @CdsName(DEFINITION_NAME)
  ElementRef<String> definition_name();

  ElementRef<String> value();
}
