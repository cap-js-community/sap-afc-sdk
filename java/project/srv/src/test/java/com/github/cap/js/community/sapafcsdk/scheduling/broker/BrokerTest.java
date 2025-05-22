package com.github.cap.js.community.sapafcsdk.scheduling.broker;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.sap.cds.services.messages.LocalizedMessageProvider;
import com.sap.cds.services.persistence.PersistenceService;
import com.sap.cds.services.runtime.CdsRuntime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@AutoConfigureMockMvc
@SpringBootTest
public class BrokerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private LocalizedMessageProvider messageProvider;

  @Autowired
  private CdsRuntime cdsRuntime;

  @Autowired
  private PersistenceService persistenceService;

  @Test
  @WithMockUser
  void getCatalog() throws Exception {
    MvcResult result = mockMvc
      .perform(get("/broker/v2/catalog").accept("application/json"))
      .andExpect(status().isOk())
      .andReturn();
    mockMvc
      .perform(asyncDispatch(result))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.services[0].id").value("c48d9d0b-4320-439e-8f4e-2ab0294bd971"))
      .andExpect(jsonPath("$.services[0].plans[0].id").value("a7609272-ce22-41e0-a605-1ad3318ef2d5"));
  }

  @Test
  void getCatalogNoAuth() throws Exception {
    mockMvc.perform(get("/broker/v2/catalog")).andExpect(status().isUnauthorized());
  }
}
