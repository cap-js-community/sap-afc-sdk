package customer.scheduling;

import com.github.cap.js.community.sapafcsdk.model.schedulingproviderservice.*;
import com.github.cap.js.community.sapafcsdk.scheduling.base.SchedulingProviderBase;
import com.sap.cds.services.cds.CdsCreateEventContext;
import com.sap.cds.services.cds.CqnService;
import com.sap.cds.services.handler.annotations.HandlerOrder;
import com.sap.cds.services.handler.annotations.On;
import com.sap.cds.services.handler.annotations.ServiceName;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
@ServiceName(SchedulingProviderService_.CDS_NAME)
public class CustomSchedulingProviderHandler extends SchedulingProviderBase {

  @On(event = CqnService.EVENT_CREATE, entity = Job_.CDS_NAME)
  @HandlerOrder(HandlerOrder.EARLY)
  public void createJob(CdsCreateEventContext context, List<Job> jobs) {
    // Your logic goes here
    context.proceed();
  }

  @On(event = JobCancelContext.CDS_NAME, entity = Job_.CDS_NAME)
  @HandlerOrder(HandlerOrder.EARLY)
  public void cancelJob(JobCancelContext context) {
    // Your logic goes here
    context.proceed();
  }

  @On(event = JobResultDataContext.CDS_NAME, entity = JobResult_.CDS_NAME)
  @HandlerOrder(HandlerOrder.EARLY)
  public void downloadData(JobResultDataContext context) {
    // Your logic goes here
    context.proceed();
  }
}
