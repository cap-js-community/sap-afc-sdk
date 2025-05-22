package cds.gen.schedulingprocessingservice;

import com.sap.cds.ql.CdsName;
import com.sap.cds.ql.ElementRef;
import com.sap.cds.ql.StructuredType;
import java.io.InputStream;
import java.lang.String;
import java.util.Collection;
import javax.annotation.processing.Generated;

@CdsName("SchedulingProcessingService.JobResult")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobResult_ extends StructuredType<JobResult_> {
  String CDS_NAME = "SchedulingProcessingService.JobResult";

  ElementRef<String> name();

  ElementRef<String> type();

  ElementRef<String> link();

  ElementRef<String> mimeType();

  ElementRef<String> filename();

  ElementRef<InputStream> data();

  ElementRef<Collection<JobResultMessage>> messages();
}
