package com.github.cap.js.community.sapafcsdk.scheduling.handlers;

import static cds.gen.scheduling.Scheduling_.JOB;
import static cds.gen.scheduling.Scheduling_.JOB_RESULT;

import cds.gen.scheduling.*;
import cds.gen.schedulingprocessingservice.*;
import cds.gen.schedulingprocessingservice.JobResult;
import cds.gen.schedulingprocessingservice.JobResultMessage;
import cds.gen.schedulingwebsocketservice.JobStatusChanged;
import cds.gen.schedulingwebsocketservice.JobStatusChangedContext;
import cds.gen.schedulingwebsocketservice.SchedulingWebsocketService;
import com.github.cap.js.community.sapafcsdk.configuration.AfcSdkProperties;
import com.github.cap.js.community.sapafcsdk.configuration.OutboxConfig;
import com.github.cap.js.community.sapafcsdk.scheduling.common.JobSchedulingError;
import com.sap.cds.ql.CQL;
import com.sap.cds.ql.Insert;
import com.sap.cds.ql.Select;
import com.sap.cds.ql.Update;
import com.sap.cds.ql.cqn.CqnUpdate;
import com.sap.cds.services.EventContext;
import com.sap.cds.services.handler.EventHandler;
import com.sap.cds.services.handler.annotations.Before;
import com.sap.cds.services.handler.annotations.On;
import com.sap.cds.services.handler.annotations.ServiceName;
import com.sap.cds.services.messages.LocalizedMessageProvider;
import com.sap.cds.services.outbox.OutboxService;
import com.sap.cds.services.persistence.PersistenceService;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
@ServiceName(SchedulingProcessingService_.CDS_NAME)
public class SchedulingProcessingHandler implements EventHandler {

  static Logger log = LoggerFactory.getLogger("job-sync");

  public static final Map<String, List<String>> STATUS_TRANSITIONS = new HashMap<>();

  static {
    STATUS_TRANSITIONS.put(
      JobStatusCode.REQUESTED,
      List.of(JobStatusCode.RUNNING, JobStatusCode.CANCEL_REQUESTED, JobStatusCode.CANCELED)
    );
    STATUS_TRANSITIONS.put(
      JobStatusCode.RUNNING,
      List.of(
        JobStatusCode.COMPLETED,
        JobStatusCode.COMPLETED_WITH_WARNING,
        JobStatusCode.COMPLETED_WITH_ERROR,
        JobStatusCode.FAILED,
        JobStatusCode.CANCEL_REQUESTED
      )
    );
    STATUS_TRANSITIONS.put(JobStatusCode.COMPLETED, List.of());
    STATUS_TRANSITIONS.put(JobStatusCode.COMPLETED_WITH_WARNING, List.of());
    STATUS_TRANSITIONS.put(JobStatusCode.COMPLETED_WITH_ERROR, List.of());
    STATUS_TRANSITIONS.put(JobStatusCode.FAILED, List.of());
    STATUS_TRANSITIONS.put(
      JobStatusCode.CANCEL_REQUESTED,
      List.of(
        JobStatusCode.COMPLETED,
        JobStatusCode.COMPLETED_WITH_WARNING,
        JobStatusCode.COMPLETED_WITH_ERROR,
        JobStatusCode.FAILED,
        JobStatusCode.CANCELED
      )
    );
    STATUS_TRANSITIONS.put(JobStatusCode.CANCELED, List.of());
  }

  public static List<String> MESSAGE_SEVERITIES = List.of(
    MessageSeverityCode.SUCCESS,
    MessageSeverityCode.WARNING,
    MessageSeverityCode.ERROR,
    MessageSeverityCode.INFO
  );

  @Autowired
  protected SchedulingProcessingService processingService;

  @Autowired
  protected SchedulingWebsocketService websocketService;

  @Autowired
  protected LocalizedMessageProvider messageProvider;

  @Autowired
  protected PersistenceService persistenceService;

  @Autowired
  protected AfcSdkProperties afcsdkProperties;

  @Autowired
  @Qualifier(OutboxConfig.OUTBOX_SERVICE)
  protected OutboxService outboxService;

  protected final Map<String, List<String>> statusTransitions;

  public SchedulingProcessingHandler() {
    this.statusTransitions = STATUS_TRANSITIONS;
  }

  @Before(event = { ProcessJobContext.CDS_NAME, UpdateJobContext.CDS_NAME, CancelJobContext.CDS_NAME })
  public void beforeEvents(EventContext context) {
    String ID = (String) context.get("ID");
    Select<Job_> query = Select.from(JOB).columns(CQL.star(), CQL.to("parameters").expand()).byId(ID);
    Optional<Job> _job = persistenceService.run(query).first(Job.class);
    if (_job.isEmpty()) {
      throw JobSchedulingError.jobNotFound(ID);
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
      mockJobSync(context);
    }
    context.setCompleted();
  }

