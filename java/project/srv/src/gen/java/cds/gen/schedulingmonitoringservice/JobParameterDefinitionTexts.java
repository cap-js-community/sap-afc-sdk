package cds.gen.schedulingmonitoringservice;

import com.sap.cds.CdsData;
import com.sap.cds.Struct;
import com.sap.cds.ql.CdsName;
import java.lang.Object;
import java.lang.String;
import java.util.Map;
import javax.annotation.processing.Generated;

@CdsName("SchedulingMonitoringService.JobParameterDefinition.texts")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobParameterDefinitionTexts extends CdsData {
  String LOCALE = "locale";

  String JOB = "job";

  String JOB_NAME = "job_name";

  String NAME = "name";

  String DESCRIPTION = "description";

  /**
   * Type for a language code
   */
  String getLocale();

  /**
   * Type for a language code
   */
  void setLocale(String locale);

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

  JobParameterDefinitionTexts_ ref();

  static JobParameterDefinitionTexts create() {
    return Struct.create(JobParameterDefinitionTexts.class);
  }

  static JobParameterDefinitionTexts of(Map<String, Object> map) {
    return Struct.access(map).as(JobParameterDefinitionTexts.class);
  }
}
