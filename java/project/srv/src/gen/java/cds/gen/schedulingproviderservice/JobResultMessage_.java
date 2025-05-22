package cds.gen.schedulingproviderservice;

import com.sap.cds.ql.CdsName;
import com.sap.cds.ql.ElementRef;
import com.sap.cds.ql.StructuredType;
import java.lang.String;
import java.time.Instant;
import javax.annotation.processing.Generated;

/**
 * Aspect for entities with canonical universal IDs
 *
 * See https://cap.cloud.sap/docs/cds/common#aspect-cuid
 */
@CdsName("SchedulingProviderService.JobResultMessage")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobResultMessage_ extends StructuredType<JobResultMessage_> {
  String ID = "ID";

  String CDS_NAME = "SchedulingProviderService.JobResultMessage";

  @CdsName(ID)
  ElementRef<String> ID();

  ElementRef<String> resultID();

  ElementRef<String> severity();

  ElementRef<String> code();

  ElementRef<String> text();

  ElementRef<Instant> createdAt();
}
