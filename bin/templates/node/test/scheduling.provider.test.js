"use strict";

const cds = require("@sap/cds");

const { GET, POST, test } = cds.test(__dirname + "/..");

describe("Scheduling Provider", () => {
  beforeEach(async () => {
    await test.data.reset();
  });

  it("GET Job Definitions", async () => {
    const response = await GET("/api/job-scheduling/v1/JobDefinition");
    expect(response.status).toEqual(200);
  });

  it("GET Jobs", async () => {
    const response = await GET("/api/job-scheduling/v1/Job");
    expect(response.status).toEqual(200);
  });

  it("POST Job", async () => {
    const response = await POST("/api/job-scheduling/v1/Job", {
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
      ],
    });
    expect(response.status).toBe(201);
  });

  it("POST Job cancel", async () => {
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
      ],
    });
    const ID = response.data.ID;
    expect(response.status).toBe(201);
    response = await POST(`/api/job-scheduling/v1/Job/${ID}/cancel`, {});
    expect(response.status).toBe(204);
    response = await GET(`/api/job-scheduling/v1/Job/${ID}`);
    expect(response.status).toEqual(200);
    expect(response.data.status).toEqual("cancelRequested");
  });

  it("POST notification", async () => {
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
  });
});
