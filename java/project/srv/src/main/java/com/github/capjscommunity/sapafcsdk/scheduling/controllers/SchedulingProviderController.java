package com.github.capjscommunity.sapafcsdk.scheduling.controllers;

import static com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.providerservice.ProviderService_.*;

import com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.DataTypeCode;
import com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.providerservice.*;
import com.github.capjscommunity.sapafcsdk.scheduling.common.JobSchedulingException;
import com.sap.cds.CdsException;
import com.sap.cds.Result;
import com.sap.cds.ql.CQL;
import com.sap.cds.ql.Insert;
import com.sap.cds.ql.Select;
import com.sap.cds.ql.StructuredType;
import com.sap.cds.reflect.CdsModel;
import com.sap.cds.services.ServiceException;
import com.sap.cds.services.persistence.PersistenceService;
import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.*;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

@Hidden
@RestController
@RequestMapping(value = "/api/job-scheduling/v1", produces = MediaType.APPLICATION_JSON_VALUE)
public class SchedulingProviderController {

  @Autowired
  private ProviderService providerService;

  @Autowired
  private PersistenceService persistenceService;

  @Autowired
  private CdsModel cdsModel;

  @Value("${cds.query.limit.max:1000}")
  private int queryMaxLimit;

  @Tag(name = "Capabilities")
  @GetMapping("/Capabilities")
  public Capabilities capabilities(HttpServletResponse response) {
    return providerService.run(Select.from(CAPABILITIES)).single(Capabilities.class);
  }

  @Tag(name = "Job Definition")
  @GetMapping("/JobDefinition")
  public List<JobDefinition> jobDefinitions(
    @RequestParam(name = "skip", required = false) Integer skip,
    @RequestParam(name = "top", required = false) Integer top,
    @RequestParam(name = "name", required = false) String name,
    @RequestParam(name = "search", required = false) String search,
    HttpServletResponse response
  ) {
    Select<JobDefinition_> query = Select.from(JOB_DEFINITION).orderBy(jd -> jd.name().asc());
    query = applyLimit(query, top, skip);

    if (name != null && !name.isEmpty()) {
      query = query.where(jd -> jd.name().plain("like", "'" + wildcard(name) + "'"));
    }

    if (search != null && !search.isEmpty()) {
      String pattern = "%" + search.toLowerCase() + "%";
      query = query.where(jd ->
        jd
          .name()
          .toLower()
          .plain("like", "'" + pattern + "'")
          .or(
            jd
              .description()
              .toLower()
              .plain("like", "'" + pattern + "'")
              .or(jd.longDescription().toLower().plain("like", "'" + pattern + "'"))
          )
      );
    }

    query = query.inlineCount();
    Result result = providerService.run(query);
    response.setHeader("x-total-count", String.valueOf(result.inlineCount()));

    return result.listOf(JobDefinition.class);
  }

  @Tag(name = "Job Definition")
  @GetMapping("/JobDefinition/{name}")
  public JobDefinition jobDefinition(
    @PathVariable(name = "name", required = true) String name,
    HttpServletResponse response
  ) {
    Select<JobDefinition_> query = Select.from(JOB_DEFINITION).byId(name);
    Optional<JobDefinition> jobDefinition = providerService.run(query).first(JobDefinition.class);
    if (jobDefinition.isPresent()) {
      return jobDefinition.get();
    }
    response.setStatus(HttpStatus.NOT_FOUND.value());
    return null;
  }

  @Hidden
  @GetMapping("/JobDefinitionText")
  public ResponseEntity<?> jobDefinitionText(
    @RequestParam(name = "skip", required = false) Integer skip,
    @RequestParam(name = "top", required = false) Integer top,
    HttpServletRequest request
  ) {
    return ResponseHandler.execute(
      () -> {
        throw JobSchedulingException.accessOnlyViaParent();
      },
      request,
      HttpStatus.OK
    );
  }

  @Hidden
  @GetMapping("/JobDefinitionText/{name}")
  public ResponseEntity<?> jobDefinitionText(
    @PathVariable(name = "name", required = true) String name,
    HttpServletRequest request
  ) {
    return ResponseHandler.execute(
      () -> {
        throw JobSchedulingException.accessOnlyViaParent();
      },
      request,
      HttpStatus.OK
    );
  }

