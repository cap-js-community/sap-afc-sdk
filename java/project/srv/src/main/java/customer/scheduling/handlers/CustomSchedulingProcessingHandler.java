package customer.scheduling.handlers;

import com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.processingservice.*;
import com.github.capjscommunity.sapafcsdk.scheduling.base.SchedulingProcessingBase;
import com.sap.cds.services.handler.annotations.HandlerOrder;
import com.sap.cds.services.handler.annotations.On;
import com.sap.cds.services.handler.annotations.ServiceName;
import org.springframework.stereotype.Component;

@Component
@ServiceName(ProcessingService_.CDS_NAME)
public class CustomSchedulingProcessingHandler extends SchedulingProcessingBase {

  @On(event = ProcessJobContext.CDS_NAME)
  @HandlerOrder(HandlerOrder.EARLY)
  public void processJob(ProcessJobContext context) {
    // Your logic goes here
    context.proceed();
  }

  @On(event = UpdateJobContext.CDS_NAME)
  @HandlerOrder(HandlerOrder.EARLY)
  public void updateJob(UpdateJobContext context) {
    // Your logic goes here
    context.proceed();
  }

  @On(event = CancelJobContext.CDS_NAME)
  @HandlerOrder(HandlerOrder.EARLY)
  public void cancelJob(CancelJobContext context) {
    // Your logic goes here
    context.proceed();
  }

  @On(event = SyncJobContext.CDS_NAME)
  @HandlerOrder(HandlerOrder.EARLY)
  public void syncJob(SyncJobContext context) {
    // Your logic goes here
    context.proceed();
  }

  @On(event = NotifyContext.CDS_NAME)
  @HandlerOrder(HandlerOrder.EARLY)
  public void notify(NotifyContext context) {
    // Your logic goes here
    context.proceed();
  }
}
