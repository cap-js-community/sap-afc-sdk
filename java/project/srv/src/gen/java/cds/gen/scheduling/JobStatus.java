package cds.gen.scheduling;

import com.sap.cds.CdsData;
import com.sap.cds.Struct;
import com.sap.cds.ql.CdsName;
import java.lang.Object;
import java.lang.String;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.annotation.processing.Generated;

/**
 * Aspect for a code list with name and description
 *
 * See https://cap.cloud.sap/docs/cds/common#aspect-codelist
 */
@CdsName("scheduling.JobStatus")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobStatus extends CdsData {
  String NAME = "name";

  String DESCR = "descr";

  String CODE = "code";

  String TEXTS = "texts";

  String LOCALIZED = "localized";

  String getName();

  void setName(String name);

  String getDescr();

  void setDescr(String descr);

  String getCode();

  void setCode(String code);

  List<JobStatusTexts> getTexts();

  void setTexts(List<? extends Map<String, ?>> texts);

  JobStatusTexts getLocalized();

  void setLocalized(Map<String, ?> localized);

  JobStatus_ ref();

  static JobStatus create() {
    return Struct.create(JobStatus.class);
  }

  static JobStatus of(Map<String, Object> map) {
    return Struct.access(map).as(JobStatus.class);
  }

  static JobStatus create(String code) {
    Map<String, Object> keys = new HashMap<>();
    keys.put(CODE, code);
    return Struct.access(keys).as(JobStatus.class);
  }
}