  @Tag(name = "Job Definition")
  @GetMapping("/JobDefinition/{name}/texts")
  public List<JobDefinitionText> jobDefinitionTexts(
    @PathVariable(name = "name", required = true) String name,
    @RequestParam(name = "skip", required = false) Integer skip,
    @RequestParam(name = "top", required = false) Integer top,
    HttpServletResponse response
  ) {
    Select<JobDefinition_> existsQuery = Select.from(JOB_DEFINITION).byId(name);
    Optional<JobDefinition> jobDefinition = providerService.run(existsQuery).first(JobDefinition.class);
    if (jobDefinition.isEmpty()) {
      response.setStatus(HttpStatus.NOT_FOUND.value());
      return null;
    }

    Select<JobDefinitionText_> query = Select.from(JOB_DEFINITION_TEXT)
      .where(jdt -> jdt.name().eq(name))
      .orderBy(jdt -> jdt.name().asc(), jdt -> jdt.name().asc());
    query = applyLimit(query, top, skip);

    query = query.inlineCount();
    Result result = providerService.run(query);
    response.setHeader("x-total-count", String.valueOf(result.inlineCount()));

    return result.listOf(JobDefinitionText.class);
  }

  @Hidden
  @GetMapping("/JobParameterDefinition")
  public ResponseEntity<?> jobParameterDefinition(
    @RequestParam(name = "skip", required = false) Integer skip,
    @RequestParam(name = "top", required = false) Integer top,
    HttpServletRequest request
  ) {
    return ResponseHandler.execute(
      () -> {
        throw JobSchedulingException.accessOnlyViaParent();
      },
      request,
      HttpStatus.OK
    );
  }

  @Hidden
  @GetMapping("/JobParameterDefinition/{name}")
  public ResponseEntity<?> jobParameterDefinition(
    @PathVariable(name = "name", required = true) String name,
    HttpServletRequest request
  ) {
    return ResponseHandler.execute(
      () -> {
        throw JobSchedulingException.accessOnlyViaParent();
      },
      request,
      HttpStatus.OK
    );
  }

  @Tag(name = "Job Definition")
  @GetMapping("/JobDefinition/{name}/parameters")
  public List<JobParameterDefinition> jobDefinitionParameters(
    @PathVariable(name = "name", required = true) String name,
    @RequestParam(name = "skip", required = false) Integer skip,
    @RequestParam(name = "top", required = false) Integer top,
    HttpServletResponse response
  ) {
    Select<JobDefinition_> existsQuery = Select.from(JOB_DEFINITION).byId(name);
    Optional<JobDefinition> jobDefinition = providerService.run(existsQuery).first(JobDefinition.class);
    if (jobDefinition.isEmpty()) {
      response.setStatus(HttpStatus.NOT_FOUND.value());
      return null;
    }

    Select<JobParameterDefinition_> query = Select.from(JOB_PARAMETER_DEFINITION)
      .where(jpd -> jpd.jobName().eq(name))
      .orderBy(jpd -> jpd.jobName().asc(), jpd -> jpd.name().asc());
    query = applyLimit(query, top, skip);

    query = query.inlineCount();
    Result result = providerService.run(query);
    response.setHeader("x-total-count", String.valueOf(result.inlineCount()));

    List<JobParameterDefinition> parameters = result.listOf(JobParameterDefinition.class);

    for (JobParameterDefinition parameter : parameters) {
      if (parameter.getValue() != null) {
        if (Objects.equals(parameter.getDataType(), DataTypeCode._BOOLEAN)) {
          parameter.put("value", Objects.equals(parameter.getValue(), "true"));
        } else if (Objects.equals(parameter.getDataType(), DataTypeCode.NUMBER)) {
          parameter.put("value", Float.parseFloat(parameter.getValue()));
        }
      }
      if (parameter.getEnumValues() != null) {
        Collection<Object> enumValues = new ArrayList<>();
        for (String value : parameter.getEnumValues()) {
          if (Objects.equals(parameter.getDataType(), DataTypeCode._BOOLEAN)) {
            enumValues.add(Objects.equals(value, "true"));
          } else if (Objects.equals(parameter.getDataType(), DataTypeCode.NUMBER)) {
            enumValues.add(Float.parseFloat(value));
          } else {
            enumValues.add(value);
          }
        }
        parameter.put("enumValues", enumValues);
      }
    }
    return parameters;
  }

