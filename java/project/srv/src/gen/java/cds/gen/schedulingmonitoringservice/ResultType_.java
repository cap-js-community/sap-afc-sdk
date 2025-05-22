package cds.gen.schedulingmonitoringservice;

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
@CdsName("SchedulingMonitoringService.ResultType")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface ResultType_ extends StructuredType<ResultType_> {
  String CDS_NAME = "SchedulingMonitoringService.ResultType";

  ElementRef<String> name();

  ElementRef<String> descr();

  ElementRef<String> code();

  ResultTypeTexts_ texts();

  ResultTypeTexts_ texts(Function<ResultTypeTexts_, CqnPredicate> filter);

  ResultTypeTexts_ localized();

  ResultTypeTexts_ localized(Function<ResultTypeTexts_, CqnPredicate> filter);
}
