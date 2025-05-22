package cds.gen.schedulingmonitoringservice;

import com.sap.cds.ql.CdsName;
import com.sap.cds.ql.ElementRef;
import com.sap.cds.ql.StructuredType;
import com.sap.cds.ql.cqn.CqnPredicate;
import java.lang.Boolean;
import java.lang.String;
import java.util.function.Function;
import javax.annotation.processing.Generated;

@CdsName("SchedulingMonitoringService.JobDefinition")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobDefinition_ extends StructuredType<JobDefinition_> {
  String CDS_NAME = "SchedulingMonitoringService.JobDefinition";

  ElementRef<String> name();

  ElementRef<String> description();

  ElementRef<String> longDescription();

  ElementRef<Boolean> supportsStartDateTime();

  ElementRef<Boolean> supportsTestRun();

  ElementRef<String> version();

  JobParameterDefinition_ parameters();

  JobParameterDefinition_ parameters(Function<JobParameterDefinition_, CqnPredicate> filter);

  JobDefinitionTexts_ texts();

  JobDefinitionTexts_ texts(Function<JobDefinitionTexts_, CqnPredicate> filter);

  JobDefinitionTexts_ localized();

  JobDefinitionTexts_ localized(Function<JobDefinitionTexts_, CqnPredicate> filter);
}
