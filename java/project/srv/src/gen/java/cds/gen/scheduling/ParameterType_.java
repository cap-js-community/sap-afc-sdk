package cds.gen.scheduling;

import com.sap.cds.ql.CdsName;
import com.sap.cds.ql.ElementRef;
import com.sap.cds.ql.StructuredType;
import com.sap.cds.ql.cqn.CqnPredicate;
import java.lang.String;
import java.util.function.Function;
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
public interface ParameterType_ extends StructuredType<ParameterType_> {
  String CDS_NAME = "scheduling.ParameterType";

  ElementRef<String> name();

  ElementRef<String> descr();

  ElementRef<String> code();

  ParameterTypeTexts_ texts();

  ParameterTypeTexts_ texts(Function<ParameterTypeTexts_, CqnPredicate> filter);

  ParameterTypeTexts_ localized();

  ParameterTypeTexts_ localized(Function<ParameterTypeTexts_, CqnPredicate> filter);
}
