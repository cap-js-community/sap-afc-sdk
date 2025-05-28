package com.github.cap.js.community.sapafcsdk.scheduling.handlers;

import static com.github.cap.js.community.sapafcsdk.model.scheduling.Scheduling_.JOB;
import static com.github.cap.js.community.sapafcsdk.model.scheduling.Scheduling_.JOB_DEFINITION;

import com.github.cap.js.community.sapafcsdk.model.scheduling.*;
import com.github.cap.js.community.sapafcsdk.model.scheduling.JobDefinition;
import com.github.cap.js.community.sapafcsdk.model.scheduling.JobDefinition_;
import com.github.cap.js.community.sapafcsdk.model.scheduling.JobParameter;
import com.github.cap.js.community.sapafcsdk.model.scheduling.JobParameterDefinition;
import com.github.cap.js.community.sapafcsdk.model.schedulingprocessingservice.SchedulingProcessingService;
import com.github.cap.js.community.sapafcsdk.model.schedulingproviderservice.*;
import com.github.cap.js.community.sapafcsdk.model.schedulingproviderservice.Job;
import com.github.cap.js.community.sapafcsdk.model.schedulingproviderservice.JobResult;
import com.github.cap.js.community.sapafcsdk.model.schedulingproviderservice.JobResult_;
import com.github.cap.js.community.sapafcsdk.model.schedulingproviderservice.Job_;
import com.github.cap.js.community.sapafcsdk.model.schedulingwebsocketservice.JobStatusChanged;
import com.github.cap.js.community.sapafcsdk.model.schedulingwebsocketservice.JobStatusChangedContext;
import com.github.cap.js.community.sapafcsdk.model.schedulingwebsocketservice.SchedulingWebsocketService;
import com.github.cap.js.community.sapafcsdk.scheduling.base.SchedulingProviderBase;
import com.github.cap.js.community.sapafcsdk.scheduling.common.JobSchedulingError;
import com.sap.cds.Result;
import com.sap.cds.ql.CQL;
import com.sap.cds.ql.Insert;
import com.sap.cds.ql.Select;
import com.sap.cds.ql.Update;
import com.sap.cds.ql.cqn.CqnAnalyzer;
import com.sap.cds.services.EventContext;
import com.sap.cds.services.cds.CdsCreateEventContext;
import com.sap.cds.services.cds.CqnService;
import com.sap.cds.services.handler.EventHandler;
import com.sap.cds.services.handler.annotations.After;
import com.sap.cds.services.handler.annotations.Before;
import com.sap.cds.services.handler.annotations.On;
import com.sap.cds.services.handler.annotations.ServiceName;
import java.io.IOException;
import java.util.*;
import org.springframework.stereotype.Component;

@Component
@ServiceName(SchedulingProviderService_.CDS_NAME)
public class SchedulingProviderHandler extends SchedulingProviderBase implements EventHandler {

  @After(event = CqnService.EVENT_READ, entity = Job_.CDS_NAME)
  public void fillLink(EventContext context, List<Job> jobs) {
    for (Job job : jobs) {
      if (job.getLink() == null) {
        job.setLink(
          endpointProvider.approuterTenantUrl(context.getUserInfo()) + "/launchpad.html#Job-monitor&/Job(" + job.getId() + ")"
        );
      }
    }
  }

