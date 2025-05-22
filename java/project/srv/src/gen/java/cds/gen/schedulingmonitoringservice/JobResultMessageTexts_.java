package cds.gen.schedulingmonitoringservice;

import com.sap.cds.ql.CdsName;
import com.sap.cds.ql.ElementRef;
import com.sap.cds.ql.StructuredType;
import java.lang.String;
import javax.annotation.processing.Generated;

@CdsName("SchedulingMonitoringService.JobResultMessage.texts")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobResultMessageTexts_ extends StructuredType<JobResultMessageTexts_> {
  String ID = "ID";

  String CDS_NAME = "SchedulingMonitoringService.JobResultMessage.texts";

  ElementRef<String> locale();

  @CdsName(ID)
  ElementRef<String> ID();

  ElementRef<String> text();
}
