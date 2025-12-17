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
import java.util.Locale;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@AutoConfigureMockMvc
@SpringBootTest
public class SchedulingProviderOutboxCancelTest {

  @DynamicPropertySource
  static void overrideProps(DynamicPropertyRegistry registry) {
    registry.add("cds.persistence.schema", () -> "OUTBOX_PROVIDER_CANCEL");
  }

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private CdsRuntime cdsRuntime;

  @Autowired
  private PersistenceService persistenceService;

  @Test
  @WithMockUser("authenticated")
  public void cancelJobOutboxed() throws Exception {
    String ID;
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
      ID = json.getString("ID");

      setup.awaitCompleted();

      mockMvc
        .perform(get("/api/job-scheduling/v1/Job/" + ID))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value(JobStatusCode.RUNNING));
    }

    try (OutboxTestSetup setup = new OutboxTestSetup(ProcessingService_.CDS_NAME, cdsRuntime, persistenceService)) {
      mockMvc
        .perform(post("/api/job-scheduling/v1/Job/" + ID + "/cancel").locale(Locale.ENGLISH))
        .andExpect(status().isNoContent());
      mockMvc.perform(get("/api/job-scheduling/v1/Job/" + ID)).andExpect(status().isOk());

      List<JSONObject> messageEvents = setup.awaitCompleted();

      mockMvc
        .perform(get("/api/job-scheduling/v1/Job/" + ID))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("canceled"));

      JSONObject processingEvent = messageEvents.getFirst();
      assertEquals("sapafcsdk.scheduling.ProcessingService", processingEvent.get("event"));
      assertEquals("cancelJob", processingEvent.getJSONObject("message").get("event"));
      assertEquals(ID, processingEvent.getJSONObject("message").getJSONObject("params").get("ID"));

      JSONObject websocketEvent = messageEvents.get(1);
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
    }
  }
}
