package cds.gen.schedulingwebsocketservice;

import com.sap.cds.ql.CdsName;
import com.sap.cds.ql.ElementRef;
import com.sap.cds.ql.StructuredType;
import java.lang.String;
import java.util.Collection;
import javax.annotation.processing.Generated;

@CdsName("SchedulingWebsocketService.jobStatusChanged")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobStatusChanged_ extends StructuredType<JobStatusChanged_> {
  String IDS = "IDs";

  String CDS_NAME = "SchedulingWebsocketService.jobStatusChanged";

  @CdsName(IDS)
  ElementRef<Collection<String>> IDs();

  ElementRef<String> status();
}
