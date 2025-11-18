package com.github.capjscommunity.sapafcsdk.scheduling.handlers;

import static com.github.capjscommunity.sapafcsdk.model.scheduling.Scheduling_.*;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

import com.github.capjscommunity.sapafcsdk.configuration.OutboxConfig;
import com.github.capjscommunity.sapafcsdk.model.scheduling.*;
import com.github.capjscommunity.sapafcsdk.model.schedulingprocessingservice.SchedulingProcessingService;
import com.github.capjscommunity.sapafcsdk.test.OutboxTestConfig;
import com.github.capjscommunity.sapafcsdk.test.TestSimpleCompletedConfig;
import com.sap.cds.Result;
import com.sap.cds.ql.Delete;
import com.sap.cds.ql.Insert;
import com.sap.cds.ql.Select;
import com.sap.cds.services.messages.LocalizedMessageProvider;
import com.sap.cds.services.outbox.OutboxService;
import com.sap.cds.services.persistence.PersistenceService;
import java.io.InputStream;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ContextConfiguration;

@AutoConfigureMockMvc
@SpringBootTest
@ContextConfiguration(classes = { OutboxTestConfig.class, TestSimpleCompletedConfig.class })
public class SchedulingProcessingHandlerSimpleMockCompletedTest {

  @Autowired
  private SchedulingProcessingService processingService;

  @Autowired
  private PersistenceService persistenceService;

  @Autowired
  private LocalizedMessageProvider messageProvider;

  @Autowired
  @Qualifier(OutboxConfig.OUTBOX_SERVICE)
  protected OutboxService outboxService;

  @Test
  @WithMockUser("authenticated")
  void processJob() throws Exception {
    Locale.setDefault(Locale.ENGLISH);

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
    assertEquals(JobStatusCode.COMPLETED, processedJob.getStatusCode());

    List<JobResult> jobResults = persistenceService
      .run(Select.from(JOB_RESULT).where(jr -> jr.job_ID().eq(ID)))
      .listOf(JobResult.class);

    assertEquals(5, jobResults.size());
    assertEquals("Basic Mocked Run", jobResults.get(0).getName());
    assertEquals(ResultTypeCode.MESSAGE, jobResults.get(0).getTypeCode());
    assertEquals("Message", jobResults.get(1).getName());
    assertEquals(ResultTypeCode.MESSAGE, jobResults.get(1).getTypeCode());
    assertEquals("Link", jobResults.get(2).getName());
    assertEquals(ResultTypeCode.LINK, jobResults.get(2).getTypeCode());
    assertEquals("https://sap.com", jobResults.get(2).getLink());
    assertEquals("Data", jobResults.get(3).getName());
    assertEquals(ResultTypeCode.DATA, jobResults.get(3).getTypeCode());
    assertEquals("text/plain", jobResults.get(3).getMimeType());
    assertEquals("log.txt", jobResults.get(3).getFilename());
    assertEquals("Data", jobResults.get(4).getName());
    assertEquals(ResultTypeCode.DATA, jobResults.get(4).getTypeCode());
    assertEquals("application/pdf", jobResults.get(4).getMimeType());
    assertEquals("log.pdf", jobResults.get(4).getFilename());

    List<String> messageResultIDs = jobResults
      .stream()
      .filter(r -> Objects.equals(r.getTypeCode(), ResultTypeCode.MESSAGE))
      .map(JobResult::getId)
      .toList();

    List<JobResultMessage> jobResultMessages = persistenceService
      .run(Select.from(JOB_RESULT_MESSAGE).where(jr -> jr.result_ID().eq(messageResultIDs.get(0))))
      .listOf(JobResultMessage.class);
    assertEquals(1, jobResultMessages.size());
    assertEquals("jobBasicMock", jobResultMessages.get(0).getCode());
    assertEquals(MessageSeverityCode.INFO, jobResultMessages.get(0).getSeverityCode());
    assertEquals(messageProvider.get("jobBasicMock", null, Locale.ENGLISH), jobResultMessages.get(0).getText());

    jobResultMessages = persistenceService
      .run(Select.from(JOB_RESULT_MESSAGE).where(jr -> jr.result_ID().eq(messageResultIDs.get(1))))
      .listOf(JobResultMessage.class);
    assertEquals(1, jobResultMessages.size());
    assertEquals("jobCompleted", jobResultMessages.get(0).getCode());
    assertEquals(MessageSeverityCode.INFO, jobResultMessages.get(0).getSeverityCode());
    assertEquals(messageProvider.get("jobCompleted", null, Locale.ENGLISH), jobResultMessages.get(0).getText());

    String textResultID = jobResults
      .stream()
      .filter(r -> "text/plain".equals(r.getMimeType()))
      .map(JobResult::getId)
      .findFirst()
      .orElseThrow();

    JobResult jobResult = persistenceService
      .run(Select.from(Scheduling_.JOB_RESULT).byId(textResultID))
      .single(com.github.capjscommunity.sapafcsdk.model.scheduling.JobResult.class);
    assertEquals("Job completed successfully", new String(jobResult.getData().readAllBytes()));

    String pdfResultID = jobResults
      .stream()
      .filter(r -> "application/pdf".equals(r.getMimeType()))
      .map(JobResult::getId)
      .findFirst()
      .orElseThrow();

    jobResult = persistenceService
      .run(Select.from(Scheduling_.JOB_RESULT).byId(pdfResultID))
      .single(com.github.capjscommunity.sapafcsdk.model.scheduling.JobResult.class);
    InputStream pdfStream = this.getClass().getClassLoader().getResourceAsStream("log.pdf");
    byte[] pdfBytes = pdfStream.readAllBytes();
    assertArrayEquals(pdfBytes, jobResult.getData().readAllBytes());

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }
}
