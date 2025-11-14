package com.github.cap.js.community.sapafcsdk.scheduling.handlers;

import com.github.cap.js.community.sapafcsdk.common.EndpointProvider;
import com.github.cap.js.community.sapafcsdk.configuration.AfcSdkProperties;
import com.github.cap.js.community.sapafcsdk.model.sapafcsdk.scheduling.schedulingmonitoringservice.Job;
import com.github.cap.js.community.sapafcsdk.model.sapafcsdk.scheduling.schedulingmonitoringservice.JobCancelContext;
import com.github.cap.js.community.sapafcsdk.model.sapafcsdk.scheduling.schedulingmonitoringservice.Job_;
import com.github.cap.js.community.sapafcsdk.model.sapafcsdk.scheduling.schedulingmonitoringservice.SchedulingMonitoringService_;
import com.github.cap.js.community.sapafcsdk.model.sapafcsdk.scheduling.schedulingproviderservice.SchedulingProviderService;
import com.sap.cds.ql.CQL;
import com.sap.cds.ql.cqn.CqnAnalyzer;
import com.sap.cds.services.EventContext;
import com.sap.cds.services.cds.CqnService;
import com.sap.cds.services.handler.EventHandler;
import com.sap.cds.services.handler.annotations.After;
import com.sap.cds.services.handler.annotations.On;
import com.sap.cds.services.handler.annotations.ServiceName;
import com.sap.cds.services.persistence.PersistenceService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@ServiceName(SchedulingMonitoringService_.CDS_NAME)
public class SchedulingMonitoringHandler implements EventHandler {

  @Autowired
  private PersistenceService persistenceService;

  @Autowired
  private SchedulingProviderService schedulingProviderService;

  @Autowired
  private EndpointProvider endpointProvider;

  @Autowired
  protected AfcSdkProperties afcsdkProperties;

  @After(event = CqnService.EVENT_READ, entity = Job_.CDS_NAME)
  public void fillLink(EventContext context, List<Job> jobs) {
    if (afcsdkProperties.getUi() != null && afcsdkProperties.getUi().isLink()) {
      for (Job job : jobs) {
        if (job.getId() != null && job.getLink() == null) {
          job.setLink(endpointProvider.getLink(context.getUserInfo(), "Job", "monitor", job.getId()));
        }
      }
    }
  }

  @On(event = JobCancelContext.CDS_NAME, entity = Job_.CDS_NAME)
  public void cancelJob(JobCancelContext context) {
    String ID = CqnAnalyzer.create(context.getModel())
      .analyze(context.getCqn().ref())
      .targetKeys()
      .get("ID")
      .toString();
    com.github.cap.js.community.sapafcsdk.model.sapafcsdk.scheduling.schedulingproviderservice.Job_ job = CQL.entity(
      com.github.cap.js.community.sapafcsdk.model.sapafcsdk.scheduling.schedulingproviderservice.Job_.class
    ).filter(j -> j.ID().eq(ID));
    this.schedulingProviderService.cancel(job);
    context.setResult(persistenceService.run(context.getCqn()).single(Job.class));
    context.getMessages().success("cancelJobSuccess").code("200");
    context.setCompleted();
  }
}