  protected void processJobUpdate(EventContext context, String status, Collection<JobResult> results) {
    Job job = (Job) context.get("job");

    if (status == null || status.isEmpty()) {
      throw JobSchedulingError.statusValueMissing();
    }

    if (this.statusTransitions.get(status) == null) {
      throw JobSchedulingError.invalidJobStatus(status);
    }

    if (status.equals(job.getStatusCode())) {
      return;
    }

    if (!this.checkStatusTransition(context, job.getStatusCode(), status)) {
      throw JobSchedulingError.statusTransitionNotAllowed(job.getStatusCode(), status);
    }

    job.setStatusCode(status);
    CqnUpdate update = Update.entity(JOB).data(job);
    persistenceService.run(update);
    if (results != null && !results.isEmpty()) {
      Collection<cds.gen.scheduling.JobResult> insertResults = this.checkJobResults(context, results);
      Insert insert = Insert.into(JOB_RESULT).entries(insertResults);
      persistenceService.run(insert);
    }

    SchedulingWebsocketService websocketServiceOutboxed = outboxService.outboxed(websocketService);
    JobStatusChangedContext jobStatusChanged = JobStatusChangedContext.create();
    JobStatusChanged jobStatusChangedData = JobStatusChanged.create();
    jobStatusChangedData.setStatus(status);
    jobStatusChangedData.setIDs(Collections.singletonList(job.getId()));
    jobStatusChanged.setData(jobStatusChangedData);
    websocketServiceOutboxed.emit(jobStatusChanged);
  }

  public boolean checkStatusTransition(EventContext context, String statusBefore, String statusAfter) {
    List<String> validTransitions = this.statusTransitions.getOrDefault(statusBefore, List.of());
    return validTransitions.contains(statusAfter);
  }

