package cds.gen.schedulingprocessingservice;

import com.sap.cds.CdsData;
import com.sap.cds.Struct;
import com.sap.cds.ql.CdsName;
import java.io.InputStream;
import java.lang.Object;
import java.lang.String;
import java.util.Collection;
import java.util.Map;
import javax.annotation.processing.Generated;

@CdsName("SchedulingProcessingService.JobResult")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface JobResult extends CdsData {
  String NAME = "name";

  String TYPE = "type";

  String LINK = "link";

  String MIME_TYPE = "mimeType";

  String FILENAME = "filename";

  String DATA = "data";

  String MESSAGES = "messages";

  String getName();

  void setName(String name);

  String getType();

  void setType(String type);

  String getLink();

  void setLink(String link);

  String getMimeType();

  void setMimeType(String mimeType);

  String getFilename();

  void setFilename(String filename);

  InputStream getData();

  void setData(InputStream data);

  Collection<JobResultMessage> getMessages();

  void setMessages(Collection<JobResultMessage> messages);

  static JobResult create() {
    return Struct.create(JobResult.class);
  }

  static JobResult of(Map<String, Object> map) {
    return Struct.access(map).as(JobResult.class);
  }
}
