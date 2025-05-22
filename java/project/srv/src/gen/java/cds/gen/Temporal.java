package cds.gen;

import com.sap.cds.CdsData;
import com.sap.cds.Struct;
import com.sap.cds.ql.CdsName;
import java.lang.Object;
import java.lang.String;
import java.time.Instant;
import java.util.Map;
import javax.annotation.processing.Generated;

/**
 * Aspect for entities with temporal data
 *
 * See https://cap.cloud.sap/docs/cds/common#aspect-temporal
 */
@CdsName("temporal")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface Temporal extends CdsData {
  String VALID_FROM = "validFrom";

  String VALID_TO = "validTo";

  Instant getValidFrom();

  void setValidFrom(Instant validFrom);

  Instant getValidTo();

  void setValidTo(Instant validTo);

  static Temporal create() {
    return Struct.create(Temporal.class);
  }

  static Temporal of(Map<String, Object> map) {
    return Struct.access(map).as(Temporal.class);
  }
}
