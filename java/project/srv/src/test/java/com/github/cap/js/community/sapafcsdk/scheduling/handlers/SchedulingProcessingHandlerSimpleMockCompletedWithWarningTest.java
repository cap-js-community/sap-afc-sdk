package com.github.cap.js.community.sapafcsdk.scheduling.handlers;

import static com.github.cap.js.community.sapafcsdk.model.scheduling.Scheduling_.*;
import static org.junit.jupiter.api.Assertions.assertEquals;

import com.github.cap.js.community.sapafcsdk.configuration.OutboxConfig;
import com.github.cap.js.community.sapafcsdk.model.scheduling.*;
import com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.SchedulingProcessingService;
import com.github.cap.js.community.sapafcsdk.test.OutboxTestConfig;
import com.github.cap.js.community.sapafcsdk.test.TestSimpleCompletedWithWarningConfig;
import com.sap.cds.Result;
import com.sap.cds.ql.Delete;
import com.sap.cds.ql.Insert;
import com.sap.cds.ql.Select;
import com.sap.cds.services.messages.LocalizedMessageProvider;
import com.sap.cds.services.outbox.OutboxService;
import com.sap.cds.services.persistence.PersistenceService;
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
@ContextConfiguration(classes = { OutboxTestConfig.class, TestSimpleCompletedWithWarningConfig.class })
public class SchedulingProcessingHandlerSimpleMockCompletedWithWarningTest {

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
  void processJob() {
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
    assertEquals(JobStatusCode.COMPLETED_WITH_WARNING, processedJob.getStatusCode());

    List<JobResult> jobResults = persistenceService
      .run(Select.from(JOB_RESULT).where(jr -> jr.job_ID().eq(ID)))
      .listOf(JobResult.class);

    assertEquals(2, jobResults.size());
    assertEquals("Basic Mocked Run", jobResults.get(0).getName());
    assertEquals(ResultTypeCode.MESSAGE, jobResults.get(0).getTypeCode());
    assertEquals("Message", jobResults.get(1).getName());
    assertEquals(ResultTypeCode.MESSAGE, jobResults.get(1).getTypeCode());

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
    assertEquals("jobCompletedWithWarning", jobResultMessages.get(0).getCode());
    assertEquals(MessageSeverityCode.WARNING, jobResultMessages.get(0).getSeverityCode());
    assertEquals(
      messageProvider.get("jobCompletedWithWarning", null, Locale.ENGLISH),
      jobResultMessages.get(0).getText()
    );

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }
}
