package cds.gen.featureservice;

import com.sap.cds.CdsData;
import com.sap.cds.Struct;
import com.sap.cds.services.EventContext;
import com.sap.cds.services.EventName;
import java.lang.Object;
import java.lang.String;
import java.util.Map;
import javax.annotation.processing.Generated;

@EventName("redisSendCommand")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface RedisSendCommandContext extends EventContext {
  String COMMAND = "command";

  String CDS_NAME = "redisSendCommand";

  Command getCommand();

  void setCommand(Command command);

  void setResult(String result);

  String getResult();

  static RedisSendCommandContext create() {
    return EventContext.create(RedisSendCommandContext.class, null);
  }

  interface Command extends CdsData {
    static Command create() {
      return Struct.create(Command.class);
    }

    static Command of(Map<String, Object> map) {
      return Struct.access(map).as(Command.class);
    }
  }
}
