package cds.gen.sap.common;

import com.sap.cds.ql.CdsName;
import com.sap.cds.ql.ElementRef;
import com.sap.cds.ql.StructuredType;
import com.sap.cds.ql.cqn.CqnPredicate;
import java.lang.Short;
import java.lang.String;
import java.util.function.Function;
import javax.annotation.processing.Generated;

/**
 * Code list for currencies
 *
 * See https://cap.cloud.sap/docs/cds/common#entity-currencies
 */
@CdsName("sap.common.Currencies")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface Currencies_ extends StructuredType<Currencies_> {
  String CDS_NAME = "sap.common.Currencies";

  ElementRef<String> name();

  ElementRef<String> descr();

  ElementRef<String> code();

  ElementRef<String> symbol();

  ElementRef<Short> minorUnit();

  CurrenciesTexts_ texts();

  CurrenciesTexts_ texts(Function<CurrenciesTexts_, CqnPredicate> filter);

  CurrenciesTexts_ localized();

  CurrenciesTexts_ localized(Function<CurrenciesTexts_, CqnPredicate> filter);
}
