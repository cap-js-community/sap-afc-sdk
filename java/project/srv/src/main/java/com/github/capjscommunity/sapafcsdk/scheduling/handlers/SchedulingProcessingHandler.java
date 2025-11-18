package com.github.capjscommunity.sapafcsdk.scheduling.handlers;

import static com.github.capjscommunity.sapafcsdk.model.scheduling.Scheduling_.JOB;

import com.github.capjscommunity.sapafcsdk.configuration.AfcSdkProperties;
import com.github.capjscommunity.sapafcsdk.model.scheduling.Job;
import com.github.capjscommunity.sapafcsdk.model.scheduling.JobStatusCode;
import com.github.capjscommunity.sapafcsdk.model.scheduling.Job_;
import com.github.capjscommunity.sapafcsdk.model.schedulingprocessingservice.*;
import com.github.capjscommunity.sapafcsdk.scheduling.base.SchedulingProcessingBase;
import com.github.capjscommunity.sapafcsdk.scheduling.common.JobSchedulingException;
import com.sap.cds.ql.CQL;
import com.sap.cds.ql.Select;
import com.sap.cds.services.EventContext;
import com.sap.cds.services.handler.EventHandler;
import com.sap.cds.services.handler.annotations.Before;
import com.sap.cds.services.handler.annotations.On;
import com.sap.cds.services.handler.annotations.ServiceName;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
@ServiceName(SchedulingProcessingService_.CDS_NAME)
public class SchedulingProcessingHandler extends SchedulingProcessingBase implements EventHandler {

  @Before(event = { ProcessJobContext.CDS_NAME, UpdateJobContext.CDS_NAME, CancelJobContext.CDS_NAME })
  public void beforeEvents(EventContext context) {
    String ID = (String) context.get("ID");
    Select<Job_> query = Select.from(JOB).columns(CQL.star(), CQL.to("parameters").expand()).byId(ID);
    Optional<Job> _job = persistenceService.run(query).first(Job.class);
    if (_job.isEmpty()) {
      throw JobSchedulingException.jobNotFound(ID);
    }
    context.put("job", _job.get());
  }

  @On(event = ProcessJobContext.CDS_NAME)
  public void processJob(ProcessJobContext context) throws IOException {
    List<JobResult> results = new ArrayList<>();
    AfcSdkProperties.MockProcessing processingConfig = afcsdkProperties.getMockProcessing();
    if (processingConfig != null) {
      results = this.mockJobProcessing(context);
    }
    this.processJobUpdate(context, JobStatusCode.RUNNING, results);
    context.setCompleted();
  }

  @On(event = UpdateJobContext.CDS_NAME)
  public void updateJob(UpdateJobContext context) {
    this.processJobUpdate(context, context.getStatus(), context.getResults());
    context.setCompleted();
  }

  @On(event = CancelJobContext.CDS_NAME)
  public void cancelJob(CancelJobContext context) {
    this.processJobUpdate(context, JobStatusCode.CANCELED, null);
    context.setCompleted();
  }

  @On(event = SyncJobContext.CDS_NAME)
  public void syncJob(SyncJobContext context) {
    AfcSdkProperties.MockProcessing processingConfig = afcsdkProperties.getMockProcessing();
    if (processingConfig != null) {
      this.mockJobSync(context);
    }
    context.setCompleted();
  }

  @On(event = NotifyContext.CDS_NAME)
  public void notify(NotifyContext context) {
    AfcSdkProperties.MockProcessing processingConfig = afcsdkProperties.getMockProcessing();
    if (processingConfig != null) {
      this.mockNotification(context);
    }
    context.setCompleted();
  }

  // protected void reportStatus(EventContext context, String status) {
  //   afcService.reportStatus(Status);
  // }
}
