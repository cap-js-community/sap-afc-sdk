package customer.scheduling;

import cds.gen.schedulingprocessingservice.*;

import com.sap.cds.services.handler.EventHandler;
import com.sap.cds.services.handler.annotations.On;
import com.sap.cds.services.handler.annotations.ServiceName;
import com.sap.cds.services.persistence.PersistenceService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@ServiceName(SchedulingProcessingService_.CDS_NAME)
public class SchedulingProcessingHandler implements EventHandler {

    @Autowired
    protected PersistenceService persistenceService;

    public CustomSchedulingProcessingHandler() {
        super();
    }

    @Order(1)
    @On(event = ProcessJobContext.CDS_NAME)
    public void processJob(ProcessJobContext context) throws IOException {
        // Your logic goes here
        context.proceed();
    }

    @Order(1)
    @On(event = UpdateJobContext.CDS_NAME)
    public void updateJob(UpdateJobContext context) {
        // Your logic goes here
        context.proceed();
    }

    @Order(1)
    @On(event = CancelJobContext.CDS_NAME)
    public void cancelJob(CancelJobContext context) {
        // Your logic goes here
        context.proceed();
    }

    @Order(1)
    @On(event = SyncJobContext.CDS_NAME)
    public void syncJob(SyncJobContext context) {
        // Your logic goes here
        context.proceed();
    }
}