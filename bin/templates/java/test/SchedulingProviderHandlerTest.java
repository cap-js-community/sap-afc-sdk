package customer.scheduling;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;
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
public class SchedulingProviderHandlerTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  @WithMockUser("authenticated")
  public void getJobDefinitions() throws Exception {
    mockMvc.perform(get("/api/job-scheduling/v1/JobDefinition")).andExpect(status().isOk());
  }

  @Test
  @WithMockUser("authenticated")
  public void getJobs() throws Exception {
    mockMvc.perform(get("/api/job-scheduling/v1/Job")).andExpect(status().isOk());
  }

  @Test
  @WithMockUser("authenticated")
  public void createJob() throws Exception {
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
            new JSONObject(Map.of("name", "C", "value", "true"))
          )
        )
      )
    );
    mockMvc
      .perform(post("/api/job-scheduling/v1/Job").contentType("application/json").content(job.toString()))
      .andExpect(status().isCreated());
  }

  @Test
  @WithMockUser("authenticated")
  public void cancelJob() throws Exception {
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
            new JSONObject(Map.of("name", "C", "value", "true"))
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

    mockMvc.perform(post("/api/job-scheduling/v1/Job/" + ID + "/cancel")).andExpect(status().isNoContent());

    mockMvc
      .perform(get("/api/job-scheduling/v1/Job/" + ID))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.status").value("cancelRequested"));
  }

  @Test
  @WithMockUser("authenticated")
  public void notification() throws Exception {
    JSONObject notification = new JSONObject(
      Map.of("name", "taskListStatusChanged", "ID", "3a89dfec-59f9-4a91-90fe-3c7ca7407103", "value", "obsolete")
    );
    JSONArray notifications = new JSONArray();
    notifications.put(notification);
    JSONObject content = new JSONObject(Map.of("notifications", notifications));
    mockMvc
      .perform(post("/api/job-scheduling/v1/notify").contentType("application/json").content(content.toString()))
      .andExpect(status().isNoContent());
  }
}
