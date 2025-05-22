package cds.gen.schedulingmonitoringservice;

import com.sap.cds.CdsData;
import com.sap.cds.Struct;
import com.sap.cds.ql.CdsName;
import java.lang.Boolean;
import java.lang.Object;
import java.lang.String;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.annotation.processing.Generated;

@CdsName("SchedulingMonitoringService.JobDefinition")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobDefinition extends CdsData {
  String NAME = "name";

  String DESCRIPTION = "description";

  String LONG_DESCRIPTION = "longDescription";

  String SUPPORTS_START_DATE_TIME = "supportsStartDateTime";

  String SUPPORTS_TEST_RUN = "supportsTestRun";

  String VERSION = "version";

  String PARAMETERS = "parameters";

  String TEXTS = "texts";

  String LOCALIZED = "localized";

  String getName();

  void setName(String name);

  String getDescription();

  void setDescription(String description);

  String getLongDescription();

  void setLongDescription(String longDescription);

  Boolean getSupportsStartDateTime();

  void setSupportsStartDateTime(Boolean supportsStartDateTime);

  Boolean getSupportsTestRun();

  void setSupportsTestRun(Boolean supportsTestRun);

  String getVersion();

  void setVersion(String version);

  List<JobParameterDefinition> getParameters();

  void setParameters(List<? extends Map<String, ?>> parameters);

  List<JobDefinitionTexts> getTexts();

  void setTexts(List<? extends Map<String, ?>> texts);

  JobDefinitionTexts getLocalized();

  void setLocalized(Map<String, ?> localized);

  JobDefinition_ ref();

  static JobDefinition create() {
    return Struct.create(JobDefinition.class);
  }

  static JobDefinition of(Map<String, Object> map) {
    return Struct.access(map).as(JobDefinition.class);
  }

  static JobDefinition create(String name) {
    Map<String, Object> keys = new HashMap<>();
    keys.put(NAME, name);
    return Struct.access(keys).as(JobDefinition.class);
  }
}
