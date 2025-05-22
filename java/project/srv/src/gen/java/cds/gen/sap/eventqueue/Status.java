package cds.gen.sap.eventqueue;

import com.sap.cds.ql.CdsName;
import java.lang.Integer;
import javax.annotation.processing.Generated;

@CdsName("sap.eventqueue.Status")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public final class Status {
  public static final Integer DONE = 2;

  public static final Integer EXCEEDED = 4;

  public static final Integer ERROR = 3;

  public static final Integer IN_PROGRESS = 1;

  public static final Integer SUSPENDED = 5;

  public static final Integer OPEN = 0;

  private Status() {
  }
}
