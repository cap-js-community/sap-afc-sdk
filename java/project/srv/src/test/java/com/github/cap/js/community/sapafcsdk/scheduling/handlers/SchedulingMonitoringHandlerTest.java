package com.github.cap.js.community.sapafcsdk.scheduling.handlers;

import static com.github.cap.js.community.sapafcsdk.model.scheduling.Scheduling_.JOB;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.github.cap.js.community.sapafcsdk.model.scheduling.Job;
import com.github.cap.js.community.sapafcsdk.model.scheduling.JobStatusCode;
import com.github.cap.js.community.sapafcsdk.test.OutboxTestConfig;
import com.sap.cds.Result;
import com.sap.cds.ql.Delete;
import com.sap.cds.ql.Insert;
import com.sap.cds.services.messages.LocalizedMessageProvider;
import com.sap.cds.services.persistence.PersistenceService;
import java.util.Locale;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;

@AutoConfigureMockMvc
@SpringBootTest
@ContextConfiguration(classes = OutboxTestConfig.class)
public class SchedulingMonitoringHandlerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private LocalizedMessageProvider messageProvider;

  @Autowired
  private PersistenceService persistenceService;

  @Test
  @WithMockUser("authenticated")
  void getMetadata() throws Exception {
    mockMvc
      .perform(get("/odata/v4/job-scheduling/monitoring/$metadata"))
      .andExpect(status().isOk())
      .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_XML));
  }

  @Test
  @WithMockUser("authenticated")
  void getJobDefinitions() throws Exception {
    mockMvc
      .perform(get("/odata/v4/job-scheduling/monitoring/JobDefinition?$expand=parameters"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.value.[0].name").value("JOB_1"))
      .andExpect(jsonPath("$.value.[0].parameters.[0].name").value("A"));
    mockMvc
      .perform(get("/odata/v4/job-scheduling/monitoring/JobDefinition/JOB_1?$expand=parameters"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.name").value("JOB_1"))
      .andExpect(jsonPath("$.parameters.[0].name").value("A"));
    mockMvc
      .perform(get("/odata/v4/job-scheduling/monitoring/JobDefinition('JOB_1')?$expand=parameters"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.name").value("JOB_1"))
      .andExpect(jsonPath("$.parameters.[0].name").value("A"));
  }

  @Test
  @WithMockUser("authenticated")
  void getJobs() throws Exception {
    mockMvc
      .perform(get("/odata/v4/job-scheduling/monitoring/Job?$expand=parameters"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.value.[0].definition_name").value("JOB_1"))
      .andExpect(
        jsonPath("$.value.[0].link").value(
          "http://localhost:8080/launchpad.html#Job-monitor&/Job(3a89dfec-59f9-4a91-90fe-3c7ca7407103)"
        )
      )
      .andExpect(jsonPath("$.value.[0].parameters.[0].definition_name").value("A"));
    mockMvc
      .perform(get("/odata/v4/job-scheduling/monitoring/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407103?$expand=parameters"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.definition_name").value("JOB_1"))
      .andExpect(jsonPath("$.parameters.[0].definition_name").value("A"));
  }

  @Test
  @WithMockUser("authenticated")
  void getUiFlow() throws Exception {
    mockMvc
      .perform(
        get(
          "/odata/v4/job-scheduling/monitoring/Job?$count=true&$orderby=createdAt desc&$select=ID,createdAt,criticality,definition_name,modifiedAt,referenceID,status_code,testRun,version&$expand=definition($select=description,name),status($select=code,name)&$skip=0&$top=30"
        )
      )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.value", not(empty())))
      .andExpect(jsonPath("$.value[0].definition_name", notNullValue()));

    mockMvc
      .perform(
        get(
          "/odata/v4/job-scheduling/monitoring/Job(5a89dfec-59f9-4a91-90fe-3c7ca7407103)?$select=ID,createdAt,createdBy,definition_name,link,modifiedAt,modifiedBy,referenceID,status_code,testRun,version&$expand=definition($select=description,longDescription,name,supportsStartDateTime,supportsTestRun),status($select=code,name)"
        )
      )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.ID").value("5a89dfec-59f9-4a91-90fe-3c7ca7407103"))
      .andExpect(jsonPath("$.definition_name", notNullValue()));

    mockMvc
      .perform(
        get(
          "/odata/v4/job-scheduling/monitoring/Job(5a89dfec-59f9-4a91-90fe-3c7ca7407103)/results?$count=true&$orderby=name&$select=ID,filename,link,mimeType,name,type_code&$expand=type($select=code,name)&$skip=0&$top=10"
        )
      )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.value[0].ID", not(empty())));

    mockMvc
      .perform(
        get(
          "/odata/v4/job-scheduling/monitoring/Job(5a89dfec-59f9-4a91-90fe-3c7ca7407103)/parameters?$count=true&$orderby=definition_name&$select=ID,definition_name,value&$expand=definition($select=dataType_code,job_name,mappingType_code,name,type_code;$expand=dataType($select=code,name),mappingType($select=code,name),type($select=code,name))&$skip=0&$top=10"
        )
      )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.value[0].definition_name", not(empty())));

    mockMvc
      .perform(
        get(
          "/odata/v4/job-scheduling/monitoring/Job(5a89dfec-59f9-4a91-90fe-3c7ca7407103)/results(c2eb590f-9505-4fd6-a5e2-511a1b2ff47f)/messages?$count=true&$orderby=createdAt&$select=ID,code,createdAt,criticality,text&$expand=severity($select=code,name,numericCode)&$skip=0&$top=10"
        )
      )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.value[0].code", not(empty())));

    mockMvc
      .perform(
        get(
          "/odata/v4/job-scheduling/monitoring/Job(5a89dfec-59f9-4a91-90fe-3c7ca7407103)/results(c2eb590f-9505-4fd6-a5e2-511a1b2ff47f)?$select=ID,filename,link,mimeType,name,type_code&$expand=type($select=code,name)"
        )
      )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.ID").value("c2eb590f-9505-4fd6-a5e2-511a1b2ff47f"))
      .andExpect(jsonPath("$.type_code", not(empty())));

    mockMvc
      .perform(
        get(
          "/odata/v4/job-scheduling/monitoring/Job(5a89dfec-59f9-4a91-90fe-3c7ca7407103)/results(c2eb590f-9505-4fd6-a5e2-511a1b2ff47f)/messages?$count=true&$orderby=createdAt&$select=ID,code,createdAt,criticality,text&$expand=severity($select=code,name,numericCode)&$skip=0&$top=10"
        )
      )
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.value[0].code", not(empty())));

    mockMvc
      .perform(get("/odata/v4/job-scheduling/monitoring/JobResult(b2eb590f-9505-4fd6-a5e2-511a1b2ff47f)/data"))
      .andExpect(status().isOk())
      .andExpect(content().string("This is a test"));
  }

  @Test
  @WithMockUser("authenticated")
  void getCodelists() throws Exception {
    mockMvc.perform(get("/odata/v4/job-scheduling/monitoring/JobStatus")).andExpect(status().isOk());
    mockMvc.perform(get("/odata/v4/job-scheduling/monitoring/ResultType")).andExpect(status().isOk());
    mockMvc.perform(get("/odata/v4/job-scheduling/monitoring/ParameterType")).andExpect(status().isOk());
    mockMvc.perform(get("/odata/v4/job-scheduling/monitoring/DataType")).andExpect(status().isOk());
    mockMvc.perform(get("/odata/v4/job-scheduling/monitoring/MappingType")).andExpect(status().isOk());
    mockMvc.perform(get("/odata/v4/job-scheduling/monitoring/MessageSeverity")).andExpect(status().isOk());
  }

  @Test
  @WithMockUser("authenticated")
  void postJobDefinition() throws Exception {
    mockMvc
      .perform(post("/odata/v4/job-scheduling/monitoring/JobDefinition").contentType("application/json").content("{}"))
      .andExpect(status().isMethodNotAllowed())
      .andExpect(
        jsonPath("$.error.message").value("Entity 'SchedulingMonitoringService.JobDefinition' is not insertable")
      );
  }

  @Test
  @WithMockUser("authenticated")
  void putJobDefinition() throws Exception {
    mockMvc
      .perform(
        put("/odata/v4/job-scheduling/monitoring/JobDefinition('JOB_1')").contentType("application/json").content("{}")
      )
      .andExpect(status().isMethodNotAllowed())
      .andExpect(
        jsonPath("$.error.message").value("Entity 'SchedulingMonitoringService.JobDefinition' is not updatable")
      );
  }

  @Test
  @WithMockUser("authenticated")
  void deleteJobDefinition() throws Exception {
    mockMvc
      .perform(delete("/odata/v4/job-scheduling/monitoring/JobDefinition('JOB_1')"))
      .andExpect(status().isMethodNotAllowed())
      .andExpect(
        jsonPath("$.error.message").value("Entity 'SchedulingMonitoringService.JobDefinition' is not deletable")
      );
  }

  @Test
  @WithMockUser("authenticated")
  void postJobParameterDefinition() throws Exception {
    mockMvc
      .perform(
        post("/odata/v4/job-scheduling/monitoring/JobDefinition('JOB_1')/parameters")
          .contentType("application/json")
          .content("{}")
      )
      .andExpect(status().isMethodNotAllowed())
      .andExpect(
        jsonPath("$.error.message").value(
          "Entity 'SchedulingMonitoringService.JobParameterDefinition' is not insertable"
        )
      );
  }

  @Test
  @WithMockUser("authenticated")
  void putJobParameterDefinition() throws Exception {
    mockMvc
      .perform(
        put("/odata/v4/job-scheduling/monitoring/JobDefinition('JOB_1')/parameters(name='A',job_name='JOB_1')")
          .contentType("application/json")
          .content("{}")
      )
      .andExpect(status().isMethodNotAllowed())
      .andExpect(
        jsonPath("$.error.message").value(
          "Entity 'SchedulingMonitoringService.JobParameterDefinition' is not updatable"
        )
      );
  }

  @Test
  @WithMockUser("authenticated")
  void deleteJobParameterDefinition() throws Exception {
    mockMvc
      .perform(
        delete("/odata/v4/job-scheduling/monitoring/JobDefinition('JOB_1')/parameters(name='A',job_name='JOB_1')")
      )
      .andExpect(status().isMethodNotAllowed())
      .andExpect(
        jsonPath("$.error.message").value(
          "Entity 'SchedulingMonitoringService.JobParameterDefinition' is not deletable"
        )
      );
  }

  @Test
  @WithMockUser("authenticated")
  void putJob() throws Exception {
    mockMvc
      .perform(
        put("/odata/v4/job-scheduling/monitoring/Job(3a89dfec-59f9-4a91-90fe-3c7ca7407103)")
          .contentType("application/json")
          .content("{}")
      )
      .andExpect(status().isMethodNotAllowed())
      .andExpect(jsonPath("$.error.message").value("Entity 'SchedulingMonitoringService.Job' is not updatable"));
  }

  @Test
  @WithMockUser("authenticated")
  void deleteJob() throws Exception {
    mockMvc
      .perform(delete("/odata/v4/job-scheduling/monitoring/Job(3a89dfec-59f9-4a91-90fe-3c7ca7407103)"))
      .andExpect(status().isMethodNotAllowed())
      .andExpect(jsonPath("$.error.message").value("Entity 'SchedulingMonitoringService.Job' is not deletable"));
  }

  @Test
  @WithMockUser("authenticated")
  void cancelJob() throws Exception {
    Job job = Job.of(
      Map.of(
        "definition_name",
        "JOB_5",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b327",
        "status_code",
        JobStatusCode.REQUESTED,
        "version",
        "1"
      )
    );
    Result result = persistenceService.run(Insert.into(JOB).entry(job));
    String ID = result.single().as(Job.class).getId();

    mockMvc
      .perform(
        post("/odata/v4/job-scheduling/monitoring/Job(" + ID + ")/SchedulingMonitoringService.cancel")
          .locale(Locale.ENGLISH)
          .contentType("application/json")
          .content("{}")
      )
      .andExpect(status().isOk())
      .andExpect(
        header().string(
          "sap-messages",
          "[{\"code\":\"200\",\"message\":\"" +
          messageProvider.get("cancelJobSuccess", null, Locale.ENGLISH) +
          "\",\"numericSeverity\":1}]"
        )
      )
      .andExpect(jsonPath("$.status_code").value("cancelRequested"));

    mockMvc
      .perform(get("/odata/v4/job-scheduling/monitoring/Job(" + ID + ")"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.status_code").value("canceled"));

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }

  @Test
  @WithMockUser("authenticated")
  void cancelNonExistingJob() throws Exception {
    mockMvc
      .perform(
        post(
          "/odata/v4/job-scheduling/monitoring/Job(1a89dfec-59f9-4a91-90fe-3c7ca7407103)/SchedulingMonitoringService.cancel"
        )
          .locale(Locale.ENGLISH)
          .contentType("application/json")
          .content("{}")
      )
      .andExpect(status().isNotFound())
      .andExpect(
        jsonPath("$.error.message").value(
          messageProvider.get("jobNotFound", new String[] { "1a89dfec-59f9-4a91-90fe-3c7ca7407103" }, Locale.ENGLISH)
        )
      );
  }

  @Test
  @WithMockUser("authenticated")
  void cancelAlreadyRequestedJob() throws Exception {
    Job job = Job.of(
      Map.of(
        "definition_name",
        "JOB_5",
        "referenceID",
        "c1253940-5f25-4a0b-8585-f62bd085b327",
        "status_code",
        JobStatusCode.REQUESTED,
        "version",
        "1"
      )
    );
    Result result = persistenceService.run(Insert.into(JOB).entry(job));
    String ID = result.single().as(Job.class).getId();

    mockMvc
      .perform(
        post("/odata/v4/job-scheduling/monitoring/Job(" + ID + ")/SchedulingMonitoringService.cancel")
          .locale(Locale.ENGLISH)
          .contentType("application/json")
          .content("{}")
      )
      .andExpect(status().isOk());

    mockMvc
      .perform(
        post("/odata/v4/job-scheduling/monitoring/Job(" + ID + ")/SchedulingMonitoringService.cancel")
          .locale(Locale.ENGLISH)
          .contentType("application/json")
          .content("{}")
      )
      .andExpect(status().isBadRequest())
      .andExpect(
        jsonPath("$.error.message").value(
          messageProvider.get("jobCannotBeCanceled", new String[] { "canceled" }, Locale.ENGLISH)
        )
      );

    persistenceService.run(Delete.from(JOB).where(j -> j.ID().eq(ID)));
  }
}
