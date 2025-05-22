package cds.gen.scheduling;

import com.sap.cds.ql.CdsName;
import java.lang.String;
import javax.annotation.processing.Generated;

@CdsName("scheduling.JobStatusCode")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public final class JobStatusCode {
  public static final String RUNNING = "running";

  public static final String CANCELED = "canceled";

  public static final String REQUESTED = "requested";

  public static final String COMPLETED_WITH_ERROR = "completedWithError";

  public static final String COMPLETED = "completed";

  public static final String FAILED = "failed";

  public static final String COMPLETED_WITH_WARNING = "completedWithWarning";

  public static final String CANCEL_REQUESTED = "cancelRequested";

  private JobStatusCode() {
  }
}
