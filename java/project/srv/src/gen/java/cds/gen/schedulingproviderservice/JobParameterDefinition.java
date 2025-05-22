package cds.gen.schedulingproviderservice;

import com.sap.cds.CdsData;
import com.sap.cds.Struct;
import com.sap.cds.ql.CdsName;
import java.lang.Boolean;
import java.lang.Object;
import java.lang.String;
import java.util.Map;
import javax.annotation.processing.Generated;

@CdsName("SchedulingProviderService.JobParameterDefinition")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobParameterDefinition extends CdsData {
  String NAME = "name";

  String JOB_NAME = "jobName";

  String DESCRIPTION = "description";

  String TYPE = "type";

  String DATA_TYPE = "dataType";

  String MAPPING_TYPE = "mappingType";

  String VALUE = "value";

  String REQUIRED = "required";

  String getName();

  void setName(String name);

  String getJobName();

  void setJobName(String jobName);

  String getDescription();

  void setDescription(String description);

  String getType();

  void setType(String type);

  String getDataType();

  void setDataType(String dataType);

  String getMappingType();

  void setMappingType(String mappingType);

  String getValue();

  void setValue(String value);

  Boolean getRequired();

  void setRequired(Boolean required);

  JobParameterDefinition_ ref();

  static JobParameterDefinition create() {
    return Struct.create(JobParameterDefinition.class);
  }

  static JobParameterDefinition of(Map<String, Object> map) {
    return Struct.access(map).as(JobParameterDefinition.class);
  }
}
