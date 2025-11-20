package com.github.capjscommunity.sapafcsdk.scheduling.handlers;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.github.capjscommunity.sapafcsdk.configuration.OutboxConfig;
import com.github.capjscommunity.sapafcsdk.model.cds.outbox.Messages_;
import com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.JobStatusCode;
import com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.websocketservice.JobStatusChanged;
import com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.websocketservice.JobStatusChangedContext;
import com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.websocketservice.WebsocketService;
import com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.websocketservice.WebsocketService_;
import com.sap.cds.services.cds.CqnService;
import com.sap.cds.services.changeset.ChangeSetListener;
import com.sap.cds.services.impl.cds.CdsCreateEventContextImpl;
import com.sap.cds.services.outbox.OutboxService;
import com.sap.cds.services.persistence.PersistenceService;
import com.sap.cds.services.runtime.CdsRuntime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.json.JSONObject;
import org.junit.jupiter.api.Assertions;
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
    OutboxTestSetup setup = prepareOutboxTest(WebsocketService_.CDS_NAME, JobStatusChangedContext.CDS_NAME);

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
  }

  private static class OutboxTestSetup {

    CqnService service;
    List<JSONObject> messageEvents;
    CountDownLatch messageFinished;
    CountDownLatch eventTriggered;
  }

  private SchedulingWebsocketHandlerTest.OutboxTestSetup prepareOutboxTest(String serviceName, String eventName) {
    OutboxService outboxService = cdsRuntime
      .getServiceCatalog()
      .getService(OutboxService.class, OutboxService.PERSISTENT_ORDERED_NAME);
    CqnService service = outboxService.outboxed(
      cdsRuntime.getServiceCatalog().getService(CqnService.class, serviceName)
    );

    SchedulingWebsocketHandlerTest.OutboxTestSetup setup = new SchedulingWebsocketHandlerTest.OutboxTestSetup();
    setup.service = service;
    setup.messageEvents = new ArrayList<>();
    setup.messageFinished = new CountDownLatch(1);
    setup.eventTriggered = new CountDownLatch(1);

    persistenceService.after(CqnService.EVENT_CREATE, Messages_.CDS_NAME, context -> {
      String message = ((CdsCreateEventContextImpl) context).getCqn().entries().get(0).get("msg").toString();
      JSONObject object = Assertions.assertDoesNotThrow(() -> new JSONObject(message));
      setup.messageEvents.add(object);
    });

    persistenceService.after(CqnService.EVENT_DELETE, Messages_.CDS_NAME, context -> {
      context
        .getChangeSetContext()
        .register(
          new ChangeSetListener() {
            @Override
            public void afterClose(boolean completed) {
              setup.messageFinished.countDown();
            }
          }
        );
    });

    if (eventName != null) {
      setup.service.before(eventName, null, context -> {
        try {
          assertTrue(setup.eventTriggered.await(3, TimeUnit.SECONDS), "event triggered latch timed out");
        } catch (InterruptedException e) {
          throw new RuntimeException(e);
        }
      });
    }

    return setup;
  }
}
