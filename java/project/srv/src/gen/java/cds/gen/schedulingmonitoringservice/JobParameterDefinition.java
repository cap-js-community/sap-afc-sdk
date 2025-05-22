package cds.gen.schedulingmonitoringservice;

import com.sap.cds.CdsData;
import com.sap.cds.Struct;
import com.sap.cds.ql.CdsName;
import java.lang.Boolean;
import java.lang.Object;
import java.lang.String;
import java.util.List;
import java.util.Map;
import javax.annotation.processing.Generated;

@CdsName("SchedulingMonitoringService.JobParameterDefinition")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobParameterDefinition extends CdsData {
  String JOB = "job";

  String JOB_NAME = "job_name";

  String NAME = "name";

  String DESCRIPTION = "description";

  String TYPE = "type";

  String TYPE_CODE = "type_code";

  String DATA_TYPE = "dataType";

  String DATA_TYPE_CODE = "dataType_code";

  String MAPPING_TYPE = "mappingType";

  String MAPPING_TYPE_CODE = "mappingType_code";

  String VALUE = "value";

  String REQUIRED = "required";

  String TEXTS = "texts";

  String LOCALIZED = "localized";

  JobDefinition getJob();

  void setJob(Map<String, ?> job);

  @CdsName(JOB_NAME)
  String getJobName();

  @CdsName(JOB_NAME)
  void setJobName(String jobName);

  String getName();

  void setName(String name);

  String getDescription();

  void setDescription(String description);

  ParameterType getType();

  void setType(Map<String, ?> type);

  @CdsName(TYPE_CODE)
  String getTypeCode();

  @CdsName(TYPE_CODE)
  void setTypeCode(String typeCode);

  DataType getDataType();

  void setDataType(Map<String, ?> dataType);

  @CdsName(DATA_TYPE_CODE)
  String getDataTypeCode();

  @CdsName(DATA_TYPE_CODE)
  void setDataTypeCode(String dataTypeCode);

  MappingType getMappingType();

  void setMappingType(Map<String, ?> mappingType);

  @CdsName(MAPPING_TYPE_CODE)
  String getMappingTypeCode();

  @CdsName(MAPPING_TYPE_CODE)
  void setMappingTypeCode(String mappingTypeCode);

  String getValue();

  void setValue(String value);

  Boolean getRequired();

  void setRequired(Boolean required);

  List<JobParameterDefinitionTexts> getTexts();

  void setTexts(List<? extends Map<String, ?>> texts);

  JobParameterDefinitionTexts getLocalized();

  void setLocalized(Map<String, ?> localized);

  JobParameterDefinition_ ref();

  static JobParameterDefinition create() {
    return Struct.create(JobParameterDefinition.class);
  }

  static JobParameterDefinition of(Map<String, Object> map) {
    return Struct.access(map).as(JobParameterDefinition.class);
  }
}
