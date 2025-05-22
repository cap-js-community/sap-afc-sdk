package cds.gen.schedulingprocessingservice;

import com.sap.cds.ql.CdsName;
import com.sap.cds.ql.ElementRef;
import com.sap.cds.ql.StructuredType;
import java.lang.String;
import java.time.Instant;
import java.util.Collection;
import javax.annotation.processing.Generated;

@CdsName("SchedulingProcessingService.JobResultMessage")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobResultMessage_ extends StructuredType<JobResultMessage_> {
  String CDS_NAME = "SchedulingProcessingService.JobResultMessage";

  ElementRef<String> code();

  ElementRef<String> text();

  ElementRef<String> severity();

  ElementRef<Instant> createdAt();

  ElementRef<Collection<JobResultMessageText>> texts();
}
