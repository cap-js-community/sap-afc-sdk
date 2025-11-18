package com.github.capjscommunity.sapafcsdk.scheduling.handlers;

import static com.github.capjscommunity.sapafcsdk.model.schedulingproviderservice.SchedulingProviderService_.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.github.capjscommunity.sapafcsdk.model.scheduling.JobStatusCode;
import com.github.capjscommunity.sapafcsdk.model.scheduling.MessageSeverityCode;
import com.github.capjscommunity.sapafcsdk.model.scheduling.ResultTypeCode;
import com.github.capjscommunity.sapafcsdk.model.scheduling.Scheduling_;
import com.github.capjscommunity.sapafcsdk.model.schedulingproviderservice.*;
import com.github.capjscommunity.sapafcsdk.test.OutboxTestConfig;
import com.sap.cds.Result;
import com.sap.cds.ql.CQL;
import com.sap.cds.ql.Delete;
import com.sap.cds.ql.Insert;
import com.sap.cds.ql.Select;
import com.sap.cds.services.persistence.PersistenceService;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.json.JSONObject;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ContextConfiguration;

@AutoConfigureMockMvc
@SpringBootTest
@ContextConfiguration(classes = OutboxTestConfig.class)
public class SchedulingProviderHandlerTest {

  @Autowired
  private SchedulingProviderService providerService;

  @Autowired
  private PersistenceService persistenceService;

  @Test
  @WithMockUser("authenticated")
  void getJobDefinitions() {
    Select<JobDefinition_> query = Select.from(JOB_DEFINITION).orderBy(jd -> jd.name().asc());
    List<JobDefinition> jobDefinitions = providerService.run(query).listOf(JobDefinition.class);
    assertEquals(6, jobDefinitions.size());
    for (int i = 0; i < jobDefinitions.size(); i++) {
      JobDefinition jobDefinition = jobDefinitions.get(i);
      assertEquals("JOB_" + (i + 1), jobDefinition.getName());
    }
  }

  @Test
  @WithMockUser("authenticated")
  void getJobParameterDefinitions() {
    Select<JobParameterDefinition_> query = Select.from(JOB_PARAMETER_DEFINITION)
      .where(jpd -> jpd.jobName().eq("JOB_1"))
      .orderBy(jpd -> jpd.name().asc());
    List<JobParameterDefinition> jobParameterDefinitions = providerService
      .run(query)
      .listOf(JobParameterDefinition.class);
    assertEquals(5, jobParameterDefinitions.size());
    assertEquals("A", jobParameterDefinitions.get(0).getName());
    assertEquals("ABC", jobParameterDefinitions.get(0).getValue());
    assertEquals("B", jobParameterDefinitions.get(1).getName());
    assertEquals("21", jobParameterDefinitions.get(1).getValue());
    assertEquals("C", jobParameterDefinitions.get(2).getName());
    assertNull(jobParameterDefinitions.get(2).getValue());
    assertEquals("D", jobParameterDefinitions.get(3).getName());
    assertEquals("22", jobParameterDefinitions.get(3).getValue());
    assertEquals("E", jobParameterDefinitions.get(4).getName());
    assertEquals("2025-01-01T00:00:00Z", jobParameterDefinitions.get(4).getValue());
  }

  @Test
  @WithMockUser("authenticated")
  void getJobs() {
    Select<Job_> query = Select.from(JOB).orderBy(j -> j.name().asc());
    List<Job> jobs = providerService.run(query).listOf(Job.class);
    assertEquals(3, jobs.size());
    for (int i = 0; i < jobs.size(); i++) {
      Job job = jobs.get(i);
      assertEquals("JOB_" + (i + 1), job.getName());
    }
  }

  @Test
  @WithMockUser("authenticated")
  void getJobParameters() {
    Select<JobParameter_> query = Select.from(JOB_PARAMETER)
      .where(jp -> jp.jobID().eq("3a89dfec-59f9-4a91-90fe-3c7ca7407103"))
      .orderBy(jp -> jp.name().asc());
    List<JobParameter> jobParameters = providerService.run(query).listOf(JobParameter.class);
    assertEquals(5, jobParameters.size());
    assertEquals("A", jobParameters.get(0).getName());
    assertEquals("ABC", jobParameters.get(0).getValue());
    assertEquals("B", jobParameters.get(1).getName());
    assertEquals("11", jobParameters.get(1).getValue());
    assertEquals("C", jobParameters.get(2).getName());
    assertEquals("true", jobParameters.get(2).getValue());
    assertEquals("D", jobParameters.get(3).getName());
    assertEquals("12", jobParameters.get(3).getValue());
    assertEquals("E", jobParameters.get(4).getName());
    assertEquals("2025-01-02T00:00:00Z", jobParameters.get(4).getValue());
  }

