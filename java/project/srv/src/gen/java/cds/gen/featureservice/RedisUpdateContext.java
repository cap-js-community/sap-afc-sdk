package cds.gen.featureservice;

import com.sap.cds.CdsData;
import com.sap.cds.Struct;
import com.sap.cds.services.EventContext;
import com.sap.cds.services.EventName;
import java.lang.Object;
import java.lang.String;
import java.util.Map;
import javax.annotation.processing.Generated;

@EventName("redisUpdate")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface RedisUpdateContext extends EventContext {
  String NEW_VALUES = "newValues";

  String CDS_NAME = "redisUpdate";

  NewValues getNewValues();

  void setNewValues(NewValues newValues);

  static RedisUpdateContext create() {
    return EventContext.create(RedisUpdateContext.class, null);
  }

  interface NewValues extends CdsData {
    static NewValues create() {
      return Struct.create(NewValues.class);
    }

    static NewValues of(Map<String, Object> map) {
      return Struct.access(map).as(NewValues.class);
    }
  }
}
