package scheduling.handlers;

import cds.gen.schedulingwebsocketservice.JobStatusChangedContext;
import cds.gen.schedulingwebsocketservice.SchedulingWebsocketService_;
import com.sap.cds.services.handler.EventHandler;
import com.sap.cds.services.handler.annotations.On;
import com.sap.cds.services.handler.annotations.ServiceName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import scheduling.common.SchedulingWebSocket;

import java.io.IOException;

@Component
@ServiceName(SchedulingWebsocketService_.CDS_NAME)
public class SchedulingWebsocketHandler implements EventHandler {

    @Autowired
    private SchedulingWebSocket schedulingWebSocket;

    @On(event = JobStatusChangedContext.CDS_NAME)
    public void jobStatusChanged(JobStatusChangedContext context) throws IOException {
        String payload = "{\"event\":\"jobStatusChanged\",\"data\":" + context.getData().toJson() + "}";
        TextMessage message = new TextMessage(payload);
        schedulingWebSocket.sendTextMessage(message);
        context.setCompleted();
    }
}