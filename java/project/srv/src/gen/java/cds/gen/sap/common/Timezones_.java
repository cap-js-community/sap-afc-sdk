package cds.gen.sap.common;

import com.sap.cds.ql.CdsName;
import com.sap.cds.ql.ElementRef;
import com.sap.cds.ql.StructuredType;
import com.sap.cds.ql.cqn.CqnPredicate;
import java.lang.String;
import java.util.function.Function;
import javax.annotation.processing.Generated;

/**
 * Code list for time zones
 *
 * See https://cap.cloud.sap/docs/cds/common#entity-timezones
 */
@CdsName("sap.common.Timezones")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface Timezones_ extends StructuredType<Timezones_> {
  String CDS_NAME = "sap.common.Timezones";

  ElementRef<String> name();

  ElementRef<String> descr();

  ElementRef<String> code();

  TimezonesTexts_ texts();

  TimezonesTexts_ texts(Function<TimezonesTexts_, CqnPredicate> filter);

  TimezonesTexts_ localized();

  TimezonesTexts_ localized(Function<TimezonesTexts_, CqnPredicate> filter);
}
