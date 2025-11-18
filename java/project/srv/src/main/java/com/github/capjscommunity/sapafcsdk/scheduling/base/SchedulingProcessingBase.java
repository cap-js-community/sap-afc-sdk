package com.github.capjscommunity.sapafcsdk.scheduling.base;

import static com.github.capjscommunity.sapafcsdk.model.scheduling.Scheduling_.JOB;
import static com.github.capjscommunity.sapafcsdk.model.scheduling.Scheduling_.JOB_RESULT;

import com.github.capjscommunity.sapafcsdk.configuration.AfcSdkProperties;
import com.github.capjscommunity.sapafcsdk.configuration.OutboxConfig;
import com.github.capjscommunity.sapafcsdk.model.scheduling.*;
import com.github.capjscommunity.sapafcsdk.model.schedulingprocessingservice.*;
import com.github.capjscommunity.sapafcsdk.model.schedulingprocessingservice.JobResult;
import com.github.capjscommunity.sapafcsdk.model.schedulingprocessingservice.JobResultMessage;
import com.github.capjscommunity.sapafcsdk.model.schedulingwebsocketservice.JobStatusChanged;
import com.github.capjscommunity.sapafcsdk.model.schedulingwebsocketservice.JobStatusChangedContext;
import com.github.capjscommunity.sapafcsdk.model.schedulingwebsocketservice.SchedulingWebsocketService;
import com.github.capjscommunity.sapafcsdk.scheduling.common.JobSchedulingException;
import com.sap.cds.ql.Insert;
import com.sap.cds.ql.Update;
import com.sap.cds.ql.cqn.CqnUpdate;
import com.sap.cds.services.EventContext;
import com.sap.cds.services.messages.LocalizedMessageProvider;
import com.sap.cds.services.outbox.OutboxService;
import com.sap.cds.services.persistence.PersistenceService;
import java.io.ByteArrayInputStream;
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

public class SchedulingProcessingBase {

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

  public SchedulingProcessingBase() {
    this.statusTransitions = STATUS_TRANSITIONS;
  }

