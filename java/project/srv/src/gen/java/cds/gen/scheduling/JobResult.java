package cds.gen.scheduling;

import com.sap.cds.CdsData;
import com.sap.cds.Struct;
import com.sap.cds.ql.CdsName;
import java.io.InputStream;
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
@CdsName("scheduling.JobResult")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobResult extends CdsData {
  String ID = "ID";

  String JOB = "job";

  String JOB_ID = "job_ID";

  String NAME = "name";

  String TYPE = "type";

  String TYPE_CODE = "type_code";

  String LINK = "link";

  String MIME_TYPE = "mimeType";

  String FILENAME = "filename";

  String DATA = "data";

  String MESSAGES = "messages";

  @CdsName(ID)
  String getId();

  @CdsName(ID)
  void setId(String id);

  Job getJob();

  void setJob(Map<String, ?> job);

  @CdsName(JOB_ID)
  String getJobId();

  @CdsName(JOB_ID)
  void setJobId(String jobId);

  String getName();

  void setName(String name);

  ResultType getType();

  void setType(Map<String, ?> type);

  @CdsName(TYPE_CODE)
  String getTypeCode();

  @CdsName(TYPE_CODE)
  void setTypeCode(String typeCode);

  String getLink();

  void setLink(String link);

  String getMimeType();

  void setMimeType(String mimeType);

  String getFilename();

  void setFilename(String filename);

  InputStream getData();

  void setData(InputStream data);

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
