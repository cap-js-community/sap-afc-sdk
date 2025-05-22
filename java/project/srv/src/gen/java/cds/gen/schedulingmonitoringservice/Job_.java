package cds.gen.schedulingmonitoringservice;

import com.sap.cds.ql.CdsName;
import com.sap.cds.ql.ElementRef;
import com.sap.cds.ql.StructuredType;
import com.sap.cds.ql.cqn.CqnPredicate;
import java.lang.Boolean;
import java.lang.Integer;
import java.lang.String;
import java.time.Instant;
import java.util.function.Function;
import javax.annotation.processing.Generated;

/**
 * Aspect to capture changes by user and name
 *
 * See https://cap.cloud.sap/docs/cds/common#aspect-managed
 */
@CdsName("SchedulingMonitoringService.Job")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface Job_ extends StructuredType<Job_> {
  String ID = "ID";

  String DEFINITION_NAME = "definition_name";

  String STATUS_CODE = "status_code";

  String CDS_NAME = "SchedulingMonitoringService.Job";

  @CdsName(ID)
  ElementRef<String> ID();

  ElementRef<Instant> createdAt();

  ElementRef<String> createdBy();

  ElementRef<Instant> modifiedAt();

  ElementRef<String> modifiedBy();

  ElementRef<String> referenceID();

  ElementRef<Instant> startDateTime();

  JobDefinition_ definition();

  JobDefinition_ definition(Function<JobDefinition_, CqnPredicate> filter);

  @CdsName(DEFINITION_NAME)
  ElementRef<String> definition_name();

  ElementRef<String> version();

  ElementRef<String> link();

  JobStatus_ status();

  JobStatus_ status(Function<JobStatus_, CqnPredicate> filter);

  @CdsName(STATUS_CODE)
  ElementRef<String> status_code();

  ElementRef<Boolean> testRun();

  JobParameter_ parameters();

  JobParameter_ parameters(Function<JobParameter_, CqnPredicate> filter);

  JobResult_ results();

  JobResult_ results(Function<JobResult_, CqnPredicate> filter);

  ElementRef<Integer> criticality();
}
