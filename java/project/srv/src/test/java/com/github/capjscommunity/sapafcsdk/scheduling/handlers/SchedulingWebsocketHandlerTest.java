package com.github.capjscommunity.sapafcsdk.scheduling.handlers;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.github.capjscommunity.sapafcsdk.common.WebSocketHandler;
import com.github.capjscommunity.sapafcsdk.configuration.OutboxConfig;
import com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.JobStatusCode;
import com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.websocketservice.JobStatusChanged;
import com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.websocketservice.JobStatusChangedContext;
import com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.websocketservice.WebsocketService;
import com.github.capjscommunity.sapafcsdk.test.MockWebSocketSession;
import com.github.capjscommunity.sapafcsdk.test.OutboxTestConfig;
import com.sap.cds.services.outbox.OutboxService;
import com.sap.cds.services.persistence.PersistenceService;
import com.sap.cds.services.runtime.CdsRuntime;
import java.util.Collections;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketMessage;

@AutoConfigureMockMvc
@SpringBootTest
@ContextConfiguration(classes = { OutboxTestConfig.class })
public class SchedulingWebsocketHandlerTest {

  @Autowired
  private CdsRuntime cdsRuntime;

  @Autowired
  @Qualifier(OutboxConfig.OUTBOX_SERVICE)
  protected OutboxService outboxService;

  @Autowired
  private WebsocketService websocketService;

  @Autowired
  private WebSocketHandler webSocketHandler;

  @Autowired
  private PersistenceService persistenceService;

  @Test
  @WithMockUser("authenticated")
  public void jobStatusChanged() throws Exception {
    MockWebSocketSession webSocketSession = new MockWebSocketSession();
    webSocketHandler.afterConnectionEstablished(webSocketSession);

    WebsocketService websocketServiceOutboxed = outboxService.outboxed(websocketService);
    JobStatusChangedContext jobStatusChanged = JobStatusChangedContext.create();
    JobStatusChanged jobStatusChangedData = JobStatusChanged.create();
    jobStatusChangedData.setStatus(JobStatusCode.COMPLETED);
    jobStatusChangedData.setIDs(Collections.singletonList("3a89dfec-59f9-4a91-90fe-3c7ca7407103"));
    jobStatusChanged.setData(jobStatusChangedData);
    websocketServiceOutboxed.emit(jobStatusChanged);

    List<WebSocketMessage<?>> messages = webSocketSession.getSentMessages();
    assertEquals(1, messages.size());
    String message = ((TextMessage) messages.get(0)).getPayload();
    JSONObject websocketEvent = new JSONObject(message);
    assertEquals("jobStatusChanged", websocketEvent.get("event"));
    JSONObject websocketEventData = websocketEvent.getJSONObject("data");
    assertEquals("3a89dfec-59f9-4a91-90fe-3c7ca7407103", ((JSONArray) websocketEventData.get("IDs")).get(0));
    assertEquals("completed", websocketEventData.get("status"));
  }
}
