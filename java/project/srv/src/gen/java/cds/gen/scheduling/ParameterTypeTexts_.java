package cds.gen.scheduling;

import com.sap.cds.ql.CdsName;
import com.sap.cds.ql.ElementRef;
import com.sap.cds.ql.StructuredType;
import java.lang.String;
import javax.annotation.processing.Generated;

@CdsName("scheduling.ParameterType.texts")
@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
public interface ParameterTypeTexts_ extends StructuredType<ParameterTypeTexts_> {
  String CDS_NAME = "scheduling.ParameterType.texts";

  ElementRef<String> locale();

  ElementRef<String> name();

  ElementRef<String> descr();

  ElementRef<String> code();
}
