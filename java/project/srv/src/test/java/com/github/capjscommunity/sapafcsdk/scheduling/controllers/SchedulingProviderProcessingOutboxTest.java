package com.github.capjscommunity.sapafcsdk.scheduling.controllers;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.JobStatusCode;
import com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.processingservice.ProcessJobContext;
import com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.processingservice.ProcessingService_;
import com.github.capjscommunity.sapafcsdk.test.OutboxTestSetup;
import com.sap.cds.services.persistence.PersistenceService;
import com.sap.cds.services.runtime.CdsRuntime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import org.json.JSONArray;
import org.json.JSONObject;
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
    OutboxTestSetup setup = new OutboxTestSetup(
      ProcessingService_.CDS_NAME,
      ProcessJobContext.CDS_NAME,
      cdsRuntime,
      persistenceService
    );
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
    assertEquals("sapafcsdk.scheduling.ProcessingService", processingEvent.get("event"));
    assertEquals("processJob", processingEvent.getJSONObject("message").get("event"));
    assertEquals(ID, processingEvent.getJSONObject("message").getJSONObject("params").get("ID"));

    JSONObject websocketEvent = setup.messageEvents.get(1);
    assertEquals("sapafcsdk.scheduling.WebsocketService", websocketEvent.get("event"));
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

    setup.active = false;
  }

  @Test
  @WithMockUser("authenticated")
  public void cancelJobOutboxed() throws Exception {
    OutboxTestSetup createSetup = new OutboxTestSetup(
      ProcessingService_.CDS_NAME,
      ProcessJobContext.CDS_NAME,
      cdsRuntime,
      persistenceService
    );

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

    createSetup.eventTriggered.countDown();
    assertTrue(createSetup.messageFinished.await(3, TimeUnit.SECONDS));

    mockMvc
      .perform(get("/api/job-scheduling/v1/Job/" + ID))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.status").value(JobStatusCode.RUNNING));

    createSetup.active = false;

    OutboxTestSetup cancelSetup = new OutboxTestSetup(
      ProcessingService_.CDS_NAME,
      ProcessJobContext.CDS_NAME,
      cdsRuntime,
      persistenceService
    );

    mockMvc
      .perform(post("/api/job-scheduling/v1/Job/" + ID + "/cancel").locale(Locale.ENGLISH))
      .andExpect(status().isNoContent());

    cancelSetup.eventTriggered.countDown();

    mockMvc
      .perform(get("/api/job-scheduling/v1/Job/" + ID))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.status").value("cancelRequested"));

    assertTrue(cancelSetup.messageFinished.await(3, TimeUnit.SECONDS));

    mockMvc
      .perform(get("/api/job-scheduling/v1/Job/" + ID))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.status").value("canceled"));

    JSONObject processingEvent = cancelSetup.messageEvents.get(0);
    assertEquals("sapafcsdk.scheduling.ProcessingService", processingEvent.get("event"));
    assertEquals("cancelJob", processingEvent.getJSONObject("message").get("event"));
    assertEquals(ID, processingEvent.getJSONObject("message").getJSONObject("params").get("ID"));

    JSONObject websocketEvent = cancelSetup.messageEvents.get(1);
    assertEquals("sapafcsdk.scheduling.WebsocketService", websocketEvent.get("event"));
    assertEquals("jobStatusChanged", websocketEvent.getJSONObject("message").get("event"));
    assertEquals(
      "cancelRequested",
      websocketEvent.getJSONObject("message").getJSONObject("params").getJSONObject("data").get("status")
    );
    assertEquals(
      ID,
      websocketEvent.getJSONObject("message").getJSONObject("params").getJSONObject("data").getJSONArray("IDs").get(0)
    );

    cancelSetup.active = false;
  }
}