  @Tag(name = "Job")
  @GetMapping("/Job")
  public List<Job> jobs(
    @RequestParam(name = "skip", required = false) Integer skip,
    @RequestParam(name = "top", required = false) Integer top,
    @RequestParam(name = "name", required = false) String name,
    @RequestParam(name = "referenceID", required = false) String referenceID,
    HttpServletResponse response
  ) {
    Select<Job_> query = Select.from(JOB).orderBy(j -> j.name().asc());
    query = applyLimit(query, top, skip);

    if (name != null && !name.isEmpty()) {
      query = query.where(j -> j.name().eq(name));
    }

    if (referenceID != null && !referenceID.isEmpty()) {
      query = query.where(j -> j.referenceID().eq(referenceID));
    }

    query = query.inlineCount();
    Result result = providerService.run(query);
    response.setHeader("x-total-count", String.valueOf(result.inlineCount()));

    return providerService.run(query).listOf(Job.class);
  }

  @Tag(name = "Job")
  @GetMapping("/Job/{ID}")
  public Job job(@PathVariable(name = "ID", required = true) String ID, HttpServletResponse response) {
    Select<Job_> query = Select.from(JOB).byId(ID);
    Optional<Job> job = providerService.run(query).first(Job.class);
    if (job.isPresent()) {
      return job.get();
    }
    response.setStatus(HttpStatus.NOT_FOUND.value());
    return null;
  }

  @Hidden
  @GetMapping("/JobParameter")
  public ResponseEntity<?> jobParameter(
    @RequestParam(name = "skip", required = false) Integer skip,
    @RequestParam(name = "top", required = false) Integer top,
    HttpServletRequest request
  ) {
    return ResponseHandler.execute(
      () -> {
        throw JobSchedulingException.accessOnlyViaParent();
      },
      request,
      HttpStatus.OK
    );
  }

  @Hidden
  @GetMapping("/JobParameter/{ID}")
  public ResponseEntity<?> jobParameter(
    @PathVariable(name = "ID", required = true) String name,
    HttpServletRequest request
  ) {
    return ResponseHandler.execute(
      () -> {
        throw JobSchedulingException.accessOnlyViaParent();
      },
      request,
      HttpStatus.OK
    );
  }

  @Tag(name = "Job")
  @GetMapping("/Job/{ID}/parameters")
  public List<JobParameter> jobParameters(
    @PathVariable(name = "ID", required = true) String ID,
    @RequestParam(name = "skip", required = false) Integer skip,
    @RequestParam(name = "top", required = false) Integer top,
    HttpServletResponse response
  ) {
    Select<Job_> existsQuery = Select.from(JOB).byId(ID);
    Optional<Job> job = providerService.run(existsQuery).first(Job.class);
    if (job.isEmpty()) {
      response.setStatus(HttpStatus.NOT_FOUND.value());
      return null;
    }

    Select<JobParameter_> query = Select.from(JOB_PARAMETER)
      .where(jp -> jp.jobID().eq(ID))
      .orderBy(jd -> jd.jobID().asc(), jd -> jd.name().asc());
    query = applyLimit(query, top, skip);

    query = query.inlineCount();
    Result result = providerService.run(query);
    response.setHeader("x-total-count", String.valueOf(result.inlineCount()));

    List<JobParameter> parameters = result.listOf(JobParameter.class);

    Select<JobParameterDefinition_> jpdQuery = Select.from(JOB_PARAMETER_DEFINITION).where(jpd ->
      jpd.jobName().eq(job.get().getName())
    );
    Stream<JobParameterDefinition> jpds = providerService.run(jpdQuery).streamOf(JobParameterDefinition.class);

    Map<String, JobParameterDefinition> jpsMap = jpds.collect(
      Collectors.toMap(JobParameterDefinition::getName, Function.identity())
    );

    for (JobParameter parameter : parameters) {
      if (parameter.getValue() != null) {
        JobParameterDefinition jpElement = jpsMap.get(parameter.getName());
        if (Objects.equals(jpElement.getDataType(), DataTypeCode._BOOLEAN)) {
          parameter.put("value", Objects.equals(parameter.getValue(), "true"));
        } else if (Objects.equals(jpElement.getDataType(), DataTypeCode.NUMBER)) {
          parameter.put("value", Float.parseFloat(parameter.getValue()));
        }
      }
    }
    return parameters;
  }

