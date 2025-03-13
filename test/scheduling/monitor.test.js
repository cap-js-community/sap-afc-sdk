"use strict";

const cds = require("@sap/cds");

const { authorization, cleanData, clearEventQueue, connectToWS, processOutbox } = require("../helper");

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
    response = await GET(
      "/scheduling.monitoring.job/webapp/odata/v4/job-scheduling/monitoring/JobDefinition?$expand=parameters",
    );
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET(
      "/scheduling.monitoring.job/odata/v4/job-scheduling/monitoring/JobDefinition?$expand=parameters",
    );
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

  it("Cancel Job", async () => {
    const ID = "3a89dfec-59f9-4a91-90fe-3c7ca7407103";
    const ws = await connectToWS("job-scheduling", ID);

    let response = await POST(`/odata/v4/job-scheduling/monitoring/Job('${ID}')/cancel`, {});
    expect(response.headers["sap-messages"]).toBe(`[{"code":"200","message":"Job was canceled.","numericSeverity":1}]`);
    expect(response.status).toBe(200);
    expect(response.data.status_code).toBe("cancelRequested");

    let message = ws.message("jobStatusChanged");
    await processOutbox("SchedulingWebsocketService");
    let event = await message;
    expect(event.ID).toBe(ID);
    expect(event.status).toBe("cancelRequested");

    message = ws.message("jobStatusChanged");
    await processOutbox();
    event = await message;
    expect(event.ID).toBe(ID);
    expect(event.status).toBe("canceled");

    response = await GET(`/odata/v4/job-scheduling/monitoring/Job/${ID}`);
    expect(response.data.status_code).toBe("canceled");

    ws.close();
  });

  it("Get Codelists", async () => {
    let response = await GET("/odata/v4/job-scheduling/monitoring/JobStatus");
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET("/odata/v4/job-scheduling/monitoring/ParameterType");
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET("/odata/v4/job-scheduling/monitoring/DataType");
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET("/odata/v4/job-scheduling/monitoring/MappingType");
    expect(cleanData(response.data)).toMatchSnapshot();
  });

  describe("Error Situations", () => {
    it("POST Job Definitions", async () => {
      await expect(POST("/odata/v4/job-scheduling/monitoring/JobDefinition", {})).rejects.toThrowAPIError(
        405,
        `Entity "SchedulingMonitoringService.JobDefinition" is read-only`,
      );
    });

    it("PUT Job Definitions", async () => {
      await expect(PUT("/odata/v4/job-scheduling/monitoring/JobDefinition('JOB_1')", {})).rejects.toThrowAPIError(
        405,
        `Entity "SchedulingMonitoringService.JobDefinition" is read-only`,
      );
    });

    it("DELETE Job Definitions", async () => {
      await expect(DELETE("/odata/v4/job-scheduling/monitoring/JobDefinition('JOB_1')")).rejects.toThrowAPIError(
        405,
        `Entity "SchedulingMonitoringService.JobDefinition" is read-only`,
      );
    });

    it("POST Job Parameter Definitions", async () => {
      await expect(
        POST("/odata/v4/job-scheduling/monitoring/JobDefinition('JOB_1')/parameters", {}),
      ).rejects.toThrowAPIError(405, `Entity "SchedulingMonitoringService.JobParameterDefinition" is read-only`);
    });

    it("PUT Job Job Parameter Definitions", async () => {
      await expect(
        PUT("/odata/v4/job-scheduling/monitoring/JobDefinition/('JOB_1')/parameters(name='A',jobName='JOB_1')", {}),
      ).rejects.toThrowAPIError(405, `Entity "SchedulingMonitoringService.JobParameterDefinition" is read-only`);
    });

    it("DELETE Job Job Parameter Definitions", async () => {
      await expect(
        DELETE("/odata/v4/job-scheduling/monitoring/JobDefinition/JOB_1/parameters(name='A',jobName='JOB_1')", {}),
      ).rejects.toThrowAPIError(405, `Entity "SchedulingMonitoringService.JobParameterDefinition" is read-only`);
    });

    it("PUT Job", async () => {
      await expect(
        PUT("/odata/v4/job-scheduling/monitoring/Job('3a89dfec-59f9-4a91-90fe-3c7ca7407103')", {}),
      ).rejects.toThrowAPIError(405, `Entity "SchedulingMonitoringService.Job" is read-only`);
    });

    it("DELETE Job", async () => {
      await expect(
        DELETE("/odata/v4/job-scheduling/monitoring/Job('3a89dfec-59f9-4a91-90fe-3c7ca7407103')", {}),
      ).rejects.toThrowAPIError(405, `Entity "SchedulingMonitoringService.Job" is read-only`);
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
