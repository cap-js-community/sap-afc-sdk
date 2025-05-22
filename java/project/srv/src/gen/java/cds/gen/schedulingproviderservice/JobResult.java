package cds.gen.schedulingproviderservice;

import com.sap.cds.CdsData;
import com.sap.cds.Struct;
import com.sap.cds.ql.CdsName;
import java.lang.Object;
import java.lang.String;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.annotation.processing.Generated;

/**
 * Aspect for entities with canonical universal IDs
 *
 * See https://cap.cloud.sap/docs/cds/common#aspect-cuid
 */
@CdsName("SchedulingProviderService.JobResult")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobResult extends CdsData {
  String ID = "ID";

  String JOB_ID = "jobID";

  String TYPE = "type";

  String NAME = "name";

  String LINK = "link";

  String MIME_TYPE = "mimeType";

  String FILENAME = "filename";

  String MESSAGES = "messages";

  @CdsName(ID)
  String getId();

  @CdsName(ID)
  void setId(String id);

  String getJobID();

  void setJobID(String jobID);

  String getType();

  void setType(String type);

  String getName();

  void setName(String name);

  String getLink();

  void setLink(String link);

  String getMimeType();

  void setMimeType(String mimeType);

  String getFilename();

  void setFilename(String filename);

  List<JobResultMessage> getMessages();

  void setMessages(List<? extends Map<String, ?>> messages);

  JobResult_ ref();

  static JobResult create() {
    return Struct.create(JobResult.class);
  }

  static JobResult of(Map<String, Object> map) {
    return Struct.access(map).as(JobResult.class);
  }

  static JobResult create(String id) {
    Map<String, Object> keys = new HashMap<>();
    keys.put(ID, id);
    return Struct.access(keys).as(JobResult.class);
  }
}
