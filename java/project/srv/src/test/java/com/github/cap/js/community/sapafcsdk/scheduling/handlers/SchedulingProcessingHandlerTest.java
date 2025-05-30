package com.github.cap.js.community.sapafcsdk.scheduling.handlers;

import static com.github.cap.js.community.sapafcsdk.model.scheduling.Scheduling_.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.github.cap.js.community.sapafcsdk.configuration.OutboxConfig;
import com.github.cap.js.community.sapafcsdk.model.scheduling.*;
import com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.SchedulingProcessingService;
import com.github.cap.js.community.sapafcsdk.test.OutboxTestConfig;
import com.sap.cds.Result;
import com.sap.cds.ql.Delete;
import com.sap.cds.ql.Insert;
import com.sap.cds.ql.Select;
import com.sap.cds.services.messages.LocalizedMessageProvider;
import com.sap.cds.services.outbox.OutboxService;
import com.sap.cds.services.persistence.PersistenceService;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.lang.reflect.InvocationTargetException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;

@AutoConfigureMockMvc
@SpringBootTest(properties = "spring.main.allow-bean-definition-overriding=true")
@ContextConfiguration(classes = { OutboxTestConfig.class })
public class SchedulingProcessingHandlerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private SchedulingProcessingService processingService;

  @Autowired
  private LocalizedMessageProvider messageProvider;

  @Autowired
  private PersistenceService persistenceService;

  @Autowired
  @Qualifier(OutboxConfig.OUTBOX_SERVICE)
  protected OutboxService outboxService;

  @Test
  @WithMockUser("authenticated")
  void processJob() throws Exception {
    Job job = Job.of(
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
    Result result = persistenceService.run(Insert.into(JOB).entry(job));
    String ID = result.single().as(Job.class).getId();

    SchedulingProcessingService processingServiceOutboxed = outboxService.outboxed(processingService);
    processingServiceOutboxed.processJob(ID, false);

    Job processedJob = persistenceService.run(Select.from(JOB).byId(ID)).single(Job.class);
    assertEquals(JobStatusCode.RUNNING, processedJob.getStatusCode());

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }

  @Test
  @WithMockUser("authenticated")
  void updateJobStatus() throws Exception {
    Job job = Job.of(
      Map.of(
        "definition_name",
        "JOB_6",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b328",
        "status_code",
        JobStatusCode.REQUESTED,
        "version",
        "1"
      )
    );
    Result result = persistenceService.run(Insert.into(JOB).entry(job));
    String ID = result.single().as(Job.class).getId();

    SchedulingProcessingService outboxedProcessingService = outboxService.outboxed(processingService);
    outboxedProcessingService.updateJob(ID, JobStatusCode.RUNNING, null);

    Job runningJob = persistenceService.run(Select.from(JOB).byId(ID)).single(Job.class);
    assertEquals(JobStatusCode.RUNNING, runningJob.getStatusCode());

    outboxedProcessingService.updateJob(ID, JobStatusCode.COMPLETED, null);

    Job completedJob = persistenceService.run(Select.from(JOB).byId(ID)).single(Job.class);
    assertEquals(JobStatusCode.COMPLETED, completedJob.getStatusCode());

    outboxedProcessingService.updateJob(ID, JobStatusCode.COMPLETED, null);

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }

  @Test
  @WithMockUser("authenticated")
  void updateJobWithTranslation() throws Exception {
    Locale.setDefault(Locale.ENGLISH);

    Job job = Job.of(
      Map.of(
        "definition_name",
        "JOB_1",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b328",
        "status_code",
        JobStatusCode.REQUESTED,
        "version",
        "1"
      )
    );
    Result insertResult = persistenceService.run(Insert.into(JOB).entry(job));
    String ID = insertResult.single().as(Job.class).getId();

    SchedulingProcessingService outboxedService = outboxService.outboxed(processingService);
    outboxedService.updateJob(ID, JobStatusCode.RUNNING, null);

    com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessage message =
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessage.create();
    message.setCode("jobCompleted");
    message.setSeverity(MessageSeverityCode.INFO);

    com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessageText deText =
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessageText.create();
    deText.setLocale(Locale.GERMAN.getLanguage());
    deText.setText("Job abgeschlossen");
    com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessageText frText =
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessageText.create();
    frText.setLocale(Locale.FRENCH.getLanguage());
    message.setTexts(List.of(deText, frText));

    com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult resultEntry =
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.create();
    resultEntry.setType(ResultTypeCode.MESSAGE);
    resultEntry.setName("Result");
    resultEntry.setMessages(List.of(message));

    outboxedService.updateJob(ID, JobStatusCode.COMPLETED, List.of(resultEntry));

    Job updatedJob = persistenceService.run(Select.from(JOB).byId(ID)).single(Job.class);
    assertEquals(JobStatusCode.COMPLETED, updatedJob.getStatusCode());

    List<JobResult> results = persistenceService
      .run(
        Select.from(com.github.cap.js.community.sapafcsdk.model.scheduling.Scheduling_.JOB_RESULT).where(jr ->
          jr.job_ID().eq(ID)
        )
      )
      .listOf(JobResult.class);
    List<String> resultIDs = results.stream().map(JobResult::getId).toList();

    List<JobResultMessage> messages = persistenceService
      .run(Select.from(JOB_RESULT_MESSAGE).where(m -> m.result_ID().in(resultIDs)))
      .listOf(JobResultMessage.class);

    assertEquals(1, messages.size());
    assertEquals("jobCompleted", messages.get(0).getCode());
    assertEquals(messageProvider.get("jobCompleted", null, Locale.ENGLISH), messages.get(0).getText());

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobResult/" + resultIDs.get(0) + "/messages").locale(Locale.FRENCH))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$[0].code").value("jobCompleted"))
      .andExpect(jsonPath("$[0].text").value(messageProvider.get("jobCompleted", null, Locale.FRENCH)));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobResult/" + resultIDs.get(0) + "/messages").locale(Locale.GERMAN))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$[0].code").value("jobCompleted"))
      .andExpect(jsonPath("$[0].text").value("Job abgeschlossen"));

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }

  @Test
  @WithMockUser("authenticated")
  void updateJobResultsBytes() throws Exception {
    Job job = Job.of(
      Map.of(
        "definition_name",
        "JOB_1",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b328",
        "status_code",
        JobStatusCode.REQUESTED,
        "version",
        "1"
      )
    );
    Result insertResult = persistenceService.run(Insert.into(JOB).entry(job));
    String ID = insertResult.single().as(Job.class).getId();

    SchedulingProcessingService outboxedService = outboxService.outboxed(processingService);
    outboxedService.updateJob(ID, JobStatusCode.RUNNING, null);

    InputStream dataStream = new ByteArrayInputStream("This is a test".getBytes(StandardCharsets.UTF_8));
    List<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> jobResults = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of("type", ResultTypeCode.LINK, "name", "Link", "link", "https://sap.com")
      ),
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of(
          "type",
          ResultTypeCode.DATA,
          "name",
          "Data",
          "filename",
          "test.txt",
          "mimeType",
          "text/plain",
          "data",
          dataStream
        )
      ),
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of(
          "type",
          ResultTypeCode.MESSAGE,
          "name",
          "Result",
          "messages",
          List.of(Map.of("code", "jobCompleted", "severity", MessageSeverityCode.INFO))
        )
      )
    );

    outboxedService.updateJob(ID, JobStatusCode.COMPLETED, jobResults);

    Job updatedJob = persistenceService.run(Select.from(JOB).byId(ID)).single(Job.class);
    assertEquals(JobStatusCode.COMPLETED, updatedJob.getStatusCode());

    List<JobResult> results = persistenceService
      .run(Select.from(JOB_RESULT).where(jr -> jr.job_ID().eq(ID)))
      .listOf(JobResult.class);
    JobResult jobResult = results.get(0);
    assertEquals("Link", jobResult.getName());
    assertEquals(ResultTypeCode.LINK, jobResult.getTypeCode());
    assertEquals("https://sap.com", jobResult.getLink());

    jobResult = results.get(1);
    assertEquals("Data", jobResult.getName());
    assertEquals(ResultTypeCode.DATA, jobResult.getTypeCode());
    assertEquals("test.txt", jobResult.getFilename());
    assertEquals("text/plain", jobResult.getMimeType());

    jobResult = results.get(2);
    assertEquals("Result", jobResult.getName());
    assertEquals(ResultTypeCode.MESSAGE, jobResult.getTypeCode());

    List<String> resultIDs = results.stream().map(JobResult::getId).toList();
    List<JobResultMessage> messages = persistenceService
      .run(Select.from(JOB_RESULT_MESSAGE).where(msg -> msg.result_ID().in(resultIDs)))
      .listOf(JobResultMessage.class);

    assertEquals(1, messages.size());
    JobResultMessage message = messages.get(0);
    assertEquals("jobCompleted", message.getCode());
    assertEquals(MessageSeverityCode.INFO, message.getSeverityCode());

    JobResult dataResult = persistenceService
      .run(Select.from(JOB_RESULT).where(jr -> jr.job_ID().eq(ID).and(jr.type_code().eq(ResultTypeCode.DATA))))
      .single(JobResult.class);

    String actualData = new String(dataResult.getData().readAllBytes(), StandardCharsets.UTF_8);
    assertEquals("This is a test", actualData);

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }

  @Test
  @WithMockUser("authenticated")
  void updateJobResultsStream() throws Exception {
    Job job = Job.of(
      Map.of(
        "definition_name",
        "JOB_1",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b328",
        "status_code",
        JobStatusCode.REQUESTED,
        "version",
        "1"
      )
    );
    Result insertResult = persistenceService.run(Insert.into(JOB).entry(job));
    String ID = insertResult.single().as(Job.class).getId();

    SchedulingProcessingService outboxedService = outboxService.outboxed(processingService);
    outboxedService.updateJob(ID, JobStatusCode.RUNNING, null);

    InputStream dataStream = new ByteArrayInputStream("This is a test".getBytes(StandardCharsets.UTF_8));
    List<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> jobResults = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of(
          "type",
          ResultTypeCode.DATA,
          "name",
          "Data",
          "filename",
          "test.txt",
          "mimeType",
          "text/plain",
          "data",
          dataStream
        )
      )
    );

    outboxedService.updateJob(ID, JobStatusCode.COMPLETED, jobResults);

    Job updatedJob = persistenceService.run(Select.from(JOB).byId(ID)).single(Job.class);
    assertEquals(JobStatusCode.COMPLETED, updatedJob.getStatusCode());

    JobResult dataResult = persistenceService
      .run(Select.from(JOB_RESULT).where(jr -> jr.job_ID().eq(ID).and(jr.type_code().eq(ResultTypeCode.DATA))))
      .single(JobResult.class);

    String actualData = new String(dataResult.getData().readAllBytes(), StandardCharsets.UTF_8);
    assertEquals("This is a test", actualData);

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }

  @Test
  @WithMockUser("authenticated")
  void processJobUpdate() throws Exception {
    Job job = Job.of(
      Map.of(
        "definition_name",
        "JOB_1",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b328",
        "status_code",
        JobStatusCode.REQUESTED,
        "version",
        "1"
      )
    );
    Result insertResult = persistenceService.run(Insert.into(JOB).entry(job));
    String ID = insertResult.single().as(Job.class).getId();

    InputStream dataStream = new ByteArrayInputStream("This is a test".getBytes(StandardCharsets.UTF_8));
    List<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> jobResults = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of(
          "type",
          ResultTypeCode.DATA,
          "name",
          "Data",
          "filename",
          "test.txt",
          "mimeType",
          "text/plain",
          "data",
          dataStream
        )
      )
    );

    processingService.updateJob(ID, JobStatusCode.RUNNING, jobResults);

    Job updatedJob = persistenceService.run(Select.from(JOB).byId(ID)).single(Job.class);
    assertEquals(JobStatusCode.RUNNING, updatedJob.getStatusCode());

    List<JobResult> results = persistenceService
      .run(Select.from(JOB_RESULT).where(jr -> jr.job_ID().eq(ID)))
      .listOf(JobResult.class);
    JobResult jobResult = results.get(0);
    assertEquals("Data", jobResult.getName());
    assertEquals(ResultTypeCode.DATA, jobResult.getTypeCode());
    assertEquals("test.txt", jobResult.getFilename());
    assertEquals("text/plain", jobResult.getMimeType());

    JobResult dataResult = persistenceService
      .run(Select.from(JOB_RESULT).where(jr -> jr.job_ID().eq(ID).and(jr.type_code().eq(ResultTypeCode.DATA))))
      .single(JobResult.class);

    String actualData = new String(dataResult.getData().readAllBytes(), StandardCharsets.UTF_8);
    assertEquals("This is a test", actualData);

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }

  @Test
  @WithMockUser("authenticated")
  void cancelJob() throws Exception {
    Job job = Job.of(
      Map.of(
        "definition_name",
        "JOB_1",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b328",
        "status_code",
        JobStatusCode.REQUESTED,
        "version",
        "1"
      )
    );
    Result insertResult = persistenceService.run(Insert.into(JOB).entry(job));
    String ID = insertResult.single().as(Job.class).getId();

    processingService.cancelJob(ID);
    Job canceledJob = persistenceService.run(Select.from(JOB).byId(ID)).single(Job.class);
    assertEquals(JobStatusCode.CANCELED, canceledJob.getStatusCode());

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }

  @Test
  @WithMockUser("authenticated")
  void processJobError() throws Exception {
    Locale.setDefault(Locale.ENGLISH);

    Exception exception = assertThrows(Exception.class, () -> {
      processingService.processJob("XXX", false);
    });
    assertTrue(
      exception.getMessage().contains(messageProvider.get("jobNotFound", new String[] { "XXX" }, Locale.ENGLISH)),
      "Expected exception message not found: " + exception.getMessage()
    );
  }

  @Test
  @WithMockUser("authenticated")
  void updateJobWrongStatus() throws Exception {
    Locale.setDefault(Locale.ENGLISH);
    Job job = Job.of(
      Map.of(
        "definition_name",
        "JOB_1",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b328",
        "status_code",
        JobStatusCode.REQUESTED,
        "version",
        "1"
      )
    );
    Result insertResult = persistenceService.run(Insert.into(JOB).entry(job));
    String ID = insertResult.single().as(Job.class).getId();

    Exception exception = assertThrows(Exception.class, () -> {
      processingService.updateJob("XXX", JobStatusCode.RUNNING, null);
    });
    assertTrue(
      exception.getMessage().contains(messageProvider.get("jobNotFound", new String[] { "XXX" }, Locale.ENGLISH)),
      "Expected exception message not found: " + exception.getMessage()
    );

    exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, null, null);
    });
    assertTrue(
      exception.getMessage().contains(messageProvider.get("statusValueMissing", null, Locale.ENGLISH)),
      "Expected exception message not found: " + exception.getMessage()
    );

    exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, "XXX", null);
    });
    assertTrue(
      exception.getMessage().contains(messageProvider.get("invalidJobStatus", new String[] { "XXX" }, Locale.ENGLISH)),
      "Expected exception message not found: " + exception.getMessage()
    );

    exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, JobStatusCode.COMPLETED, null);
    });
    assertTrue(
      exception
        .getMessage()
        .contains(
          messageProvider.get("statusTransitionNotAllowed", new String[] { "requested", "completed" }, Locale.ENGLISH)
        ),
      "Expected exception message not found: " + exception.getMessage()
    );

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }

  @Test
  @WithMockUser("authenticated")
  void updateJobWrongResultsLink() throws Exception {
    Locale.setDefault(Locale.ENGLISH);
    Job job = Job.of(
      Map.of(
        "definition_name",
        "JOB_1",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b328",
        "status_code",
        JobStatusCode.REQUESTED,
        "version",
        "1"
      )
    );
    Result insertResult = persistenceService.run(Insert.into(JOB).entry(job));
    String ID = insertResult.single().as(Job.class).getId();

    Collection<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> results1 = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.create()
    );
    Exception exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, JobStatusCode.RUNNING, results1);
    });
    assertTrue(
      exception
        .getMessage()
        .contains("Value of element 'name' in entity 'SchedulingProcessingService.JobResult' is required"),
      "Expected exception message not found: " + exception.getMessage()
    );

    Collection<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> results2 = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(Map.of("name", "Link"))
    );
    exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, JobStatusCode.RUNNING, results2);
    });
    assertTrue(
      exception
        .getMessage()
        .contains("Value of element 'type' in entity 'SchedulingProcessingService.JobResult' is required"),
      "Expected exception message not found: " + exception.getMessage()
    );

    Collection<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> results3 = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of("name", "Link", "type", "X")
      )
    );
    exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, JobStatusCode.RUNNING, results3);
    });
    assertTrue(
      exception.getMessage().contains(messageProvider.get("invalidResultType", new String[] { "X" }, Locale.ENGLISH)),
      "Expected exception message not found: " + exception.getMessage()
    );

    Collection<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> results4 = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of("name", "Link", "type", ResultTypeCode.LINK)
      )
    );
    exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, JobStatusCode.RUNNING, results4);
    });
    assertTrue(
      exception.getMessage().contains(messageProvider.get("linkMissing", new String[] { "link" }, Locale.ENGLISH)),
      "Expected exception message not found: " + exception.getMessage()
    );

    Collection<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> results5 = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of("name", "Link", "type", ResultTypeCode.LINK, "link", "https://sap.com", "mimeType", "text/plain")
      )
    );
    exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, JobStatusCode.RUNNING, results5);
    });
    assertTrue(
      exception
        .getMessage()
        .contains(messageProvider.get("mimeTypeNotAllowed", new String[] { "link" }, Locale.ENGLISH)),
      "Expected exception message not found: " + exception.getMessage()
    );

    Collection<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> results6 = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of("name", "Link", "type", ResultTypeCode.LINK, "link", "https://sap.com", "filename", "test.txt")
      )
    );
    exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, JobStatusCode.RUNNING, results6);
    });
    assertTrue(
      exception
        .getMessage()
        .contains(messageProvider.get("filenameNotAllowed", new String[] { "link" }, Locale.ENGLISH)),
      "Expected exception message not found: " + exception.getMessage()
    );

    InputStream dataStream = new ByteArrayInputStream("This is a test".getBytes(StandardCharsets.UTF_8));
    Collection<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> results7 = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of("name", "Link", "type", ResultTypeCode.LINK, "link", "https://sap.com", "data", dataStream)
      )
    );
    exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, JobStatusCode.RUNNING, results7);
    });
    assertTrue(
      exception.getMessage().contains(messageProvider.get("dataNotAllowed", new String[] { "link" }, Locale.ENGLISH)),
      "Expected exception message not found: " + exception.getMessage()
    );

    Collection<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> results8 = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of(
          "name",
          "Link",
          "type",
          ResultTypeCode.LINK,
          "link",
          "https://sap.com",
          "messages",
          new ArrayList<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessage>()
        )
      )
    );
    exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, JobStatusCode.RUNNING, results8);
    });
    assertTrue(
      exception
        .getMessage()
        .contains(messageProvider.get("messagesNotAllowed", new String[] { "link" }, Locale.ENGLISH)),
      "Expected exception message not found: " + exception.getMessage()
    );

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }

  @Test
  @WithMockUser("authenticated")
  void updateJobWrongResultsData() throws Exception {
    Locale.setDefault(Locale.ENGLISH);
    Job job = Job.of(
      Map.of(
        "definition_name",
        "JOB_1",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b328",
        "status_code",
        JobStatusCode.REQUESTED,
        "version",
        "1"
      )
    );
    Result insertResult = persistenceService.run(Insert.into(JOB).entry(job));
    String ID = insertResult.single().as(Job.class).getId();

    Collection<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> results1 = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of("name", "Link", "type", ResultTypeCode.DATA)
      )
    );
    Exception exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, JobStatusCode.RUNNING, results1);
    });
    assertTrue(
      exception.getMessage().contains(messageProvider.get("mimeTypeMissing", new String[] { "data" }, Locale.ENGLISH)),
      "Expected exception message not found: " + exception.getMessage()
    );

    Collection<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> results2 = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of("name", "Link", "type", ResultTypeCode.DATA, "mimeType", "text/plain")
      )
    );
    exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, JobStatusCode.RUNNING, results2);
    });
    assertTrue(
      exception.getMessage().contains(messageProvider.get("filenameMissing", new String[] { "data" }, Locale.ENGLISH)),
      "Expected exception message not found: " + exception.getMessage()
    );

    Collection<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> results3 = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of("name", "Link", "type", ResultTypeCode.DATA, "mimeType", "text/plain", "filename", "test.txt")
      )
    );
    exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, JobStatusCode.RUNNING, results3);
    });
    assertTrue(
      exception.getMessage().contains(messageProvider.get("dataMissing", new String[] { "data" }, Locale.ENGLISH)),
      "Expected exception message not found: " + exception.getMessage()
    );

    InputStream dataStream = new ByteArrayInputStream("This is a test".getBytes(StandardCharsets.UTF_8));
    Collection<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> results4 = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of(
          "name",
          "Link",
          "type",
          ResultTypeCode.DATA,
          "mimeType",
          "text/plain",
          "filename",
          "test.txt",
          "data",
          dataStream,
          "link",
          "https://sap.com"
        )
      )
    );
    exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, JobStatusCode.RUNNING, results4);
    });
    assertTrue(
      exception.getMessage().contains(messageProvider.get("linkNotAllowed", new String[] { "data" }, Locale.ENGLISH)),
      "Expected exception message not found: " + exception.getMessage()
    );

    Collection<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> results5 = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of(
          "name",
          "Link",
          "type",
          ResultTypeCode.DATA,
          "mimeType",
          "text/plain",
          "filename",
          "test.txt",
          "data",
          dataStream,
          "messages",
          new ArrayList<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessage>()
        )
      )
    );
    exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, JobStatusCode.RUNNING, results5);
    });
    assertTrue(
      exception
        .getMessage()
        .contains(messageProvider.get("messagesNotAllowed", new String[] { "data" }, Locale.ENGLISH)),
      "Expected exception message not found: " + exception.getMessage()
    );

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }

  @Test
  @WithMockUser("authenticated")
  void updateJobWrongResultsMessage() throws Exception {
    Locale.setDefault(Locale.ENGLISH);
    Job job = Job.of(
      Map.of(
        "definition_name",
        "JOB_1",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b328",
        "status_code",
        JobStatusCode.REQUESTED,
        "version",
        "1"
      )
    );
    Result insertResult = persistenceService.run(Insert.into(JOB).entry(job));
    String ID = insertResult.single().as(Job.class).getId();

    Collection<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> results1 = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of("name", "Link", "type", ResultTypeCode.MESSAGE)
      )
    );
    Exception exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, JobStatusCode.RUNNING, results1);
    });
    assertTrue(
      exception
        .getMessage()
        .contains(messageProvider.get("messagesMissing", new String[] { "message" }, Locale.ENGLISH)),
      "Expected exception message not found: " + exception.getMessage()
    );

    Collection<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> results2 = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of(
          "name",
          "Link",
          "type",
          ResultTypeCode.MESSAGE,
          "messages",
          new ArrayList<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessage>()
        )
      )
    );
    exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, JobStatusCode.RUNNING, results2);
    });
    assertTrue(
      exception
        .getMessage()
        .contains(messageProvider.get("messagesMissing", new String[] { "message" }, Locale.ENGLISH)),
      "Expected exception message not found: " + exception.getMessage()
    );

    List<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessage> messages =
      new ArrayList<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessage>();
    com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessage message =
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessage.create();
    messages.add(message);
    Collection<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> results3 = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of("name", "Link", "type", ResultTypeCode.MESSAGE, "messages", messages)
      )
    );
    exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, JobStatusCode.RUNNING, results3);
    });
    String targetMessage =
      ((InvocationTargetException) exception.getCause().getCause()).getTargetException().getMessage();
    assertTrue(
      targetMessage.contains(
        "Value of element 'code' in entity 'SchedulingProcessingService.JobResultMessage' is required"
      ),
      "Expected exception message not found: " + exception.getMessage()
    );

    messages = new ArrayList<
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessage
    >();
    message = com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessage.create();
    message.setCode("abc");
    messages.add(message);
    Collection<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> results4 = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of("name", "Link", "type", ResultTypeCode.MESSAGE, "messages", messages)
      )
    );
    exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, JobStatusCode.RUNNING, results4);
    });
    targetMessage = ((InvocationTargetException) exception.getCause().getCause()).getTargetException().getMessage();
    assertTrue(
      targetMessage.contains(
        "Value of element 'severity' in entity 'SchedulingProcessingService.JobResultMessage' is required"
      )
    );

    messages = new ArrayList<
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessage
    >();
    message = com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessage.create();
    message.setCode("abc");
    message.setSeverity("X");
    messages.add(message);
    Collection<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> results5 = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of("name", "Link", "type", ResultTypeCode.MESSAGE, "messages", messages)
      )
    );
    exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, JobStatusCode.RUNNING, results5);
    });
    assertTrue(
      exception
        .getMessage()
        .contains(messageProvider.get("invalidMessageSeverity", new String[] { "X" }, Locale.ENGLISH)),
      "Expected exception message not found: " + exception.getMessage()
    );

    messages = new ArrayList<
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessage
    >();
    message = com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessage.create();
    message.setCode("abc");
    message.setText("This is a test");
    message.setSeverity(MessageSeverityCode.ERROR);
    messages.add(message);
    Collection<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> results6 = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of("name", "Link", "type", ResultTypeCode.MESSAGE, "messages", messages, "link", "https://sap.com")
      )
    );
    exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, JobStatusCode.RUNNING, results6);
    });
    assertTrue(
      exception
        .getMessage()
        .contains(messageProvider.get("linkNotAllowed", new String[] { "message" }, Locale.ENGLISH)),
      "Expected exception message not found: " + exception.getMessage()
    );

    messages = new ArrayList<
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessage
    >();
    message = com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessage.create();
    message.setCode("abc");
    message.setText("This is a test");
    message.setSeverity(MessageSeverityCode.ERROR);
    messages.add(message);
    Collection<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> results7 = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of("name", "Link", "type", ResultTypeCode.MESSAGE, "messages", messages, "mimeType", "text/plain")
      )
    );
    exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, JobStatusCode.RUNNING, results7);
    });
    assertTrue(
      exception
        .getMessage()
        .contains(messageProvider.get("mimeTypeNotAllowed", new String[] { "message" }, Locale.ENGLISH)),
      "Expected exception message not found: " + exception.getMessage()
    );

    messages = new ArrayList<
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessage
    >();
    message = com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessage.create();
    message.setCode("abc");
    message.setText("This is a test");
    message.setSeverity(MessageSeverityCode.ERROR);
    messages.add(message);
    Collection<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> results8 = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of("name", "Link", "type", ResultTypeCode.MESSAGE, "messages", messages, "filename", "test.txt")
      )
    );
    exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, JobStatusCode.RUNNING, results8);
    });
    assertTrue(
      exception
        .getMessage()
        .contains(messageProvider.get("filenameNotAllowed", new String[] { "message" }, Locale.ENGLISH)),
      "Expected exception message not found: " + exception.getMessage()
    );

    messages = new ArrayList<
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessage
    >();
    message = com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessage.create();
    message.setCode("abc");
    message.setText("This is a test");
    message.setSeverity(MessageSeverityCode.ERROR);
    messages.add(message);
    InputStream dataStream = new ByteArrayInputStream("This is a test".getBytes(StandardCharsets.UTF_8));
    Collection<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> results9 = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of("name", "Link", "type", ResultTypeCode.MESSAGE, "messages", messages, "data", dataStream)
      )
    );
    exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, JobStatusCode.RUNNING, results9);
    });
    assertTrue(
      exception
        .getMessage()
        .contains(messageProvider.get("dataNotAllowed", new String[] { "message" }, Locale.ENGLISH)),
      "Expected exception message not found: " + exception.getMessage()
    );

    messages = new ArrayList<
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessage
    >();
    message = com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessage.create();
    message.setCode("jobCompleted");
    message.setSeverity(MessageSeverityCode.INFO);
    List<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessageText> texts =
      new ArrayList<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessageText>();
    com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessageText text =
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessageText.create();
    texts.add(text);
    message.setTexts(texts);
    messages.add(message);
    Collection<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> results10 = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of("name", "Link", "type", ResultTypeCode.MESSAGE, "messages", messages)
      )
    );
    exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, JobStatusCode.RUNNING, results10);
    });
    targetMessage = ((InvocationTargetException) exception
        .getCause()
        .getCause()
        .getCause()
        .getCause()).getTargetException()
      .getMessage();
    assertTrue(
      targetMessage.contains(
        "Value of element 'locale' in entity 'SchedulingProcessingService.JobResultMessageText' is required"
      ),
      "Expected exception message not found: " + exception.getMessage()
    );

    messages = new ArrayList<
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessage
    >();
    message = com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessage.create();
    message.setCode("jobCompleted");
    message.setSeverity(MessageSeverityCode.INFO);
    texts = new ArrayList<
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessageText
    >();
    text = com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResultMessageText.create();
    text.setLocale("xx");
    text.setText("test");
    texts.add(text);
    message.setTexts(texts);
    messages.add(message);
    Collection<com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult> results11 = List.of(
      com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.JobResult.of(
        Map.of("name", "Link", "type", ResultTypeCode.MESSAGE, "messages", messages)
      )
    );
    exception = assertThrows(Exception.class, () -> {
      processingService.updateJob(ID, JobStatusCode.RUNNING, results11);
    });
    assertTrue(
      exception.getMessage().contains(messageProvider.get("invalidLocale", new String[] { "xx" }, Locale.ENGLISH)),
      "Expected exception message not found: " + exception.getMessage()
    );

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }

  @Test
  @WithMockUser("authenticated")
  void cancelJobStatus() throws Exception {
    Locale.setDefault(Locale.ENGLISH);
    Job job = Job.of(
      Map.of(
        "definition_name",
        "JOB_1",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b328",
        "status_code",
        JobStatusCode.REQUESTED,
        "version",
        "1"
      )
    );
    Result insertResult = persistenceService.run(Insert.into(JOB).entry(job));
    String ID = insertResult.single().as(Job.class).getId();

    Exception exception = assertThrows(Exception.class, () -> {
      processingService.cancelJob("XXX");
    });
    assertTrue(
      exception.getMessage().contains(messageProvider.get("jobNotFound", new String[] { "XXX" }, Locale.ENGLISH)),
      "Expected exception message not found: " + exception.getMessage()
    );

    processingService.updateJob(ID, JobStatusCode.RUNNING, null);

    exception = assertThrows(Exception.class, () -> {
      processingService.cancelJob(ID);
    });
    assertTrue(
      exception
        .getMessage()
        .contains(
          messageProvider.get("statusTransitionNotAllowed", new String[] { "running", "canceled" }, Locale.ENGLISH)
        ),
      "Expected exception message not found: " + exception.getMessage()
    );

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }

  @Test
  @WithMockUser("authenticated")
  void cancelJobCompleted() throws Exception {
    Locale.setDefault(Locale.ENGLISH);
    Job job = Job.of(
      Map.of(
        "definition_name",
        "JOB_1",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b328",
        "status_code",
        JobStatusCode.REQUESTED,
        "version",
        "1"
      )
    );
    Result insertResult = persistenceService.run(Insert.into(JOB).entry(job));
    String ID = insertResult.single().as(Job.class).getId();

    Exception exception = assertThrows(Exception.class, () -> {
      processingService.cancelJob("XXX");
    });
    assertTrue(
      exception.getMessage().contains(messageProvider.get("jobNotFound", new String[] { "XXX" }, Locale.ENGLISH)),
      "Expected exception message not found: " + exception.getMessage()
    );

    processingService.updateJob(ID, JobStatusCode.RUNNING, null);
    processingService.updateJob(ID, JobStatusCode.COMPLETED, null);

    exception = assertThrows(Exception.class, () -> {
      processingService.cancelJob(ID);
    });
    assertTrue(
      exception
        .getMessage()
        .contains(
          messageProvider.get("statusTransitionNotAllowed", new String[] { "completed", "canceled" }, Locale.ENGLISH)
        ),
      "Expected exception message not found: " + exception.getMessage()
    );

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }
}