  @Before(event = CqnService.EVENT_CREATE, entity = Job_.CDS_NAME)
  public void beforeCreateJob(CdsCreateEventContext context, List<Job> jobs) {
    // Definition
    Job data = jobs.get(0);
    String definitionName = data.getName();
    Select<JobDefinition_> query = Select.from(JOB_DEFINITION)
      .columns(CQL.star(), CQL.to("parameters").expand())
      .where(jd -> jd.name().eq(definitionName));
    Optional<JobDefinition> _jobDefinition = persistenceService.run(query).first(JobDefinition.class);
    if (_jobDefinition.isEmpty()) {
      throw JobSchedulingError.jobDefinitionNotFound(definitionName);
    }

    JobDefinition jobDefinition = _jobDefinition.get();

    // Reference ID
    if (data.getReferenceID() == null) {
      throw JobSchedulingError.referenceIDMissing();
    }
    try {
      UUID.fromString(data.getReferenceID());
    } catch (IllegalArgumentException e) {
      throw JobSchedulingError.referenceIDNoUUID(data.getReferenceID());
    }

    // Results
    if (data.getResults() != null) {
      throw JobSchedulingError.jobResultsReadOnly();
    }

    // Start Date & Time
    if (data.getStartDateTime() != null && !jobDefinition.getSupportsStartDateTime()) {
      throw JobSchedulingError.startDateTimeNotSupported(jobDefinition.getName());
    }

    // Header
    com.github.cap.js.community.sapafcsdk.model.scheduling.Job job =
      com.github.cap.js.community.sapafcsdk.model.scheduling.Job.create();
    job.setReferenceID(data.getReferenceID());
    job.setStartDateTime(data.getStartDateTime());
    job.setDefinitionName(definitionName);
    job.setVersion(jobDefinition.getVersion());
    job.setStatusCode(JobStatusCode.REQUESTED);
    List<JobParameter> jobParameters = new ArrayList<>();
    job.setParameters(jobParameters);

    // Parameters
    Map<String, JobParameterDefinition> parameterDefinitions = new HashMap<>();
    for (JobParameterDefinition parameterDefinition : jobDefinition.getParameters()) {
      parameterDefinitions.put(parameterDefinition.getName(), parameterDefinition);
    }

    Map<String, com.github.cap.js.community.sapafcsdk.model.schedulingproviderservice.JobParameter> parameters =
      new HashMap<>();
    if (data.getParameters() != null) {
      for (com.github.cap.js.community.sapafcsdk.model.schedulingproviderservice.JobParameter parameter : data.getParameters()) {
        if (parameter.getName() == null) {
          throw JobSchedulingError.jobParameterNameMissing();
        }
        if (!parameterDefinitions.containsKey(parameter.getName())) {
          throw JobSchedulingError.jobParameterNotKnown(parameter.getName());
        }
        parameters.put(parameter.getName(), parameter);
      }
    }

    for (JobParameterDefinition jobParameterDefinition : jobDefinition.getParameters()) {
      com.github.cap.js.community.sapafcsdk.model.schedulingproviderservice.JobParameter parameter = parameters.get(
        jobParameterDefinition.getName()
      );
      if (parameter == null && jobParameterDefinition.getRequired()) {
        throw JobSchedulingError.jobParameterRequired(jobParameterDefinition.getName());
      }
      if (parameter == null) {
        continue;
      }
      if (!ParameterTypeCode.MAPPING.equals(jobParameterDefinition.getTypeCode())) {
        if (
          ParameterTypeCode.READ_ONLY_VALUE.equals(jobParameterDefinition.getTypeCode()) &&
          parameter.containsKey("value") &&
          parameter.get("value") != null &&
          !parameter.get("value").equals(jobParameterDefinition.getValue())
        ) {
          throw JobSchedulingError.jobParameterReadOnly(jobParameterDefinition.getName());
        }
      }
      if (!parameter.containsKey("value")) {
        parameter.setValue(jobParameterDefinition.getValue());
      }
      if ((!parameter.containsKey("value") || parameter.get("value") == null) && jobParameterDefinition.getRequired()) {
        throw JobSchedulingError.jobParameterValueRequired(jobParameterDefinition.getName());
      }
      if (parameter.containsKey("value") && parameter.get("value") != null) {
        switch (jobParameterDefinition.getDataTypeCode()) {
          case DataTypeCode.STRING:
          default:
            parameter.put("value", parameter.get("value").toString());
            break;
          case DataTypeCode.NUMBER:
            try {
              Float.parseFloat(parameter.get("value").toString());
            } catch (NumberFormatException e) {
              throw JobSchedulingError.jobParameterValueInvalidType(
                parameter.get("value"),
                parameter.getName(),
                jobParameterDefinition.getDataTypeCode()
              );
            }
            parameter.put("value", parameter.get("value").toString());
            break;
          case DataTypeCode.DATETIME:
            if (!isValidISODateTime(parameter.get("value").toString())) {
              throw JobSchedulingError.jobParameterValueInvalidType(
                parameter.get("value"),
                parameter.getName(),
                jobParameterDefinition.getDataTypeCode()
              );
            }
            parameter.put("value", normalizeISODateTime(parameter.get("value").toString()));
            break;
          case DataTypeCode._BOOLEAN:
            if (
              !(("true".equals(parameter.get("value").toString())) ||
                ("false".equals(parameter.get("value").toString())))
            ) {
              throw JobSchedulingError.jobParameterValueInvalidType(
                parameter.get("value"),
                parameter.getName(),
                jobParameterDefinition.getDataTypeCode()
              );
            }
            parameter.put("value", parameter.get("value").toString());
            break;
        }
      }
      JobParameter jobParameter = JobParameter.create();
      jobParameter.setDefinitionName(parameter.getName());
      jobParameter.setDefinitionJobName(definitionName);
      jobParameter.setValue(parameter.getValue());
      jobParameters.add(jobParameter);
    }

    if (jobDefinition.getSupportsTestRun()) {
      job.setTestRun(false);
      Optional<JobParameterDefinition> testRunParameterDefinition = jobDefinition
        .getParameters()
        .stream()
        .filter(parameter -> MappingTypeCode.TEST_RUN.equals(parameter.getMappingTypeCode()))
        .findFirst();
      if (testRunParameterDefinition.isPresent()) {
        Optional<JobParameter> testRunParameter = job
          .getParameters()
          .stream()
          .filter(parameter -> testRunParameterDefinition.get().getName().equals(parameter.getDefinitionName()))
          .findFirst();
        testRunParameter.ifPresent(jobParameter -> job.setTestRun("true".equals(jobParameter.getValue())));
      }
    }

    context.put("job", job);
  }

