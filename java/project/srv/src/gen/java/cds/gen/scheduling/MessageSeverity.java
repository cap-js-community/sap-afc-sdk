package cds.gen.scheduling;

import com.sap.cds.CdsData;
import com.sap.cds.Struct;
import com.sap.cds.ql.CdsName;
import java.lang.Integer;
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
@CdsName("scheduling.MessageSeverity")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface MessageSeverity extends CdsData {
  String NAME = "name";

  String DESCR = "descr";

  String CODE = "code";

  String NUMERIC_CODE = "numericCode";

  String TEXTS = "texts";

  String LOCALIZED = "localized";

  String getName();

  void setName(String name);

  String getDescr();

  void setDescr(String descr);

  String getCode();

  void setCode(String code);

  Integer getNumericCode();

  void setNumericCode(Integer numericCode);

  List<MessageSeverityTexts> getTexts();

  void setTexts(List<? extends Map<String, ?>> texts);

  MessageSeverityTexts getLocalized();

  void setLocalized(Map<String, ?> localized);

  MessageSeverity_ ref();

  static MessageSeverity create() {
    return Struct.create(MessageSeverity.class);
  }

  static MessageSeverity of(Map<String, Object> map) {
    return Struct.access(map).as(MessageSeverity.class);
  }

  static MessageSeverity create(String code) {
    Map<String, Object> keys = new HashMap<>();
    keys.put(CODE, code);
    return Struct.access(keys).as(MessageSeverity.class);
  }
}
