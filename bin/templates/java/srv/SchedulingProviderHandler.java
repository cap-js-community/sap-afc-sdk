package customer.scheduling;

import cds.gen.schedulingproviderservice.*;
import com.sap.cds.services.cds.*;
import com.sap.cds.services.handler.annotations.*;
import java.util.*;
import org.springframework.stereotype.Component;

@Component
@ServiceName(SchedulingProviderService_.CDS_NAME)
public class SchedulingProviderHandler extends scheduling.handlers.SchedulingProviderHandler {

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
