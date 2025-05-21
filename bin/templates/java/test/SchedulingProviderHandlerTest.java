package customer.scheduling;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

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
            new JSONObject(Map.of("name", "C", "value", "true"))
          )
        )
      )
    );
    mockMvc
      .perform(post("/api/job-scheduling/v1/Job").contentType("application/json").content(job.toString()))
      .andExpect(status().isCreated());
  }
}
