package com.github.capjscommunity.sapafcsdk.scheduling.handlers;

import com.github.capjscommunity.sapafcsdk.common.WebSocketHandler;
import com.github.capjscommunity.sapafcsdk.model.schedulingwebsocketservice.JobStatusChangedContext;
import com.github.capjscommunity.sapafcsdk.model.schedulingwebsocketservice.SchedulingWebsocketService_;
import com.sap.cds.services.handler.EventHandler;
import com.sap.cds.services.handler.annotations.On;
import com.sap.cds.services.handler.annotations.ServiceName;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;

@Component
@ServiceName(SchedulingWebsocketService_.CDS_NAME)
public class SchedulingWebsocketHandler implements EventHandler {

  @Autowired
  private WebSocketHandler webSocketHandler;

  @On(event = JobStatusChangedContext.CDS_NAME)
  public void jobStatusChanged(JobStatusChangedContext context) throws IOException {
    String payload = "{\"event\":\"jobStatusChanged\",\"data\":" + context.getData().toJson() + "}";
    TextMessage message = new TextMessage(payload);
    webSocketHandler.sendTextMessage(message);
    context.setCompleted();
  }
}