  protected Collection<cds.gen.scheduling.JobResult> checkJobResults(
    EventContext context,
    Collection<JobResult> results
  ) {
    String jobId = (String) context.get("ID");
    List<Locale> locales = getAvailableBundleLocales("i18n/messages", this.getClass().getClassLoader());
    List<cds.gen.scheduling.JobResult> dbResults = new ArrayList<>();

    for (JobResult result : results) {
      cds.gen.scheduling.JobResult dbResult = cds.gen.scheduling.JobResult.create();

      if (result.getName() == null || result.getName().isEmpty()) {
        throw JobSchedulingError.resultNameMissing();
      }
      if (result.getType() == null || result.getType().isEmpty()) {
        throw JobSchedulingError.resultTypeMissing();
      }

      switch (result.getType()) {
        case ResultTypeCode.LINK:
          if (result.getLink() == null) {
            throw JobSchedulingError.linkMissing(result.getType());
          }
          if (result.getMimeType() != null) {
            throw JobSchedulingError.mimeTypeNotAllowed(result.getType());
          }
          if (result.getFilename() != null) {
            throw JobSchedulingError.filenameNotAllowed(result.getType());
          }
          if (result.getData() != null) {
            throw JobSchedulingError.dataNotAllowed(result.getType());
          }
          if (result.getMessages() != null) {
            throw JobSchedulingError.messagesNotAllowed(result.getType());
          }
          break;
        case ResultTypeCode.DATA:
          if (result.getMimeType() == null) {
            throw JobSchedulingError.mimeTypeMissing(result.getType());
          }
          if (result.getFilename() == null) {
            throw JobSchedulingError.filenameMissing(result.getType());
          }
          if (result.getData() == null) {
            throw JobSchedulingError.dataMissing(result.getType());
          }
          if (result.getLink() != null) {
            throw JobSchedulingError.linkNotAllowed(result.getType());
          }
          if (result.getMessages() != null) {
            throw JobSchedulingError.messagesNotAllowed(result.getType());
          }
          break;
        case ResultTypeCode.MESSAGE:
          Collection<JobResultMessage> messages = result.getMessages();
          if (messages == null || messages.isEmpty()) {
            throw JobSchedulingError.messagesMissing(result.getType());
          }

          List<cds.gen.scheduling.JobResultMessage> dbMessages = new ArrayList<>();

          for (JobResultMessage message : messages) {
            cds.gen.scheduling.JobResultMessage dbMessage = cds.gen.scheduling.JobResultMessage.create();

            if (message.getCode() == null) {
              throw JobSchedulingError.codeMissing();
            }

            dbMessage.setCode(message.getCode());
            dbMessage.setText(message.getText());

            if (dbMessage.getText() == null) {
              String defaultText = messageProvider.get(message.getCode(), null, Locale.getDefault());
              if (defaultText == null) {
                throw JobSchedulingError.textMissing();
              }
              dbMessage.setText(defaultText);
            }

            List<cds.gen.scheduling.JobResultMessageTexts> dbTexts = new ArrayList<>();
            if (message.getTexts() == null) {
              for (Locale locale : locales) {
                cds.gen.scheduling.JobResultMessageTexts dbText = cds.gen.scheduling.JobResultMessageTexts.create();
                dbText.setLocale(locale.toString());
                dbText.setText(messageProvider.get(message.getCode(), null, locale));
                dbTexts.add(dbText);
              }
            } else {
              for (JobResultMessageText text : message.getTexts()) {
                if (text.getLocale() == null || text.getLocale().isEmpty()) {
                  throw JobSchedulingError.localeMissing();
                }
                boolean isValidLocale = locales
                  .stream()
                  .map(Locale::toString)
                  .anyMatch(l -> l.equals(text.getLocale()));
                if (!isValidLocale) {
                  throw JobSchedulingError.invalidLocale(text.getLocale());
                }
                cds.gen.scheduling.JobResultMessageTexts dbText = cds.gen.scheduling.JobResultMessageTexts.create();
                dbText.setLocale(text.getLocale());
                dbText.setText(text.getText());
                if (dbText.getText() == null || dbText.getText().isEmpty()) {
                  Locale locale = locales
                    .stream()
                    .filter(l -> l.toString().equals(dbText.getLocale()))
                    .findFirst()
                    .orElseThrow(() -> JobSchedulingError.invalidLocale(dbText.getLocale()));
                  dbText.setText(messageProvider.get(message.getCode(), null, locale));
                }
                dbTexts.add(dbText);
              }
            }

            dbMessage.setTexts(dbTexts);

            if (message.getSeverity() == null) {
              throw JobSchedulingError.severityMissing();
            }

            if (!MESSAGE_SEVERITIES.contains(message.getSeverity())) {
              throw JobSchedulingError.invalidMessageSeverity(message.getSeverity());
            }

            dbMessage.setSeverityCode(message.getSeverity());
            dbMessage.setCreatedAt(message.getCreatedAt());

            if (message.getCreatedAt() == null) {
              dbMessage.setCreatedAt(Instant.now());
            }

            dbMessages.add(dbMessage);
          }

          dbResult.setMessages(dbMessages);

          if (result.getLink() != null) {
            throw JobSchedulingError.linkNotAllowed(result.getType());
          }
          if (result.getMimeType() != null) {
            throw JobSchedulingError.mimeTypeNotAllowed(result.getType());
          }
          if (result.getFilename() != null) {
            throw JobSchedulingError.filenameNotAllowed(result.getType());
          }
          if (result.getData() != null) {
            throw JobSchedulingError.dataNotAllowed(result.getType());
          }
          break;
        default:
          throw JobSchedulingError.invalidResultType(result.getType());
      }

      dbResult.setJobId(jobId);
      dbResult.setName(result.getName());
      dbResult.setTypeCode(result.getType());
      dbResult.setLink(result.getLink());
      dbResult.setMimeType(result.getMimeType());
      dbResult.setFilename(result.getFilename());
      if (result.getData() != null) {
        dbResult.setData(result.getData());
      }
      dbResults.add(dbResult);
    }

    return dbResults;
  }

