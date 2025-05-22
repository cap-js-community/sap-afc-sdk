package cds.gen.scheduling;

import com.sap.cds.CdsData;
import com.sap.cds.Struct;
import com.sap.cds.ql.CdsName;
import java.lang.Object;
import java.lang.String;
import java.util.Map;
import javax.annotation.processing.Generated;

@CdsName("scheduling.JobDefinition.texts")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobDefinitionTexts extends CdsData {
  String LOCALE = "locale";

  String NAME = "name";

  String DESCRIPTION = "description";

  String LONG_DESCRIPTION = "longDescription";

  /**
   * Type for a language code
   */
  String getLocale();

  /**
   * Type for a language code
   */
  void setLocale(String locale);

  String getName();

  void setName(String name);

  String getDescription();

  void setDescription(String description);

  String getLongDescription();

  void setLongDescription(String longDescription);

  JobDefinitionTexts_ ref();

  static JobDefinitionTexts create() {
    return Struct.create(JobDefinitionTexts.class);
  }

  static JobDefinitionTexts of(Map<String, Object> map) {
    return Struct.access(map).as(JobDefinitionTexts.class);
  }
}
