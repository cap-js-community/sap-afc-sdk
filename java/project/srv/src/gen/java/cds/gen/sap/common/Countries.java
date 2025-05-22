package cds.gen.sap.common;

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
 * Code list for countries
 *
 * See https://cap.cloud.sap/docs/cds/common#entity-countries
 */
@CdsName("sap.common.Countries")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface Countries extends CdsData {
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

  List<CountriesTexts> getTexts();

  void setTexts(List<? extends Map<String, ?>> texts);

  CountriesTexts getLocalized();

  void setLocalized(Map<String, ?> localized);

  Countries_ ref();

  static Countries create() {
    return Struct.create(Countries.class);
  }

  static Countries of(Map<String, Object> map) {
    return Struct.access(map).as(Countries.class);
  }

  static Countries create(String code) {
    Map<String, Object> keys = new HashMap<>();
    keys.put(CODE, code);
    return Struct.access(keys).as(Countries.class);
  }
}
