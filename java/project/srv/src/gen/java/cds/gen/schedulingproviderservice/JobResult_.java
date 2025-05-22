package cds.gen.schedulingproviderservice;

import com.sap.cds.ql.CdsName;
import com.sap.cds.ql.ElementRef;
import com.sap.cds.ql.StructuredType;
import com.sap.cds.ql.cqn.CqnPredicate;
import java.lang.String;
import java.util.function.Function;
import javax.annotation.processing.Generated;

/**
 * Aspect for entities with canonical universal IDs
 *
 * See https://cap.cloud.sap/docs/cds/common#aspect-cuid
 */
@CdsName("SchedulingProviderService.JobResult")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobResult_ extends StructuredType<JobResult_> {
  String ID = "ID";

  String CDS_NAME = "SchedulingProviderService.JobResult";

  @CdsName(ID)
  ElementRef<String> ID();

  ElementRef<String> jobID();

  ElementRef<String> type();

  ElementRef<String> name();

  ElementRef<String> link();

  ElementRef<String> mimeType();

  ElementRef<String> filename();

  JobResultMessage_ messages();

  JobResultMessage_ messages(Function<JobResultMessage_, CqnPredicate> filter);
}
