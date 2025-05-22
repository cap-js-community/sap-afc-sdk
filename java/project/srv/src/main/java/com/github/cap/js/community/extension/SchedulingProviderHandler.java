package com.github.cap.js.community.extension;

import cds.gen.schedulingproviderservice.*;
import com.sap.cds.services.cds.CdsCreateEventContext;
import com.sap.cds.services.cds.CqnService;
import com.sap.cds.services.handler.annotations.HandlerOrder;
import com.sap.cds.services.handler.annotations.On;
import com.sap.cds.services.handler.annotations.ServiceName;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@ServiceName(SchedulingProviderService_.CDS_NAME)
public class SchedulingProviderHandler extends com.github.cap.js.community.scheduling.handlers.SchedulingProviderHandler {

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