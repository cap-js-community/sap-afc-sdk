package com.github.capjscommunity.sapafcsdk.scheduling.controllers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
public class SchedulingProviderControllerLimitTest {

  @Autowired
  private MockMvc mockMvc;

  @DynamicPropertySource
  static void dynamicProperties(DynamicPropertyRegistry registry) {
    registry.add("cds.query.limit.max", () -> "2");
  }

  @Test
  @WithMockUser("authenticated")
  public void getJobDefinitions() throws Exception {
    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(2));
  }

  @Test
  @WithMockUser("authenticated")
  public void getJobDefinitionParameters() throws Exception {
    mockMvc
      .perform(get("/api/job-scheduling/v1/JobDefinition/JOB_1/parameters"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(2));
  }

  @Test
  @WithMockUser("authenticated")
  public void getJobs() throws Exception {
    mockMvc
      .perform(get("/api/job-scheduling/v1/Job"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(2));
  }

  @Test
  @WithMockUser("authenticated")
  public void getJobParameters() throws Exception {
    mockMvc
      .perform(get("/api/job-scheduling/v1/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407103/parameters"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(2));
  }

  @Test
  @WithMockUser("authenticated")
  public void getJobResults() throws Exception {
    mockMvc
      .perform(get("/api/job-scheduling/v1/Job/5a89dfec-59f9-4a91-90fe-3c7ca7407103/results"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(2));
  }

  @Test
  @WithMockUser("authenticated")
  public void getJobResultMessages() throws Exception {
    mockMvc
      .perform(get("/api/job-scheduling/v1/JobResult/c2eb590f-9505-4fd6-a5e2-511a1b2ff47f/messages"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.length()").value(2));
  }
}
