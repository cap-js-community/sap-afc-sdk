package cds.gen.sap.eventqueue;

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

/**
 * Aspect for entities with canonical universal IDs
 *
 * See https://cap.cloud.sap/docs/cds/common#aspect-cuid
 */
@CdsName("sap.eventqueue.Event")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface Event extends CdsData {
  String ID = "ID";

  String TYPE = "type";

  String SUB_TYPE = "subType";

  String REFERENCE_ENTITY = "referenceEntity";

  String REFERENCE_ENTITY_KEY = "referenceEntityKey";

  String STATUS = "status";

  String PAYLOAD = "payload";

  String ATTEMPTS = "attempts";

  String LAST_ATTEMPT_TIMESTAMP = "lastAttemptTimestamp";

  String CREATED_AT = "createdAt";

  String START_AFTER = "startAfter";

  String CONTEXT = "context";

  String ERROR = "error";

  @CdsName(ID)
  String getId();

  @CdsName(ID)
  void setId(String id);

  String getType();

  void setType(String type);

  String getSubType();

  void setSubType(String subType);

  String getReferenceEntity();

  void setReferenceEntity(String referenceEntity);

  String getReferenceEntityKey();

  void setReferenceEntityKey(String referenceEntityKey);

  Integer getStatus();

  void setStatus(Integer status);

  String getPayload();

  void setPayload(String payload);

  Integer getAttempts();

  void setAttempts(Integer attempts);

  Instant getLastAttemptTimestamp();

  void setLastAttemptTimestamp(Instant lastAttemptTimestamp);

  Instant getCreatedAt();

  void setCreatedAt(Instant createdAt);

  Instant getStartAfter();

  void setStartAfter(Instant startAfter);

  String getContext();

  void setContext(String context);

  String getError();

  void setError(String error);

  Event_ ref();

  static Event create() {
    return Struct.create(Event.class);
  }

  static Event of(Map<String, Object> map) {
    return Struct.access(map).as(Event.class);
  }

  static Event create(String id) {
    Map<String, Object> keys = new HashMap<>();
    keys.put(ID, id);
    return Struct.access(keys).as(Event.class);
  }
}
