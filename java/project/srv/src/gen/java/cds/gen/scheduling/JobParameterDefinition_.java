package cds.gen.scheduling;

import com.sap.cds.ql.CdsName;
import com.sap.cds.ql.ElementRef;
import com.sap.cds.ql.StructuredType;
import com.sap.cds.ql.cqn.CqnPredicate;
import java.lang.Boolean;
import java.lang.String;
import java.util.function.Function;
import javax.annotation.processing.Generated;

@CdsName("scheduling.JobParameterDefinition")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobParameterDefinition_ extends StructuredType<JobParameterDefinition_> {
  String JOB_NAME = "job_name";

  String TYPE_CODE = "type_code";

  String DATA_TYPE_CODE = "dataType_code";

  String MAPPING_TYPE_CODE = "mappingType_code";

  String CDS_NAME = "scheduling.JobParameterDefinition";

  JobDefinition_ job();

  JobDefinition_ job(Function<JobDefinition_, CqnPredicate> filter);

  @CdsName(JOB_NAME)
  ElementRef<String> job_name();

  ElementRef<String> name();

  ElementRef<String> description();

  ParameterType_ type();

  ParameterType_ type(Function<ParameterType_, CqnPredicate> filter);

  @CdsName(TYPE_CODE)
  ElementRef<String> type_code();

  DataType_ dataType();

  DataType_ dataType(Function<DataType_, CqnPredicate> filter);

  @CdsName(DATA_TYPE_CODE)
  ElementRef<String> dataType_code();

  MappingType_ mappingType();

  MappingType_ mappingType(Function<MappingType_, CqnPredicate> filter);

  @CdsName(MAPPING_TYPE_CODE)
  ElementRef<String> mappingType_code();

  ElementRef<String> value();

  ElementRef<Boolean> required();

  JobParameterDefinitionTexts_ texts();

  JobParameterDefinitionTexts_ texts(Function<JobParameterDefinitionTexts_, CqnPredicate> filter);

  JobParameterDefinitionTexts_ localized();

  JobParameterDefinitionTexts_ localized(
      Function<JobParameterDefinitionTexts_, CqnPredicate> filter);
}
