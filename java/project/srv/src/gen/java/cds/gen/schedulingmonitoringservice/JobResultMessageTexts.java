package cds.gen.schedulingmonitoringservice;

import com.sap.cds.CdsData;
import com.sap.cds.Struct;
import com.sap.cds.ql.CdsName;
import java.lang.Object;
import java.lang.String;
import java.util.Map;
import javax.annotation.processing.Generated;

@CdsName("SchedulingMonitoringService.JobResultMessage.texts")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobResultMessageTexts extends CdsData {
  String LOCALE = "locale";

  String ID = "ID";

  String TEXT = "text";

  /**
   * Type for a language code
   */
  String getLocale();

  /**
   * Type for a language code
   */
  void setLocale(String locale);

  @CdsName(ID)
  String getId();

  @CdsName(ID)
  void setId(String id);

  String getText();

  void setText(String text);

  JobResultMessageTexts_ ref();

  static JobResultMessageTexts create() {
    return Struct.create(JobResultMessageTexts.class);
  }

  static JobResultMessageTexts of(Map<String, Object> map) {
    return Struct.access(map).as(JobResultMessageTexts.class);
  }
}