  @On(event = CqnService.EVENT_CREATE, entity = Job_.CDS_NAME)
  public void createJob(CdsCreateEventContext context, List<Job> jobs) {
    com.github.cap.js.community.sapafcsdk.model.scheduling.Job job =
      (com.github.cap.js.community.sapafcsdk.model.scheduling.Job) context.get("job");
    Result result = persistenceService.run(Insert.into(JOB).entry(job));
    com.github.cap.js.community.sapafcsdk.model.scheduling.Job createdJob = result.single(
      com.github.cap.js.community.sapafcsdk.model.scheduling.Job.class
    );
    context.put("job", createdJob);
    Select<com.github.cap.js.community.sapafcsdk.model.schedulingproviderservice.Job_> read = Select.from(
      com.github.cap.js.community.sapafcsdk.model.schedulingproviderservice.SchedulingProviderService_.JOB
    ).byId(createdJob.getId());
    context.setResult(context.getService().run(read));
    context.setCompleted();
  }

  @After(event = CqnService.EVENT_CREATE, entity = Job_.CDS_NAME)
  public void afterCreateJob(CdsCreateEventContext context, List<Job> jobs) {
    com.github.cap.js.community.sapafcsdk.model.scheduling.Job job =
      (com.github.cap.js.community.sapafcsdk.model.scheduling.Job) context.get("job");

    SchedulingProcessingService processingServiceOutboxed = outboxService.outboxed(processingService);
    processingServiceOutboxed.processJob(job.getId(), job.getTestRun());

    SchedulingWebsocketService websocketServiceOutboxed = outboxService.outboxed(websocketService);
    JobStatusChangedContext jobStatusChanged = JobStatusChangedContext.create();
    JobStatusChanged jobStatusChangedData = JobStatusChanged.create();
    jobStatusChangedData.setStatus(JobStatusCode.REQUESTED);
    jobStatusChangedData.setIDs(Collections.singletonList(job.getId()));
    jobStatusChanged.setData(jobStatusChangedData);
    websocketServiceOutboxed.emit(jobStatusChanged);
  }

