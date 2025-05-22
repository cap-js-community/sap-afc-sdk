package cds.gen.cds.outbox;

import com.sap.cds.CdsData;
import com.sap.cds.Struct;
import com.sap.cds.ql.CdsName;
import java.lang.Integer;
import java.lang.Object;
import java.lang.String;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import javax.annotation.processing.Generated;

@CdsName("cds.outbox.Messages")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface Messages extends CdsData {
  String ID = "ID";

  String TIMESTAMP = "timestamp";

  String TARGET = "target";

  String MSG = "msg";

  String ATTEMPTS = "attempts";

  String PARTITION = "partition";

  String LAST_ERROR = "lastError";

  String LAST_ATTEMPT_TIMESTAMP = "lastAttemptTimestamp";

  @CdsName(ID)
  String getId();

  @CdsName(ID)
  void setId(String id);

  Instant getTimestamp();

  void setTimestamp(Instant timestamp);

  String getTarget();

  void setTarget(String target);

  String getMsg();

  void setMsg(String msg);

  Integer getAttempts();

  void setAttempts(Integer attempts);

  Integer getPartition();

  void setPartition(Integer partition);

  String getLastError();

  void setLastError(String lastError);

  Instant getLastAttemptTimestamp();

  void setLastAttemptTimestamp(Instant lastAttemptTimestamp);

  Messages_ ref();

  static Messages create() {
    return Struct.create(Messages.class);
  }

  static Messages of(Map<String, Object> map) {
    return Struct.access(map).as(Messages.class);
  }

  static Messages create(String id) {
    Map<String, Object> keys = new HashMap<>();
    keys.put(ID, id);
    return Struct.access(keys).as(Messages.class);
  }
}
