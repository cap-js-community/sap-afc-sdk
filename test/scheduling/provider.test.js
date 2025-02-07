"use strict";

const cds = require("@sap/cds");

const {
  authorization,
  cleanData,
  clearEventQueue,
  eventQueueEntry,
  connectToWS,
  processOutbox,
} = require("../util/helper");

const { GET, POST, PUT, DELETE, axios, test } = cds.test(__dirname + "/../..");

process.env.PORT = 0; // Random

describe("API", () => {
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
      await expect(GET("/api-docs/api/job-scheduling/v0/")).rejects.toThrow("Request failed with status code 404");
      response = await GET("/");
      expect(response.status).toEqual(200);
    });
  });

  it("GET Job Definitions", async () => {
    let response = await GET("/api/job-scheduling/v1/JobDefinition");
    expect(response.data).toHaveLength(2);
    expect(response.data[0].name).toBe("JOB_1");
    expect(response.data[1].name).toBe("JOB_2");
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
    response = await GET("/api/job-scheduling/v1/JobDefinition?skip=-1&top=3");
    expect(response.data).toHaveLength(2);
  });

  it("GET Job Parameter Definitons", async () => {
    let response = await GET("/api/job-scheduling/v1/JobDefinition/JOB_1/parameters");
    expect(cleanData(response.data)).toMatchSnapshot();
  });

  it("GET Job", async () => {
    let response = await GET("/api/job-scheduling/v1/Job");
    expect(response.data).toHaveLength(2);
    expect(response.data[0].name).toBe("JOB_1");
    expect(response.data[1].name).toBe("JOB_2");
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
    response = await GET("/api/job-scheduling/v1/Job?skip=-1&top=3");
    expect(response.data).toHaveLength(2);

    response = await GET("/api/job-scheduling/v1/Job?referenceID=8158cbab-a42b-4cb9-9656-8db72521d13d");
    expect(response.data).toHaveLength(1);
    expect(response.data[0].name).toBe("JOB_2");
    expect(response.data[0].referenceID).toBe("8158cbab-a42b-4cb9-9656-8db72521d13d");
  });

  it("GET Job Parameters", async () => {
    const response = await GET("/api/job-scheduling/v1/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407103/parameters");
    expect(cleanData(response.data)).toMatchSnapshot();
  });

  it("Create Job", async () => {
    let response = await POST("/api/job-scheduling/v1/Job", {
      name: "JOB_1",
      referenceID: "4711",
      startDateTime: "2025-01-01T12:00:00Z",
      parameters: [
        {
          name: "A",
          value: "abcd",
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
    const entry = await eventQueueEntry();
    expect(entry.startAfter).toBe("2025-01-01T12:00:00.000Z");
    expect(entry.referenceEntityKey).toBe(ID);

    const ws = await connectToWS("job-scheduling", ID);
    let message = ws.message("jobStatusChanged");
    await processOutbox("websocket");
    let event = await message;
    expect(event.ID).toBe(ID);
    expect(event.status).toBe("requested");

    response = await GET(`/api/job-scheduling/v1/Job/${ID}`);
    expect(cleanData(response.data)).toMatchSnapshot();
    expect(response.data.status).toEqual("requested");
    response = await GET(`/api/job-scheduling/v1/Job/${ID}/parameters`);
    expect(cleanData(response.data)).toMatchSnapshot();

    message = ws.message("jobStatusChanged");
    await processOutbox();
    event = await message;
    expect(event.ID).toBe(ID);
    expect(event.status).toBe("running");

    response = await GET(`/api/job-scheduling/v1/Job/${ID}`);
    expect(response.data.status).toBe("running");

    ws.close();
  });

  it("Cancel Job", async () => {
    const ID = "3a89dfec-59f9-4a91-90fe-3c7ca7407103";
    const ws = await connectToWS("job-scheduling", ID);

    let response = await POST(`/api/job-scheduling/v1/Job/${ID}/cancel`, {});
    expect(response.status).toBe(204);
    response = await GET(`/api/job-scheduling/v1/Job/${ID}`);
    expect(response.data.status).toEqual("cancelRequested");

    let message = ws.message("jobStatusChanged");
    await processOutbox("websocket");
    let event = await message;
    expect(event.ID).toBe(ID);
    expect(event.status).toBe("cancelRequested");

    message = ws.message("jobStatusChanged");
    await processOutbox();
    event = await message;
    expect(event.ID).toBe(ID);
    expect(event.status).toBe("canceled");

    response = await GET(`/api/job-scheduling/v1/Job/${ID}`);
    expect(response.data.status).toBe("canceled");

    ws.close();
  });

  describe("Error Situations", () => {
    it("POST Job Definitions", async () => {
      await expect(POST("/api/job-scheduling/v1/JobDefinition", {})).rejects.toThrowAPIError(
        405,
        `Entity "SchedulingProviderService.JobDefinition" is read-only`,
      );
    });

    it("PUT Job Definitions", async () => {
      await expect(PUT("/api/job-scheduling/v1/JobDefinition/JOB_1", {})).rejects.toThrowAPIError(
        405,
        `Entity "SchedulingProviderService.JobDefinition" is read-only`,
      );
    });

    it("DELETE Job Definitions", async () => {
      await expect(DELETE("/api/job-scheduling/v1/JobDefinition/JOB_1")).rejects.toThrowAPIError(
        405,
        `Entity "SchedulingProviderService.JobDefinition" is read-only`,
      );
    });

    it("POST Job Parameter Definitions", async () => {
      await expect(POST("/api/job-scheduling/v1/JobDefinition/JOB_1/parameters", {})).rejects.toThrowAPIError(
        405,
        `Entity "SchedulingProviderService.JobParameterDefinition" is read-only`,
      );
    });

    it("PUT Job Parameter Definitions", async () => {
      await expect(PUT("/api/job-scheduling/v1/JobDefinition/JOB_1/parameters/A", {})).rejects.toThrowAPIError(
        400,
        `Entity "SchedulingProviderService.JobParameterDefinition" has 2 keys. Only 1 was provided.`,
      );
      await expect(PUT("/api/job-scheduling/v1/JobDefinition/JOB_1/parameters/A/JOB_1", {})).rejects.toThrowAPIError(
        405,
        `Entity "SchedulingProviderService.JobParameterDefinition" is read-only`,
      );
      await expect(
        PUT("/api/job-scheduling/v1/JobDefinition('JOB_1')/parameters(name='A',jobName='JOB_1')", {}),
      ).rejects.toThrowAPIError(405, `Entity "SchedulingProviderService.JobParameterDefinition" is read-only`);
    });

    it("DELETE Job Parameter Definitions", async () => {
      await expect(DELETE("/api/job-scheduling/v1/JobDefinition/JOB_1/parameters/A", {})).rejects.toThrowAPIError(
        400,
        `Entity "SchedulingProviderService.JobParameterDefinition" has 2 keys. Only 1 was provided.`,
      );
      await expect(DELETE("/api/job-scheduling/v1/JobDefinition/JOB_1/parameters/A/JOB_1", {})).rejects.toThrowAPIError(
        405,
        `Entity "SchedulingProviderService.JobParameterDefinition" is read-only`,
      );
      await expect(
        DELETE("/api/job-scheduling/v1/JobDefinition('JOB_1')/parameters(name='A',jobName='JOB_1')", {}),
      ).rejects.toThrowAPIError(405, `Entity "SchedulingProviderService.JobParameterDefinition" is read-only`);
    });

    it("PUT Job", async () => {
      await expect(PUT("/api/job-scheduling/v1/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407103", {})).rejects.toThrowAPIError(
        405,
        `Entity "Job" is not updatable`,
      );
    });

    it("DELETE Job", async () => {
      await expect(
        DELETE("/api/job-scheduling/v1/Job/3a89dfec-59f9-4a91-90fe-3c7ca7407103", {}),
      ).rejects.toThrowAPIError(405, `Entity "Job" is not deletable`);
    });

    it("READ Job Definition with wrong options", async () => {
      await expect(GET("/api/job-scheduling/v1/JobDefinition?skip=A")).rejects.toThrowAPIError(
        400,
        "invalidOptionSkip",
        ["A"],
      );
      await expect(GET("/api/job-scheduling/v1/JobDefinition?top=B")).rejects.toThrowAPIError(400, "invalidOptionTop", [
        "B",
      ]);
    });

    it("READ Job with wrong options", async () => {
      await expect(GET("/api/job-scheduling/v1/Job?skip=A")).rejects.toThrowAPIError(400, "invalidOptionSkip", ["A"]);
      await expect(GET("/api/job-scheduling/v1/Job?top=B")).rejects.toThrowAPIError(400, "invalidOptionTop", ["B"]);
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
      ).rejects.toThrowAPIError(400, "Value 1 is not a valid UUID");
      await expect(
        POST("/api/job-scheduling/v1/Job", {
          name: "JOB_1",
          referenceID: "4711",
        }),
      ).rejects.toThrowAPIError(400, "jobParameterRequired", ["A"]);
      await expect(
        POST("/api/job-scheduling/v1/Job", {
          name: "JOB_1",
          referenceID: "4711",
          startDateTime: "X",
        }),
      ).rejects.toThrowAPIError(400, "Value X is not a valid DateTime");
      await expect(
        POST("/api/job-scheduling/v1/Job", {
          name: "JOB_1",
          referenceID: "4711",
          startDateTime: new Date().toISOString(),
          parameters: "test",
        }),
      ).rejects.toThrowAPIError(400, `Property "0" does not exist in parameters`);
      await expect(
        POST("/api/job-scheduling/v1/Job", {
          name: "JOB_1",
          referenceID: "4711",
          parameters: [{}],
        }),
      ).rejects.toThrowAPIError(400, "jobParameterNameMissing");
      await expect(
        POST("/api/job-scheduling/v1/Job", {
          name: "JOB_1",
          referenceID: "4711",
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
          referenceID: "4711",
          parameters: [
            {
              name: "A",
              value: 1,
            },
          ],
        }),
      ).rejects.toThrowAPIError(400, "Value 1 is not a valid String");
      await expect(
        POST("/api/job-scheduling/v1/Job", {
          name: "JOB_1",
          referenceID: "4711",
          parameters: [
            {
              name: "A",
              value: "1",
            },
            {
              name: "B",
              value: "2",
            },
          ],
        }),
      ).rejects.toThrowAPIError(400, "jobParameterReadOnly", ["B"]);
      await expect(
        POST("/api/job-scheduling/v1/Job", {
          name: "JOB_1",
          referenceID: "4711",
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
          referenceID: "4711",
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
          referenceID: "4711",
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
          referenceID: "4711",
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
          referenceID: "4711",
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
});
