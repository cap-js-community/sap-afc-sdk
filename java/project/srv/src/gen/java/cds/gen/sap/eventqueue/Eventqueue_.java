package cds.gen.sap.eventqueue;

import com.sap.cds.ql.CdsName;
import java.lang.Class;
import java.lang.String;
import javax.annotation.processing.Generated;

@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
@CdsName("sap.eventqueue")
public interface Eventqueue_ {
  String CDS_NAME = "sap.eventqueue";

  Class<Event_> EVENT = Event_.class;

  Class<Lock_> LOCK = Lock_.class;
}