  @Before(event = JobCancelContext.CDS_NAME, entity = Job_.CDS_NAME)
  public void beforeCancelJob(JobCancelContext context) {
    String ID = CqnAnalyzer.create(context.getModel())
      .analyze(context.getCqn().ref())
      .targetKeys()
      .get("ID")
      .toString();
    Optional<Job> _job = persistenceService.run(context.getCqn()).first(Job.class);
    if (_job.isEmpty()) {
      throw JobSchedulingError.jobNotFound(ID);
    }
    Job job = _job.get();
    if (!(JobStatusCode.REQUESTED.equals(job.getStatus()) || JobStatusCode.RUNNING.equals(job.getStatus()))) {
      throw JobSchedulingError.jobCannotBeCanceled(job.getStatus());
    }
  }

  @On(event = JobCancelContext.CDS_NAME, entity = Job_.CDS_NAME)
  public void cancelJob(JobCancelContext context) {
    String ID = CqnAnalyzer.create(context.getModel())
      .analyze(context.getCqn().ref())
      .targetKeys()
      .get("ID")
      .toString();
    com.github.cap.js.community.sapafcsdk.model.scheduling.Job dbJob =
      com.github.cap.js.community.sapafcsdk.model.scheduling.Job.create(ID);
    dbJob.setStatusCode(JobStatusCode.CANCEL_REQUESTED);
    Update<com.github.cap.js.community.sapafcsdk.model.scheduling.Job_> update = Update.entity(JOB).data(dbJob);
    persistenceService.run(update);
    context.setCompleted();
  }

  @After(event = JobCancelContext.CDS_NAME, entity = Job_.CDS_NAME)
  public void afterCancelJob(JobCancelContext context) {
    String ID = CqnAnalyzer.create(context.getModel())
      .analyze(context.getCqn().ref())
      .targetKeys()
      .get("ID")
      .toString();

    SchedulingProcessingService processingServiceOutboxed = outboxService.outboxed(processingService);
    processingServiceOutboxed.cancelJob(ID);

    SchedulingWebsocketService websocketServiceOutboxed = outboxService.outboxed(websocketService);
    JobStatusChangedContext jobStatusChanged = JobStatusChangedContext.create();
    JobStatusChanged jobStatusChangedData = JobStatusChanged.create();
    jobStatusChangedData.setStatus(JobStatusCode.CANCEL_REQUESTED);
    jobStatusChangedData.setIDs(Collections.singletonList(ID));
    jobStatusChanged.setData(jobStatusChangedData);
    websocketServiceOutboxed.emit(jobStatusChanged);
  }

  @Before(event = JobResultDataContext.CDS_NAME, entity = JobResult_.CDS_NAME)
  public void beforeDownloadData(JobResultDataContext context) {
    String ID = CqnAnalyzer.create(context.getModel())
      .analyze(context.getCqn().ref())
      .targetKeys()
      .get("ID")
      .toString();
    Optional<JobResult> _jobResult = persistenceService.run(context.getCqn()).first(JobResult.class);
    if (_jobResult.isEmpty()) {
      throw JobSchedulingError.jobResultNotFound(ID);
    }
  }

  @On(event = JobResultDataContext.CDS_NAME, entity = JobResult_.CDS_NAME)
  public void downloadData(JobResultDataContext context) throws IOException {
    String ID = CqnAnalyzer.create(context.getModel())
      .analyze(context.getCqn().ref())
      .targetKeys()
      .get("ID")
      .toString();
    context.setResult((byte[]) this.downloadData(context, ID));
    context.setCompleted();
  }
}
