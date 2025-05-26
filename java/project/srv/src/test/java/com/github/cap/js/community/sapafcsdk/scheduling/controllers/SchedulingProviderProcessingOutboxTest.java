package com.github.cap.js.community.sapafcsdk.scheduling.controllers;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.github.cap.js.community.sapafcsdk.model.cds.outbox.Messages_;
import com.github.cap.js.community.sapafcsdk.model.scheduling.JobStatusCode;
import com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.CancelJobContext;
import com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.ProcessJobContext;
import com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.SchedulingProcessingService_;
import com.sap.cds.services.cds.CqnService;
import com.sap.cds.services.changeset.ChangeSetListener;
import com.sap.cds.services.impl.cds.CdsCreateEventContextImpl;
import com.sap.cds.services.outbox.OutboxService;
import com.sap.cds.services.persistence.PersistenceService;
import com.sap.cds.services.runtime.CdsRuntime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@AutoConfigureMockMvc
@SpringBootTest
public class SchedulingProviderProcessingOutboxTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private CdsRuntime cdsRuntime;

  @Autowired
  private PersistenceService persistenceService;

  @Test
  @WithMockUser("authenticated")
  public void createJobOutboxed() throws Exception {
    OutboxTestSetup setup = prepareOutboxTest(SchedulingProcessingService_.CDS_NAME, ProcessJobContext.CDS_NAME);
    JSONObject job = new JSONObject(
      Map.of(
        "name",
        "JOB_1",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b327",
        "parameters",
        new JSONArray(
          List.of(
            new JSONObject(Map.of("name", "A", "value", "abc")),
            new JSONObject(Map.of("name", "C", "value", "true")),
            new JSONObject(Map.of("name", "E", "value", JSONObject.NULL))
          )
        )
      )
    );
    MvcResult result = mockMvc
      .perform(post("/api/job-scheduling/v1/Job").contentType("application/json").content(job.toString()))
      .andExpect(status().isCreated())
      .andReturn();
    String response = result.getResponse().getContentAsString();
    JSONObject json = new JSONObject(response);
    String ID = json.getString("ID");
    assertEquals("http://localhost:8080/launchpad.html#Job-monitor&/Job(" + ID + ")", json.get("link"));
    assertEquals("JOB_1", json.get("name"));
    assertEquals("c1253940-5f25-4a0b-8585-f62bd085b327", json.get("referenceID"));
    assertEquals(JSONObject.NULL, json.get("startDateTime"));
    assertEquals(JobStatusCode.REQUESTED, json.get("status"));
    assertEquals(JSONObject.NULL, json.get("testRun"));
    assertEquals("1", json.get("version"));

    mockMvc
      .perform(get("/api/job-scheduling/v1/Job/" + ID))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.status").value(JobStatusCode.REQUESTED));

    setup.eventTriggered.countDown();

    JSONObject processingEvent = setup.messageEvents.get(0);
    assertEquals("SchedulingProcessingService", processingEvent.get("event"));
    assertEquals("processJob", processingEvent.getJSONObject("message").get("event"));
    assertEquals(ID, processingEvent.getJSONObject("message").getJSONObject("params").get("ID"));

    JSONObject websocketEvent = setup.messageEvents.get(1);
    assertEquals("SchedulingWebsocketService", websocketEvent.get("event"));
    assertEquals("jobStatusChanged", websocketEvent.getJSONObject("message").get("event"));
    assertEquals(
      JobStatusCode.REQUESTED,
      websocketEvent.getJSONObject("message").getJSONObject("params").getJSONObject("data").get("status")
    );
    assertEquals(
      ID,
      websocketEvent.getJSONObject("message").getJSONObject("params").getJSONObject("data").getJSONArray("IDs").get(0)
    );

    assertTrue(setup.messageFinished.await(3, TimeUnit.SECONDS));

    mockMvc
      .perform(get("/api/job-scheduling/v1/Job/" + ID))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.status").value(JobStatusCode.RUNNING));
  }

  @Test
  @WithMockUser("authenticated")
  public void cancelJobOutboxed() throws Exception {
    OutboxTestSetup setup = prepareOutboxTest(SchedulingProcessingService_.CDS_NAME, CancelJobContext.CDS_NAME);

    mockMvc
      .perform(post("/api/job-scheduling/v1/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407103/cancel").locale(Locale.ENGLISH))
      .andExpect(status().isNoContent());

    mockMvc
      .perform(get("/api/job-scheduling/v1/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407103"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.status").value("cancelRequested"));

    setup.eventTriggered.countDown();

    JSONObject processingEvent = setup.messageEvents.get(0);
    assertEquals("SchedulingProcessingService", processingEvent.get("event"));
    assertEquals("cancelJob", processingEvent.getJSONObject("message").get("event"));
    assertEquals(
      "3a89dfec-59f9-4a91-90fe-3c7ca7407103",
      processingEvent.getJSONObject("message").getJSONObject("params").get("ID")
    );

    JSONObject websocketEvent = setup.messageEvents.get(1);
    assertEquals("SchedulingWebsocketService", websocketEvent.get("event"));
    assertEquals("jobStatusChanged", websocketEvent.getJSONObject("message").get("event"));
    assertEquals(
      "cancelRequested",
      websocketEvent.getJSONObject("message").getJSONObject("params").getJSONObject("data").get("status")
    );
    assertEquals(
      "3a89dfec-59f9-4a91-90fe-3c7ca7407103",
      websocketEvent.getJSONObject("message").getJSONObject("params").getJSONObject("data").getJSONArray("IDs").get(0)
    );

    assertTrue(setup.messageFinished.await(3, TimeUnit.SECONDS));

    mockMvc
      .perform(get("/api/job-scheduling/v1/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407103"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.status").value("canceled"));
  }

  private static class OutboxTestSetup {

    CqnService service;
    List<JSONObject> messageEvents;
    CountDownLatch messageFinished;
    CountDownLatch eventTriggered;
  }

  private OutboxTestSetup prepareOutboxTest(String serviceName, String eventName) {
    OutboxService outboxService = cdsRuntime
      .getServiceCatalog()
      .getService(OutboxService.class, OutboxService.PERSISTENT_ORDERED_NAME);
    CqnService service = outboxService.outboxed(
      cdsRuntime.getServiceCatalog().getService(CqnService.class, serviceName)
    );

    OutboxTestSetup setup = new OutboxTestSetup();
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
