package cds.gen.schedulingproviderservice;

import com.sap.cds.ql.CdsName;
import java.lang.Class;
import java.lang.String;
import javax.annotation.processing.Generated;

@Generated(
    value = "cds-maven-plugin",
    date = "2025-05-22T10:26:54.194467Z",
    comments = "com.sap.cds:cds-maven-plugin:3.10.0 / com.sap.cds:cds4j-api:3.10.0"
)
@CdsName("SchedulingProviderService")
public interface SchedulingProviderService_ {
  String CDS_NAME = "SchedulingProviderService";

  Class<JobDefinition_> JOB_DEFINITION = JobDefinition_.class;

  Class<Job_> JOB = Job_.class;

  Class<JobResult_> JOB_RESULT = JobResult_.class;

  Class<JobParameterDefinition_> JOB_PARAMETER_DEFINITION = JobParameterDefinition_.class;

  Class<JobParameter_> JOB_PARAMETER = JobParameter_.class;

  Class<JobResultMessage_> JOB_RESULT_MESSAGE = JobResultMessage_.class;
}
