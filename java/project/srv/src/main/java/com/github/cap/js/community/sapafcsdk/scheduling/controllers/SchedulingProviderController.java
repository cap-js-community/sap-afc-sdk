package com.github.cap.js.community.sapafcsdk.scheduling.controllers;

import static cds.gen.schedulingproviderservice.SchedulingProviderService_.*;

import cds.gen.scheduling.DataTypeCode;
import cds.gen.schedulingproviderservice.*;
import com.sap.cds.CdsException;
import com.sap.cds.impl.parser.StructDataParser;
import com.sap.cds.ql.CQL;
import com.sap.cds.ql.Insert;
import com.sap.cds.ql.Select;
import com.sap.cds.ql.StructuredType;
import com.sap.cds.reflect.CdsModel;
import com.sap.cds.services.ServiceException;
import com.sap.cds.services.persistence.PersistenceService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
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

@RestController
@RequestMapping("/api/job-scheduling/v1")
public class SchedulingProviderController {

  @Autowired
  private SchedulingProviderService providerService;

  @Autowired
  private PersistenceService persistenceService;

  @Autowired
  private CdsModel cdsModel;

  @Value("${cds.query.limit.max:1000}")
  private int queryMaxLimit;

  @Tag(name = "Job Definition")
  @GetMapping("/JobDefinition")
  public List<JobDefinition> jobDefinitions(
    @RequestParam(name = "skip", required = false) Integer skip,
    @RequestParam(name = "top", required = false) Integer top,
    @RequestParam(name = "name", required = false) String name,
    @RequestParam(name = "search", required = false) String search
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

    return providerService.run(query).listOf(JobDefinition.class);
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
      .orderBy(jd -> jd.jobName().asc(), jd -> jd.name().asc());
    query = applyLimit(query, top, skip);

    List<JobParameterDefinition> parameters = providerService.run(query).listOf(JobParameterDefinition.class);

    for (JobParameterDefinition parameter : parameters) {
      if (parameter.getValue() != null) {
        if (Objects.equals(parameter.getDataType(), DataTypeCode._BOOLEAN)) {
          parameter.put("value", Objects.equals(parameter.getValue(), "true"));
        } else if (Objects.equals(parameter.getDataType(), DataTypeCode.NUMBER)) {
          parameter.put("value", Float.parseFloat(parameter.getValue()));
        }
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
    @RequestParam(name = "referenceID", required = false) String referenceID
  ) {
    Select<Job_> query = Select.from(JOB).orderBy(j -> j.name().asc());
    query = applyLimit(query, top, skip);

    if (name != null && !name.isEmpty()) {
      query = query.where(j -> j.name().eq(name));
    }

    if (referenceID != null && !referenceID.isEmpty()) {
      query = query.where(j -> j.referenceID().eq(referenceID));
    }

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
    List<JobParameter> parameters = providerService.run(query).listOf(JobParameter.class);

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

    return providerService.run(query).listOf(JobParameter.class);
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

    return providerService.run(query).listOf(JobResultMessage.class);
  }

  @Tag(name = "Job Result")
  @GetMapping("/JobResult/{ID}/data")
  public StreamingResponseBody jobResultData(
    @PathVariable(name = "ID", required = true) String ID,
    HttpServletResponse response
  ) {
    Select<cds.gen.scheduling.JobResult_> query = Select.from(cds.gen.scheduling.Scheduling_.JOB_RESULT).byId(ID);
    Optional<cds.gen.scheduling.JobResult> _jobResult = persistenceService
      .run(query)
      .first(cds.gen.scheduling.JobResult.class);
    if (_jobResult.isEmpty()) {
      response.setStatus(HttpStatus.NOT_FOUND.value());
      return null;
    }
    cds.gen.scheduling.JobResult jobResult = _jobResult.get();
    String dispositionType = cdsModel
      .getEntity(cds.gen.scheduling.JobResult_.CDS_NAME)
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
  public ResponseEntity<?> createJob(
    @RequestBody String body,
    HttpServletRequest request,
    HttpServletResponse response
  ) {
    return ResponseHandler.execute(
      () -> {
        StructDataParser parser = StructDataParser.create(cdsModel.getEntity(Job_.CDS_NAME));
        Map<String, Object> data = parser.parseObject(body);
        Job job = Job.of(data);
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
        if (exception instanceof CdsException) {
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
}
