"use strict";

const cds = require("@sap/cds");

const { authorization, cleanData, clearEventQueue, connectToWS, processOutbox, callBatch } = require("../helper");

const { GET, POST, PUT, DELETE, axios, test } = cds.test(__dirname + "/../..");

process.env.PORT = 0; // Random

describe("Monitoring Service", () => {
  beforeEach(async () => {
    axios.defaults.headers = {
      Authorization: authorization.alice,
    };
    await clearEventQueue();
    await test.data.reset();
  });

  it("Get $metadata", async () => {
    const response = await GET("/odata/v4/job-scheduling/monitoring/$metadata");
    expect(response.data).toMatchSnapshot();
  });

  it("Get Job Definitions", async () => {
    let response = await GET("/odata/v4/job-scheduling/monitoring/JobDefinition?$expand=parameters");
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET("/odata/v4/job-scheduling/monitoring/JobDefinition/JOB_1?$expand=parameters");
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET("/odata/v4/job-scheduling/monitoring/JobDefinition('JOB_1')?$expand=parameters");
    expect(cleanData(response.data)).toMatchSnapshot();
  });

  it("Get Jobs", async () => {
    let response = await GET("/odata/v4/job-scheduling/monitoring/Job?$expand=parameters");
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET(
      "/odata/v4/job-scheduling/monitoring/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407103?$expand=parameters",
    );
    expect(cleanData(response.data)).toMatchSnapshot();
  });

  it("Get UI Flow", async () => {
    let response = await GET(
      "/odata/v4/job-scheduling/monitoring/Job?$count=true&$orderby=createdAt%20desc&$select=ID,createdAt,criticality,definition_name,modifiedAt,referenceID,status_code,testRun,version&$expand=definition($select=description,name),status($select=code,name)&$skip=0&$top=30",
    );
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET(
      "/odata/v4/job-scheduling/monitoring/Job(5a89dfec-59f9-4a91-90fe-3c7ca7407103)?$select=ID,createdAt,createdBy,definition_name,link,modifiedAt,modifiedBy,referenceID,status_code,testRun,version&$expand=definition($select=description,longDescription,name,supportsStartDateTime,supportsTestRun),status($select=code,name)",
    );
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET(
      "/odata/v4/job-scheduling/monitoring/Job(5a89dfec-59f9-4a91-90fe-3c7ca7407103)/results?$count=true&$orderby=name&$select=ID,filename,link,mimeType,name,type_code&$expand=type($select=code,name)&$skip=0&$top=10",
    );
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET(
      "/odata/v4/job-scheduling/monitoring/Job(5a89dfec-59f9-4a91-90fe-3c7ca7407103)/parameters?$count=true&$orderby=definition_name&$select=ID,definition_name,value&$expand=definition($select=dataType_code,job_name,mappingType_code,name,type_code;$expand=dataType($select=code,name),mappingType($select=code,name),type($select=code,name))&$skip=0&$top=10",
    );
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET(
      "/odata/v4/job-scheduling/monitoring/Job(5a89dfec-59f9-4a91-90fe-3c7ca7407103)/results(c2eb590f-9505-4fd6-a5e2-511a1b2ff47f)/messages?$count=true&$orderby=createdAt&$select=ID,code,createdAt,criticality,text&$expand=severity($select=code,name,numericCode)&$skip=0&$top=10",
    );
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET(
      "/odata/v4/job-scheduling/monitoring/Job(5a89dfec-59f9-4a91-90fe-3c7ca7407103)/results(c2eb590f-9505-4fd6-a5e2-511a1b2ff47f)?$select=ID,filename,link,mimeType,name,type_code&$expand=type($select=code,name)",
    );
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET(
      "/odata/v4/job-scheduling/monitoring/Job(5a89dfec-59f9-4a91-90fe-3c7ca7407103)/results(c2eb590f-9505-4fd6-a5e2-511a1b2ff47f)/messages?$count=true&$orderby=createdAt&$select=ID,code,createdAt,criticality,text&$expand=severity($select=code,name,numericCode)&$skip=0&$top=10",
    );
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET("/odata/v4/job-scheduling/monitoring/JobResult(b2eb590f-9505-4fd6-a5e2-511a1b2ff47f)/data");
    expect(cleanData(response.data)).toMatchSnapshot();
  });

  it("Get UI Flow (batch)", async () => {
    const response = await callBatch(POST, "/odata/v4/job-scheduling/monitoring/$batch", [
      {
        method: "GET",
        url: "Job?$count=true&$orderby=createdAt%20desc&$select=ID,createdAt,criticality,definition_name,modifiedAt,referenceID,status_code,testRun,version&$expand=definition($select=description,name),status($select=code,name)&$skip=0&$top=30",
      },
      {
        method: "GET",
        url: "Job(5a89dfec-59f9-4a91-90fe-3c7ca7407103)?$select=ID,createdAt,createdBy,definition_name,link,modifiedAt,modifiedBy,referenceID,status_code,testRun,version&$expand=definition($select=description,longDescription,name,supportsStartDateTime,supportsTestRun),status($select=code,name)",
      },
      {
        method: "GET",
        url: "Job(5a89dfec-59f9-4a91-90fe-3c7ca7407103)/results?$count=true&$orderby=name&$select=ID,filename,link,mimeType,name,type_code&$expand=type($select=code,name)&$skip=0&$top=10",
      },
      {
        method: "GET",
        url: "Job(5a89dfec-59f9-4a91-90fe-3c7ca7407103)/parameters?$count=true&$orderby=definition_name&$select=ID,definition_name,value&$expand=definition($select=dataType_code,job_name,mappingType_code,name,type_code;$expand=dataType($select=code,name),mappingType($select=code,name),type($select=code,name))&$skip=0&$top=10",
      },
      {
        method: "GET",
        url: "Job(5a89dfec-59f9-4a91-90fe-3c7ca7407103)/results(c2eb590f-9505-4fd6-a5e2-511a1b2ff47f)/messages?$count=true&$orderby=createdAt&$select=ID,code,createdAt,criticality,text&$expand=severity($select=code,name,numericCode)&$skip=0&$top=10",
      },
      {
        method: "GET",
        url: "Job(5a89dfec-59f9-4a91-90fe-3c7ca7407103)/results(c2eb590f-9505-4fd6-a5e2-511a1b2ff47f)?$select=ID,filename,link,mimeType,name,type_code&$expand=type($select=code,name)",
      },
      {
        method: "GET",
        url: "Job(5a89dfec-59f9-4a91-90fe-3c7ca7407103)/results(c2eb590f-9505-4fd6-a5e2-511a1b2ff47f)/messages?$count=true&$orderby=createdAt&$select=ID,code,createdAt,criticality,text&$expand=severity($select=code,name,numericCode)&$skip=0&$top=10",
      },
      {
        method: "GET",
        url: "JobResult(b2eb590f-9505-4fd6-a5e2-511a1b2ff47f)/data",
        headers: ["Accept: text/plain"],
      },
    ]);
    expect(cleanData(response.data)).toMatchSnapshot();
  });

  it("Cancel Job", async () => {
    const ID = "3a89dfec-59f9-4a91-90fe-3c7ca7407103";
    const ws = await connectToWS("job-scheduling", ID);

    let response = await POST(`/odata/v4/job-scheduling/monitoring/Job(${ID})/cancel`, {});
    expect(response.headers["sap-messages"]).toBe(
      `[{"code":"cancelJobSuccess","message":"Job was canceled.","numericSeverity":1}]`,
    );
    expect(response.status).toBe(200);
    expect(response.data.status_code).toBe("cancelRequested");

    let message = ws.message("jobStatusChanged");
    await processOutbox("SchedulingWebsocketService.jobStatusChanged");
    let event = await message;
    expect(event.IDs).toEqual([ID]);
    expect(event.status).toBe("cancelRequested");

    message = ws.message("jobStatusChanged");
    await processOutbox("SchedulingProcessingService");
    await processOutbox("SchedulingWebsocketService.jobStatusChanged");
    event = await message;
    expect(event.IDs).toEqual([ID]);
    expect(event.status).toBe("canceled");

    response = await GET(`/odata/v4/job-scheduling/monitoring/Job/${ID}`);
    expect(response.data.status_code).toBe("canceled");

    ws.close();
  });

  it("Get Codelists", async () => {
    let response = await GET("/odata/v4/job-scheduling/monitoring/JobStatus");
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET("/odata/v4/job-scheduling/monitoring/ResultType");
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET("/odata/v4/job-scheduling/monitoring/ParameterType");
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET("/odata/v4/job-scheduling/monitoring/DataType");
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET("/odata/v4/job-scheduling/monitoring/MappingType");
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET("/odata/v4/job-scheduling/monitoring/MessageSeverity");
    expect(cleanData(response.data)).toMatchSnapshot();
  });

  describe("Error Situations", () => {
    it("POST Job Definitions", async () => {
      await expect(POST("/odata/v4/job-scheduling/monitoring/JobDefinition", {})).rejects.toThrowCDSError(
        405,
        "ENTITY_IS_READ_ONLY",
        `Entity "SchedulingMonitoringService.JobDefinition" is read-only`,
      );
    });

    it("PUT Job Definitions", async () => {
      await expect(PUT("/odata/v4/job-scheduling/monitoring/JobDefinition('JOB_1')", {})).rejects.toThrowCDSError(
        405,
        "ENTITY_IS_READ_ONLY",
        `Entity "SchedulingMonitoringService.JobDefinition" is read-only`,
      );
    });

    it("DELETE Job Definitions", async () => {
      await expect(DELETE("/odata/v4/job-scheduling/monitoring/JobDefinition('JOB_1')")).rejects.toThrowCDSError(
        405,
        "ENTITY_IS_READ_ONLY",
        `Entity "SchedulingMonitoringService.JobDefinition" is read-only`,
      );
    });

    it("POST Job Parameter Definitions", async () => {
      await expect(
        POST("/odata/v4/job-scheduling/monitoring/JobDefinition('JOB_1')/parameters", {}),
      ).rejects.toThrowCDSError(
        405,
        "ENTITY_IS_READ_ONLY",
        `Entity "SchedulingMonitoringService.JobParameterDefinition" is read-only`,
      );
    });

    it("PUT Job Job Parameter Definitions", async () => {
      await expect(
        PUT("/odata/v4/job-scheduling/monitoring/JobDefinition('JOB_1')/parameters(name='A',job_name='JOB_1')", {}),
      ).rejects.toThrowCDSError(
        405,
        "ENTITY_IS_READ_ONLY",
        `Entity "SchedulingMonitoringService.JobParameterDefinition" is read-only`,
      );
    });

    it("DELETE Job Job Parameter Definitions", async () => {
      await expect(
        DELETE("/odata/v4/job-scheduling/monitoring/JobDefinition/JOB_1/parameters(name='A',job_name='JOB_1')", {}),
      ).rejects.toThrowCDSError(
        405,
        "ENTITY_IS_READ_ONLY",
        `Entity "SchedulingMonitoringService.JobParameterDefinition" is read-only`,
      );
    });

    it("PUT Job", async () => {
      await expect(
        PUT("/odata/v4/job-scheduling/monitoring/Job(3a89dfec-59f9-4a91-90fe-3c7ca7407103)", {}),
      ).rejects.toThrowCDSError(405, "ENTITY_IS_READ_ONLY", `Entity "SchedulingMonitoringService.Job" is read-only`);
    });

    it("DELETE Job", async () => {
      await expect(
        DELETE("/odata/v4/job-scheduling/monitoring/Job(3a89dfec-59f9-4a91-90fe-3c7ca7407103)", {}),
      ).rejects.toThrowCDSError(405, "ENTITY_IS_READ_ONLY", `Entity "SchedulingMonitoringService.Job" is read-only`);
    });

    it("Cancel Job", async () => {
      await expect(POST(`/odata/v4/job-scheduling/monitoring/Job/XXX/cancel`, {})).rejects.toThrowAPIError(
        404,
        "jobNotFound",
        ["XXX"],
      );

      const ID = "3a89dfec-59f9-4a91-90fe-3c7ca7407103";
      await POST(`/odata/v4/job-scheduling/monitoring/Job/${ID}/cancel`, {});

      await expect(POST(`/odata/v4/job-scheduling/monitoring/Job/${ID}/cancel`, {})).rejects.toThrowAPIError(
        400,
        "jobCannotBeCanceled",
        ["cancelRequested"],
      );

      const providerService = await cds.connect.to("SchedulingProviderService");
      providerService.before("cancel", async (req) => {
        throw new Error("Unexpected error");
      });

      await expect(
        POST(`/odata/v4/job-scheduling/monitoring/Job/${ID}/cancel`, {}),
      ).rejects.toThrowAPIUnexpectedError();
    });
  });
});
