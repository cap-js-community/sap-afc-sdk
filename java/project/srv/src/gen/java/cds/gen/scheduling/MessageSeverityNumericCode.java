package cds.gen.scheduling;

import com.sap.cds.ql.CdsName;
import java.lang.Integer;
import javax.annotation.processing.Generated;

@CdsName("scheduling.MessageSeverityNumericCode")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public final class MessageSeverityNumericCode {
  public static final Integer SUCCESS = 1;

  public static final Integer WARNING = 3;

  public static final Integer ERROR = 4;

  public static final Integer INFO = 2;

  private MessageSeverityNumericCode() {
  }
}
