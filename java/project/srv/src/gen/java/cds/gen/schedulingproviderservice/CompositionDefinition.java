package cds.gen.schedulingproviderservice;

import com.sap.cds.CdsData;
import com.sap.cds.Struct;
import com.sap.cds.ql.CdsName;
import java.lang.Object;
import java.lang.String;
import java.util.Map;
import javax.annotation.processing.Generated;

@CdsName("SchedulingProviderService.compositionDefinition")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface CompositionDefinition extends CdsData {
  static CompositionDefinition create() {
    return Struct.create(CompositionDefinition.class);
  }

  static CompositionDefinition of(Map<String, Object> map) {
    return Struct.access(map).as(CompositionDefinition.class);
  }
}
