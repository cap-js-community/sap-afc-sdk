package customer.scheduling;

import cds.gen.schedulingprocessingservice.*;
import com.github.cap.js.community.sapafcsdk.scheduling.handlers.SchedulingProcessingHandler;
import com.sap.cds.services.handler.annotations.HandlerOrder;
import com.sap.cds.services.handler.annotations.On;
import com.sap.cds.services.handler.annotations.ServiceName;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Primary
@Component
@ServiceName(SchedulingProcessingService_.CDS_NAME)
public class CustomSchedulingProcessingHandler extends SchedulingProcessingHandler {

  @On(event = ProcessJobContext.CDS_NAME)
  @HandlerOrder(HandlerOrder.EARLY)
  public void customProcessJob(ProcessJobContext context) {
    // Your logic goes here
    context.proceed();
  }

  @On(event = UpdateJobContext.CDS_NAME)
  @HandlerOrder(HandlerOrder.EARLY)
  public void customUpdateJob(UpdateJobContext context) {
    // Your logic goes here
    context.proceed();
  }

  @On(event = CancelJobContext.CDS_NAME)
  @HandlerOrder(HandlerOrder.EARLY)
  public void customCancelJob(CancelJobContext context) {
    // Your logic goes here
    context.proceed();
  }

  @On(event = SyncJobContext.CDS_NAME)
  @HandlerOrder(HandlerOrder.EARLY)
  public void customSyncJob(SyncJobContext context) {
    // Your logic goes here
    context.proceed();
  }
}
