package com.github.capjscommunity.sapafcsdk.test;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketExtension;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;

public class MockWebSocketSession implements WebSocketSession {

  private final List<WebSocketMessage<?>> sentMessages = new ArrayList<>();
  private boolean open = true;

  public List<WebSocketMessage<?>> getSentMessages() {
    return sentMessages;
  }

  @Override
  public String getId() {
    return "";
  }

  @Override
  public URI getUri() {
    return null;
  }

  @Override
  public HttpHeaders getHandshakeHeaders() {
    return null;
  }

  @Override
  public Map<String, Object> getAttributes() {
    return Map.of();
  }

  @Override
  public Principal getPrincipal() {
    return null;
  }

  @Override
  public InetSocketAddress getLocalAddress() {
    return null;
  }

  @Override
  public InetSocketAddress getRemoteAddress() {
    return null;
  }

  @Override
  public String getAcceptedProtocol() {
    return "";
  }

  @Override
  public void setTextMessageSizeLimit(int messageSizeLimit) {}

  @Override
  public int getTextMessageSizeLimit() {
    return 0;
  }

  @Override
  public void setBinaryMessageSizeLimit(int messageSizeLimit) {}

  @Override
  public int getBinaryMessageSizeLimit() {
    return 0;
  }

  @Override
  public List<WebSocketExtension> getExtensions() {
    return List.of();
  }

  @Override
  public void sendMessage(WebSocketMessage<?> message) throws IOException {
    sentMessages.add(message);
  }

  @Override
  public boolean isOpen() {
    return open;
  }

  public void close() {
    open = false;
  }

  @Override
  public void close(CloseStatus status) throws IOException {}
}
