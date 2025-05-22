package cds.gen.schedulingprocessingservice;

import com.sap.cds.CdsData;
import com.sap.cds.Struct;
import com.sap.cds.ql.CdsName;
import java.lang.Object;
import java.lang.String;
import java.util.Map;
import javax.annotation.processing.Generated;

@CdsName("SchedulingProcessingService.JobResultMessageText")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobResultMessageText extends CdsData {
  String LOCALE = "locale";

  String TEXT = "text";

  /**
   * Type for a language code
   */
  String getLocale();

  /**
   * Type for a language code
   */
  void setLocale(String locale);

  String getText();

  void setText(String text);

  static JobResultMessageText create() {
    return Struct.create(JobResultMessageText.class);
  }

  static JobResultMessageText of(Map<String, Object> map) {
    return Struct.access(map).as(JobResultMessageText.class);
  }
}