  @Tag(name = "Job")
  @GetMapping("/Job/{ID}/results")
  public List<JobParameter> jobResults(
    @PathVariable(name = "ID", required = true) String ID,
    @RequestParam(name = "skip", required = false) Integer skip,
    @RequestParam(name = "top", required = false) Integer top,
    HttpServletResponse response
  ) {
    Select<Job_> existsQuery = Select.from(JOB).byId(ID);
    Optional<Job> job = providerService.run(existsQuery).first(Job.class);
    if (job.isEmpty()) {
      response.setStatus(HttpStatus.NOT_FOUND.value());
      return null;
    }

    Select<JobResult_> query = Select.from(JOB_RESULT)
      .where(jobResult -> jobResult.jobID().eq(ID))
      .orderBy(jr -> jr.jobID().asc(), jr -> jr.name().asc());
    query = applyLimit(query, top, skip);

    query = query.inlineCount();
    Result result = providerService.run(query);
    response.setHeader("x-total-count", String.valueOf(result.inlineCount()));

    return result.listOf(JobParameter.class);
  }

  @Hidden
  @GetMapping("/JobResult")
  public ResponseEntity<?> jobResult(
    @RequestParam(name = "skip", required = false) Integer skip,
    @RequestParam(name = "top", required = false) Integer top,
    HttpServletRequest request
  ) {
    return ResponseHandler.execute(
      () -> {
        throw JobSchedulingException.accessOnlyByKey();
      },
      request,
      HttpStatus.OK
    );
  }

  @Tag(name = "Job Result")
  @GetMapping("/JobResult/{ID}")
  public JobResult jobResult(@PathVariable(name = "ID", required = true) String ID, HttpServletResponse response) {
    Select<JobResult_> query = Select.from(JOB_RESULT).byId(ID);
    Optional<JobResult> jobResult = providerService.run(query).first(JobResult.class);
    if (jobResult.isPresent()) {
      return jobResult.get();
    }
    response.setStatus(HttpStatus.NOT_FOUND.value());
    return null;
  }

  @Hidden
  @GetMapping("/JobResultMessage")
  public ResponseEntity<?> jobResultMessage(
    @RequestParam(name = "skip", required = false) Integer skip,
    @RequestParam(name = "top", required = false) Integer top,
    HttpServletRequest request
  ) {
    return ResponseHandler.execute(
      () -> {
        throw JobSchedulingException.accessOnlyViaParent();
      },
      request,
      HttpStatus.OK
    );
  }

  @Hidden
  @GetMapping("/JobResultMessage/{ID}")
  public ResponseEntity<?> jobResultMessage(
    @PathVariable(name = "ID", required = true) String name,
    HttpServletRequest request
  ) {
    return ResponseHandler.execute(
      () -> {
        throw JobSchedulingException.accessOnlyViaParent();
      },
      request,
      HttpStatus.OK
    );
  }

  @Tag(name = "Job Result")
  @GetMapping("/JobResult/{ID}/messages")
  public List<JobResultMessage> jobResultMessages(
    @PathVariable(name = "ID", required = true) String ID,
    @RequestParam(name = "skip", required = false) Integer skip,
    @RequestParam(name = "top", required = false) Integer top,
    HttpServletResponse response
  ) {
    Select<JobResult_> existsQuery = Select.from(JOB_RESULT).byId(ID);
    Optional<JobResult> jobResult = providerService.run(existsQuery).first(JobResult.class);
    if (jobResult.isEmpty()) {
      response.setStatus(HttpStatus.NOT_FOUND.value());
      return null;
    }

    Select<JobResultMessage_> query = Select.from(JOB_RESULT_MESSAGE)
      .where(jrm -> jrm.resultID().eq(ID))
      .orderBy(jrm -> jrm.resultID().asc(), jrm -> jrm.code().asc());
    query = applyLimit(query, top, skip);

    query = query.inlineCount();
    Result result = providerService.run(query);
    response.setHeader("x-total-count", String.valueOf(result.inlineCount()));

    return result.listOf(JobResultMessage.class);
  }

  @Tag(name = "Job Result")
  @GetMapping("/JobResult/{ID}/data")
  public StreamingResponseBody jobResultData(
    @PathVariable(name = "ID", required = true) String ID,
    HttpServletResponse response
  ) {
    Select<com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.JobResult_> query = Select.from(
      com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.Scheduling_.JOB_RESULT
    ).byId(ID);
    Optional<com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.JobResult> _jobResult = persistenceService
      .run(query)
      .first(com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.JobResult.class);
    if (_jobResult.isEmpty()) {
      response.setStatus(HttpStatus.NOT_FOUND.value());
      return null;
    }
    com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.JobResult jobResult = _jobResult.get();
    String dispositionType = cdsModel
      .getEntity(com.github.capjscommunity.sapafcsdk.model.sapafcsdk.scheduling.JobResult_.CDS_NAME)
      .getElement("data")
      .getAnnotationValue("@Core.ContentDisposition.Type", "attachment");
    response.setContentType(jobResult.getMimeType());
    response.setHeader("Content-Disposition", dispositionType + "; filename=\"" + jobResult.getFilename() + "\"");
    return outputStream -> {
      jobResult.getData().transferTo(outputStream);
    };
  }

