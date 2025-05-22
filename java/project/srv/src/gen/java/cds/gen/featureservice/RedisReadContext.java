package cds.gen.featureservice;

import com.sap.cds.CdsData;
import com.sap.cds.Struct;
import com.sap.cds.services.EventContext;
import com.sap.cds.services.EventName;
import java.lang.Object;
import java.lang.String;
import java.util.Map;
import javax.annotation.processing.Generated;

@EventName("redisRead")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface RedisReadContext extends EventContext {
  String CDS_NAME = "redisRead";

  void setResult(ReturnType result);

  ReturnType getResult();

  static RedisReadContext create() {
    return EventContext.create(RedisReadContext.class, null);
  }

  interface ReturnType extends CdsData {
    static ReturnType create() {
      return Struct.create(ReturnType.class);
    }

    static ReturnType of(Map<String, Object> map) {
      return Struct.access(map).as(ReturnType.class);
    }
  }
}
