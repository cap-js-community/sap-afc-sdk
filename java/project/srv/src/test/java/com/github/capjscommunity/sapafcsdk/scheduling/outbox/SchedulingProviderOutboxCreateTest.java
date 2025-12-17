package com.github.capjscommunity.sapafcsdk.scheduling.outbox;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.JobStatusCode;
import com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.processingservice.ProcessingService_;
import com.github.capjscommunity.sapafcsdk.test.OutboxTestSetup;
import com.sap.cds.services.persistence.PersistenceService;
import com.sap.cds.services.runtime.CdsRuntime;
import java.util.List;
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
public class SchedulingProviderOutboxCreateTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private CdsRuntime cdsRuntime;

  @Autowired
  private PersistenceService persistenceService;

  @Test
  @WithMockUser("authenticated")
  public void createJobOutboxed() throws Exception {
    try (OutboxTestSetup setup = new OutboxTestSetup(ProcessingService_.CDS_NAME, cdsRuntime, persistenceService)) {
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

      List<JSONObject> messageEvents = setup.awaitCompleted(5, TimeUnit.SECONDS);

      JSONObject processingEvent = messageEvents.get(0);
      assertEquals("sapafcsdk.scheduling.ProcessingService", processingEvent.get("event"));
      assertEquals("processJob", processingEvent.getJSONObject("message").get("event"));
      assertEquals(ID, processingEvent.getJSONObject("message").getJSONObject("params").get("ID"));

      JSONObject websocketEvent = messageEvents.get(1);
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

      mockMvc
        .perform(get("/api/job-scheduling/v1/Job/" + ID))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value(JobStatusCode.RUNNING));
    }
  }
}