  @Tag(name = "Job")
  @PostMapping("/Job")
  public ResponseEntity<?> createJob(@RequestBody Job job, HttpServletRequest request) {
    return ResponseHandler.execute(
      () -> {
        Insert insert = Insert.into(JOB).entry(job);
        return providerService.run(insert).single(Job.class);
      },
      request,
      HttpStatus.CREATED
    );
  }

  @Tag(name = "Job")
  @PostMapping("/Job/{ID}/cancel")
  public ResponseEntity<?> cancelJob(@PathVariable(name = "ID") String ID, HttpServletRequest request) {
    return ResponseHandler.execute(
      () -> {
        Job_ jobRef = CQL.entity(Job_.class).filter(j -> j.ID().eq(ID));
        providerService.cancel(jobRef);
        return ResponseEntity.noContent().build();
      },
      request,
      HttpStatus.NO_CONTENT
    );
  }

  @Tag(name = "Notification")
  @PostMapping("notify")
  public ResponseEntity<?> notify(@RequestBody NotifyBody body, HttpServletRequest request) {
    return ResponseHandler.execute(
      () -> {
        List<Notification> notifications = new ArrayList<>();
        for (NotifyNotification notifyNotification : body.notifications) {
          notifications.add(
            Notification.of(
              Map.of(
                "name",
                notifyNotification.name,
                "ID",
                notifyNotification.ID,
                "code",
                notifyNotification.code,
                "value",
                notifyNotification.value
              )
            )
          );
        }
        providerService.notify(notifications);
        return ResponseEntity.noContent().build();
      },
      request,
      HttpStatus.NO_CONTENT
    );
  }

  private <T extends StructuredType<?>> Select<T> applyLimit(Select<T> query, Integer top, Integer skip) {
    int effectiveTop = (top != null) ? top : queryMaxLimit;
    effectiveTop = (effectiveTop <= 0) ? 1 : Math.min(effectiveTop, queryMaxLimit);
    int effectiveSkip = (skip != null) ? skip : 0;
    return query.limit(effectiveTop, effectiveSkip);
  }

  private String wildcard(String value) {
    if (value == null) {
      return null;
    }
    boolean starStart = value.startsWith("*");
    boolean starEnd = value.endsWith("*");
    String token = value.replaceAll("^\\*|\\*$", "");
    return (starStart ? "%" : "") + token + (starEnd ? "%" : "");
  }

  public static class ResponseHandler {

    public static <T> ResponseEntity<?> execute(Supplier<T> action, HttpServletRequest request, HttpStatus okStatus) {
      try {
        T result = action.get();
        return ResponseEntity.status(okStatus).contentType(MediaType.APPLICATION_JSON).body(result);
      } catch (Exception exception) {
        if (exception instanceof JobSchedulingException) {
          return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .contentType(MediaType.APPLICATION_JSON)
            .body(
              Map.of(
                "code",
                ((JobSchedulingException) exception).getCode(),
                "message",
                ((JobSchedulingException) exception).getLocalizedMessage(request.getLocale())
              )
            );
        } else if (exception instanceof CdsException) {
          return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .contentType(MediaType.APPLICATION_JSON)
            .body(Map.of("code", "parserError", "message", exception.getMessage()));
        } else if (exception instanceof ServiceException error) {
          HttpStatus status = Optional.ofNullable(HttpStatus.resolve(error.getErrorStatus().getHttpStatus())).orElse(
            HttpStatus.INTERNAL_SERVER_ERROR
          );
          return ResponseEntity.status(status)
            .contentType(MediaType.APPLICATION_JSON)
            .body(Map.of("code", error.getPlainMessage(), "message", error.getLocalizedMessage(request.getLocale())));
        } else {
          return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .contentType(MediaType.APPLICATION_JSON)
            .body(Map.of("code", "500", "message", exception.getMessage()));
        }
      }
    }
  }

  public static class NotifyBody {

    public List<NotifyNotification> notifications;
  }

  public static class NotifyNotification {

    public String name;
    public String ID;
    public String code;
    public String value;
  }
}
