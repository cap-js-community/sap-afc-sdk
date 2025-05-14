package customer.scheduling;

import cds.gen.schedulingprocessingservice.SchedulingProcessingService;

import cds.gen.schedulingproviderservice.*;
import cds.gen.schedulingproviderservice.Job;
import cds.gen.schedulingproviderservice.JobResult_;
import cds.gen.schedulingproviderservice.Job_;

import com.sap.cds.services.cds.CdsCreateEventContext;
import com.sap.cds.services.cds.CqnService;
import com.sap.cds.services.handler.EventHandler;
import com.sap.cds.services.handler.annotations.On;
import com.sap.cds.services.handler.annotations.ServiceName;
import com.sap.cds.services.persistence.PersistenceService;

import org.springframework.core.annotation.Order;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.*;

@Component
@ServiceName(SchedulingProviderService_.CDS_NAME)
public class CustomSchedulingProviderHandler implements EventHandler {

    @Autowired
    private PersistenceService persistenceService;

    @Autowired
    private SchedulingProcessingService processingService;

    @Order(1)
    @On(event = CqnService.EVENT_CREATE, entity = Job_.CDS_NAME)
    public void createJob(CdsCreateEventContext context, List<Job> jobs) {
        // Your logic goes here
        context.proceed();
    }

    @Order(1)
    @On(event = JobCancelContext.CDS_NAME, entity = Job_.CDS_NAME)
    public void cancelJob(JobCancelContext context) {
        // Your logic goes here
        context.proceed();
    }

    @Order(1)
    @On(event = JobResultDataContext.CDS_NAME, entity = JobResult_.CDS_NAME)
    public void downloadData(JobResultDataContext context) throws IOException {
        // Your logic goes here
        context.proceed();
    }
}