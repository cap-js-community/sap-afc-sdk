"use strict";

const cds = require("@sap/cds");
const { text, buffer } = require("node:stream/consumers");
const { Readable } = require("stream");
const fs = require("fs");

const { cleanData, connectToWS, clearEventQueue, eventQueueEntry, processQueue } = require("../helper");
const { JobStatus, ResultType, MessageSeverity } = require("../../srv/scheduling/common/codelist");
const SchedulingProcessingService = require("../../srv/scheduling/processing-service");

const { test } = cds.test(__dirname + "/../..", "--with-mocks");

process.env.PORT = 0; // Random

let processingService;

const ID = "3a89dfec-59f9-4a91-90fe-3c7ca7407103";
const REFERENCE_ID = "7158cbab-a42b-4cb9-9656-8db72521d13d";

describe("Processing Service", () => {
  const log = cds.test.log();

  beforeAll(async () => {
    processingService = await cds.connect.to("sapafcsdk.scheduling.ProcessingService");
    const afc = await cds.connect.to("afc");
    afc.on("#succeeded", () => {});
    afc.on("#failed", () => {});
  });

  beforeEach(async () => {
    await clearEventQueue();
    await test.data.reset();
  });

  it("processJob - no mock", async () => {
    cds.env.requires["sap-afc-sdk"].mockProcessing = false;
    const ws = await connectToWS("job-scheduling");
    let message = ws.message("jobStatusChanged");

    await expect(processingService.processJob(ID)).resolves.not.toThrow();

    await processQueue("sapafcsdk.scheduling.ProcessingService");

    let job = await SELECT.one.from("sapafcsdk.scheduling.Job").where({ ID });
    expect(job.status_code).toBe(JobStatus.running);

    await processQueue("sapafcsdk.scheduling.WebsocketService.jobStatusChanged");
    let event = await message;
    expect(event.IDs).toEqual([ID]);
    expect(event.status).toBe(JobStatus.running);

    ws.close();
  });

  it("processJob - simple mock - completed", async () => {
    cds.env.requires["sap-afc-sdk"].mockProcessing = true;
    await expect(processingService.processJob(ID)).resolves.not.toThrow();

    await processQueue("sapafcsdk.scheduling.ProcessingService");

    const entry = await eventQueueEntry("sapafcsdk.scheduling.ProcessingService", ID, "updateJob");
    expect(entry).toBeDefined();
    expect(entry.startAfter).toBeDefined();
    let result = await UPDATE.entity("sap.eventqueue.Event")
      .set({
        startAfter: null,
      })
      .where({ ID: entry.ID });
    expect(result).toBe(1);

    await processQueue("sapafcsdk.scheduling.ProcessingService");

    const job = await SELECT.one.from("sapafcsdk.scheduling.Job").where({ ID });
    expect(job.status_code).toBe(JobStatus.completed);

    const jobResult = await SELECT.from("sapafcsdk.scheduling.JobResult").where({ job_ID: ID });
    const jobMessageResultIDs = jobResult
      .filter((entry) => entry.type_code === ResultType.message)
      .map((entry) => entry.ID);
    const jobDataTextResultID = jobResult.find((entry) => entry.mimeType === "text/plain").ID;
    const jobDataPDFResultID = jobResult.find((entry) => entry.mimeType === "application/pdf").ID;
    expect(cleanData(jobResult)).toMatchSnapshot();
    for (const jobMessageResultID of jobMessageResultIDs) {
      let jobResultMessages = await SELECT.from("sapafcsdk.scheduling.JobResultMessage").where({
        result_ID: jobMessageResultID,
      });
      expect(cleanData(jobResultMessages)).toMatchSnapshot();
    }
    result = await SELECT.one.from("sapafcsdk.scheduling.JobResult").columns("data").where({ ID: jobDataTextResultID });
    let data = await text(result.data);
    expect(data).toEqual("Job completed successfully");
    result = await SELECT.one.from("sapafcsdk.scheduling.JobResult").columns("data").where({ ID: jobDataPDFResultID });
    data = await buffer(result.data); //
    const fileData = fs.readFileSync("./srv/scheduling/assets/log.pdf");
    expect(data).toEqual(fileData);
  });

  it("processJob - simple mock - completed with warning", async () => {
    cds.env.requires["sap-afc-sdk"].mockProcessing = {
      default: JobStatus.completedWithWarning,
    };
    await expect(processingService.processJob(ID)).resolves.not.toThrow();

    await processQueue("sapafcsdk.scheduling.ProcessingService");

    const entry = await eventQueueEntry("sapafcsdk.scheduling.ProcessingService", ID, "updateJob");
    expect(entry).toBeDefined();
    expect(entry.startAfter).toBeDefined();
    const result = await UPDATE.entity("sap.eventqueue.Event")
      .set({
        startAfter: null,
      })
      .where({ ID: entry.ID });
    expect(result).toBe(1);

    await processQueue("sapafcsdk.scheduling.ProcessingService");

    const job = await SELECT.one.from("sapafcsdk.scheduling.Job").where({ ID });
    expect(job.status_code).toBe(JobStatus.completedWithWarning);

    const jobResult = await SELECT.from("sapafcsdk.scheduling.JobResult").where({ job_ID: ID });
    const jobMessageResultIDs = jobResult
      .filter((entry) => entry.type_code === ResultType.message)
      .map((entry) => entry.ID);
    expect(cleanData(jobResult)).toMatchSnapshot();
    for (const jobMessageResultID of jobMessageResultIDs) {
      let jobResultMessages = await SELECT.from("sapafcsdk.scheduling.JobResultMessage").where({
        result_ID: jobMessageResultID,
      });
      expect(cleanData(jobResultMessages)).toMatchSnapshot();
    }
  });

  it("processJob - simple mock - completed with error", async () => {
    cds.env.requires["sap-afc-sdk"].mockProcessing = {
      default: JobStatus.completedWithError,
    };
    await expect(processingService.processJob(ID)).resolves.not.toThrow();

    await processQueue("sapafcsdk.scheduling.ProcessingService");

    const entry = await eventQueueEntry("sapafcsdk.scheduling.ProcessingService", ID, "updateJob");
    expect(entry).toBeDefined();
    expect(entry.startAfter).toBeDefined();
    const result = await UPDATE.entity("sap.eventqueue.Event")
      .set({
        startAfter: null,
      })
      .where({ ID: entry.ID });
    expect(result).toBe(1);

    await processQueue("sapafcsdk.scheduling.ProcessingService");

    const job = await SELECT.one.from("sapafcsdk.scheduling.Job").where({ ID });
    expect(job.status_code).toBe(JobStatus.completedWithError);

    const jobResult = await SELECT.from("sapafcsdk.scheduling.JobResult").where({ job_ID: ID });
    const jobMessageResultIDs = jobResult
      .filter((entry) => entry.type_code === ResultType.message)
      .map((entry) => entry.ID);
    expect(cleanData(jobResult)).toMatchSnapshot();
    for (const jobMessageResultID of jobMessageResultIDs) {
      let jobResultMessages = await SELECT.from("sapafcsdk.scheduling.JobResultMessage").where({
        result_ID: jobMessageResultID,
      });
      expect(cleanData(jobResultMessages)).toMatchSnapshot();
    }
  });

  it("processJob - simple mock - failed", async () => {
    cds.env.requires["sap-afc-sdk"].mockProcessing = {
      default: JobStatus.failed,
    };
    await expect(processingService.processJob(ID)).resolves.not.toThrow();

    await processQueue("sapafcsdk.scheduling.ProcessingService");

    const entry = await eventQueueEntry("sapafcsdk.scheduling.ProcessingService", ID, "updateJob");
    expect(entry).toBeDefined();
    expect(entry.startAfter).toBeDefined();
    const result = await UPDATE.entity("sap.eventqueue.Event")
      .set({
        startAfter: null,
      })
      .where({ ID: entry.ID });
    expect(result).toBe(1);

    await processQueue("sapafcsdk.scheduling.ProcessingService");

    const job = await SELECT.one.from("sapafcsdk.scheduling.Job").where({ ID });
    expect(job.status_code).toBe(JobStatus.failed);

    const jobResult = await SELECT.from("sapafcsdk.scheduling.JobResult").where({ job_ID: ID });
    const jobMessageResultIDs = jobResult
      .filter((entry) => entry.type_code === ResultType.message)
      .map((entry) => entry.ID);
    expect(cleanData(jobResult)).toMatchSnapshot();
    for (const jobMessageResultID of jobMessageResultIDs) {
      let jobResultMessages = await SELECT.from("sapafcsdk.scheduling.JobResultMessage").where({
        result_ID: jobMessageResultID,
      });
      expect(cleanData(jobResultMessages)).toMatchSnapshot();
    }
  });

  it("processJob - advanced mock", async () => {
    cds.env.requires["sap-afc-sdk"].mockProcessing = {
      status: {
        completed: 0.7,
        completedWithWarning: 0.1,
        completedWithError: 0.1,
        failed: 0.1,
      },
    };
    await expect(processingService.processJob(ID)).resolves.not.toThrow();

    await processQueue("sapafcsdk.scheduling.ProcessingService");

    let entry = await eventQueueEntry("sapafcsdk.scheduling.ProcessingService", ID, "updateJob");
    expect(entry).toBeDefined();
    expect(entry.startAfter).toBeDefined();
    const result = await UPDATE.entity("sap.eventqueue.Event")
      .set({
        startAfter: null,
      })
      .where({ ID: entry.ID });
    expect(result).toBe(1);

    await processQueue("sapafcsdk.scheduling.ProcessingService");

    const job = await SELECT.one.from("sapafcsdk.scheduling.Job").where({ ID });
    expect(job.status_code).not.toBe(JobStatus.running);
    expect(job.status_code).not.toBe(JobStatus.requested);
  });

  it("updateJob - status", async () => {
    const ws = await connectToWS("job-scheduling");

    let message = ws.message("jobStatusChanged");
    await expect(processingService.updateJob(ID, JobStatus.running)).resolves.not.toThrow();

    await processQueue("sapafcsdk.scheduling.ProcessingService");
    await processQueue("sapafcsdk.scheduling.WebsocketService.jobStatusChanged");
    let event = await message;
    expect(event.IDs).toEqual([ID]);
    expect(event.status).toBe("running");

    message = ws.message("jobStatusChanged");
    await expect(processingService.updateJob(ID, JobStatus.completed)).resolves.not.toThrow();

    await processQueue("sapafcsdk.scheduling.ProcessingService");
    await processQueue("sapafcsdk.scheduling.WebsocketService.jobStatusChanged");
    const job = await SELECT.one.from("sapafcsdk.scheduling.Job").where({ ID });
    expect(job.status_code).toBe(JobStatus.completed);
    event = await message;
    expect(event.IDs).toEqual([ID]);
    expect(event.status).toBe(JobStatus.completed);

    await expect(processingService.updateJob(ID, JobStatus.completed)).resolves.not.toThrow();
    await processQueue("sapafcsdk.scheduling.ProcessingService");

    ws.close();
  });

  it("updateJob - translation", async () => {
    await expect(processingService.updateJob(ID, JobStatus.running)).resolves.not.toThrow();
    await processQueue("sapafcsdk.scheduling.ProcessingService");
    await expect(
      processingService.updateJob(ID, JobStatus.completed, [
        {
          type: ResultType.message,
          name: "Result",
          messages: [
            {
              code: "jobCompleted",
              severity: MessageSeverity.info,
              texts: [
                {
                  locale: "de",
                  text: "Job abgeschlossen",
                },
                {
                  locale: "fr",
                },
              ],
            },
            {
              code: "invalidJobStatus",
              values: ["xxx"],
              severity: MessageSeverity.info,
              texts: [
                {
                  locale: "de",
                },
                {
                  locale: "fr",
                },
              ],
            },
          ],
        },
      ]),
    ).resolves.not.toThrow();
    await processQueue("sapafcsdk.scheduling.ProcessingService");
    const job = await SELECT.one.from("sapafcsdk.scheduling.Job").where({ ID });
    expect(job.status_code).toBe(JobStatus.completed);
    const jobResults = await SELECT.from("sapafcsdk.scheduling.JobResult").where({ job_ID: ID });
    const resultIDs = jobResults.map((j) => j.ID);
    expect(cleanData(jobResults)).toMatchSnapshot();
    let jobMessages = await SELECT.from("sapafcsdk.scheduling.JobResultMessage").where({
      result_ID: { in: resultIDs },
    });
    expect(cleanData(jobMessages)).toMatchSnapshot();
    await cds.tx({ locale: "fr" }, async (tx) => {
      jobMessages = await tx.run(
        SELECT.localized("sapafcsdk.scheduling.JobResultMessage").where({ result_ID: { in: resultIDs } }),
      );
      expect(cleanData(jobMessages)).toMatchSnapshot();
    });
    await cds.tx({ locale: "de" }, async (tx) => {
      jobMessages = await tx.run(
        SELECT.localized("sapafcsdk.scheduling.JobResultMessage").where({ result_ID: { in: resultIDs } }),
      );
      expect(cleanData(jobMessages)).toMatchSnapshot();
    });
  });

  it("updateJob - results - base64", async () => {
    await expect(processingService.updateJob(ID, JobStatus.running)).resolves.not.toThrow();
    await processQueue("sapafcsdk.scheduling.ProcessingService");
    await expect(
      processingService.updateJob(ID, JobStatus.completed, [
        {
          type: ResultType.link,
          name: "Link",
          link: "https://sap.com",
        },
        {
          type: ResultType.data,
          name: "Data",
          filename: "test.txt",
          mimeType: "text/plain",
          data: btoa("This is a test"),
        },
        {
          type: ResultType.message,
          name: "Result",
          messages: [
            {
              code: "jobCompleted",
              severity: MessageSeverity.info,
            },
          ],
        },
      ]),
    ).resolves.not.toThrow();
    await processQueue("sapafcsdk.scheduling.ProcessingService");
    const job = await SELECT.one.from("sapafcsdk.scheduling.Job").where({ ID });
    expect(job.status_code).toBe(JobStatus.completed);
    const jobResults = await SELECT.from("sapafcsdk.scheduling.JobResult").where({ job_ID: ID });
    const resultIDs = jobResults.map((j) => j.ID);
    expect(cleanData(jobResults)).toMatchSnapshot();
    let jobMessages = await SELECT.from("sapafcsdk.scheduling.JobResultMessage").where({
      result_ID: { in: resultIDs },
    });
    expect(cleanData(jobMessages)).toMatchSnapshot();
    const result = await SELECT.one
      .from("sapafcsdk.scheduling.JobResult")
      .columns("data")
      .where({ job_ID: ID, type: ResultType.data });
    const data = await text(result.data);
    expect(data).toEqual("This is a test");
  });

  it("updateJob - results - readable", async () => {
    await expect(processingService.updateJob(ID, JobStatus.running)).resolves.not.toThrow();
    await processQueue("sapafcsdk.scheduling.ProcessingService");
    await expect(
      processingService.updateJob(ID, JobStatus.completed, [
        {
          type: ResultType.data,
          name: "Data",
          filename: "test.txt",
          mimeType: "text/plain",
          data: Readable.from("This is a test", { objectMode: false }),
        },
      ]),
    ).resolves.not.toThrow();
    await processQueue("sapafcsdk.scheduling.ProcessingService");
    const job = await SELECT.one.from("sapafcsdk.scheduling.Job").where({ ID });
    expect(job.status_code).toBe(JobStatus.completed);
    const jobResults = await SELECT.from("sapafcsdk.scheduling.JobResult").where({ job_ID: ID });
    const resultIDs = jobResults.map((j) => j.ID);
    expect(cleanData(jobResults)).toMatchSnapshot();
    const jobMessages = await SELECT.from("sapafcsdk.scheduling.JobResultMessage").where({
      result_ID: { in: resultIDs },
    });
    expect(cleanData(jobMessages)).toMatchSnapshot();
    const result = await SELECT.one
      .from("sapafcsdk.scheduling.JobResult")
      .columns("data")
      .where({ job_ID: ID, type: ResultType.data });
    const data = await text(result.data);
    expect(data).toEqual("���r�^i֛�");
  });

  it("updateJob - results - arraybuffer", async () => {
    await expect(processingService.updateJob(ID, JobStatus.running)).resolves.not.toThrow();
    await processQueue("sapafcsdk.scheduling.ProcessingService");
    await clearEventQueue();
    await expect(
      processingService.updateJob(ID, JobStatus.completed, [
        {
          type: ResultType.data,
          name: "Data",
          filename: "test.txt",
          mimeType: "text/plain",
          data: Buffer.from("This is a test"),
        },
      ]),
    ).resolves.not.toThrow();
    await processQueue("sapafcsdk.scheduling.ProcessingService");
    const entry = await eventQueueEntry();
    expect(entry).toBeDefined();
    expect(entry.status).toBe(3);
    expect(JSON.parse(entry.error)).toMatchObject({
      message: "ASSERT_DATA_TYPE",
      name: "Error",
      stack: "ASSERT_DATA_TYPE",
      target: "results[0]/data",
    });
  });

  it("updateJob - processJobUpdate", async () => {
    const schedulingProcessingService = new SchedulingProcessingService();
    const req = {
      job: {
        ID,
        status_code: JobStatus.running,
      },
    };
    const result = await schedulingProcessingService.processJobUpdate(req, req.job, JobStatus.completed, [
      {
        type: ResultType.data,
        name: "Buffer",
        filename: "test.txt",
        mimeType: "text/plain",
        data: Buffer.from("This is a test"),
      },
      {
        type: ResultType.data,
        name: "Stream",
        filename: "test.txt",
        mimeType: "text/plain",
        data: Readable.from("This is a test", { objectMode: false }),
      },
    ]);
    expect(result).toBeUndefined();
    const tx = cds.tx(req);
    const results = await tx.run(SELECT.from("sapafcsdk.scheduling.JobResult").where({ job_ID: ID }));
    expect(results).toHaveLength(2);
    const data = [];
    for (const entry of results) {
      const jobResult = await tx.run(
        SELECT.one.from("sapafcsdk.scheduling.JobResult").columns("data").where({ ID: entry.ID }),
      );
      data.push(await text(jobResult.data));
    }
    await tx.rollback();
    for (const record of data) {
      expect(record).toEqual("This is a test");
    }
  });

  it("syncJob", async () => {
    cds.env.log.levels["periodic"] = MessageSeverity.info;
    cds.env.requires["sap-afc-sdk"].mockProcessing = true;
    await expect(processingService.syncJob()).resolves.not.toThrow();
    await processQueue("sapafcsdk.scheduling.ProcessingService.syncJob");
    expect(log.output).toEqual(expect.stringMatching(/\[sapafcsdk\/jobsync] - periodic sync job triggered/s));

    log.output = "";
    cds.env.requires["sap-afc-sdk"].mockProcessing = false;
    await expect(processingService.syncJob()).resolves.not.toThrow();
    await processQueue("sapafcsdk.scheduling.ProcessingService.syncJob");
    expect(log.output).not.toEqual(expect.stringMatching(/\[sapafcsdk\/jobsync] - periodic sync job triggered/s));
  });

  it("cancelJob", async () => {
    const ws = await connectToWS("job-scheduling");
    let message = ws.message("jobStatusChanged");

    await expect(processingService.cancelJob(ID)).resolves.not.toThrow();

    await processQueue("sapafcsdk.scheduling.ProcessingService");

    const job = await SELECT.one.from("sapafcsdk.scheduling.Job").where({ ID });
    expect(job.status_code).toBe(JobStatus.canceled);

    await processQueue("sapafcsdk.scheduling.WebsocketService.jobStatusChanged");
    let event = await message;
    expect(event.IDs).toEqual([ID]);
    expect(event.status).toBe(JobStatus.canceled);

    ws.close();
  });

  describe("AFC", () => {
    it("AFC Read Job", async () => {
      const req = new cds.Request({
        job: {
          ID,
        },
      });
      await expect(processingService.afcReadJob(req, req.job)).rejects.toThrowErrorMatchingInlineSnapshot(
        `"referenceIDMissing"`,
      );
      req.job.referenceID = REFERENCE_ID;
      const job = await processingService.afcReadJob(req, req.job);
      expect(job).toMatchObject({
        ID: "7158cbab-a42b-4cb9-9656-8db72521d13d",
        taskId: "6158cbab-a42b-4cb9-9656-8db72521d13d",
        taskName: "Task 1",
        taskListId: "5158cbab-a42b-4cb9-9656-8db72521d13d",
        taskListName: "Task List 1",
        taskListInstance: "1",
        externalJobId: "7158cbab-a42b-4cb9-9656-8db72521d13d",
        externalJobGroupId: "7158cbab-a42b-4cb9-9656-8db72521d13e",
        externalJobName: "JOB_1",
        externalJobReferenceId: "3a89dfec-59f9-4a91-90fe-3c7ca7407103",
        jobStatus: "requested",
        jobType: "thirdparty",
      });
    });

    it("AFC Update Job", async () => {
      const req = {
        job: {
          ID,
        },
        reject: jest.fn((error) => {
          throw error;
        }),
      };
      await expect(processingService.afcUpdateJob(req, req.job)).rejects.toThrowErrorMatchingInlineSnapshot(
        `"referenceIDMissing"`,
      );
      req.job.referenceID = "xxx";
      await expect(processingService.afcUpdateJob(req, req.job)).rejects.toThrowErrorMatchingInlineSnapshot(
        `"jobNotFound"`,
      );
      req.job.referenceID = REFERENCE_ID;
      await expect(
        processingService.afcUpdateJob(req, req.job, JobStatus.completed, [
          {
            type: ResultType.link,
            name: "link",
          },
        ]),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"invalidResultType"`);
      await processingService.afcUpdateJob(req, req.job, JobStatus.completed, [
        {
          type: ResultType.message,
          name: "messages",
          messages: [
            {
              code: "jobCompleted",
              severity: MessageSeverity.info,
            },
          ],
        },
      ]);
      await cds.tx(req).commit();
      await processQueue("afc");
      let entry = await eventQueueEntry("afc", undefined);
      expect(entry).toBeDefined();
      expect(entry.status).toBe(2);
      expect(entry.referenceEntity).toBe("sap.afc.IntegrationService.TaskExternalJob");
      expect(entry.referenceEntityKey).toBe(REFERENCE_ID);
      const payload = JSON.parse(entry.payload);
      expect(payload.query).toBeDefined();
      expect(payload.query.INSERT).toBeDefined();
      await processQueue("afc"); // #succeeded
      entry = await eventQueueEntry("afc", undefined, "#succeeded");
      expect(entry).toBeDefined();
      expect(entry.status).toBe(2);
      const input = JSON.parse(entry.payload).data;
      expect(input.ID).toBeDefined();
      expect(input.results[0].ID).toBeDefined();
      expect(input.results[0].messages[0].ID).toBeDefined();
      expect(input.results[0].messages[0].createdAt).toBeDefined();
      expect(input).toMatchObject({
        externalJobId: "7158cbab-a42b-4cb9-9656-8db72521d13d",
        jobStatus: "completed",
        results: [
          {
            name: "messages",
            messages: [
              {
                code: "jobCompleted",
                text: "Job completed successfully",
                severity: "info",
              },
            ],
            type: "message",
          },
        ],
      });

      await cds.tx({ locale: "de" }, async (tx) => {
        const jobInput = await tx.run(
          SELECT.from("sap.afc.IntegrationService.TaskExternalJobInput").where({ ID: input.ID }),
        );
        expect(cleanData(jobInput)).toMatchSnapshot();
      });
    });
  });

  describe("Error Situations", () => {
    it("processJob", async () => {
      await expect(processingService.processJob("XXX")).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      const entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: ["XXX"],
        code: "jobNotFound",
        message: "jobNotFound",
        name: "jobNotFound",
        numericSeverity: 4,
        severity: "E",
        status: 404,
      });
      await clearEventQueue();
    });

    it("updateJob - status", async () => {
      await expect(processingService.updateJob("XXX")).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      let entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: ["XXX"],
        code: "jobNotFound",
        message: "jobNotFound",
        name: "jobNotFound",
        numericSeverity: 4,
        severity: "E",
        status: 404,
      });
      await clearEventQueue();

      await expect(processingService.updateJob(ID)).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: [],
        code: "statusValueMissing",
        message: "statusValueMissing",
        name: "statusValueMissing",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();

      await expect(processingService.updateJob(ID, "XXX")).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: ["XXX"],
        code: "invalidJobStatus",
        message: "invalidJobStatus",
        name: "invalidJobStatus",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();

      await expect(processingService.updateJob(ID, JobStatus.completed)).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: ["requested", "completed"],
        code: "statusTransitionNotAllowed",
        message: "statusTransitionNotAllowed",
        name: "statusTransitionNotAllowed",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();
    });

    it("updateJob - results", async () => {
      await expect(processingService.updateJob(ID, JobStatus.completed, {})).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      let entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        name: "Error",
        message: "ASSERT_ARRAY",
        stack: "ASSERT_ARRAY",
        target: "results",
      });
      await clearEventQueue();

      await expect(processingService.updateJob(ID, JobStatus.running, [{}])).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        name: "resultNameMissing",
        message: "resultNameMissing",
        code: "resultNameMissing",
        args: [],
        status: 400,
        severity: "E",
        numericSeverity: 4,
      });
      await clearEventQueue();

      await expect(processingService.updateJob(ID, JobStatus.running, [{ name: "Link" }])).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: [],
        code: "resultTypeMissing",
        message: "resultTypeMissing",
        name: "resultTypeMissing",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [{ name: "Link", type: "X" }]),
      ).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: ["X"],
        code: "invalidResultType",
        message: "invalidResultType",
        name: "invalidResultType",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Link",
            type: ResultType.link,
          },
        ]),
      ).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: ["link"],
        code: "linkMissing",
        message: "linkMissing",
        name: "linkMissing",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Link",
            type: ResultType.link,
            link: "https://sap.com",
            mimeType: "text/plain",
          },
        ]),
      ).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: ["link"],
        code: "mimeTypeNotAllowed",
        message: "mimeTypeNotAllowed",
        name: "mimeTypeNotAllowed",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Link",
            type: ResultType.link,
            link: "https://sap.com",
            filename: "test.txt",
          },
        ]),
      ).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: ["link"],
        code: "filenameNotAllowed",
        message: "filenameNotAllowed",
        name: "filenameNotAllowed",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Link",
            type: ResultType.link,
            link: "https://sap.com",
            data: "xxx",
          },
        ]),
      ).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: ["link"],
        code: "dataNotAllowed",
        message: "dataNotAllowed",
        name: "dataNotAllowed",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Link",
            type: ResultType.link,
            link: "https://sap.com",
            messages: [],
          },
        ]),
      ).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: ["link"],
        code: "messagesNotAllowed",
        message: "messagesNotAllowed",
        name: "messagesNotAllowed",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();

      await expect(processingService.updateJob(ID, JobStatus.running, [{ name: "Data" }])).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: [],
        code: "resultTypeMissing",
        message: "resultTypeMissing",
        name: "resultTypeMissing",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Data",
            type: ResultType.data,
          },
        ]),
      ).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: ["data"],
        code: "mimeTypeMissing",
        message: "mimeTypeMissing",
        name: "mimeTypeMissing",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Data",
            type: ResultType.data,
            mimeType: "text/plain",
          },
        ]),
      ).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: ["data"],
        code: "filenameMissing",
        message: "filenameMissing",
        name: "filenameMissing",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Data",
            type: ResultType.data,
            mimeType: "text/plain",
            filename: "test.txt",
          },
        ]),
      ).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: ["data"],
        code: "dataMissing",
        message: "dataMissing",
        name: "dataMissing",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Data",
            type: ResultType.data,
            mimeType: "text/plain",
            filename: "test.txt",
            data: btoa("This is a test"),
            link: "https://sap.com",
          },
        ]),
      ).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: ["data"],
        code: "linkNotAllowed",
        message: "linkNotAllowed",
        name: "linkNotAllowed",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Data",
            type: ResultType.data,
            mimeType: "text/plain",
            filename: "test.txt",
            data: btoa("This is a test"),
            messages: [],
          },
        ]),
      ).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: ["data"],
        code: "messagesNotAllowed",
        message: "messagesNotAllowed",
        name: "messagesNotAllowed",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Message",
            type: ResultType.message,
          },
        ]),
      ).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: ["message"],
        code: "messagesMissing",
        message: "messagesMissing",
        name: "messagesMissing",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Message",
            type: ResultType.message,
            messages: {},
          },
        ]),
      ).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        message: "ASSERT_ARRAY",
        name: "Error",
        stack: "ASSERT_ARRAY",
        target: "results[0]/messages",
      });
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Message",
            type: ResultType.message,
            messages: [],
          },
        ]),
      ).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: ["message"],
        code: "messagesMissing",
        message: "messagesMissing",
        name: "messagesMissing",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Message",
            type: ResultType.message,
            messages: [{}],
          },
        ]),
      ).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: [],
        code: "codeMissing",
        message: "codeMissing",
        name: "codeMissing",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Message",
            type: ResultType.message,
            messages: [
              {
                code: "abc",
              },
            ],
          },
        ]),
      ).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: [],
        code: "textMissing",
        message: "textMissing",
        name: "textMissing",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Message",
            type: ResultType.message,
            messages: [
              {
                code: "abc",
                text: "This is a message",
              },
            ],
          },
        ]),
      ).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: [],
        code: "severityMissing",
        message: "severityMissing",
        name: "severityMissing",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Message",
            type: ResultType.message,
            messages: [
              {
                code: "abc",
                text: "This is a message",
                severity: "X",
              },
            ],
          },
        ]),
      ).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: ["X"],
        code: "invalidMessageSeverity",
        message: "invalidMessageSeverity",
        name: "invalidMessageSeverity",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Message",
            type: ResultType.message,
            messages: [
              {
                code: "abc",
                text: "This is a message",
                severity: MessageSeverity.error,
                createdAt: "xxx",
              },
            ],
          },
        ]),
      ).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: [
          "xxx",
          {
            type: "cds.Timestamp",
          },
        ],
        message: "ASSERT_DATA_TYPE",
        name: "Error",
        stack: "ASSERT_DATA_TYPE",
        target: "results[0]/messages[0]/createdAt",
      });
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Message",
            type: ResultType.message,
            messages: [
              {
                code: "abc",
                text: "This is a message",
                severity: MessageSeverity.error,
              },
            ],
            link: "https://sap.com",
          },
        ]),
      ).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: ["message"],
        code: "linkNotAllowed",
        message: "linkNotAllowed",
        name: "linkNotAllowed",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Message",
            type: ResultType.message,
            messages: [
              {
                code: "abc",
                text: "This is a message",
                severity: MessageSeverity.error,
              },
            ],
            mimeType: "text/plain",
          },
        ]),
      ).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: ["message"],
        code: "mimeTypeNotAllowed",
        message: "mimeTypeNotAllowed",
        name: "mimeTypeNotAllowed",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Message",
            type: ResultType.message,
            messages: [
              {
                code: "abc",
                text: "This is a message",
                severity: MessageSeverity.error,
              },
            ],
            filename: "test.txt",
          },
        ]),
      ).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: ["message"],
        code: "filenameNotAllowed",
        message: "filenameNotAllowed",
        name: "filenameNotAllowed",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Message",
            type: ResultType.message,
            messages: [
              {
                code: "abc",
                text: "This is a message",
                severity: MessageSeverity.error,
              },
            ],
            data: btoa("This is a test"),
          },
        ]),
      ).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: ["message"],
        code: "dataNotAllowed",
        message: "dataNotAllowed",
        name: "dataNotAllowed",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            type: ResultType.message,
            name: "Result",
            messages: [
              {
                code: "jobCompleted",
                severity: MessageSeverity.info,
                texts: [{}],
              },
            ],
          },
        ]),
      ).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: [],
        code: "localeMissing",
        message: "localeMissing",
        name: "localeMissing",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            type: ResultType.message,
            name: "Result",
            messages: [
              {
                code: "jobCompleted",
                severity: MessageSeverity.info,
                texts: [{ locale: "xx" }],
              },
            ],
          },
        ]),
      ).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: ["xx"],
        code: "invalidLocale",
        message: "invalidLocale",
        name: "invalidLocale",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
    });

    it("cancelJob - status", async () => {
      await expect(processingService.cancelJob("XXX")).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      let entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: ["XXX"],
        code: "jobNotFound",
        message: "jobNotFound",
        name: "jobNotFound",
        numericSeverity: 4,
        severity: "E",
        status: 404,
      });
      await clearEventQueue();

      await expect(processingService.updateJob(ID, "running")).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      await clearEventQueue();
      await expect(processingService.cancelJob(ID)).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: ["running", "canceled"],
        code: "statusTransitionNotAllowed",
        message: "statusTransitionNotAllowed",
        name: "statusTransitionNotAllowed",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();
    });

    it("cancelJob - completed", async () => {
      cds.env.requires["sap-afc-sdk"].mockProcessing = {
        default: JobStatus.completed,
      };
      await expect(processingService.processJob(ID)).resolves.not.toThrow();

      await processQueue("sapafcsdk.scheduling.ProcessingService");

      let entry = await eventQueueEntry("sapafcsdk.scheduling.ProcessingService", ID, "updateJob");
      expect(entry).toBeDefined();
      expect(entry.startAfter).toBeDefined();
      const result = await UPDATE.entity("sap.eventqueue.Event")
        .set({
          startAfter: null,
        })
        .where({ ID: entry.ID });
      expect(result).toBe(1);

      await processQueue("sapafcsdk.scheduling.ProcessingService");

      const job = await SELECT.one.from("sapafcsdk.scheduling.Job").where({ ID });
      expect(job.status_code).toBe(JobStatus.completed);

      await clearEventQueue();

      await expect(processingService.cancelJob(ID)).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(JSON.parse(entry.error)).toMatchObject({
        args: ["completed", "canceled"],
        code: "statusTransitionNotAllowed",
        message: "statusTransitionNotAllowed",
        name: "statusTransitionNotAllowed",
        numericSeverity: 4,
        severity: "E",
        status: 400,
      });
      await clearEventQueue();
    });

    it("notify", async () => {
      cds.env.requires["sap-afc-sdk"].mockProcessing = false;
      await expect(
        processingService.notify({
          notifications: [
            {
              name: "taskListStatusChanged",
              ID: "3a89dfec-59f9-4a91-90fe-3c7ca7407103",
              code: "TASKLIST-1",
              value: "obsolete",
            },
          ],
        }),
      ).resolves.not.toThrow();
      await processQueue("sapafcsdk.scheduling.ProcessingService");
      await clearEventQueue();
    });

    it("notify - mock", async () => {
      cds.env.requires["sap-afc-sdk"].mockProcessing = true;
      await expect(
        processingService.notify({
          notifications: [
            {
              name: "taskListStatusChanged",
              ID: "3a89dfec-59f9-4a91-90fe-3c7ca7407103",
              code: "TASKLIST-1",
              value: "obsolete",
            },
          ],
        }),
      ).resolves.not.toThrow();

      await processQueue("sapafcsdk.scheduling.ProcessingService");
      expect(log.output).toEqual(
        expect.stringMatching(
          /\[sapafcsdk\/notification] - \{\n\s*name: 'taskListStatusChanged',\n\s*ID: '3a89dfec-59f9-4a91-90fe-3c7ca7407103',\n\s*code: 'TASKLIST-1',\n\s*value: 'obsolete'\n\s*}/s,
        ),
      );
      log.clear();
      await clearEventQueue();
    });
  });
});
