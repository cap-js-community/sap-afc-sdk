package com.github.cap.js.community.scheduling.handlers;

import cds.gen.scheduling.Job;
import cds.gen.scheduling.JobStatusCode;
import cds.gen.schedulingprocessingservice.SchedulingProcessingService;
import com.github.cap.js.community.scheduling.configuration.AFCSDKTestAdvancedConfig;
import com.github.cap.js.community.scheduling.configuration.OutboxConfig;
import com.github.cap.js.community.scheduling.configuration.OutboxTestConfig;
import com.sap.cds.Result;
import com.sap.cds.ql.Delete;
import com.sap.cds.ql.Insert;
import com.sap.cds.ql.Select;
import com.sap.cds.services.outbox.OutboxService;
import com.sap.cds.services.persistence.PersistenceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ContextConfiguration;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Map;

import static cds.gen.scheduling.Scheduling_.JOB;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@AutoConfigureMockMvc
@SpringBootTest(
        properties = "spring.main.allow-bean-definition-overriding=true"
)
@ContextConfiguration(classes = { OutboxTestConfig.class, AFCSDKTestAdvancedConfig.class })
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
    void processJob() throws Exception {
        Locale.setDefault(Locale.ENGLISH);

        Job job = Job.of(Map.of("definition_name", "JOB_5", "referenceID", "c1253940-5f25-4a0b-8585-f62bd085b327", "status_code", JobStatusCode.REQUESTED, "version", "1"));
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

}
