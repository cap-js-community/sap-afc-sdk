package cds.gen.cds.outbox;

import com.sap.cds.ql.CdsName;
import java.lang.Class;
import java.lang.String;
import javax.annotation.processing.Generated;

@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
@CdsName("cds.outbox")
public interface Outbox_ {
  String CDS_NAME = "cds.outbox";

  Class<Messages_> MESSAGES = Messages_.class;
}
