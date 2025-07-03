package com.github.cap.js.community.sapafcsdk.scheduling.base;

import static com.github.cap.js.community.sapafcsdk.model.scheduling.Scheduling_.JOB_RESULT;

import com.github.cap.js.community.sapafcsdk.common.EndpointProvider;
import com.github.cap.js.community.sapafcsdk.configuration.OutboxConfig;
import com.github.cap.js.community.sapafcsdk.model.scheduling.JobResult;
import com.github.cap.js.community.sapafcsdk.model.scheduling.JobResult_;
import com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.SchedulingProcessingService;
import com.github.cap.js.community.sapafcsdk.model.schedulingproviderservice.JobResultDataContext;
import com.github.cap.js.community.sapafcsdk.model.schedulingwebsocketservice.SchedulingWebsocketService;
import com.sap.cds.ql.Select;
import com.sap.cds.services.outbox.OutboxService;
import com.sap.cds.services.persistence.PersistenceService;
import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAccessor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;

public class SchedulingProviderBase {

  @Autowired
  protected PersistenceService persistenceService;

  @Autowired
  protected SchedulingProcessingService processingService;

  @Autowired
  protected SchedulingWebsocketService websocketService;

  @Autowired
  @Qualifier(OutboxConfig.OUTBOX_SERVICE)
  protected OutboxService outboxService;

  @Autowired
  protected EndpointProvider endpointProvider;

  protected InputStream downloadData(JobResultDataContext context, String ID) throws IOException {
    Select<JobResult_> query = Select.from(JOB_RESULT).byId(ID);
    JobResult jobResult = persistenceService.run(query).single(JobResult.class);
    return jobResult.getData();
  }

  protected boolean isValidISODateTime(String date) {
    try {
      TemporalAccessor ta = DateTimeFormatter.ISO_DATE_TIME.parse(date);
      Instant.from(ta);
      return true;
    } catch (Exception ignored) {}
    return false;
  }

  protected String normalizeISODateTime(String date) {
    try {
      return Instant.from(DateTimeFormatter.ISO_DATE_TIME.parse(date)).toString();
    } catch (Exception ignored) {}
    return null;
  }
}
