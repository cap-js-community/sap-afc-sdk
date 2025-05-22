package cds.gen.schedulingproviderservice;

import com.sap.cds.ql.CdsName;
import com.sap.cds.ql.ElementRef;
import com.sap.cds.ql.StructuredType;
import java.lang.Boolean;
import java.lang.String;
import javax.annotation.processing.Generated;

@CdsName("SchedulingProviderService.JobParameterDefinition")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobParameterDefinition_ extends StructuredType<JobParameterDefinition_> {
  String CDS_NAME = "SchedulingProviderService.JobParameterDefinition";

  ElementRef<String> name();

  ElementRef<String> jobName();

  ElementRef<String> description();

  ElementRef<String> type();

  ElementRef<String> dataType();

  ElementRef<String> mappingType();

  ElementRef<String> value();

  ElementRef<Boolean> required();
}
