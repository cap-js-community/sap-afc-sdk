package com.github.cap.js.community.sapafcsdk.scheduling.controllers;

import static com.github.cap.js.community.sapafcsdk.model.scheduling.Scheduling_.JOB;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.github.cap.js.community.sapafcsdk.model.scheduling.Job;
import com.github.cap.js.community.sapafcsdk.model.scheduling.JobStatusCode;
import com.github.cap.js.community.sapafcsdk.model.scheduling.MessageSeverityCode;
import com.github.cap.js.community.sapafcsdk.model.scheduling.ResultTypeCode;
import com.github.cap.js.community.sapafcsdk.test.OutboxTestConfig;
import com.github.cap.js.community.sapafcsdk.test.TestSimpleCompletedConfig;
import com.sap.cds.Result;
import com.sap.cds.ql.Delete;
import com.sap.cds.ql.Insert;
import com.sap.cds.services.messages.LocalizedMessageProvider;
import com.sap.cds.services.persistence.PersistenceService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@AutoConfigureMockMvc
@SpringBootTest
@ContextConfiguration(classes = { OutboxTestConfig.class, TestSimpleCompletedConfig.class })
public class SchedulingProviderControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private PersistenceService persistenceService;

  @Autowired
  private LocalizedMessageProvider messageProvider;

  @Test
  @WithMockUser("authenticated")
  public void getJobDefinitions() throws Exception {
    MvcResult result = mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition"))
      .andExpect(header().string("Content-Type", "application/json"))
      .andExpect(status().isOk())
      .andReturn();

    String content = result.getResponse().getContentAsString();
    JSONArray jsonArray = new JSONArray(content);
    assertEquals(6, jsonArray.length());
    for (int i = 0; i < jsonArray.length(); i++) {
      JSONObject job = jsonArray.getJSONObject(i);
      assertEquals("JOB_" + (i + 1), job.getString("name"));
    }

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition/JOB_1"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.name").value("JOB_1"));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition?skip=0&top=1"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1))
      .andExpect(jsonPath("$[0].name").value("JOB_1"));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition?skip=-1&top=-1"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1))
      .andExpect(jsonPath("$[0].name").value("JOB_1"));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition?skip=1&top=1"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1))
      .andExpect(jsonPath("$[0].name").value("JOB_2"));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition?skip=-1&top=4"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(4))
      .andExpect(header().string("x-total-count", "6"));

    result = mockMvc.perform(get("/api/job-scheduling/v1/JobDefinition?skip=1")).andExpect(status().isOk()).andReturn();

    content = result.getResponse().getContentAsString();
    jsonArray = new JSONArray(content);
    assertEquals(5, jsonArray.length());
    for (int i = 0; i < jsonArray.length(); i++) {
      JSONObject job = jsonArray.getJSONObject(i);
      assertEquals("JOB_" + (i + 2), job.getString("name"));
    }

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition?$expand=parameters"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(6))
      .andExpect(jsonPath("$.value.[0].parameters").doesNotExist());

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition?$filter=name eq 'JOB_1'"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(6));
  }

  @Test
  @WithMockUser("authenticated")
  public void getJobDefinitionsByName() throws Exception {
    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition?name=JOB_1"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition?name=JOB_*"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(6));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition?name=*OB_2"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition?name=*OB*"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(6));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition?name=*O*B*"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(0));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition?name=job_1"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(0)); // H2 case-sensitive
  }

  @Test
  @WithMockUser("authenticated")
  public void getJobDefinitionsBySearch() throws Exception {
    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition?search=JOB_1"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition?search=JoB_"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(6));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition?search=Ob_2"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition?search=OB"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(6));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition?search=O*B"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(0));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition?search=job_1"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition?search=Job definition 1"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition?search=Job def"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(6));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition?search=ob definition 1"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition?search=ob def"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(6));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition?search=ob*def"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(0));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition?search=job definition 1"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1));
  }

  @Test
  @WithMockUser("authenticated")
  public void getJobParameterDefinitions() throws Exception {
    mockMvc
      .perform(get("/api/job-scheduling/v1/JobParameterDefinition"))
      .andExpect(jsonPath("$.message").value(messageProvider.get("accessOnlyViaParent", null, Locale.ENGLISH)));
    mockMvc
      .perform(get("/api/job-scheduling/v1/JobParameterDefinition/A"))
      .andExpect(jsonPath("$.message").value(messageProvider.get("accessOnlyViaParent", null, Locale.ENGLISH)));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition/JOB_1/parameters"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(5))
      .andExpect(jsonPath("$[0].name").value("A"))
      .andExpect(jsonPath("$[0].value").value("ABC"))
      .andExpect(jsonPath("$[1].name").value("B"))
      .andExpect(jsonPath("$[1].value").value(21))
      .andExpect(jsonPath("$[2].name").value("C"))
      .andExpect(jsonPath("$[2].value").doesNotExist())
      .andExpect(jsonPath("$[3].name").value("D"))
      .andExpect(jsonPath("$[3].value").value(22))
      .andExpect(jsonPath("$[4].name").value("E"))
      .andExpect(jsonPath("$[4].value").value("2025-01-01T00:00:00Z"));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition/JOB_1/parameters?top=1"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1))
      .andExpect(jsonPath("$[0].name").value("A"));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition/JOB_1/parameters?skip=1&top=1"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1))
      .andExpect(jsonPath("$[0].name").value("B"))
      .andExpect(header().string("x-total-count", "5"));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition/JOB_1/parameters?skip=1"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(4))
      .andExpect(jsonPath("$[0].name").value("B"));
  }

  @Test
  @WithMockUser("authenticated")
  public void getJobs() throws Exception {
    mockMvc
      .perform(get("/api/job-scheduling/v1/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407103"))
      .andExpect(jsonPath("$.name").value("JOB_1"))
      .andExpect(
        jsonPath("$.link").value(
          "http://localhost:8080/launchpad.html#Job-monitor&/Job(3a89dfec-59f9-4a91-90fe-3c7ca7407103)"
        )
      )
      .andExpect(status().isOk());

    MvcResult result = mockMvc
      .perform(get("/api/job-scheduling/v1/Job"))
      .andExpect(header().string("Content-Type", "application/json"))
      .andExpect(status().isOk())
      .andReturn();

    String content = result.getResponse().getContentAsString();
    JSONArray jsonArray = new JSONArray(content);
    assertEquals(3, jsonArray.length());
    for (int i = 0; i < jsonArray.length(); i++) {
      JSONObject job = jsonArray.getJSONObject(i);
      assertEquals("JOB_" + (i + 1), job.getString("name"));
    }

    mockMvc
      .perform(get("/api/job-scheduling/v1/Job?skip=0&top=1"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1))
      .andExpect(jsonPath("$[0].name").value("JOB_1"));

    mockMvc
      .perform(get("/api/job-scheduling/v1/Job?skip=-1&top=-1"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1))
      .andExpect(jsonPath("$[0].name").value("JOB_1"));

    mockMvc
      .perform(get("/api/job-scheduling/v1/Job?skip=1&top=1"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1))
      .andExpect(jsonPath("$[0].name").value("JOB_2"))
      .andExpect(header().string("x-total-count", "3"));

    mockMvc
      .perform(get("/api/job-scheduling/v1/Job?skip=-1&top=4"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(3));

    result = mockMvc.perform(get("/api/job-scheduling/v1/JobDefinition?skip=1")).andExpect(status().isOk()).andReturn();

    content = result.getResponse().getContentAsString();
    jsonArray = new JSONArray(content);
    assertEquals(5, jsonArray.length());
    for (int i = 0; i < jsonArray.length(); i++) {
      JSONObject job = jsonArray.getJSONObject(i);
      assertEquals("JOB_" + (i + 2), job.getString("name"));
    }

    mockMvc
      .perform(get("/api/job-scheduling/v1/Job"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(3));

    mockMvc
      .perform(get("/api/job-scheduling/v1/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407103?$expand=parameters"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.parameters").doesNotExist());

    mockMvc
      .perform(get("/api/job-scheduling/v1/Job?$filter=name eq 'JOB_1'"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(3));
  }

  @Test
  @WithMockUser("authenticated")
  public void getJobByReferenceID() throws Exception {
    mockMvc
      .perform(get("/api/job-scheduling/v1/Job?referenceID=8158cbab-a42b-4cb9-9656-8db72521d13d"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1))
      .andExpect(jsonPath("$[0].name").value("JOB_2"))
      .andExpect(jsonPath("$[0].referenceID").value("8158cbab-a42b-4cb9-9656-8db72521d13d"));
  }

  @Test
  @WithMockUser("authenticated")
  public void getJobByName() throws Exception {
    mockMvc
      .perform(get("/api/job-scheduling/v1/Job?name=JOB_2"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1))
      .andExpect(jsonPath("$[0].name").value("JOB_2"));
  }

  @Test
  @WithMockUser("authenticated")
  public void getJobParameters() throws Exception {
    mockMvc
      .perform(get("/api/job-scheduling/v1/JobParameter"))
      .andExpect(jsonPath("$.message").value(messageProvider.get("accessOnlyViaParent", null, Locale.ENGLISH)));
    mockMvc
      .perform(get("/api/job-scheduling/v1/JobParameter/3a89dfec-59f9-4a91-90fe-3c7ca7407103"))
      .andExpect(jsonPath("$.message").value(messageProvider.get("accessOnlyViaParent", null, Locale.ENGLISH)));

    mockMvc
      .perform(get("/api/job-scheduling/v1/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407103/parameters"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(5))
      .andExpect(jsonPath("$[0].name").value("A"))
      .andExpect(jsonPath("$[0].value").value("ABC"))
      .andExpect(jsonPath("$[1].name").value("B"))
      .andExpect(jsonPath("$[1].value").value(11))
      .andExpect(jsonPath("$[2].name").value("C"))
      .andExpect(jsonPath("$[2].value").value(true))
      .andExpect(jsonPath("$[3].name").value("D"))
      .andExpect(jsonPath("$[3].value").value(12))
      .andExpect(jsonPath("$[4].name").value("E"))
      .andExpect(jsonPath("$[4].value").value("2025-01-02T00:00:00Z"));

    mockMvc
      .perform(get("/api/job-scheduling/v1/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407103/parameters?top=1"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1))
      .andExpect(jsonPath("$[0].name").value("A"));

    mockMvc
      .perform(get("/api/job-scheduling/v1/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407103/parameters?skip=1&top=1"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1))
      .andExpect(jsonPath("$[0].name").value("B"))
      .andExpect(header().string("x-total-count", "5"));

    mockMvc
      .perform(get("/api/job-scheduling/v1/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407103/parameters?skip=1"))
      .andExpect(status().isOk());
  }

  @Test
  @WithMockUser("authenticated")
  public void getJobResults() throws Exception {
    mockMvc
      .perform(get("/api/job-scheduling/v1/JobResult"))
      .andExpect(jsonPath("$.message").value(messageProvider.get("accessOnlyByKey", null, Locale.ENGLISH)));

    mockMvc
      .perform(get("/api/job-scheduling/v1/Job/5a89dfec-59f9-4a91-90fe-3c7ca7407103/results"))
      .andExpect(status().isOk());

    mockMvc
      .perform(get("/api/job-scheduling/v1/Job/5a89dfec-59f9-4a91-90fe-3c7ca7407103/results?top=1"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1))
      .andExpect(jsonPath("$[0].type").value(ResultTypeCode.DATA));

    mockMvc
      .perform(get("/api/job-scheduling/v1/Job/5a89dfec-59f9-4a91-90fe-3c7ca7407103/results?skip=1&top=1"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1))
      .andExpect(jsonPath("$[0].type").value(ResultTypeCode.LINK))
      .andExpect(header().string("x-total-count", "3"));

    mockMvc
      .perform(get("/api/job-scheduling/v1/Job/5a89dfec-59f9-4a91-90fe-3c7ca7407103/results?skip=1"))
      .andExpect(status().isOk());
  }

  @Test
  @WithMockUser("authenticated")
  public void getJobResultMessages() throws Exception {
    mockMvc
      .perform(get("/api/job-scheduling/v1/JobResultMessage"))
      .andExpect(jsonPath("$.message").value(messageProvider.get("accessOnlyViaParent", null, Locale.ENGLISH)));
    mockMvc
      .perform(get("/api/job-scheduling/v1/JobResultMessage/c2eb590f-9505-4fd6-a5e2-511a1b2ff47f"))
      .andExpect(jsonPath("$.message").value(messageProvider.get("accessOnlyViaParent", null, Locale.ENGLISH)));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobResult/c2eb590f-9505-4fd6-a5e2-511a1b2ff47f"))
      .andExpect(status().isOk());

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobResult/c2eb590f-9505-4fd6-a5e2-511a1b2ff47f/messages"))
      .andExpect(status().isOk());

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobResult/c2eb590f-9505-4fd6-a5e2-511a1b2ff47f/messages?top=1"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1))
      .andExpect(jsonPath("$[0].text").value("This is an error"))
      .andExpect(jsonPath("$[0].severity").value(MessageSeverityCode.ERROR))
      .andExpect(header().string("x-total-count", "3"));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobResult/c2eb590f-9505-4fd6-a5e2-511a1b2ff47f/messages?skip=1&top=1"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1))
      .andExpect(jsonPath("$[0].text").value("This is an information"))
      .andExpect(jsonPath("$[0].severity").value(MessageSeverityCode.INFO));

    mockMvc
      .perform(
        get("/api/job-scheduling/v1/JobResult/c2eb590f-9505-4fd6-a5e2-511a1b2ff47f/messages?skip=1&top=1").locale(
          Locale.GERMAN
        )
      )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1))
      .andExpect(jsonPath("$[0].text").value("Das ist eine Information"))
      .andExpect(jsonPath("$[0].severity").value(MessageSeverityCode.INFO));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobResult/c2eb590f-9505-4fd6-a5e2-511a1b2ff47f/messages?skip=2&top=1"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1))
      .andExpect(jsonPath("$[0].text").value("This is a warning"))
      .andExpect(jsonPath("$[0].severity").value(MessageSeverityCode.WARNING));

    mockMvc
      .perform(
        get("/api/job-scheduling/v1/JobResult/c2eb590f-9505-4fd6-a5e2-511a1b2ff47f/messages?skip=2&top=1").locale(
          Locale.GERMAN
        )
      )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(1))
      .andExpect(jsonPath("$[0].text").value("Das ist eine Warnung"))
      .andExpect(jsonPath("$[0].severity").value(MessageSeverityCode.WARNING));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobResult/c2eb590f-9505-4fd6-a5e2-511a1b2ff47f/messages?skip=1"))
      .andExpect(status().isOk());

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobResult/a2eb590f-9505-4fd6-a5e2-511a1b2ff47f/messages"))
      .andExpect(status().isOk())
      .andExpect(content().json("[]"));

    mockMvc
      .perform(get("/api/job-scheduling/v1/JobResult/c2eb590f-9505-4fd6-a5e2-511a1b2ff47f?$expand=messages"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.messages").doesNotExist());
  }

  @Test
  @WithMockUser("authenticated")
  public void getJobResultData() throws Exception {
    mockMvc
      .perform(get("/api/job-scheduling/v1/JobResult/b2eb590f-9505-4fd6-a5e2-511a1b2ff47f/data"))
      .andExpect(status().isOk())
      .andExpect(header().string("Content-Type", "text/plain"))
      .andExpect(header().string("Content-Disposition", "attachment; filename=\"test.txt\""))
      .andExpect(content().string("This is a test"));
  }

  @Test
  @WithMockUser("authenticated")
  public void createJobBasic() throws Exception {
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
    JSONObject json = (JSONObject) cleanData(new JSONObject(response));
    String ID = json.getString("ID");
    assertEquals("http://localhost:8080/<ID>", json.get("link"));
    assertEquals("JOB_1", json.get("name"));
    assertEquals("c1253940-5f25-4a0b-8585-f62bd085b327", json.get("referenceID"));
    assertEquals(JSONObject.NULL, json.get("startDateTime"));
    assertEquals(JobStatusCode.REQUESTED, json.get("status"));
    assertEquals(JSONObject.NULL, json.get("testRun"));
    assertEquals("1", json.get("version"));

    MvcResult jobResult = mockMvc
      .perform(get("/api/job-scheduling/v1/Job/" + ID))
      .andExpect(status().isOk())
      .andReturn();
    JSONObject jobData = (JSONObject) cleanData(new JSONObject(jobResult.getResponse().getContentAsString()));
    assertEquals(JobStatusCode.COMPLETED, jobData.getString("status"));

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }

  @Test
  @WithMockUser("authenticated")
  public void createJobAdvanced() throws Exception {
    JSONObject job = new JSONObject(
      Map.of(
        "name",
        "JOB_2",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b327",
        "startDateTime",
        "2025-01-01T12:00:00Z",
        "parameters",
        new JSONArray(
          List.of(
            new JSONObject(Map.of("name", "A", "value", "abc")),
            new JSONObject(Map.of("name", "C", "value", "true")),
            new JSONObject(Map.of("name", "D", "value", "32")),
            new JSONObject(Map.of("name", "E"))
          )
        )
      )
    );

    MvcResult result = mockMvc
      .perform(post("/api/job-scheduling/v1/Job").contentType("application/json").content(job.toString()))
      .andExpect(status().isCreated())
      .andReturn();

    String response = result.getResponse().getContentAsString();
    JSONObject json = (JSONObject) cleanData(new JSONObject(response));
    String ID = json.getString("ID");

    assertEquals("http://localhost:8080/<ID>", json.get("link"));
    assertEquals("JOB_2", json.get("name"));
    assertEquals("c1253940-5f25-4a0b-8585-f62bd085b327", json.get("referenceID"));
    assertEquals("2025-01-01T12:00:00Z", json.get("startDateTime"));
    assertEquals(JobStatusCode.REQUESTED, json.get("status"));
    assertEquals(true, json.get("testRun"));
    assertEquals("1", json.get("version"));

    MvcResult jobResult = mockMvc
      .perform(get("/api/job-scheduling/v1/Job/" + ID))
      .andExpect(status().isOk())
      .andReturn();
    JSONObject jobData = (JSONObject) cleanData(new JSONObject(jobResult.getResponse().getContentAsString()));
    assertEquals(JobStatusCode.COMPLETED, jobData.getString("status"));

    MvcResult paramResult = mockMvc
      .perform(get("/api/job-scheduling/v1/Job/" + ID + "/parameters"))
      .andExpect(status().isOk())
      .andReturn();
    JSONArray parameters = (JSONArray) cleanData(new JSONArray(paramResult.getResponse().getContentAsString()));
    assertEquals("A", parameters.getJSONObject(0).get("name"));
    assertEquals("abc", parameters.getJSONObject(0).get("value"));
    assertEquals("C", parameters.getJSONObject(1).get("name"));
    assertEquals(true, parameters.getJSONObject(1).get("value"));
    assertEquals("D", parameters.getJSONObject(2).get("name"));
    assertEquals(new BigDecimal("32.0"), parameters.getJSONObject(2).get("value"));
    assertEquals("E", parameters.getJSONObject(3).get("name"));
    assertEquals("2025-01-01T00:00:00Z", parameters.getJSONObject(3).get("value"));

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }

  @Test
  @WithMockUser("authenticated")
  public void createJobNoParameters() throws Exception {
    JSONObject job = new JSONObject(Map.of("name", "JOB_5", "referenceID", "c1253940-5f25-4a0b-8585-f62bd085b327"));
    MvcResult result = mockMvc
      .perform(post("/api/job-scheduling/v1/Job").contentType("application/json").content(job.toString()))
      .andExpect(status().isCreated())
      .andReturn();
    JSONObject json = new JSONObject(result.getResponse().getContentAsString());
    String ID = json.getString("ID");
    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }

  @Test
  @WithMockUser("authenticated")
  public void createJobWithJsonDataTypes() throws Exception {
    JSONObject job = new JSONObject(
      Map.of(
        "name",
        "JOB_2",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b327",
        "startDateTime",
        "2025-01-01T12:00:00Z",
        "parameters",
        new JSONArray(
          List.of(
            new JSONObject(Map.of("name", "A", "value", "abcd")),
            new JSONObject(Map.of("name", "B", "value", 23)),
            new JSONObject(Map.of("name", "C", "value", true)),
            new JSONObject(Map.of("name", "D", "value", 32.0)),
            new JSONObject(Map.of("name", "E"))
          )
        )
      )
    );

    MvcResult result = mockMvc
      .perform(post("/api/job-scheduling/v1/Job").contentType("application/json").content(job.toString()))
      .andExpect(status().isCreated())
      .andReturn();

    String responseString = result.getResponse().getContentAsString();
    JSONObject responseJson = (JSONObject) cleanData(new JSONObject(responseString));
    String ID = responseJson.getString("ID");

    assertEquals("JOB_2", responseJson.get("name"));
    assertEquals("c1253940-5f25-4a0b-8585-f62bd085b327", responseJson.get("referenceID"));
    assertEquals("2025-01-01T12:00:00Z", responseJson.get("startDateTime"));
    assertEquals(JobStatusCode.REQUESTED, responseJson.get("status"));

    MvcResult jobResult = mockMvc
      .perform(get("/api/job-scheduling/v1/Job/" + ID))
      .andExpect(status().isOk())
      .andReturn();
    JSONObject jobDetails = (JSONObject) cleanData(new JSONObject(jobResult.getResponse().getContentAsString()));
    assertEquals(JobStatusCode.COMPLETED, jobDetails.get("status"));

    MvcResult paramsResult = mockMvc
      .perform(get("/api/job-scheduling/v1/Job/" + ID + "/parameters"))
      .andExpect(status().isOk())
      .andReturn();
    JSONArray parameters = (JSONArray) cleanData(new JSONArray(paramsResult.getResponse().getContentAsString()));

    Map<String, Object> expectedParameters = Map.of(
      "A",
      "abcd",
      "B",
      new BigDecimal("23.0"),
      "C",
      true,
      "D",
      new BigDecimal("32.0"),
      "E",
      "2025-01-01T00:00:00Z"
    );
    for (int i = 0; i < parameters.length(); i++) {
      JSONObject param = parameters.getJSONObject(i);
      String paramName = param.getString("name");
      assertTrue(expectedParameters.containsKey(paramName));
      assertEquals(expectedParameters.get(paramName), param.opt("value"));
    }

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }

  @Test
  @WithMockUser("authenticated")
  public void createJobWithTestRunFlag() throws Exception {
    JSONObject job = new JSONObject(
      Map.of(
        "name",
        "JOB_2",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b327",
        "startDateTime",
        "2025-01-01T12:00:00Z",
        "testRun",
        false,
        "parameters",
        new JSONArray(
          List.of(
            new JSONObject(Map.of("name", "A", "value", "abcd")),
            new JSONObject(Map.of("name", "C", "value", true)),
            new JSONObject(Map.of("name", "D", "value", 32.0)),
            new JSONObject(Map.of("name", "E"))
          )
        )
      )
    );

    MvcResult result = mockMvc
      .perform(post("/api/job-scheduling/v1/Job").contentType("application/json").content(job.toString()))
      .andExpect(status().isCreated())
      .andReturn();

    JSONObject responseJson = (JSONObject) cleanData(new JSONObject(result.getResponse().getContentAsString()));
    String ID = responseJson.getString("ID");
    boolean testRun = responseJson.getBoolean("testRun");
    assertTrue(testRun);

    MvcResult results = mockMvc
      .perform(get("/api/job-scheduling/v1/Job/" + ID + "/results"))
      .andExpect(status().isOk())
      .andReturn();
    JSONArray resultsArray = (JSONArray) cleanData(new JSONArray(results.getResponse().getContentAsString()));
    assertEquals(6, resultsArray.length());

    JSONObject jobResult = resultsArray.getJSONObject(0);
    assertEquals("Basic Mocked Run", jobResult.get("name"));
    assertEquals(ResultTypeCode.MESSAGE, jobResult.get("type"));
    MvcResult messages = mockMvc
      .perform(get("/api/job-scheduling/v1/JobResult/" + jobResult.get("ID") + "/messages").locale(Locale.ENGLISH))
      .andExpect(status().isOk())
      .andReturn();
    JSONArray resultMessages = (JSONArray) cleanData(new JSONArray(messages.getResponse().getContentAsString()));
    JSONObject resultMessage = resultMessages.getJSONObject(0);
    assertEquals("jobBasicMock", resultMessage.getString("code"));
    assertEquals(MessageSeverityCode.INFO, resultMessage.getString("severity"));
    assertEquals(messageProvider.get("jobBasicMock", null, Locale.ENGLISH), resultMessage.getString("text"));

    jobResult = resultsArray.getJSONObject(1);
    assertEquals("Data", jobResult.get("name"));
    assertEquals(ResultTypeCode.DATA, jobResult.get("type"));

    jobResult = resultsArray.getJSONObject(2);
    assertEquals("Data", jobResult.get("name"));
    assertEquals(ResultTypeCode.DATA, jobResult.get("type"));

    jobResult = resultsArray.getJSONObject(3);
    assertEquals("Link", jobResult.get("name"));
    assertEquals(ResultTypeCode.LINK, jobResult.get("type"));
    assertEquals("https://sap.com", jobResult.get("link"));

    jobResult = resultsArray.getJSONObject(4);
    assertEquals("Message", jobResult.get("name"));
    assertEquals(ResultTypeCode.MESSAGE, jobResult.get("type"));

    messages = mockMvc
      .perform(get("/api/job-scheduling/v1/JobResult/" + jobResult.get("ID") + "/messages").locale(Locale.ENGLISH))
      .andExpect(status().isOk())
      .andReturn();
    resultMessages = (JSONArray) cleanData(new JSONArray(messages.getResponse().getContentAsString()));
    resultMessage = resultMessages.getJSONObject(0);
    assertEquals("jobCompleted", resultMessage.getString("code"));
    assertEquals(MessageSeverityCode.INFO, resultMessage.getString("severity"));
    assertEquals(messageProvider.get("jobCompleted", null, Locale.ENGLISH), resultMessage.getString("text"));

    jobResult = resultsArray.getJSONObject(5);
    assertEquals("Test Run", jobResult.get("name"));
    assertEquals(ResultTypeCode.MESSAGE, jobResult.get("type"));
    messages = mockMvc
      .perform(get("/api/job-scheduling/v1/JobResult/" + jobResult.get("ID") + "/messages").locale(Locale.ENGLISH))
      .andExpect(status().isOk())
      .andReturn();
    resultMessages = (JSONArray) cleanData(new JSONArray(messages.getResponse().getContentAsString()));
    resultMessage = resultMessages.getJSONObject(0);
    assertEquals("jobTestRun", resultMessage.getString("code"));
    assertEquals(MessageSeverityCode.INFO, resultMessage.getString("severity"));
    assertEquals(messageProvider.get("jobTestRun", null, Locale.ENGLISH), resultMessage.getString("text"));

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }

  @Test
  @WithMockUser("authenticated")
  public void createJobWithTranslation() throws Exception {
    JSONObject job = new JSONObject(
      Map.of(
        "name",
        "JOB_2",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b327",
        "startDateTime",
        "2025-01-01T12:00:00Z",
        "testRun",
        false,
        "parameters",
        new JSONArray(
          List.of(
            new JSONObject(Map.of("name", "A", "value", "abcd")),
            new JSONObject(Map.of("name", "C", "value", true)),
            new JSONObject(Map.of("name", "D", "value", 32.0)),
            new JSONObject(Map.of("name", "E"))
          )
        )
      )
    );

    MvcResult result = mockMvc
      .perform(post("/api/job-scheduling/v1/Job").contentType("application/json").content(job.toString()))
      .andExpect(status().isCreated())
      .andReturn();

    JSONObject responseJson = (JSONObject) cleanData(new JSONObject(result.getResponse().getContentAsString()));
    String ID = responseJson.getString("ID");

    MvcResult results = mockMvc
      .perform(get("/api/job-scheduling/v1/Job/" + ID + "/results"))
      .andExpect(status().isOk())
      .andReturn();
    JSONArray resultsArray = (JSONArray) cleanData(new JSONArray(results.getResponse().getContentAsString()));
    assertEquals(6, resultsArray.length());

    assertEquals(6, resultsArray.length());

    JSONObject jobResult = resultsArray.getJSONObject(0);
    assertEquals("Basic Mocked Run", jobResult.get("name"));
    assertEquals(ResultTypeCode.MESSAGE, jobResult.get("type"));
    MvcResult messages = mockMvc
      .perform(get("/api/job-scheduling/v1/JobResult/" + jobResult.get("ID") + "/messages").locale(Locale.ENGLISH))
      .andExpect(status().isOk())
      .andReturn();
    JSONArray resultMessages = (JSONArray) cleanData(new JSONArray(messages.getResponse().getContentAsString()));
    JSONObject resultMessage = resultMessages.getJSONObject(0);
    assertEquals("jobBasicMock", resultMessage.getString("code"));
    assertEquals(MessageSeverityCode.INFO, resultMessage.getString("severity"));
    assertEquals(messageProvider.get("jobBasicMock", null, Locale.ENGLISH), resultMessage.getString("text"));

    messages = mockMvc
      .perform(get("/api/job-scheduling/v1/JobResult/" + jobResult.get("ID") + "/messages").locale(Locale.GERMAN))
      .andExpect(status().isOk())
      .andReturn();
    resultMessages = (JSONArray) cleanData(new JSONArray(messages.getResponse().getContentAsString()));
    resultMessage = resultMessages.getJSONObject(0);
    assertEquals("jobBasicMock", resultMessage.getString("code"));
    assertEquals(MessageSeverityCode.INFO, resultMessage.getString("severity"));
    assertEquals(messageProvider.get("jobBasicMock", null, Locale.GERMAN), resultMessage.getString("text"));

    jobResult = resultsArray.getJSONObject(1);
    assertEquals("Data", jobResult.get("name"));
    assertEquals(ResultTypeCode.DATA, jobResult.get("type"));

    jobResult = resultsArray.getJSONObject(2);
    assertEquals("Data", jobResult.get("name"));
    assertEquals(ResultTypeCode.DATA, jobResult.get("type"));

    jobResult = resultsArray.getJSONObject(3);
    assertEquals("Link", jobResult.get("name"));
    assertEquals(ResultTypeCode.LINK, jobResult.get("type"));
    assertEquals("https://sap.com", jobResult.get("link"));

    jobResult = resultsArray.getJSONObject(4);
    assertEquals("Message", jobResult.get("name"));
    assertEquals(ResultTypeCode.MESSAGE, jobResult.get("type"));

    messages = mockMvc
      .perform(get("/api/job-scheduling/v1/JobResult/" + jobResult.get("ID") + "/messages").locale(Locale.ENGLISH))
      .andExpect(status().isOk())
      .andReturn();
    resultMessages = (JSONArray) cleanData(new JSONArray(messages.getResponse().getContentAsString()));
    resultMessage = resultMessages.getJSONObject(0);
    assertEquals("jobCompleted", resultMessage.getString("code"));
    assertEquals(MessageSeverityCode.INFO, resultMessage.getString("severity"));
    assertEquals(messageProvider.get("jobCompleted", null, Locale.ENGLISH), resultMessage.getString("text"));

    messages = mockMvc
      .perform(get("/api/job-scheduling/v1/JobResult/" + jobResult.get("ID") + "/messages").locale(Locale.GERMAN))
      .andExpect(status().isOk())
      .andReturn();
    resultMessages = (JSONArray) cleanData(new JSONArray(messages.getResponse().getContentAsString()));
    resultMessage = resultMessages.getJSONObject(0);
    assertEquals("jobCompleted", resultMessage.getString("code"));
    assertEquals(MessageSeverityCode.INFO, resultMessage.getString("severity"));
    assertEquals(messageProvider.get("jobCompleted", null, Locale.GERMAN), resultMessage.getString("text"));

    jobResult = resultsArray.getJSONObject(5);
    assertEquals("Test Run", jobResult.get("name"));
    assertEquals(ResultTypeCode.MESSAGE, jobResult.get("type"));
    messages = mockMvc
      .perform(get("/api/job-scheduling/v1/JobResult/" + jobResult.get("ID") + "/messages").locale(Locale.ENGLISH))
      .andExpect(status().isOk())
      .andReturn();
    resultMessages = (JSONArray) cleanData(new JSONArray(messages.getResponse().getContentAsString()));
    resultMessage = resultMessages.getJSONObject(0);
    assertEquals("jobTestRun", resultMessage.getString("code"));
    assertEquals(MessageSeverityCode.INFO, resultMessage.getString("severity"));
    assertEquals(messageProvider.get("jobTestRun", null, Locale.ENGLISH), resultMessage.getString("text"));

    messages = mockMvc
      .perform(get("/api/job-scheduling/v1/JobResult/" + jobResult.get("ID") + "/messages").locale(Locale.GERMAN))
      .andExpect(status().isOk())
      .andReturn();
    resultMessages = (JSONArray) cleanData(new JSONArray(messages.getResponse().getContentAsString()));
    resultMessage = resultMessages.getJSONObject(0);
    assertEquals("jobTestRun", resultMessage.getString("code"));
    assertEquals(MessageSeverityCode.INFO, resultMessage.getString("severity"));
    assertEquals(messageProvider.get("jobTestRun", null, Locale.GERMAN), resultMessage.getString("text"));

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }

  @Test
  @WithMockUser("authenticated")
  public void createJobWithStatusAndDuration() throws Exception {
    String mockStatus = JobStatusCode.FAILED;
    int mockDuration = 99999;

    JSONObject job = new JSONObject(
      Map.of(
        "name",
        "JOB_6",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b327",
        "parameters",
        new JSONArray(
          List.of(
            new JSONObject(Map.of("name", "status", "value", mockStatus)),
            new JSONObject(Map.of("name", "duration", "value", mockDuration))
          )
        )
      )
    );

    MvcResult result = mockMvc
      .perform(post("/api/job-scheduling/v1/Job").contentType("application/json").content(job.toString()))
      .andExpect(status().isCreated())
      .andReturn();

    JSONObject responseJson = (JSONObject) cleanData(new JSONObject(result.getResponse().getContentAsString()));
    String ID = responseJson.getString("ID");

    MvcResult jobDetails = mockMvc
      .perform(get("/api/job-scheduling/v1/Job/" + ID))
      .andExpect(status().isOk())
      .andReturn();
    cleanData(new JSONObject(jobDetails.getResponse().getContentAsString()));

    MvcResult jobResults = mockMvc
      .perform(get("/api/job-scheduling/v1/Job/" + ID + "/results"))
      .andExpect(status().isOk())
      .andReturn();

    JSONArray resultsArray = new JSONArray(jobResults.getResponse().getContentAsString());
    assertEquals(1, resultsArray.length());

    JSONObject jobResult = resultsArray.getJSONObject(0);
    assertEquals("Basic Mocked Run", jobResult.get("name"));
    assertEquals("message", jobResult.get("type"));
    MvcResult messages = mockMvc
      .perform(get("/api/job-scheduling/v1/JobResult/" + jobResult.get("ID") + "/messages").locale(Locale.ENGLISH))
      .andExpect(status().isOk())
      .andReturn();
    JSONArray resultMessages = (JSONArray) cleanData(new JSONArray(messages.getResponse().getContentAsString()));
    JSONObject resultMessage = resultMessages.getJSONObject(0);
    assertEquals("jobBasicMock", resultMessage.getString("code"));
    assertEquals(MessageSeverityCode.INFO, resultMessage.getString("severity"));
    assertEquals(messageProvider.get("jobBasicMock", null, Locale.ENGLISH), resultMessage.getString("text"));

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }

  @Test
  @WithMockUser("authenticated")
  public void cancelJob() throws Exception {
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

    mockMvc
      .perform(post("/api/job-scheduling/v1/Job/" + ID + "/cancel").locale(Locale.ENGLISH))
      .andExpect(status().isNoContent());

    mockMvc
      .perform(get("/api/job-scheduling/v1/Job/" + ID))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.status").value("canceled"));

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }

  @Test
  @WithMockUser("authenticated")
  void getJobParameterDefinitionNotFound() throws Exception {
    mockMvc.perform(get("/api/job-scheduling/v1/JobDefinition/XXX/parameters")).andExpect(status().isNotFound());
  }

  @Test
  @WithMockUser("authenticated")
  void getJobParameterNotFound() throws Exception {
    mockMvc.perform(get("/api/job-scheduling/v1/Job/XXX/parameters")).andExpect(status().isNotFound());
  }

  @Test
  @WithMockUser("authenticated")
  void getJobResultMessageNotFound() throws Exception {
    mockMvc.perform(get("/api/job-scheduling/v1/JobResult/XXX/messages")).andExpect(status().isNotFound());
  }

  @Test
  @WithMockUser("authenticated")
  void postJobDefinitionReadOnly() throws Exception {
    mockMvc
      .perform(post("/api/job-scheduling/v1/JobDefinition"))
      .andExpect(status().isMethodNotAllowed())
      .andExpect(status().reason("Method 'POST' is not supported."));
  }

  @Test
  @WithMockUser("authenticated")
  void putJobDefinitionReadOnly() throws Exception {
    mockMvc
      .perform(put("/api/job-scheduling/v1/JobDefinition/JOB_1"))
      .andExpect(status().isMethodNotAllowed())
      .andExpect(status().reason("Method 'PUT' is not supported."));
  }

  @Test
  @WithMockUser("authenticated")
  void deleteJobDefinitionReadOnly() throws Exception {
    mockMvc
      .perform(delete("/api/job-scheduling/v1/JobDefinition/JOB_1"))
      .andExpect(status().isMethodNotAllowed())
      .andExpect(status().reason("Method 'DELETE' is not supported."));
  }

  @Test
  @WithMockUser("authenticated")
  void postJobParameterDefinitionReadOnly() throws Exception {
    mockMvc
      .perform(post("/api/job-scheduling/v1/JobDefinition/JOB_1/parameters"))
      .andExpect(status().isMethodNotAllowed())
      .andExpect(status().reason("Method 'POST' is not supported."));
  }

  @Test
  @WithMockUser("authenticated")
  void putJobParameterDefinitionOneKeyReadOnly() throws Exception {
    mockMvc.perform(put("/api/job-scheduling/v1/JobDefinition/JOB_1/parameters/A")).andExpect(status().isNotFound());
  }

  @Test
  @WithMockUser("authenticated")
  void putJobParameterDefinitionTwoKeysReadOnly() throws Exception {
    mockMvc
      .perform(put("/api/job-scheduling/v1/JobDefinition/JOB_1/parameters/A/JOB_1"))
      .andExpect(status().isNotFound());
  }

  @Test
  @WithMockUser("authenticated")
  void putJobParameterDefinitionReadOnly() throws Exception {
    mockMvc
      .perform(put("/api/job-scheduling/v1/JobDefinition('JOB_1')/parameters(name='A',jobName='JOB_1')"))
      .andExpect(status().isNotFound());
  }

  @Test
  @WithMockUser("authenticated")
  void deleteJobParameterDefinitionOneKeyReadOnly() throws Exception {
    mockMvc.perform(delete("/api/job-scheduling/v1/JobDefinition/JOB_1/parameters/A")).andExpect(status().isNotFound());
  }

  @Test
  @WithMockUser("authenticated")
  void deleteJobParameterDefinitionTwoKeysReadOnly() throws Exception {
    mockMvc
      .perform(delete("/api/job-scheduling/v1/JobDefinition/JOB_1/parameters/A/JOB_1"))
      .andExpect(status().isNotFound());
  }

  @Test
  @WithMockUser("authenticated")
  void deleteJobParameterDefinitionReadOnly() throws Exception {
    mockMvc
      .perform(delete("/api/job-scheduling/v1/JobDefinition('JOB_1')/parameters(name='A',jobName='JOB_1')"))
      .andExpect(status().isNotFound());
  }

  @Test
  @WithMockUser("authenticated")
  void putJobReadOnly() throws Exception {
    mockMvc
      .perform(put("/api/job-scheduling/v1/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407103"))
      .andExpect(status().isMethodNotAllowed())
      .andExpect(status().reason("Method 'PUT' is not supported."));
  }

  @Test
  @WithMockUser("authenticated")
  void deleteJobReadOnly() throws Exception {
    mockMvc
      .perform(delete("/api/job-scheduling/v1/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407103"))
      .andExpect(status().isMethodNotAllowed())
      .andExpect(status().reason("Method 'DELETE' is not supported."));
  }

  @Test
  @WithMockUser("authenticated")
  void readJobDefinitionWithInvalidSkip() throws Exception {
    MvcResult result = mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition?skip=A"))
      .andExpect(status().isBadRequest())
      .andReturn();
    assertNotNull(result.getResolvedException());
    assertEquals(MethodArgumentTypeMismatchException.class, result.getResolvedException().getClass());
    assertEquals(
      "Method parameter 'skip': Failed to convert value of type 'java.lang.String' to required type 'java.lang.Integer'; For input string: \"A\"",
      result.getResolvedException().getMessage()
    );
  }

  @Test
  @WithMockUser("authenticated")
  void readJobDefinitionWithInvalidTop() throws Exception {
    MvcResult result = mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition?top=B"))
      .andExpect(status().isBadRequest())
      .andReturn();
    assertNotNull(result.getResolvedException());
    assertEquals(MethodArgumentTypeMismatchException.class, result.getResolvedException().getClass());
    assertEquals(
      "Method parameter 'top': Failed to convert value of type 'java.lang.String' to required type 'java.lang.Integer'; For input string: \"B\"",
      result.getResolvedException().getMessage()
    );
  }

  @Test
  @WithMockUser("authenticated")
  void readJobWithInvalidSkip() throws Exception {
    MvcResult result = mockMvc
      .perform(get("/api/job-scheduling/v1/Job?skip=A"))
      .andExpect(status().isBadRequest())
      .andReturn();
    assertNotNull(result.getResolvedException());
    assertEquals(MethodArgumentTypeMismatchException.class, result.getResolvedException().getClass());
    assertEquals(
      "Method parameter 'skip': Failed to convert value of type 'java.lang.String' to required type 'java.lang.Integer'; For input string: \"A\"",
      result.getResolvedException().getMessage()
    );
  }

  @Test
  @WithMockUser("authenticated")
  void readJobWithInvalidTop() throws Exception {
    MvcResult result = mockMvc
      .perform(get("/api/job-scheduling/v1/Job?top=B"))
      .andExpect(status().isBadRequest())
      .andReturn();
    assertNotNull(result.getResolvedException());
    assertEquals(MethodArgumentTypeMismatchException.class, result.getResolvedException().getClass());
    assertEquals(
      "Method parameter 'top': Failed to convert value of type 'java.lang.String' to required type 'java.lang.Integer'; For input string: \"B\"",
      result.getResolvedException().getMessage()
    );
  }

  @Test
  @WithMockUser("authenticated")
  void createJobWithWrongData() throws Exception {
    mockMvc
      .perform(post("/api/job-scheduling/v1/Job").content("{}").contentType("application/json").locale(Locale.ENGLISH))
      .andExpect(status().isNotFound())
      .andExpect(jsonPath("$.code").value("jobDefinitionNotFound"))
      .andExpect(
        jsonPath("$.message").value(messageProvider.get("jobDefinitionNotFound", new String[] { null }, Locale.ENGLISH))
      );
    JSONObject job = new JSONObject(Map.of("name", "JOB_X"));
    mockMvc
      .perform(
        post("/api/job-scheduling/v1/Job")
          .content(job.toString())
          .contentType("application/json")
          .locale(Locale.ENGLISH)
      )
      .andExpect(status().isNotFound())
      .andExpect(jsonPath("$.code").value("jobDefinitionNotFound"))
      .andExpect(
        jsonPath("$.message").value(
          messageProvider.get("jobDefinitionNotFound", new String[] { "JOB_X" }, Locale.ENGLISH)
        )
      );
    job = new JSONObject(Map.of("name", "JOB_1"));
    mockMvc
      .perform(
        post("/api/job-scheduling/v1/Job")
          .content(job.toString())
          .contentType("application/json")
          .locale(Locale.ENGLISH)
      )
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.code").value("referenceIDMissing"))
      .andExpect(jsonPath("$.message").value(messageProvider.get("referenceIDMissing", null, Locale.ENGLISH)));
    job = new JSONObject(Map.of("name", "JOB_1", "referenceID", "4711"));
    mockMvc
      .perform(
        post("/api/job-scheduling/v1/Job")
          .content(job.toString())
          .contentType("application/json")
          .locale(Locale.ENGLISH)
      )
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.code").value("referenceIDNoUUID"))
      .andExpect(
        jsonPath("$.message").value(messageProvider.get("referenceIDNoUUID", new String[] { "4711" }, Locale.ENGLISH))
      );
    job = new JSONObject(Map.of("name", "JOB_1", "referenceID", "c1253940-5f25-4a0b-8585-f62bd085b327"));
    mockMvc
      .perform(
        post("/api/job-scheduling/v1/Job")
          .content(job.toString())
          .contentType("application/json")
          .locale(Locale.ENGLISH)
      )
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.code").value("jobParameterRequired"))
      .andExpect(
        jsonPath("$.message").value(messageProvider.get("jobParameterRequired", new String[] { "A" }, Locale.ENGLISH))
      );
    job = new JSONObject(
      Map.of("name", "JOB_1", "referenceID", "c1253940-5f25-4a0b-8585-f62bd085b327", "startDateTime", "X")
    );
    mockMvc
      .perform(
        post("/api/job-scheduling/v1/Job")
          .content(job.toString())
          .contentType("application/json")
          .locale(Locale.ENGLISH)
      )
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.code").value("parserError"))
      .andExpect(jsonPath("$.message").value("Cannot parse value for SchedulingProviderService.Job:startDateTime"));
    job = new JSONObject(Map.of("name", "JOB_1", "referenceID", "c1253940-5f25-4a0b-8585-f62bd085b327", "x", "y"));
    mockMvc
      .perform(
        post("/api/job-scheduling/v1/Job")
          .content(job.toString())
          .contentType("application/json")
          .locale(Locale.ENGLISH)
      )
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.code").value("parserError"))
      .andExpect(jsonPath("$.message").value("No element with name 'x' in 'SchedulingProviderService.Job'"));
    job = new JSONObject(
      Map.of(
        "name",
        "JOB_1",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b327",
        "startDateTime",
        Instant.now().toString()
      )
    );
    mockMvc
      .perform(
        post("/api/job-scheduling/v1/Job")
          .content(job.toString())
          .contentType("application/json")
          .locale(Locale.ENGLISH)
      )
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.code").value("startDateTimeNotSupported"))
      .andExpect(
        jsonPath("$.message").value(
          messageProvider.get("startDateTimeNotSupported", new String[] { "JOB_1" }, Locale.ENGLISH)
        )
      );
    job = new JSONObject(
      Map.of(
        "name",
        "JOB_1",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b327",
        "parameters",
        new JSONArray(List.of(new JSONObject(Map.of())))
      )
    );
    mockMvc
      .perform(
        post("/api/job-scheduling/v1/Job")
          .content(job.toString())
          .contentType("application/json")
          .locale(Locale.ENGLISH)
      )
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.code").value("jobParameterNameMissing"))
      .andExpect(jsonPath("$.message").value(messageProvider.get("jobParameterNameMissing", null, Locale.ENGLISH)));
    job = new JSONObject(
      Map.of(
        "name",
        "JOB_1",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b327",
        "parameters",
        new JSONArray(List.of(new JSONObject(Map.of("name", "X"))))
      )
    );
    mockMvc
      .perform(
        post("/api/job-scheduling/v1/Job")
          .content(job.toString())
          .contentType("application/json")
          .locale(Locale.ENGLISH)
      )
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.code").value("jobParameterNotKnown"))
      .andExpect(
        jsonPath("$.message").value(messageProvider.get("jobParameterNotKnown", new String[] { "X" }, Locale.ENGLISH))
      );
    job = new JSONObject(
      Map.of(
        "name",
        "JOB_1",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b327",
        "parameters",
        new JSONArray(
          List.of(new JSONObject(Map.of("name", "A", "value", 1)), new JSONObject(Map.of("name", "C", "value", "xxx")))
        )
      )
    );
    mockMvc
      .perform(
        post("/api/job-scheduling/v1/Job")
          .content(job.toString())
          .contentType("application/json")
          .locale(Locale.ENGLISH)
      )
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.code").value("jobParameterValueInvalidType"))
      .andExpect(
        jsonPath("$.message").value(
          messageProvider.get("jobParameterValueInvalidType", new String[] { "xxx", "C", "boolean" }, Locale.ENGLISH)
        )
      );
    job = new JSONObject(
      Map.of(
        "name",
        "JOB_1",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b327",
        "parameters",
        new JSONArray(
          List.of(
            new JSONObject(Map.of("name", "A", "value", "1")),
            new JSONObject(Map.of("name", "B", "value", "2")),
            new JSONObject(Map.of("name", "C", "value", "true"))
          )
        )
      )
    );
    mockMvc
      .perform(
        post("/api/job-scheduling/v1/Job")
          .content(job.toString())
          .contentType("application/json")
          .locale(Locale.ENGLISH)
      )
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.code").value("jobParameterReadOnly"))
      .andExpect(
        jsonPath("$.message").value(messageProvider.get("jobParameterReadOnly", new String[] { "B" }, Locale.ENGLISH))
      );
    job = new JSONObject(
      Map.of(
        "name",
        "JOB_1",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b327",
        "parameters",
        new JSONArray(List.of(new JSONObject(Map.of("name", "A", "value", "1")), new JSONObject(Map.of("name", "C"))))
      )
    );
    mockMvc
      .perform(
        post("/api/job-scheduling/v1/Job")
          .content(job.toString())
          .contentType("application/json")
          .locale(Locale.ENGLISH)
      )
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.code").value("jobParameterValueRequired"))
      .andExpect(
        jsonPath("$.message").value(
          messageProvider.get("jobParameterValueRequired", new String[] { "C" }, Locale.ENGLISH)
        )
      );
    job = new JSONObject(
      Map.of(
        "name",
        "JOB_1",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b327",
        "parameters",
        new JSONArray(
          List.of(
            new JSONObject(Map.of("name", "A", "value", "1")),
            new JSONObject(Map.of("name", "B", "value", "21")),
            new JSONObject(Map.of("name", "C", "value", "X"))
          )
        )
      )
    );
    mockMvc
      .perform(
        post("/api/job-scheduling/v1/Job")
          .content(job.toString())
          .contentType("application/json")
          .locale(Locale.ENGLISH)
      )
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.code").value("jobParameterValueInvalidType"))
      .andExpect(
        jsonPath("$.message").value(
          messageProvider.get("jobParameterValueInvalidType", new String[] { "X", "C", "boolean" }, Locale.ENGLISH)
        )
      );
    job = new JSONObject(
      Map.of(
        "name",
        "JOB_1",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b327",
        "parameters",
        new JSONArray(
          List.of(
            new JSONObject(Map.of("name", "A", "value", "1")),
            new JSONObject(Map.of("name", "B", "value", "21")),
            new JSONObject(Map.of("name", "C", "value", "true")),
            new JSONObject(Map.of("name", "D", "value", "X"))
          )
        )
      )
    );
    mockMvc
      .perform(
        post("/api/job-scheduling/v1/Job")
          .content(job.toString())
          .contentType("application/json")
          .locale(Locale.ENGLISH)
      )
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.code").value("jobParameterValueInvalidType"))
      .andExpect(
        jsonPath("$.message").value(
          messageProvider.get("jobParameterValueInvalidType", new String[] { "X", "D", "number" }, Locale.ENGLISH)
        )
      );
    job = new JSONObject(
      Map.of(
        "name",
        "JOB_1",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b327",
        "parameters",
        new JSONArray(
          List.of(
            new JSONObject(Map.of("name", "A", "value", "1")),
            new JSONObject(Map.of("name", "B", "value", "21")),
            new JSONObject(Map.of("name", "C", "value", "true")),
            new JSONObject(Map.of("name", "D", "value", JSONObject.NULL)),
            new JSONObject(Map.of("name", "E", "value", "X"))
          )
        )
      )
    );
    mockMvc
      .perform(
        post("/api/job-scheduling/v1/Job")
          .content(job.toString())
          .contentType("application/json")
          .locale(Locale.ENGLISH)
      )
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.code").value("jobParameterValueInvalidType"))
      .andExpect(
        jsonPath("$.message").value(
          messageProvider.get("jobParameterValueInvalidType", new String[] { "X", "E", "datetime" }, Locale.ENGLISH)
        )
      );
    job = new JSONObject(
      Map.of(
        "name",
        "JOB_1",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b327",
        "results",
        new JSONArray(List.of(new JSONObject(Map.of("type", ResultTypeCode.LINK, "link", "https://sap.com")))),
        "parameters",
        new JSONArray(
          List.of(
            new JSONObject(Map.of("name", "A", "value", "1")),
            new JSONObject(Map.of("name", "C", "value", "true"))
          )
        )
      )
    );
    mockMvc
      .perform(
        post("/api/job-scheduling/v1/Job")
          .content(job.toString())
          .contentType("application/json")
          .locale(Locale.ENGLISH)
      )
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.code").value("jobResultsReadOnly"))
      .andExpect(jsonPath("$.message").value(messageProvider.get("jobResultsReadOnly", null, Locale.ENGLISH)));
    job = new JSONObject(
      Map.of(
        "name",
        "JOB_1",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b327",
        "parameters",
        new JSONArray(
          List.of(
            new JSONObject(Map.of("name", "A", "value", "1")),
            new JSONObject(Map.of("name", "B", "value", "21")),
            new JSONObject(Map.of("name", "C", "value", "true")),
            new JSONObject(Map.of("name", "D", "value", JSONObject.NULL)),
            new JSONObject(Map.of("name", "E", "value", Instant.now()))
          )
        )
      )
    );
    MvcResult result = mockMvc
      .perform(
        post("/api/job-scheduling/v1/Job")
          .content(job.toString())
          .contentType("application/json")
          .locale(Locale.ENGLISH)
      )
      .andExpect(status().isCreated())
      .andReturn();

    String response = result.getResponse().getContentAsString();
    JSONObject json = (JSONObject) cleanData(new JSONObject(response));
    String ID = json.getString("ID");

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }

  @Test
  @WithMockUser("authenticated")
  public void cancelJobNotFound() throws Exception {
    mockMvc
      .perform(post("/api/job-scheduling/v1/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407104/cancel").locale(Locale.ENGLISH))
      .andExpect(status().isNotFound())
      .andExpect(jsonPath("$.code").value("jobNotFound"))
      .andExpect(
        jsonPath("$.message").value(
          messageProvider.get("jobNotFound", new String[] { "3a89dfec-59f9-4a91-90fe-3c7ca7407104" }, Locale.ENGLISH)
        )
      );
  }

  @Test
  @WithMockUser("authenticated")
  public void cancelJobAlreadyCanceled() throws Exception {
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

    mockMvc
      .perform(post("/api/job-scheduling/v1/Job/" + ID + "/cancel").locale(Locale.ENGLISH))
      .andExpect(status().isNoContent());

    mockMvc
      .perform(get("/api/job-scheduling/v1/Job/" + ID))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.status").value("canceled"));

    mockMvc
      .perform(get("/api/job-scheduling/v1/Job/" + ID))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.status").value("canceled"));

    mockMvc
      .perform(post("/api/job-scheduling/v1/Job/" + ID + "/cancel").locale(Locale.ENGLISH))
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.code").value("jobCannotBeCanceled"))
      .andExpect(
        jsonPath("$.message").value(
          messageProvider.get("jobCannotBeCanceled", new String[] { "canceled" }, Locale.ENGLISH)
        )
      );

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }

  private static final Set<String> FIELDS_TO_CLEAN = Set.of("createdAt", "createdBy", "modifiedAt", "modifiedBy");

  private static Object cleanData(Object data) throws JSONException {
    if (data instanceof JSONArray array) {
      for (int i = 0; i < array.length(); i++) {
        Object item = array.get(i);
        if (item instanceof JSONObject) {
          cleanData(item);
        }
      }
    } else if (data instanceof JSONObject object) {
      for (String field : FIELDS_TO_CLEAN) {
        object.remove(field);
      }
      if (object.has("link") && object.get("link") instanceof String) {
        String link = object.getString("link");
        if (link.matches("^https?://.*launchpad\\.html.*")) {
          object.put("link", "http://localhost:8080/<ID>");
        }
      }
      Iterator<?> keys = object.keys();
      while (keys.hasNext()) {
        String key = (String) keys.next();
        Object value = object.get(key);
        if (value instanceof JSONObject || value instanceof JSONArray) {
          cleanData(value);
        }
      }
    }
    return data;
  }
}