  protected void processJobUpdate(EventContext context, String status, Collection<JobResult> results) {
    Job job = (Job) context.get("job");

    if (status == null || status.isEmpty()) {
      throw JobSchedulingException.statusValueMissing();
    }

    if (this.statusTransitions.get(status) == null) {
      throw JobSchedulingException.invalidJobStatus(status);
    }

    if (status.equals(job.getStatusCode())) {
      return;
    }

    if (!this.checkStatusTransition(context, job.getStatusCode(), status)) {
      throw JobSchedulingException.statusTransitionNotAllowed(job.getStatusCode(), status);
    }

    job.setStatusCode(status);
    CqnUpdate update = Update.entity(JOB).data(job);
    persistenceService.run(update);
    if (results != null && !results.isEmpty()) {
      Collection<com.github.capjscommunity.sapafcsdk.model.scheduling.JobResult> insertResults = this.checkJobResults(
        context,
        results
      );
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

  protected boolean checkStatusTransition(EventContext context, String statusBefore, String statusAfter) {
    List<String> validTransitions = this.statusTransitions.getOrDefault(statusBefore, List.of());
    return validTransitions.contains(statusAfter);
  }

  protected Collection<com.github.capjscommunity.sapafcsdk.model.scheduling.JobResult> checkJobResults(
    EventContext context,
    Collection<JobResult> results
  ) {
    String jobId = (String) context.get("ID");
    List<Locale> locales = getAvailableBundleLocales("i18n/messages", this.getClass().getClassLoader());
    List<com.github.capjscommunity.sapafcsdk.model.scheduling.JobResult> dbResults = new ArrayList<>();

    for (JobResult result : results) {
      com.github.capjscommunity.sapafcsdk.model.scheduling.JobResult dbResult =
        com.github.capjscommunity.sapafcsdk.model.scheduling.JobResult.create();

      if (result.getName() == null || result.getName().isEmpty()) {
        throw JobSchedulingException.resultNameMissing();
      }
      if (result.getType() == null || result.getType().isEmpty()) {
        throw JobSchedulingException.resultTypeMissing();
      }

      switch (result.getType()) {
        case ResultTypeCode.LINK:
          if (result.getLink() == null) {
            throw JobSchedulingException.linkMissing(result.getType());
          }
          if (result.getMimeType() != null) {
            throw JobSchedulingException.mimeTypeNotAllowed(result.getType());
          }
          if (result.getFilename() != null) {
            throw JobSchedulingException.filenameNotAllowed(result.getType());
          }
          if (result.getData() != null) {
            throw JobSchedulingException.dataNotAllowed(result.getType());
          }
          if (result.getMessages() != null) {
            throw JobSchedulingException.messagesNotAllowed(result.getType());
          }
          break;
        case ResultTypeCode.DATA:
          if (result.getMimeType() == null) {
            throw JobSchedulingException.mimeTypeMissing(result.getType());
          }
          if (result.getFilename() == null) {
            throw JobSchedulingException.filenameMissing(result.getType());
          }
          if (result.getData() == null) {
            throw JobSchedulingException.dataMissing(result.getType());
          }
          if (result.getLink() != null) {
            throw JobSchedulingException.linkNotAllowed(result.getType());
          }
          if (result.getMessages() != null) {
            throw JobSchedulingException.messagesNotAllowed(result.getType());
          }
          break;
        case ResultTypeCode.MESSAGE:
          Collection<JobResultMessage> messages = result.getMessages();
          if (messages == null || messages.isEmpty()) {
            throw JobSchedulingException.messagesMissing(result.getType());
          }

          List<com.github.capjscommunity.sapafcsdk.model.scheduling.JobResultMessage> dbMessages = new ArrayList<>();

          for (JobResultMessage message : messages) {
            com.github.capjscommunity.sapafcsdk.model.scheduling.JobResultMessage dbMessage =
              com.github.capjscommunity.sapafcsdk.model.scheduling.JobResultMessage.create();

            if (message.getCode() == null) {
              throw JobSchedulingException.codeMissing();
            }

            dbMessage.setCode(message.getCode());
            dbMessage.setText(message.getText());

            if (dbMessage.getText() == null) {
              String defaultText = messageProvider.get(message.getCode(), null, Locale.getDefault());
              if (defaultText == null) {
                throw JobSchedulingException.textMissing();
              }
              dbMessage.setText(defaultText);
            }

            List<com.github.capjscommunity.sapafcsdk.model.scheduling.JobResultMessageTexts> dbTexts =
              new ArrayList<>();
            if (message.getTexts() == null) {
              for (Locale locale : locales) {
                com.github.capjscommunity.sapafcsdk.model.scheduling.JobResultMessageTexts dbText =
                  com.github.capjscommunity.sapafcsdk.model.scheduling.JobResultMessageTexts.create();
                dbText.setLocale(locale.toString());
                dbText.setText(messageProvider.get(message.getCode(), null, locale));
                dbTexts.add(dbText);
              }
            } else {
              for (JobResultMessageText text : message.getTexts()) {
                if (text.getLocale() == null || text.getLocale().isEmpty()) {
                  throw JobSchedulingException.localeMissing();
                }
                boolean isValidLocale = locales
                  .stream()
                  .map(Locale::toString)
                  .anyMatch(l -> l.equals(text.getLocale()));
                if (!isValidLocale) {
                  throw JobSchedulingException.invalidLocale(text.getLocale());
                }
                com.github.capjscommunity.sapafcsdk.model.scheduling.JobResultMessageTexts dbText =
                  com.github.capjscommunity.sapafcsdk.model.scheduling.JobResultMessageTexts.create();
                dbText.setLocale(text.getLocale());
                dbText.setText(text.getText());
                if (dbText.getText() == null || dbText.getText().isEmpty()) {
                  Locale locale = locales
                    .stream()
                    .filter(l -> l.toString().equals(dbText.getLocale()))
                    .findFirst()
                    .orElseThrow(() -> JobSchedulingException.invalidLocale(dbText.getLocale()));
                  dbText.setText(messageProvider.get(message.getCode(), null, locale));
                }
                dbTexts.add(dbText);
              }
            }

            dbTexts = dbTexts
              .stream()
              .filter(
                t -> t.getLocale() != null && !t.getLocale().isBlank() && t.getText() != null && !t.getText().isBlank()
              )
              .toList();

            dbMessage.setTexts(dbTexts);

            if (message.getSeverity() == null) {
              throw JobSchedulingException.severityMissing();
            }

            if (!MESSAGE_SEVERITIES.contains(message.getSeverity())) {
              throw JobSchedulingException.invalidMessageSeverity(message.getSeverity());
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
            throw JobSchedulingException.linkNotAllowed(result.getType());
          }
          if (result.getMimeType() != null) {
            throw JobSchedulingException.mimeTypeNotAllowed(result.getType());
          }
          if (result.getFilename() != null) {
            throw JobSchedulingException.filenameNotAllowed(result.getType());
          }
          if (result.getData() != null) {
            throw JobSchedulingException.dataNotAllowed(result.getType());
          }
          break;
        default:
          throw JobSchedulingException.invalidResultType(result.getType());
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

  protected JobResult createJobResult(String name, String type, String messageCode, String severity) {
    JobResult result = JobResult.create();
    result.setName(name);
    result.setType(type);
    JobResultMessage message = JobResultMessage.create();
    message.setCode(messageCode);
    message.setSeverity(severity);
    result.setMessages(Collections.singletonList(message));
    return result;
  }

  protected JobResult createJobResult(String name, String type, String link) {
    JobResult result = JobResult.create();
    result.setName(name);
    result.setType(type);
    result.setLink(link);
    return result;
  }

  protected JobResult createJobResult(String name, String type, String filename, String mimeType, InputStream data) {
    JobResult result = JobResult.create();
    result.setName(name);
    result.setType(type);
    result.setFilename(filename);
    result.setMimeType(mimeType);
    result.setData(data);
    return result;
  }

  protected void mockJobSync(SyncJobContext context) {
    Logger jobSyncLog = LoggerFactory.getLogger("sapafcsdk/jobsync");
    jobSyncLog.info("periodic sync job triggered");
  }

  protected void mockNotification(NotifyContext context) {
    Logger jobSyncLog = LoggerFactory.getLogger("sapafcsdk/notification");
    for (Notification notification : context.getNotifications()) {
      jobSyncLog.info(
        String.format(
          "{\"name\":\"%s\",\"ID\":\"%s\",\"value\":\"%s\"}",
          notification.getName(),
          notification.getId(),
          notification.getValue()
        )
      );
    }
  }

  protected static List<Locale> getAvailableBundleLocales(String baseName, ClassLoader classLoader) {
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
}
