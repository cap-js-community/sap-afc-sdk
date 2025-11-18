package com.github.capjscommunity.sapafcsdk.common;

import com.sap.cds.services.runtime.CdsRuntime;
import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class WebSocketHandler extends TextWebSocketHandler {

  private static Map<String, Set<WebSocketSession>> sessions = new HashMap<>();

  @Autowired
  private CdsRuntime cdsRuntime;

  @Override
  public void afterConnectionEstablished(WebSocketSession session) {
    String tenant = cdsRuntime.getProvidedUserInfo().getTenant();
    if (!sessions.containsKey(tenant)) {
      sessions.put(tenant, new HashSet<>());
    }
    sessions.get(tenant).add(session);
  }

  @Override
  public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
    String tenant = cdsRuntime.getProvidedUserInfo().getTenant();
    if (sessions.containsKey(tenant)) {
      sessions.get(tenant).remove(session);
      if (sessions.get(tenant).isEmpty()) {
        sessions.remove(tenant);
      }
    }
  }

  @Override
  protected void handleTextMessage(WebSocketSession session, TextMessage message) {}

  public void sendTextMessage(TextMessage message) throws IOException {
    String tenant = cdsRuntime.getProvidedUserInfo().getTenant();
    Set<WebSocketSession> tenantSessions = sessions.get(tenant);
    if (tenantSessions == null || tenantSessions.isEmpty()) {
      return;
    }
    for (WebSocketSession webSocketSession : tenantSessions) {
      webSocketSession.sendMessage(message);
    }
  }
}
