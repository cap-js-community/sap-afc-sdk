package cds.gen.schedulingproviderservice;

import com.sap.cds.ql.CdsName;
import com.sap.cds.ql.ElementRef;
import com.sap.cds.ql.StructuredType;
import com.sap.cds.ql.cqn.CqnPredicate;
import java.lang.Boolean;
import java.lang.String;
import java.time.Instant;
import java.util.function.Function;
import javax.annotation.processing.Generated;

/**
 * Aspect to capture changes by user and name
 *
 * See https://cap.cloud.sap/docs/cds/common#aspect-managed
 */
@CdsName("SchedulingProviderService.Job")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface Job_ extends StructuredType<Job_> {
  String ID = "ID";

  String CDS_NAME = "SchedulingProviderService.Job";

  @CdsName(ID)
  ElementRef<String> ID();

  ElementRef<String> name();

  ElementRef<String> referenceID();

  ElementRef<Instant> startDateTime();

  ElementRef<String> version();

  ElementRef<String> status();

  ElementRef<Instant> createdAt();

  ElementRef<String> createdBy();

  ElementRef<Instant> modifiedAt();

  ElementRef<String> modifiedBy();

  ElementRef<String> link();

  ElementRef<Boolean> testRun();

  JobParameter_ parameters();

  JobParameter_ parameters(Function<JobParameter_, CqnPredicate> filter);

  JobResult_ results();

  JobResult_ results(Function<JobResult_, CqnPredicate> filter);
}