  protected List<JobResult> mockJobProcessing(EventContext context) {
    AfcSdkProperties.MockProcessing processingConfig = afcsdkProperties.getMockProcessing();
    List<JobResult> updateResults = new ArrayList<>();

    double min = processingConfig.getMin() != null ? processingConfig.getMin() : 0;
    double max = processingConfig.getMax() != null ? processingConfig.getMax() : 10;
    double processingTime = (Math.random() * (max - min) + min) * 1000;
    String processingStatus = processingConfig.getDefault() != null
      ? processingConfig.getDefault()
      : JobStatusCode.COMPLETED;
    boolean advancedMock = false;
    if (processingConfig.getStatus() != null && !processingConfig.getStatus().isEmpty()) {
      advancedMock = true;
      Map<String, Double> statuses = processingConfig.getStatus();
      min = 0;
      max = statuses.values().stream().mapToDouble(Double::doubleValue).sum();
      double statusValue = Math.random() * (max - min) + min;
      double value = 0;
      for (Map.Entry<String, Double> status : statuses.entrySet()) {
        if (value < statusValue) {
          processingStatus = status.getKey();
        }
        value += status.getValue();
      }
    }
    String ID = (String) context.get("ID");
    Job job = (Job) context.get("job");

    Optional<JobParameter> durationParameter = job
      .getParameters()
      .stream()
      .filter(jp -> jp.getDefinitionName().equals("duration"))
      .findFirst();
    if (durationParameter.isPresent() && durationParameter.get().getValue() != null) {
      processingTime = Double.parseDouble(durationParameter.get().getValue()) * 1000;
    }
    Optional<JobParameter> statusParameter = job
      .getParameters()
      .stream()
      .filter(jp -> jp.getDefinitionName().equals("status"))
      .findFirst();
    if (statusParameter.isPresent() && statusParameter.get().getValue() != null) {
      processingStatus = statusParameter.get().getValue();
    }

    switch (processingStatus) {
      case JobStatusCode.COMPLETED:
        updateResults.add(createJobResult("Message", ResultTypeCode.MESSAGE, "jobCompleted", MessageSeverityCode.INFO));
        updateResults.add(createJobResult("Link", ResultTypeCode.LINK, "https://sap.com"));
        String text = messageProvider.get("jobCompleted", null, Locale.getDefault());
        InputStream textStream = new ByteArrayInputStream(text.getBytes(StandardCharsets.UTF_8));
        updateResults.add(createJobResult("Data", ResultTypeCode.DATA, "log.txt", "text/plain", textStream));
        InputStream pdfStream = this.getClass().getClassLoader().getResourceAsStream("log.pdf");
        updateResults.add(createJobResult("Data", ResultTypeCode.DATA, "log.pdf", "application/pdf", pdfStream));
        break;
      case JobStatusCode.COMPLETED_WITH_WARNING:
        updateResults.add(
          createJobResult("Message", ResultTypeCode.MESSAGE, "jobCompletedWithWarning", MessageSeverityCode.WARNING)
        );
        break;
      case JobStatusCode.COMPLETED_WITH_ERROR:
        updateResults.add(
          createJobResult("Message", ResultTypeCode.MESSAGE, "jobCompletedWithError", MessageSeverityCode.ERROR)
        );
        break;
      case JobStatusCode.FAILED:
        updateResults.add(createJobResult("Message", ResultTypeCode.MESSAGE, "jobFailed", MessageSeverityCode.ERROR));
        break;
    }

    final String status = processingStatus;
    if (processingTime > 0) {
      ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
      scheduler.schedule(
        () -> {
          SchedulingProcessingService processingServiceOutboxed = outboxService.outboxed(processingService);
          processingServiceOutboxed.updateJob(ID, status, updateResults);
          scheduler.shutdown();
        },
        (long) processingTime,
        TimeUnit.MILLISECONDS
      );
    } else {
      SchedulingProcessingService processingServiceOutboxed = outboxService.outboxed(processingService);
      processingServiceOutboxed.updateJob(ID, status, updateResults);
    }

    List<JobResult> mockResults = new ArrayList<>();
    if (advancedMock) {
      mockResults.add(
        createJobResult("Advanced Mocked Run", ResultTypeCode.MESSAGE, "jobAdvancedMock", MessageSeverityCode.INFO)
      );
    } else {
      mockResults.add(
        createJobResult("Basic Mocked Run", ResultTypeCode.MESSAGE, "jobBasicMock", MessageSeverityCode.INFO)
      );
    }
    if (context.get("testRun") != null && (boolean) context.get("testRun")) {
      mockResults.add(createJobResult("Test Run", ResultTypeCode.MESSAGE, "jobTestRun", MessageSeverityCode.INFO));
    }
    return mockResults;
  }

  private JobResult createJobResult(String name, String type, String messageCode, String severity) {
    JobResult result = JobResult.create();
    result.setName(name);
    result.setType(type);
    JobResultMessage message = JobResultMessage.create();
    message.setCode(messageCode);
    message.setSeverity(severity);
    result.setMessages(Collections.singletonList(message));
    return result;
  }

  private JobResult createJobResult(String name, String type, String link) {
    JobResult result = JobResult.create();
    result.setName(name);
    result.setType(type);
    result.setLink(link);
    return result;
  }

  private JobResult createJobResult(String name, String type, String filename, String mimeType, InputStream data) {
    JobResult result = JobResult.create();
    result.setName(name);
    result.setType(type);
    result.setFilename(filename);
    result.setMimeType(mimeType);
    result.setData(data);
    return result;
  }

  protected void mockJobSync(EventContext context) {
    log.info("periodic sync job triggered");
  }

  public static List<Locale> getAvailableBundleLocales(String baseName, ClassLoader classLoader) {
    ResourceBundle.Control control = ResourceBundle.Control.getControl(ResourceBundle.Control.FORMAT_DEFAULT);
    Locale[] availableLocales = Locale.getAvailableLocales();
    return Arrays.stream(availableLocales)
      .filter(locale -> {
        try {
          if (locale.toString().isEmpty()) {
            return false;
          }
          ResourceBundle bundle = ResourceBundle.getBundle(baseName, locale, classLoader, control);
          return bundle.getLocale().equals(locale);
        } catch (MissingResourceException e) {
          return false;
        }
      })
      .toList();
  }
  /*protected void reportStatus(EventContext context, String status) {
        // afcService.reportStatus(Status);
    }*/
}
