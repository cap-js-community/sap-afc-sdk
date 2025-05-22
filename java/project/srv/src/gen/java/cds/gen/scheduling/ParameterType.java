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
@CdsName("scheduling.ParameterType")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface ParameterType extends CdsData {
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

  List<ParameterTypeTexts> getTexts();

  void setTexts(List<? extends Map<String, ?>> texts);

  ParameterTypeTexts getLocalized();

  void setLocalized(Map<String, ?> localized);

  ParameterType_ ref();

  static ParameterType create() {
    return Struct.create(ParameterType.class);
  }

  static ParameterType of(Map<String, Object> map) {
    return Struct.access(map).as(ParameterType.class);
  }

  static ParameterType create(String code) {
    Map<String, Object> keys = new HashMap<>();
    keys.put(CODE, code);
    return Struct.access(keys).as(ParameterType.class);
  }
}
