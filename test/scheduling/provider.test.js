"use strict";

const cds = require("@sap/cds");

const { authorization, cleanData, clearEventQueue, eventQueueEntry, connectToWS, processQueue } = require("../helper");
const { JobStatus, MessageSeverity, ResultType } = require("../../srv/scheduling/common/codelist");

const { GET, POST, PUT, DELETE, axios, test } = cds.test(__dirname + "/../..");

process.env.VCAP_APPLICATION = JSON.stringify({
  uris: ["sap-afc-sdk-srv.sap.com"],
});

cds.env.requires["sap-afc-sdk"].api.csp = true;

process.env.PORT = 0; // Random

describe("Provider Service", () => {
  const log = cds.test.log();

  beforeEach(async () => {
    axios.defaults.headers = {
      Authorization: authorization.alice,
    };
    await clearEventQueue();
    await test.data.reset();
  });

  describe("Open API", () => {
    it("GET API Docs Root", async () => {
      let response = await GET("/api-docs/api/job-scheduling/v1/");
      expect(response.status).toEqual(200);
      expect(response.data).toBeDefined();
      expect(response.data).toMatchSnapshot();
      response = await GET("/api-docs/api/job-scheduling/v1/");
      expect(response.status).toEqual(200);
      expect(response.data).toBeDefined();
      expect(response.data).toMatchSnapshot();
    });

    it("GET API Docs - not auth", async () => {
      cds.env.requires.auth.restrict_all_services = true;
      axios.defaults.headers = {
        Authorization: "",
      };
      await expect(GET("/api-docs/api/job-scheduling/v1/")).rejects.toThrow("Request failed with status code 401");
      cds.env.requires.auth.restrict_all_services = false;
    });

    it("GET API Docs - not found", async () => {
      await expect(GET("/api-docs/api/job-scheduling/v0/")).rejects.toThrow("Request failed with status code 404");
    });
  });

  describe("Security", () => {
    it("GET CSP", async () => {
      let response = await GET("/api/job-scheduling/v1/JobDefinition");
      expect(response.headers["content-security-policy"]).toMatchSnapshot();
      expect(response.headers).toMatchObject({
        "cross-origin-opener-policy": "same-origin",
        "cross-origin-resource-policy": "same-origin",
      });
    });

    it("GET CORS", async () => {
      let response = await GET("/api/job-scheduling/v1/JobDefinition", {
        headers: {
          Origin: "https://example.com",
        },
      });
      expect(response.headers).toMatchObject({
        "access-control-allow-origin": "https://sap-afc-sdk.sap.com",
        vary: "Origin",
      });
    });
  });

  it("GET Capabilities", async () => {
    let response = await GET("/api/job-scheduling/v1/Capabilities");
    expect(cleanData(response.data)).toMatchSnapshot();
    const capabilities = cds.env.requires["sap-afc-sdk"].capabilities;
    cds.env.requires["sap-afc-sdk"].capabilities = null;
    response = await GET("/api/job-scheduling/v1/Capabilities");
    expect(cleanData(response.data)).toMatchSnapshot();
    cds.env.requires["sap-afc-sdk"].ui.link = false;
    response = await GET("/api/job-scheduling/v1/Capabilities");
    expect(cleanData(response.data)).toMatchSnapshot();
    cds.env.requires["sap-afc-sdk"].capabilities = capabilities;
  });

  it("GET Job Definitions", async () => {
    let response = await GET("/api/job-scheduling/v1/JobDefinition");
    expect(response.data).toHaveLength(6);
    for (let i = 0; i < response.data.length; i++) {
      expect(response.data[i].name).toBe(`JOB_${i + 1}`);
    }
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET("/api/job-scheduling/v1/JobDefinition/JOB_1");
    expect(cleanData(response.data)).toMatchSnapshot();

    response = await GET("/api/job-scheduling/v1/JobDefinition?skip=0&top=1");
    expect(response.data).toHaveLength(1);
    expect(response.data[0].name).toBe("JOB_1");
    response = await GET("/api/job-scheduling/v1/JobDefinition?skip=-1&top=-1");
    expect(response.data).toHaveLength(1);
    expect(response.data[0].name).toBe("JOB_1");
    response = await GET("/api/job-scheduling/v1/JobDefinition?skip=1&top=1");
    expect(response.data).toHaveLength(1);
    expect(response.data[0].name).toBe("JOB_2");
    response = await GET("/api/job-scheduling/v1/JobDefinition?skip=-1&top=4");
    expect(response.data).toHaveLength(4);
    expect(response.headers["x-total-count"]).toBe("6");
    response = await GET("/api/job-scheduling/v1/JobDefinition?skip=1");
    expect(response.data).toHaveLength(5);
    for (let i = 0; i < response.data.length; i++) {
      expect(response.data[i].name).toBe(`JOB_${i + 2}`);
    }

    const limitMax = cds.env.query.limit.max;
    cds.env.query.limit.max = 2;
    response = await GET("/api/job-scheduling/v1/JobDefinition");
    expect(response.data).toHaveLength(2);
    cds.env.query.limit.max = limitMax;

    response = await GET("/api/job-scheduling/v1/JobDefinition?$expand=parameters");
    expect(response.data[0].parameters).toBeUndefined();

    response = await GET("/api/job-scheduling/v1/JobDefinition?$filter=name eq 'JOB_1'");
    expect(response.data).toHaveLength(6);
  });

  it("GET Job Definitions (name)", async () => {
    let response = await GET("/api/job-scheduling/v1/JobDefinition?name=JOB_1");
    expect(response.data).toHaveLength(1);
    response = await GET("/api/job-scheduling/v1/JobDefinition?name=JOB_*");
    expect(response.data).toHaveLength(6);
    response = await GET("/api/job-scheduling/v1/JobDefinition?name=*OB_2");
    expect(response.data).toHaveLength(1);
    response = await GET("/api/job-scheduling/v1/JobDefinition?name=*OB*");
    expect(response.data).toHaveLength(6);
    response = await GET("/api/job-scheduling/v1/JobDefinition?name=*O*B*");
    expect(response.data).toHaveLength(0);
    response = await GET("/api/job-scheduling/v1/JobDefinition?name=job_1");
    expect(response.data).toHaveLength(1); // sqlite case-insensitive
  });

  it("GET Job Definitions (search)", async () => {
    let response = await GET("/api/job-scheduling/v1/JobDefinition?search=JOB_1");
    expect(response.data).toHaveLength(1);
    response = await GET("/api/job-scheduling/v1/JobDefinition?search=JoB_");
    expect(response.data).toHaveLength(6);
    response = await GET("/api/job-scheduling/v1/JobDefinition?search=Ob_2");
    expect(response.data).toHaveLength(1);
    response = await GET("/api/job-scheduling/v1/JobDefinition?search=OB");
    expect(response.data).toHaveLength(6);
    response = await GET("/api/job-scheduling/v1/JobDefinition?search=O*B");
    expect(response.data).toHaveLength(0);
    response = await GET("/api/job-scheduling/v1/JobDefinition?search=job_1");
    expect(response.data).toHaveLength(1);

    response = await GET("/api/job-scheduling/v1/JobDefinition?search=Job definition 1");
    expect(response.data).toHaveLength(1);
    response = await GET("/api/job-scheduling/v1/JobDefinition?search=Job def");
    expect(response.data).toHaveLength(6);
    response = await GET("/api/job-scheduling/v1/JobDefinition?search=ob definition 1");
    expect(response.data).toHaveLength(1);
    response = await GET("/api/job-scheduling/v1/JobDefinition?search=ob def");
    expect(response.data).toHaveLength(6);
    response = await GET("/api/job-scheduling/v1/JobDefinition?search=ob*def");
    expect(response.data).toHaveLength(0);
    response = await GET("/api/job-scheduling/v1/JobDefinition?search=job definition 1");
    expect(response.data).toHaveLength(1);
  });

  it("GET Job Definition Parameters", async () => {
    let response = await GET("/api/job-scheduling/v1/JobDefinition/JOB_1/parameters");
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET("/api/job-scheduling/v1/JobDefinition/JOB_1/parameters?top=1");
    expect(response.data).toHaveLength(1);
    expect(response.data[0].name).toBe("A");
    response = await GET("/api/job-scheduling/v1/JobDefinition/JOB_1/parameters?skip=1&top=1");
    expect(response.data).toHaveLength(1);
    expect(response.data[0].name).toBe("B");
    expect(response.headers["x-total-count"]).toBe("5");
    response = await GET("/api/job-scheduling/v1/JobDefinition/JOB_1/parameters?skip=1");
    expect(cleanData(response.data)).toMatchSnapshot();

    const limitMax = cds.env.query.limit.max;
    cds.env.query.limit.max = 2;
    response = await GET("/api/job-scheduling/v1/JobDefinition/JOB_1/parameters");
    expect(response.data).toHaveLength(2);
    cds.env.query.limit.max = limitMax;
  });

  it("GET Job", async () => {
    let response = await GET("/api/job-scheduling/v1/Job");
    expect(response.data).toHaveLength(3);
    for (let i = 0; i < response.data.length; i++) {
      expect(response.data[i].name).toBe(`JOB_${i + 1}`);
    }
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET("/api/job-scheduling/v1/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407103");
    expect(cleanData(response.data)).toMatchSnapshot();

    response = await GET("/api/job-scheduling/v1/Job?skip=0&top=1");
    expect(response.data).toHaveLength(1);
    expect(response.data[0].name).toBe("JOB_1");
    response = await GET("/api/job-scheduling/v1/Job?skip=-1&top=-1");
    expect(response.data).toHaveLength(1);
    expect(response.data[0].name).toBe("JOB_1");
    response = await GET("/api/job-scheduling/v1/Job?skip=1&top=1");
    expect(response.data).toHaveLength(1);
    expect(response.data[0].name).toBe("JOB_2");
    expect(response.headers["x-total-count"]).toBe("3");
    response = await GET("/api/job-scheduling/v1/Job?skip=-1&top=4");
    expect(response.data).toHaveLength(3);
    response = await GET("/api/job-scheduling/v1/JobDefinition?skip=1");
    expect(response.data).toHaveLength(5);
    for (let i = 0; i < response.data.length; i++) {
      expect(response.data[i].name).toBe(`JOB_${i + 2}`);
    }

    const limitMax = cds.env.query.limit.max;
    cds.env.query.limit.max = 2;
    response = await GET("/api/job-scheduling/v1/Job");
    expect(response.data).toHaveLength(2);
    cds.env.query.limit.max = limitMax;

    response = await GET("/api/job-scheduling/v1/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407103?$expand=parameters");
    expect(response.data.parameters).toBeUndefined();

    response = await GET("/api/job-scheduling/v1/Job?$filter=name eq 'JOB_1'");
    expect(response.data).toHaveLength(3);
  });

  it("GET Job (referencedID)", async () => {
    const response = await GET("/api/job-scheduling/v1/Job?referenceID=8158cbab-a42b-4cb9-9656-8db72521d13d");
    expect(response.data).toHaveLength(1);
    expect(response.data[0].name).toBe("JOB_2");
    expect(response.data[0].referenceID).toBe("8158cbab-a42b-4cb9-9656-8db72521d13d");
  });

  it("GET Job (name)", async () => {
    const response = await GET("/api/job-scheduling/v1/Job?name=JOB_2");
    expect(response.data).toHaveLength(1);
    expect(response.data[0].name).toBe("JOB_2");
  });

  it("GET Job Parameters", async () => {
    let response = await GET("/api/job-scheduling/v1/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407103/parameters");
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET("/api/job-scheduling/v1/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407103/parameters?top=1");
    expect(response.data).toHaveLength(1);
    expect(response.data[0].name).toBe("A");
    response = await GET("/api/job-scheduling/v1/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407103/parameters?skip=1&top=1");
    expect(response.data).toHaveLength(1);
    expect(response.data[0].name).toBe("B");
    expect(response.headers["x-total-count"]).toBe("5");
    response = await GET("/api/job-scheduling/v1/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407103/parameters?skip=1");
    expect(cleanData(response.data)).toMatchSnapshot();

    const limitMax = cds.env.query.limit.max;
    cds.env.query.limit.max = 2;
    response = await GET("/api/job-scheduling/v1/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407103/parameters");
    expect(response.data).toHaveLength(2);
    cds.env.query.limit.max = limitMax;
  });

  it("GET Job Results", async () => {
    let response = await GET("/api/job-scheduling/v1/Job/5a89dfec-59f9-4a91-90fe-3c7ca7407103/results");
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET("/api/job-scheduling/v1/Job/5a89dfec-59f9-4a91-90fe-3c7ca7407103/results?top=1");
    expect(response.data).toHaveLength(1);
    expect(response.data[0].type).toBe(ResultType.data);
    response = await GET("/api/job-scheduling/v1/Job/5a89dfec-59f9-4a91-90fe-3c7ca7407103/results?skip=1&top=1");
    expect(response.data).toHaveLength(1);
    expect(response.data[0].type).toBe(ResultType.link);
    expect(response.headers["x-total-count"]).toBe("3");

    response = await GET("/api/job-scheduling/v1/Job/5a89dfec-59f9-4a91-90fe-3c7ca7407103/results?skip=1");
    expect(cleanData(response.data)).toMatchSnapshot();

    const limitMax = cds.env.query.limit.max;
    cds.env.query.limit.max = 2;
    response = await GET("/api/job-scheduling/v1/Job/5a89dfec-59f9-4a91-90fe-3c7ca7407103/results");
    expect(response.data).toHaveLength(2);
    cds.env.query.limit.max = limitMax;
  });

  it("GET Job Result Messages", async () => {
    await expect(GET("/api/job-scheduling/v1/JobResult")).rejects.toThrowAPIError(400, "accessOnlyByKey", []);
    let response = await GET("/api/job-scheduling/v1/JobResult/c2eb590f-9505-4fd6-a5e2-511a1b2ff47f");
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET("/api/job-scheduling/v1/JobResult/c2eb590f-9505-4fd6-a5e2-511a1b2ff47f/messages");
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET("/api/job-scheduling/v1/JobResult/c2eb590f-9505-4fd6-a5e2-511a1b2ff47f/messages?top=1");
    expect(response.data).toHaveLength(1);
    expect(response.data[0].text).toBe("This is an error");
    expect(response.data[0].severity).toBe(MessageSeverity.error);
    expect(response.headers["x-total-count"]).toBe("3");
    response = await GET("/api/job-scheduling/v1/JobResult/c2eb590f-9505-4fd6-a5e2-511a1b2ff47f/messages?skip=1&top=1");
    expect(response.data).toHaveLength(1);
    expect(response.data[0].text).toBe("This is an information");
    expect(response.data[0].severity).toBe(MessageSeverity.info);
    response = await GET(
      "/api/job-scheduling/v1/JobResult/c2eb590f-9505-4fd6-a5e2-511a1b2ff47f/messages?skip=1&top=1",
      {
        headers: {
          "Accept-Language": "de",
        },
      },
    );
    expect(response.data).toHaveLength(1);
    expect(response.data[0].text).toBe("Das ist eine Information");
    expect(response.data[0].severity).toBe(MessageSeverity.info);
    response = await GET("/api/job-scheduling/v1/JobResult/c2eb590f-9505-4fd6-a5e2-511a1b2ff47f/messages?skip=2&top=1");
    expect(response.data).toHaveLength(1);
    expect(response.data[0].text).toBe("This is a warning");
    expect(response.data[0].severity).toBe(MessageSeverity.warning);
    response = await GET(
      "/api/job-scheduling/v1/JobResult/c2eb590f-9505-4fd6-a5e2-511a1b2ff47f/messages?skip=2&top=1",
      {
        headers: {
          "Accept-Language": "de",
        },
      },
    );
    expect(response.data).toHaveLength(1);
    expect(response.data[0].text).toBe("Das ist eine Warnung");
    expect(response.data[0].severity).toBe(MessageSeverity.warning);

    response = await GET("/api/job-scheduling/v1/JobResult/c2eb590f-9505-4fd6-a5e2-511a1b2ff47f/messages?skip=1");
    expect(cleanData(response.data)).toMatchSnapshot();

    const limitMax = cds.env.query.limit.max;
    cds.env.query.limit.max = 2;
    response = await GET("/api/job-scheduling/v1/JobResult/c2eb590f-9505-4fd6-a5e2-511a1b2ff47f/messages");
    expect(response.data).toHaveLength(2);
    cds.env.query.limit.max = limitMax;

    response = await GET("/api/job-scheduling/v1/JobResult/a2eb590f-9505-4fd6-a5e2-511a1b2ff47f/messages");
    expect(response.data).toEqual([]);
    response = await GET("/api/job-scheduling/v1/JobResult/c2eb590f-9505-4fd6-a5e2-511a1b2ff47f?$expand=messages");
    expect(response.data.messages).toBeUndefined();
  });

  it("GET Job Result Data", async () => {
    await expect(
      GET("/api/job-scheduling/v1/JobResult/x2eb590f-9505-4fd6-a5e2-511a1b2ff47f/data"),
    ).rejects.toThrowAPIError(404, "jobResultNotFound", ["x2eb590f-9505-4fd6-a5e2-511a1b2ff47f"]);
    const response = await GET("/api/job-scheduling/v1/JobResult/b2eb590f-9505-4fd6-a5e2-511a1b2ff47f/data");
    expect(response.data).toEqual("This is a test");
    expect(response.headers).toMatchObject({
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": 'attachment; filename="test.txt"',
    });
  });

  it("Create Job (basic)", async () => {
    let response = await POST("/api/job-scheduling/v1/Job", {
      name: "JOB_1",
      referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
      parameters: [
        {
          name: "A",
          value: "abc",
        },
        {
          name: "C",
          value: "true",
        },
        {
          name: "E",
          value: null,
        },
      ],
    });
    expect(response.status).toBe(201);
    expect(cleanData({ ...response.data })).toMatchSnapshot();
  });

  it("Create Job (advanced)", async () => {
    let response = await POST("/api/job-scheduling/v1/Job", {
      name: "JOB_2",
      referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
      startDateTime: "2025-01-01T12:00:00Z",
      parameters: [
        {
          name: "A",
          value: "abc",
        },
        {
          name: "C",
          value: "true",
        },
        {
          name: "D",
          value: "32",
        },
        {
          name: "E",
        },
      ],
    });
    expect(response.status).toBe(201);
    expect(cleanData({ ...response.data })).toMatchSnapshot();
    const ID = response.data.ID;
    let entry = await eventQueueEntry("sapafcsdk.scheduling.SchedulingProcessingService");
    expect(entry).toBeDefined();
    expect(entry.startAfter).toBe("2025-01-01T12:00:00.000Z");
    expect(entry.referenceEntityKey).toBe(ID);

    const ws = await connectToWS("job-scheduling", ID);
    let message = ws.message("jobStatusChanged");
    await processQueue("sapafcsdk.scheduling.SchedulingWebsocketService.jobStatusChanged");
    let event = await message;
    expect(event.IDs).toEqual([ID]);
    expect(event.status).toBe("requested");

    entry = await eventQueueEntry("sapafcsdk.scheduling.SchedulingWebsocketService.jobStatusChanged");
    expect(entry).toBeDefined();
    expect(entry.referenceEntityKey).toBe(ID);

    response = await GET(`/api/job-scheduling/v1/Job/${ID}`);
    expect(cleanData(response.data)).toMatchSnapshot();
    expect(response.data.status).toEqual("requested");
    response = await GET(`/api/job-scheduling/v1/Job/${ID}/parameters`);
    expect(cleanData(response.data)).toMatchSnapshot();

    message = ws.message("jobStatusChanged");
    await processQueue("sapafcsdk.scheduling.SchedulingProcessingService");
    await processQueue("sapafcsdk.scheduling.SchedulingWebsocketService.jobStatusChanged");
    event = await message;
    expect(event.IDs).toEqual([ID]);
    expect(event.status).toBe(JobStatus.running);

    response = await GET(`/api/job-scheduling/v1/Job/${ID}`);
    expect(response.data.status).toBe(JobStatus.running);

    ws.close();
  });

  it("Create Job (no parameters)", async () => {
    let response = await POST("/api/job-scheduling/v1/Job", {
      name: "JOB_5",
      referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
    });
    expect(response.status).toBe(201);
    expect(cleanData({ ...response.data })).toMatchSnapshot();
  });

  it("Create Job (JSON data types)", async () => {
    let response = await POST("/api/job-scheduling/v1/Job", {
      name: "JOB_2",
      referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
      startDateTime: "2025-01-01T12:00:00Z",
      parameters: [
        {
          name: "A",
          value: "abcd",
        },
        {
          name: "B",
          value: 23,
        },
        {
          name: "C",
          value: true,
        },
        {
          name: "D",
          value: 32.0,
        },
        {
          name: "E",
        },
      ],
    });
    expect(response.status).toBe(201);
    expect(cleanData({ ...response.data })).toMatchSnapshot();

    let ID = response.data.ID;
    response = await GET(`/api/job-scheduling/v1/Job/${ID}`);
    expect(cleanData(response.data)).toMatchSnapshot();
    expect(response.data.status).toEqual("requested");
    response = await GET(`/api/job-scheduling/v1/Job/${ID}/parameters`);
    expect(cleanData(response.data)).toMatchSnapshot();

    response = await POST("/api/job-scheduling/v1/Job", {
      name: "JOB_2",
      referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
      startDateTime: "2025-01-01T12:00:00Z",
      testRun: false,
      parameters: [
        {
          name: "A",
          value: "abcd",
        },
        {
          name: "C",
          value: true,
        },
        {
          name: "D",
          value: null,
        },
      ],
    });
    expect(response.status).toBe(201);
    ID = response.data.ID;
    response = await GET(`/api/job-scheduling/v1/Job/${ID}/parameters`);
    expect(cleanData({ ...response.data })).toMatchSnapshot();
  });

  it("Create Job (test run)", async () => {
    let response = await POST("/api/job-scheduling/v1/Job", {
      name: "JOB_2",
      referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
      startDateTime: "2025-01-01T12:00:00Z",
      testRun: false,
      parameters: [
        {
          name: "A",
          value: "abcd",
        },
        {
          name: "C",
          value: true,
        },
        {
          name: "D",
          value: 32.0,
        },
        {
          name: "E",
        },
      ],
    });
    expect(response.status).toBe(201);
    expect(cleanData({ ...response.data })).toMatchSnapshot();
    const ID = response.data.ID;
    cds.env.requires["sap-afc-sdk"].mockProcessing = {
      min: 0,
      max: 0,
      default: JobStatus.completed,
    };
    await processQueue("sapafcsdk.scheduling.SchedulingProcessingService");
    cds.env.requires["sap-afc-sdk"].mockProcessing = false;
    const entry = await eventQueueEntry();
    expect(entry).toBeDefined();
    expect(entry.startAfter).toBe("2025-01-01T12:00:00.000Z");
    expect(entry.referenceEntityKey).toBe(ID);
    expect(entry.payload).toMatch(/"testRun":true/);

    await processQueue("sapafcsdk.scheduling.SchedulingProcessingService");

    response = await GET(`/api/job-scheduling/v1/Job/${ID}/results`);
    const resultID1 = response.data[0].ID;
    const resultID2 = response.data[1].ID;
    expect(cleanData(response.data[0])).toMatchSnapshot();
    expect(cleanData(response.data[1])).toMatchSnapshot();
    response = await GET(`/api/job-scheduling/v1/JobResult/${resultID1}/messages`);
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET(`/api/job-scheduling/v1/JobResult/${resultID2}/messages`);
    expect(cleanData(response.data)).toMatchSnapshot();
  });

  it("Create Job (error-only run)", async () => {
    let response = await POST("/api/job-scheduling/v1/Job", {
      name: "JOB_2",
      referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
      errorOnlyRun: false,
      parameters: [
        {
          name: "A",
          value: "abcd",
        },
        {
          name: "C",
          value: true,
        },
        {
          name: "D",
          value: 32.0,
        },
        {
          name: "E",
        },
      ],
    });
    expect(response.status).toBe(201);
    expect(cleanData({ ...response.data })).toMatchSnapshot();
    response = await POST("/api/job-scheduling/v1/Job", {
      name: "JOB_2",
      referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
      errorOnlyRun: true,
      parameters: [
        {
          name: "A",
          value: "abcd",
        },
        {
          name: "C",
          value: true,
        },
        {
          name: "D",
          value: 32.0,
        },
        {
          name: "E",
        },
      ],
    });
    expect(response.status).toBe(201);
    expect(cleanData({ ...response.data })).toMatchSnapshot();
    await expect(
      POST("/api/job-scheduling/v1/Job", {
        name: "JOB_3",
        referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
        errorOnlyRun: false,
        parameters: [
          {
            name: "A",
            value: "xxx",
          },
          {
            name: "C",
            value: true,
          },
        ],
      }),
    ).rejects.toThrowAPIError(400, "errorOnlyRunNotSupported", ["JOB_3"]);
    await expect(
      POST("/api/job-scheduling/v1/Job", {
        name: "JOB_3",
        referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
        errorOnlyRun: true,
        parameters: [
          {
            name: "A",
            value: "xxx",
          },
          {
            name: "C",
            value: true,
          },
        ],
      }),
    ).rejects.toThrowAPIError(400, "errorOnlyRunNotSupported", ["JOB_3"]);
  });

  it("Create Job (translation)", async () => {
    let response = await POST("/api/job-scheduling/v1/Job", {
      name: "JOB_2",
      referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
      startDateTime: "2025-01-01T12:00:00Z",
      testRun: false,
      parameters: [
        {
          name: "A",
          value: "abcd",
        },
        {
          name: "C",
          value: true,
        },
        {
          name: "D",
          value: 32.0,
        },
        {
          name: "E",
        },
      ],
    });
    expect(response.status).toBe(201);
    expect(cleanData({ ...response.data })).toMatchSnapshot();
    const ID = response.data.ID;
    cds.env.requires["sap-afc-sdk"].mockProcessing = {
      min: 0,
      max: 0,
      default: JobStatus.completed,
    };
    await processQueue("sapafcsdk.scheduling.SchedulingProcessingService");
    cds.env.requires["sap-afc-sdk"].mockProcessing = false;
    const entry = await eventQueueEntry();
    expect(entry).toBeDefined();
    expect(entry.startAfter).toBe("2025-01-01T12:00:00.000Z");
    expect(entry.referenceEntityKey).toBe(ID);
    expect(entry.payload).toMatch(/"testRun":true/);

    await processQueue("sapafcsdk.scheduling.SchedulingProcessingService");

    response = await GET(`/api/job-scheduling/v1/Job/${ID}/results`);
    for (const result of response.data) {
      const resultID = result.ID;
      expect(cleanData(result)).toMatchSnapshot();
      if (result.type === ResultType.message) {
        response = await GET(`/api/job-scheduling/v1/JobResult/${resultID}/messages`);
        expect(cleanData(response.data)).toMatchSnapshot();
        response = await GET(`/api/job-scheduling/v1/JobResult/${resultID}/messages`, {
          headers: {
            "Accept-Language": "de",
          },
        });
        expect(cleanData(response.data)).toMatchSnapshot();
      }
    }
  });

  it("Create Job (status and duration)", async () => {
    const mockStatus = "failed";
    const mockDuration = 99999;
    let response = await POST("/api/job-scheduling/v1/Job", {
      name: "JOB_6",
      referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
      parameters: [
        {
          name: "status",
          value: mockStatus,
        },
        {
          name: "duration",
          value: mockDuration,
        },
      ],
    });
    expect(response.status).toBe(201);
    expect(cleanData({ ...response.data })).toMatchSnapshot();
    const ID = response.data.ID;
    cds.env.requires["sap-afc-sdk"].mockProcessing = true;
    await processQueue("sapafcsdk.scheduling.SchedulingProcessingService");
    cds.env.requires["sap-afc-sdk"].mockProcessing = false;
    let entry = await eventQueueEntry();
    expect(entry).toBeDefined();
    expect(entry.referenceEntityKey).toBe(ID);
    entry = await eventQueueEntry("sapafcsdk.scheduling.SchedulingProcessingService", ID, "updateJob");
    expect(entry).toBeDefined();
    expect(new Date(entry.startAfter).getTime()).toBeGreaterThan(new Date(Date.now() + mockDuration).getTime() - 10000);
    const result = await UPDATE.entity("sap.eventqueue.Event")
      .set({
        startAfter: null,
      })
      .where({ ID: entry.ID });
    expect(result).toBe(1);
    await processQueue("sapafcsdk.scheduling.SchedulingProcessingService");
    response = await GET(`/api/job-scheduling/v1/Job/${ID}`);
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET(`/api/job-scheduling/v1/Job/${ID}/results`);
    const resultID = response.data[0].ID;
    expect(cleanData(response.data[0])).toMatchSnapshot();
    response = await GET(`/api/job-scheduling/v1/JobResult/${resultID}/messages`);
    expect(cleanData(response.data)).toMatchSnapshot();
  });

  it("GET Create Job (enum)", async () => {
    let response = await GET("/api/job-scheduling/v1/JobDefinition/JOB_3/parameters");
    expect(cleanData(response.data)).toMatchSnapshot();
    await expect(
      POST("/api/job-scheduling/v1/Job", {
        name: "JOB_3",
        referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
        parameters: [
          {
            name: "A",
            value: "xxx",
          },
          {
            name: "C",
            value: true,
          },
        ],
      }),
    ).rejects.toThrowAPIError(400, "jobParameterValueInvalidEnum", ["xxx", "A"]);
    await expect(
      POST("/api/job-scheduling/v1/Job", {
        name: "JOB_3",
        referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
        parameters: [
          {
            name: "A",
            value: null,
          },
          {
            name: "C",
            value: true,
          },
        ],
      }),
    ).rejects.toThrowAPIError(400, "jobParameterValueRequired", ["A"]);
    await expect(
      POST("/api/job-scheduling/v1/Job", {
        name: "JOB_3",
        referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
        parameters: [
          {
            name: "A",
            value: "ABC",
          },
          {
            name: "C",
            value: true,
          },
          {
            name: "D",
            value: 22,
          },
        ],
      }),
    ).rejects.toThrowAPIError(400, "jobParameterValueInvalidEnum", [22, "D"]);
    await expect(
      POST("/api/job-scheduling/v1/Job", {
        name: "JOB_3",
        referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
        parameters: [
          {
            name: "A",
            value: "ABC",
          },
          {
            name: "C",
            value: "truefalse",
          },
        ],
      }),
    ).rejects.toThrowAPIError(400, "jobParameterValueInvalidEnum", ["truefalse", "C"]);
    response = await POST("/api/job-scheduling/v1/Job", {
      name: "JOB_3",
      referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
      parameters: [
        {
          name: "A",
          value: "ABC",
        },
        {
          name: "C",
          value: false,
        },
        {
          name: "D",
          value: "23",
        },
      ],
    });
    expect(response.status).toBe(201);
    expect(cleanData({ ...response.data })).toMatchSnapshot();
    response = await POST("/api/job-scheduling/v1/Job", {
      name: "JOB_3",
      referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
      parameters: [
        {
          name: "A",
          value: "ABC",
        },
        {
          name: "C",
          value: true,
        },
        {
          name: "D",
          value: 23,
        },
      ],
    });
    expect(response.status).toBe(201);
    expect(cleanData({ ...response.data })).toMatchSnapshot();
  });

  it("Create Job (date)", async () => {
    let response = await POST("/api/job-scheduling/v1/Job", {
      name: "JOB_4",
      referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
      parameters: [
        {
          name: "A",
          value: "1010",
        },
        {
          name: "B",
          value: "2025-01-01T12:34:56.789Z",
        },
        {
          name: "C",
          value: "alice",
        },
        {
          name: "D",
          value: false,
        },
        {
          name: "E",
          value: 2025,
        },
      ],
    });
    expect(response.status).toBe(201);
    const ID = response.data.ID;
    expect(cleanData({ ...response.data })).toMatchSnapshot();
    response = await GET(`/api/job-scheduling/v1/Job/${ID}`);
    expect(cleanData(response.data)).toMatchSnapshot();
    response = await GET(`/api/job-scheduling/v1/Job/${ID}/parameters`);
    expect(cleanData(response.data)).toMatchSnapshot();
  });

  it("Create Job (headers)", async () => {
    cds.env.requires["sapafcsdk.scheduling.SchedulingProcessingService"].outbox.propagateHeaders = [
      "customheader",
      "authid",
    ];

    let response = await POST(
      "/api/job-scheduling/v1/Job",
      {
        name: "JOB_1",
        referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
        parameters: [
          {
            name: "A",
            value: "abc",
          },
          {
            name: "C",
            value: "true",
          },
          {
            name: "E",
            value: null,
          },
        ],
      },
      {
        headers: {
          customHeader: 123,
          authId: 1234,
          xyz: "abc",
        },
      },
    );
    expect(response.status).toBe(201);
    expect(cleanData({ ...response.data })).toMatchSnapshot();

    await processQueue("sapafcsdk.scheduling.SchedulingProcessingService");
    const entry = await eventQueueEntry();
    const payload = JSON.parse(entry.payload);
    expect(payload.headers).toMatchObject({
      authid: "1234",
      customheader: "123",
    });
  });

  it("Cancel Job", async () => {
    const ID = "3a89dfec-59f9-4a91-90fe-3c7ca7407103";
    const ws = await connectToWS("job-scheduling", ID);

    let response = await POST(`/api/job-scheduling/v1/Job/${ID}/cancel`, {});
    expect(response.status).toBe(204);
    response = await GET(`/api/job-scheduling/v1/Job/${ID}`);
    expect(response.data.status).toEqual(JobStatus.cancelRequested);

    let message = ws.message("jobStatusChanged");
    await processQueue("sapafcsdk.scheduling.SchedulingWebsocketService.jobStatusChanged");
    let event = await message;
    expect(event.IDs).toEqual([ID]);
    expect(event.status).toBe(JobStatus.cancelRequested);

    message = ws.message("jobStatusChanged");
    await processQueue("sapafcsdk.scheduling.SchedulingProcessingService");
    await processQueue("sapafcsdk.scheduling.SchedulingWebsocketService.jobStatusChanged");
    event = await message;
    expect(event.IDs).toEqual([ID]);
    expect(event.status).toBe(JobStatus.canceled);

    response = await GET(`/api/job-scheduling/v1/Job/${ID}`);
    expect(response.data.status).toBe(JobStatus.canceled);

    ws.close();
  });

  describe("Error Situations", () => {
    it("GET Job Parameter Definition", async () => {
      await expect(GET("/api/job-scheduling/v1/JobParameterDefinition", {})).rejects.toThrowAPIError(
        400,
        "accessOnlyViaParent",
      );
      await expect(GET("/api/job-scheduling/v1/JobDefinition/XXX/parameters", {})).rejects.toThrowAPIError(
        404,
        "Not Found",
      );
    });

    it("GET Job Parameter", async () => {
      await expect(GET("/api/job-scheduling/v1/JobParameter", {})).rejects.toThrowAPIError(400, "accessOnlyViaParent");
      await expect(GET("/api/job-scheduling/v1/Job/XXX/parameters", {})).rejects.toThrowAPIError(404, "Not Found");
    });

    it("GET Job Result Message", async () => {
      await expect(GET("/api/job-scheduling/v1/JobResultMessage", {})).rejects.toThrowAPIError(
        400,
        "accessOnlyViaParent",
      );
    });

    it("POST Job Definitions", async () => {
      await expect(POST("/api/job-scheduling/v1/JobDefinition", {})).rejects.toThrowCDSError(
        405,
        "ENTITY_IS_READ_ONLY",
        `Entity "sapafcsdk.scheduling.SchedulingProviderService.JobDefinition" is read-only`,
      );
    });

    it("PUT Job Definitions", async () => {
      await expect(PUT("/api/job-scheduling/v1/JobDefinition/JOB_1", {})).rejects.toThrowCDSError(
        405,
        "ENTITY_IS_READ_ONLY",
        `Entity "sapafcsdk.scheduling.SchedulingProviderService.JobDefinition" is read-only`,
      );
    });

    it("DELETE Job Definitions", async () => {
      await expect(DELETE("/api/job-scheduling/v1/JobDefinition/JOB_1")).rejects.toThrowCDSError(
        405,
        "ENTITY_IS_READ_ONLY",
        `Entity "sapafcsdk.scheduling.SchedulingProviderService.JobDefinition" is read-only`,
      );
    });

    it("POST Job Parameter Definitions", async () => {
      await expect(POST("/api/job-scheduling/v1/JobDefinition/JOB_1/parameters", {})).rejects.toThrowCDSError(
        405,
        "ENTITY_IS_READ_ONLY",
        `Entity "sapafcsdk.scheduling.SchedulingProviderService.JobParameterDefinition" is read-only`,
      );
    });

    it("PUT Job Parameter Definitions", async () => {
      await expect(PUT("/api/job-scheduling/v1/JobDefinition/JOB_1/parameters/A", {})).rejects.toThrowCDSError(
        400,
        "400",
        `Entity "sapafcsdk.scheduling.SchedulingProviderService.JobParameterDefinition" has 2 keys. Only 1 was provided.`,
      );
      await expect(PUT("/api/job-scheduling/v1/JobDefinition/JOB_1/parameters/A/JOB_1", {})).rejects.toThrowCDSError(
        405,
        "ENTITY_IS_READ_ONLY",
        `Entity "sapafcsdk.scheduling.SchedulingProviderService.JobParameterDefinition" is read-only`,
      );
      await expect(
        PUT("/api/job-scheduling/v1/JobDefinition('JOB_1')/parameters(name='A',jobName='JOB_1')", {}),
      ).rejects.toThrowCDSError(
        405,
        "ENTITY_IS_READ_ONLY",
        `Entity "sapafcsdk.scheduling.SchedulingProviderService.JobParameterDefinition" is read-only`,
      );
    });

    it("DELETE Job Parameter Definitions", async () => {
      await expect(DELETE("/api/job-scheduling/v1/JobDefinition/JOB_1/parameters/A", {})).rejects.toThrowCDSError(
        400,
        "400",
        `Entity "sapafcsdk.scheduling.SchedulingProviderService.JobParameterDefinition" has 2 keys. Only 1 was provided.`,
      );
      await expect(DELETE("/api/job-scheduling/v1/JobDefinition/JOB_1/parameters/A/JOB_1", {})).rejects.toThrowCDSError(
        405,
        "ENTITY_IS_READ_ONLY",
        `Entity "sapafcsdk.scheduling.SchedulingProviderService.JobParameterDefinition" is read-only`,
      );
      await expect(
        DELETE("/api/job-scheduling/v1/JobDefinition('JOB_1')/parameters(name='A',jobName='JOB_1')", {}),
      ).rejects.toThrowCDSError(
        405,
        "ENTITY_IS_READ_ONLY",
        `Entity "sapafcsdk.scheduling.SchedulingProviderService.JobParameterDefinition" is read-only`,
      );
    });

    it("PUT Job", async () => {
      await expect(PUT("/api/job-scheduling/v1/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407103", {})).rejects.toThrowCDSError(
        405,
        "ENTITY_IS_NOT_CRUD",
        `Entity "Job" is not updatable`,
      );
    });

    it("DELETE Job", async () => {
      await expect(
        DELETE("/api/job-scheduling/v1/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407103", {}),
      ).rejects.toThrowCDSError(405, "ENTITY_IS_NOT_CRUD", `Entity "Job" is not deletable`);
    });

    it("READ Job Definition with wrong options", async () => {
      await expect(GET("/api/job-scheduling/v1/JobDefinition?skip=A")).rejects.toThrowAPIError(400, "invalidOption", [
        "A",
        "skip",
      ]);
      await expect(GET("/api/job-scheduling/v1/JobDefinition?top=B")).rejects.toThrowAPIError(400, "invalidOption", [
        "B",
        "top",
      ]);
    });

    it("READ Job with wrong options", async () => {
      await expect(GET("/api/job-scheduling/v1/Job?skip=A")).rejects.toThrowAPIError(400, "invalidOption", [
        "A",
        "skip",
      ]);
      await expect(GET("/api/job-scheduling/v1/Job?top=B")).rejects.toThrowAPIError(400, "invalidOption", ["B", "top"]);
    });

    it("POST Job with wrong data", async () => {
      await expect(POST("/api/job-scheduling/v1/Job", {})).rejects.toThrowAPIError(400, "jobDefinitionNotFound", [
        "undefined",
      ]);
      await expect(
        POST("/api/job-scheduling/v1/Job", {
          name: "JOB_X",
        }),
      ).rejects.toThrowAPIError(400, "jobDefinitionNotFound", ["JOB_X"]);
      await expect(
        POST("/api/job-scheduling/v1/Job", {
          name: "JOB_1",
        }),
      ).rejects.toThrowAPIError(400, "referenceIDMissing");
      await expect(
        POST("/api/job-scheduling/v1/Job", {
          name: "JOB_1",
          referenceID: 1,
        }),
      ).rejects.toThrowCDSError(400, "ASSERT_DATA_TYPE", "Value 1 is not a valid UUID");
      await expect(
        POST("/api/job-scheduling/v1/Job", {
          name: "JOB_1",
          referenceID: "4711",
        }),
      ).rejects.toThrowAPIError(400, "referenceIDNoUUID", ["4711"]);
      await expect(
        POST("/api/job-scheduling/v1/Job", {
          name: "JOB_1",
          referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
        }),
      ).rejects.toThrowAPIError(400, "jobParameterRequired", ["A"]);
      await expect(
        POST("/api/job-scheduling/v1/Job", {
          name: "JOB_1",
          referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
          startDateTime: "X",
        }),
      ).rejects.toThrowCDSError(400, "ASSERT_DATA_TYPE", "Value X is not a valid DateTime");
      await expect(
        POST("/api/job-scheduling/v1/Job", {
          name: "JOB_1",
          referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
          startDateTime: new Date().toISOString().split(".")[0] + "Z",
          parameters: "test",
        }),
      ).rejects.toThrowCDSError(
        400,
        "ASSERT_DATA_TYPE",
        `Value test is not a valid sapafcsdk.scheduling.SchedulingProviderService.JobParameter`,
      );
      await expect(
        POST("/api/job-scheduling/v1/Job", {
          name: "JOB_1",
          referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
          startDateTime: new Date().toISOString().split(".")[0] + "Z",
        }),
      ).rejects.toThrowAPIError(400, "startDateTimeNotSupported", ["JOB_1"]);
      await expect(
        POST("/api/job-scheduling/v1/Job", {
          name: "JOB_1",
          referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
          parameters: [{}],
        }),
      ).rejects.toThrowAPIError(400, "jobParameterNameMissing");
      await expect(
        POST("/api/job-scheduling/v1/Job", {
          name: "JOB_1",
          referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
          parameters: [
            {
              name: "X",
            },
          ],
        }),
      ).rejects.toThrowAPIError(400, "jobParameterNotKnown", ["X"]);
      await expect(
        POST("/api/job-scheduling/v1/Job", {
          name: "JOB_1",
          referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
          parameters: [
            {
              name: "A",
              value: 1,
            },
            {
              name: "C",
              value: "xxx",
            },
          ],
        }),
      ).rejects.toThrowAPIError(400, "jobParameterValueInvalidType", ["xxx", "C", "boolean"]);
      await expect(
        POST("/api/job-scheduling/v1/Job", {
          name: "JOB_1",
          referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
          parameters: [
            {
              name: "A",
              value: "1",
            },
            {
              name: "B",
              value: "2",
            },
            {
              name: "C",
              value: "true",
            },
          ],
        }),
      ).rejects.toThrowAPIError(400, "jobParameterReadOnly", ["B"]);
      await expect(
        POST("/api/job-scheduling/v1/Job", {
          name: "JOB_1",
          referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
          parameters: [
            {
              name: "A",
              value: "1",
            },
            {
              name: "C",
            },
          ],
        }),
      ).rejects.toThrowAPIError(400, "jobParameterValueRequired", ["C"]);
      await expect(
        POST("/api/job-scheduling/v1/Job", {
          name: "JOB_1",
          referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
          parameters: [
            {
              name: "A",
              value: "1",
            },
            {
              name: "B",
              value: "21",
            },
            {
              name: "C",
              value: "X",
            },
          ],
        }),
      ).rejects.toThrowAPIError(400, "jobParameterValueInvalidType", ["X", "C", "boolean"]);
      await expect(
        POST("/api/job-scheduling/v1/Job", {
          name: "JOB_1",
          referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
          parameters: [
            {
              name: "A",
              value: "1",
            },
            {
              name: "B",
              value: "21",
            },
            {
              name: "C",
              value: "true",
            },
            {
              name: "D",
              value: "X",
            },
          ],
        }),
      ).rejects.toThrowAPIError(400, "jobParameterValueInvalidType", ["X", "D", "number"]);
      await expect(
        POST("/api/job-scheduling/v1/Job", {
          name: "JOB_1",
          referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
          parameters: [
            {
              name: "A",
              value: "1",
            },
            {
              name: "B",
              value: "21",
            },
            {
              name: "C",
              value: "true",
            },
            {
              name: "D",
              value: null,
            },
            {
              name: "E",
              value: "X",
            },
          ],
        }),
      ).rejects.toThrowAPIError(400, "jobParameterValueInvalidType", ["X", "E", "datetime"]);
      await expect(
        POST("/api/job-scheduling/v1/Job", {
          name: "JOB_1",
          referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
          results: [
            {
              type: ResultType.link,
              link: "https://sap.com",
            },
          ],
          parameters: [
            {
              name: "A",
              value: "1",
            },
            {
              name: "C",
              value: "true",
            },
          ],
        }),
      ).rejects.toThrowAPIError(400, "jobResultsReadOnly");
      await expect(
        POST("/api/job-scheduling/v1/Job", {
          name: "JOB_1",
          referenceID: "c1253940-5f25-4a0b-8585-f62bd085b327",
          parameters: [
            {
              name: "A",
              value: "1",
            },
            {
              name: "B",
              value: "21",
            },
            {
              name: "C",
              value: "true",
            },
            {
              name: "D",
              value: "12.13",
            },
            {
              name: "E",
              value: new Date().toISOString(),
            },
          ],
        }),
      ).resolves.not.toThrow();
    });

    it("Cancel Job not found", async () => {
      await expect(POST(`/api/job-scheduling/v1/Job/XXX/cancel`, {})).rejects.toThrowAPIError(404, "jobNotFound", [
        "XXX",
      ]);
    });

    it("Cancel Job already canceled not possible", async () => {
      const ID = "3a89dfec-59f9-4a91-90fe-3c7ca7407103";
      await POST(`/api/job-scheduling/v1/Job/${ID}/cancel`, {});
      await expect(POST(`/api/job-scheduling/v1/Job/${ID}/cancel`, {})).rejects.toThrowAPIError(
        400,
        "jobCannotBeCanceled",
        ["cancelRequested"],
      );
    });
  });

  it("Notification", async () => {
    cds.env.requires["sap-afc-sdk"].mockProcessing = true;
    const response = await POST("/api/job-scheduling/v1/notify", {
      notifications: [
        {
          name: "taskListStatusChanged",
          ID: "3a89dfec-59f9-4a91-90fe-3c7ca7407103",
          value: "obsolete",
        },
      ],
    });
    expect(response.status).toBe(204);
    await processQueue("sapafcsdk.scheduling.SchedulingProcessingService");
    expect(log.output).toEqual(
      expect.stringMatching(
        /\[sapafcsdk\/notification] - \{\n\s*name: 'taskListStatusChanged',\n\s*ID: '3a89dfec-59f9-4a91-90fe-3c7ca7407103',\n\s*value: 'obsolete'\n\s*}/s,
      ),
    );
    log.clear();
    await clearEventQueue();
    cds.env.requires["sap-afc-sdk"].mockProcessing = false;
  });
});
