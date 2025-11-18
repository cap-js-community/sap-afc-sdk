package com.github.capjscommunity.sapafcsdk.scheduling.handlers;

import static com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.Scheduling_.JOB;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.github.capjscommunity.sapafcsdk.configuration.OutboxConfig;
import com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.Job;
import com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.JobStatusCode;
import com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.schedulingprocessingservice.Notification;
import com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.schedulingprocessingservice.SchedulingProcessingService;
import com.github.capjscommunity.sapafcsdk.test.OutboxTestConfig;
import com.github.capjscommunity.sapafcsdk.test.TestAdvancedConfig;
import com.sap.cds.Result;
import com.sap.cds.ql.Delete;
import com.sap.cds.ql.Insert;
import com.sap.cds.ql.Select;
import com.sap.cds.services.outbox.OutboxService;
import com.sap.cds.services.persistence.PersistenceService;
import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ContextConfiguration;

@AutoConfigureMockMvc
@SpringBootTest
@ContextConfiguration(classes = { OutboxTestConfig.class, TestAdvancedConfig.class })
public class SchedulingProcessingHandlerAdvancedMockTest {

  @Autowired
  private SchedulingProcessingService processingService;

  @Autowired
  private PersistenceService persistenceService;

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
    assertNotEquals(JobStatusCode.REQUESTED, processedJob.getStatusCode());
    assertNotEquals(JobStatusCode.COMPLETED, processedJob.getStatusCode());

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }

  @Test
  @WithMockUser("authenticated")
  void syncJob() {
    PrintStream standardOut = System.out;
    ByteArrayOutputStream outputStreamCaptor = new ByteArrayOutputStream();
    System.setOut(new PrintStream(outputStreamCaptor));

    processingService.syncJob();
    String logs = outputStreamCaptor.toString(StandardCharsets.UTF_8);
    assertTrue(logs.contains("periodic sync job triggered"), "Expected log message not found in: " + logs);

    System.setOut(standardOut);
  }

  @Test
  @WithMockUser("authenticated")
  public void notification() {
    PrintStream standardOut = System.out;
    ByteArrayOutputStream outputStreamCaptor = new ByteArrayOutputStream();
    System.setOut(new PrintStream(outputStreamCaptor));

    SchedulingProcessingService processingServiceOutboxed = outboxService.outboxed(processingService);
    processingServiceOutboxed.notify(
      List.of(
        Notification.of(
          Map.of("name", "taskListStatusChanged", "ID", "3a89dfec-59f9-4a91-90fe-3c7ca7407103", "value", "obsolete")
        )
      )
    );

    String logs = outputStreamCaptor.toString(StandardCharsets.UTF_8);
    assertTrue(logs.contains("sapafcsdk/notification"), "Expected log message not found in: " + logs);
    assertTrue(
      logs.contains(
        " {\"name\":\"taskListStatusChanged\",\"ID\":\"3a89dfec-59f9-4a91-90fe-3c7ca7407103\",\"value\":\"obsolete\"}"
      ),
      "Expected log message not found in: " + logs
    );

    System.setOut(standardOut);
  }
}
