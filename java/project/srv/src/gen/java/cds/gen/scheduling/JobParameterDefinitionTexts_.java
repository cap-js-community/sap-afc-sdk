package cds.gen.scheduling;

import com.sap.cds.ql.CdsName;
import com.sap.cds.ql.ElementRef;
import com.sap.cds.ql.StructuredType;
import com.sap.cds.ql.cqn.CqnPredicate;
import java.lang.String;
import java.util.function.Function;
import javax.annotation.processing.Generated;

@CdsName("scheduling.JobParameterDefinition.texts")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobParameterDefinitionTexts_ extends StructuredType<JobParameterDefinitionTexts_> {
  String JOB_NAME = "job_name";

  String CDS_NAME = "scheduling.JobParameterDefinition.texts";

  ElementRef<String> locale();

  JobDefinition_ job();

  JobDefinition_ job(Function<JobDefinition_, CqnPredicate> filter);

  @CdsName(JOB_NAME)
  ElementRef<String> job_name();

  ElementRef<String> name();

  ElementRef<String> description();
}
