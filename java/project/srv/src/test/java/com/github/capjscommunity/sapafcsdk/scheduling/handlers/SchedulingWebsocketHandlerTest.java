package com.github.capjscommunity.sapafcsdk.scheduling.handlers;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.github.capjscommunity.sapafcsdk.configuration.OutboxConfig;
import com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.JobStatusCode;
import com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.websocketservice.JobStatusChanged;
import com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.websocketservice.JobStatusChangedContext;
import com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.websocketservice.WebsocketService;
import com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.websocketservice.WebsocketService_;
import com.github.capjscommunity.sapafcsdk.test.OutboxTestSetup;
import com.sap.cds.services.outbox.OutboxService;
import com.sap.cds.services.persistence.PersistenceService;
import com.sap.cds.services.runtime.CdsRuntime;
import java.util.Collections;
import java.util.concurrent.TimeUnit;
import org.json.JSONObject;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;

@AutoConfigureMockMvc
@SpringBootTest
public class SchedulingWebsocketHandlerTest {

  @Autowired
  private CdsRuntime cdsRuntime;

  @Autowired
  @Qualifier(OutboxConfig.OUTBOX_SERVICE)
  protected OutboxService outboxService;

  @Autowired
  private WebsocketService websocketService;

  @Autowired
  private PersistenceService persistenceService;

  @Test
  @WithMockUser("authenticated")
  public void jobStatusChanged() throws Exception {
    OutboxTestSetup setup = new OutboxTestSetup(
      WebsocketService_.CDS_NAME,
      JobStatusChangedContext.CDS_NAME,
      cdsRuntime,
      persistenceService
    );

    WebsocketService websocketServiceOutboxed = outboxService.outboxed(websocketService);
    JobStatusChangedContext jobStatusChanged = JobStatusChangedContext.create();
    JobStatusChanged jobStatusChangedData = JobStatusChanged.create();
    jobStatusChangedData.setStatus(JobStatusCode.COMPLETED);
    jobStatusChangedData.setIDs(Collections.singletonList("3a89dfec-59f9-4a91-90fe-3c7ca7407103"));
    jobStatusChanged.setData(jobStatusChangedData);
    websocketServiceOutboxed.emit(jobStatusChanged);

    setup.eventTriggered.countDown();

    JSONObject websocketEvent = setup.messageEvents.get(0);
    assertEquals("sapafcsdk.scheduling.WebsocketService", websocketEvent.get("event"));
    assertEquals("jobStatusChanged", websocketEvent.getJSONObject("message").get("event"));
    assertEquals(
      JobStatusCode.COMPLETED,
      websocketEvent.getJSONObject("message").getJSONObject("params").getJSONObject("data").get("status")
    );
    assertEquals(
      "3a89dfec-59f9-4a91-90fe-3c7ca7407103",
      websocketEvent.getJSONObject("message").getJSONObject("params").getJSONObject("data").getJSONArray("IDs").get(0)
    );
    assertTrue(setup.messageFinished.await(3, TimeUnit.SECONDS));

    setup.active = false;
  }
}