  @Test
  @WithMockUser("authenticated")
  void getJobResults() {
    Select<JobResult_> query = Select.from(JOB_RESULT)
      .where(jr -> jr.jobID().eq("5a89dfec-59f9-4a91-90fe-3c7ca7407103"))
      .orderBy(jr -> jr.name().asc());
    List<JobResult> jobResults = providerService.run(query).listOf(JobResult.class);
    assertEquals(3, jobResults.size());
    assertEquals("Data", jobResults.get(0).getName());
    assertEquals(ResultTypeCode.DATA, jobResults.get(0).getType());
    assertEquals("test.txt", jobResults.get(0).getFilename());
    assertEquals("text/plain", jobResults.get(0).getMimeType());
    assertEquals("Link", jobResults.get(1).getName());
    assertEquals(ResultTypeCode.LINK, jobResults.get(1).getType());
    assertEquals("https://sap.com", jobResults.get(1).getLink());
    assertEquals("Message", jobResults.get(2).getName());
    assertEquals(ResultTypeCode.MESSAGE, jobResults.get(2).getType());
  }

  @Test
  @WithMockUser("authenticated")
  void getJobResultMessages() {
    Select<JobResultMessage_> query = Select.from(JOB_RESULT_MESSAGE)
      .where(jrm -> jrm.resultID().eq("c2eb590f-9505-4fd6-a5e2-511a1b2ff47f"))
      .orderBy(jrm -> jrm.code().asc());
    List<JobResultMessage> jobResultMessages = providerService.run(query).listOf(JobResultMessage.class);
    assertEquals(3, jobResultMessages.size());
    assertEquals("ERROR_01", jobResultMessages.get(0).getCode());
    assertEquals(MessageSeverityCode.ERROR, jobResultMessages.get(0).getSeverity());
    assertEquals("This is an error", jobResultMessages.get(0).getText());
    assertEquals("INFO_01", jobResultMessages.get(1).getCode());
    assertEquals(MessageSeverityCode.INFO, jobResultMessages.get(1).getSeverity());
    assertEquals("This is an information", jobResultMessages.get(1).getText());
    assertEquals("WARNING_01", jobResultMessages.get(2).getCode());
    assertEquals(MessageSeverityCode.WARNING, jobResultMessages.get(2).getSeverity());
    assertEquals("This is a warning", jobResultMessages.get(2).getText());
  }

  @Test
  @WithMockUser("authenticated")
  void getJobResultData() throws IOException {
    JobResult_ jobResultRef = CQL.entity(JobResult_.class).filter(j ->
      j.ID().eq("b2eb590f-9505-4fd6-a5e2-511a1b2ff47f")
    );
    InputStream data = providerService.data(jobResultRef);
    assertEquals("This is a test", new String(data.readAllBytes(), StandardCharsets.UTF_8));
  }

  @Test
  @WithMockUser("authenticated")
  void createJob() {
    List<Map<String, Object>> parameters = new ArrayList<>();
    parameters.add(Map.of("name", "A", "value", "abc"));
    parameters.add(Map.of("name", "C", "value", "true"));
    parameters.add(Map.of("name", "E"));
    Job job = Job.of(
      Map.of("name", "JOB_1", "referenceID", "c1253940-5f25-4a0b-8585-f62bd085b327", "parameters", parameters)
    );
    Insert insert = Insert.into(JOB).entry(job);
    Job createdJob = providerService.run(insert).single(Job.class);
    String ID = createdJob.getId();
    assertEquals("http://localhost:8080/launchpad.html#Job-monitor&/Job(" + ID + ")", createdJob.getLink());
    assertEquals("JOB_1", createdJob.getName());
    assertEquals("c1253940-5f25-4a0b-8585-f62bd085b327", createdJob.getReferenceID());
    assertEquals(JSONObject.NULL, createdJob.getStartDateTime());
    assertEquals(JobStatusCode.REQUESTED, createdJob.getStatus());
    assertEquals(JSONObject.NULL, createdJob.getTestRun());
    assertEquals("1", createdJob.getVersion());

    persistenceService.run(Delete.from(Scheduling_.JOB).where(j -> j.ID().eq(ID)));
  }

  @Test
  @WithMockUser("authenticated")
  void cancelJob() {
    com.github.capjscommunity.sapafcsdk.model.scheduling.Job job =
      com.github.capjscommunity.sapafcsdk.model.scheduling.Job.of(
        Map.of(
          "definition_name",
          "JOB_5",
          "referenceID",
          "c1253940-5f25-4a0b-8585-f62bd085b327",
          "status_code",
          JobStatusCode.REQUESTED,
          "version",
          "1"
        )
      );
    Result result = persistenceService.run(Insert.into(Scheduling_.JOB).entry(job));
    String ID = result.single().as(com.github.capjscommunity.sapafcsdk.model.scheduling.Job.class).getId();

    Job_ jobRef = CQL.entity(Job_.class).filter(j -> j.ID().eq(ID));
    providerService.cancel(jobRef);

    Job canceledJob = providerService.run(Select.from(JOB).byId(ID)).single(Job.class);
    assertEquals("canceled", canceledJob.getStatus());

    persistenceService.run(Delete.from(Scheduling_.JOB).where(j -> j.ID().eq(ID)));
  }
}
