"use strict";

const cds = require("@sap/cds");
const { text } = require("node:stream/consumers");
const util = require("util");
const { Readable } = require("stream");

const { cleanData, connectToWS, clearEventQueue, eventQueueEntry, processOutbox } = require("../helper");
const { JobStatus, ResultType, MessageSeverity } = require("../../srv/scheduling/common/codelist");

const { test } = cds.test(__dirname + "/../..");

process.env.PORT = 0; // Random

let processingService;

const ID = "3a89dfec-59f9-4a91-90fe-3c7ca7407103";

describe("Processing Service", () => {
  const log = cds.test.log();

  beforeAll(async () => {
    processingService = await cds.connect.to("SchedulingProcessingService");
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

    await processOutbox("processing");

    let job = await SELECT.one.from("scheduling.Job").where({ ID });
    expect(job.status_code).toBe(JobStatus.running);

    await processOutbox("websocket");
    let event = await message;
    expect(event.ID).toBe(ID);
    expect(event.status).toBe(JobStatus.running);

    ws.close();
  });

  it("processJob - simple mock - completed", async () => {
    cds.env.requires["sap-afc-sdk"].mockProcessing = true;
    await expect(processingService.processJob(ID)).resolves.not.toThrow();

    await processOutbox("processing");

    const entry = await eventQueueEntry("processing", ID, "updateJob");
    expect(entry).toBeDefined();
    expect(entry.startAfter).toBeDefined();
    const result = await UPDATE.entity("sap.eventqueue.Event")
      .set({
        startAfter: null,
      })
      .where({ ID: entry.ID });
    expect(result).toBe(1);

    await processOutbox("processing");

    const job = await SELECT.one.from("scheduling.Job").where({ ID });
    expect(job.status_code).toBe(JobStatus.completed);

    const jobResult = await SELECT.from("scheduling.JobResult").where({ job_ID: ID });
    expect(cleanData(jobResult)).toMatchSnapshot();
  });

  it("processJob - simple mock - completed with warning", async () => {
    cds.env.requires["sap-afc-sdk"].mockProcessing = {
      default: JobStatus.completedWithWarning,
    };
    await expect(processingService.processJob(ID)).resolves.not.toThrow();

    await processOutbox("processing");

    const entry = await eventQueueEntry("processing", ID, "updateJob");
    expect(entry).toBeDefined();
    expect(entry.startAfter).toBeDefined();
    const result = await UPDATE.entity("sap.eventqueue.Event")
      .set({
        startAfter: null,
      })
      .where({ ID: entry.ID });
    expect(result).toBe(1);

    await processOutbox("processing");

    const job = await SELECT.one.from("scheduling.Job").where({ ID });
    expect(job.status_code).toBe(JobStatus.completedWithWarning);

    const jobResult = await SELECT.from("scheduling.JobResult").where({ job_ID: ID });
    expect(cleanData(jobResult)).toMatchSnapshot();
  });

  it("processJob - simple mock - completed with error", async () => {
    cds.env.requires["sap-afc-sdk"].mockProcessing = {
      default: JobStatus.completedWithError,
    };
    await expect(processingService.processJob(ID)).resolves.not.toThrow();

    await processOutbox("processing");

    const entry = await eventQueueEntry("processing", ID, "updateJob");
    expect(entry).toBeDefined();
    expect(entry.startAfter).toBeDefined();
    const result = await UPDATE.entity("sap.eventqueue.Event")
      .set({
        startAfter: null,
      })
      .where({ ID: entry.ID });
    expect(result).toBe(1);

    await processOutbox("processing");

    const job = await SELECT.one.from("scheduling.Job").where({ ID });
    expect(job.status_code).toBe(JobStatus.completedWithError);

    const jobResult = await SELECT.from("scheduling.JobResult").where({ job_ID: ID });
    expect(cleanData(jobResult)).toMatchSnapshot();
  });

  it("processJob - simple mock - failed", async () => {
    cds.env.requires["sap-afc-sdk"].mockProcessing = {
      default: JobStatus.failed,
    };
    await expect(processingService.processJob(ID)).resolves.not.toThrow();

    await processOutbox("processing");

    const entry = await eventQueueEntry("processing", ID, "updateJob");
    expect(entry).toBeDefined();
    expect(entry.startAfter).toBeDefined();
    const result = await UPDATE.entity("sap.eventqueue.Event")
      .set({
        startAfter: null,
      })
      .where({ ID: entry.ID });
    expect(result).toBe(1);

    await processOutbox("processing");

    const job = await SELECT.one.from("scheduling.Job").where({ ID });
    expect(job.status_code).toBe(JobStatus.failed);

    const jobResult = await SELECT.from("scheduling.JobResult").where({ job_ID: ID });
    expect(cleanData(jobResult)).toMatchSnapshot();
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

    await processOutbox("processing");

    let entry = await eventQueueEntry("processing", ID, "updateJob");
    expect(entry).toBeDefined();
    expect(entry.startAfter).toBeDefined();
    const result = await UPDATE.entity("sap.eventqueue.Event")
      .set({
        startAfter: null,
      })
      .where({ ID: entry.ID });
    expect(result).toBe(1);

    await processOutbox("processing");

    const job = await SELECT.one.from("scheduling.Job").where({ ID });
    expect(job.status_code).not.toBe(JobStatus.running);
    expect(job.status_code).not.toBe(JobStatus.requested);
  });

  it("updateJob - status", async () => {
    const ws = await connectToWS("job-scheduling");

    let message = ws.message("jobStatusChanged");
    await expect(processingService.updateJob(ID, JobStatus.running)).resolves.not.toThrow();

    await processOutbox();
    let event = await message;
    expect(event.ID).toBe(ID);
    expect(event.status).toBe("running");

    message = ws.message("jobStatusChanged");
    await expect(processingService.updateJob(ID, JobStatus.completed)).resolves.not.toThrow();

    await processOutbox();
    const job = await SELECT.one.from("scheduling.Job").where({ ID });
    expect(job.status_code).toBe(JobStatus.completed);
    event = await message;
    expect(event.ID).toBe(ID);
    expect(event.status).toBe(JobStatus.completed);

    await expect(processingService.updateJob(ID, JobStatus.completed)).resolves.not.toThrow();
    await processOutbox();

    ws.close();
  });

  it("updateJob - results - base64", async () => {
    await expect(processingService.updateJob(ID, JobStatus.running)).resolves.not.toThrow();
    await processOutbox();
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
              text: "Job completed successfully",
              severity: MessageSeverity.info,
            },
          ],
        },
      ]),
    ).resolves.not.toThrow();
    await processOutbox();
    const job = await SELECT.one.from("scheduling.Job").where({ ID });
    expect(job.status_code).toBe(JobStatus.completed);
    const jobResults = await SELECT.from("scheduling.JobResult").where({ job_ID: ID });
    const resultIDs = jobResults.map((j) => j.ID);
    expect(cleanData(jobResults)).toMatchSnapshot();
    const jobMessages = await SELECT.from("scheduling.JobResultMessage").where({ result_ID: { in: resultIDs } });
    expect(cleanData(jobMessages)).toMatchSnapshot();
    const result = await SELECT.one
      .from("scheduling.JobResult")
      .columns("data")
      .where({ job_ID: ID, type: ResultType.data });
    const data = await text(result.data);
    expect(data).toEqual("This is a test");
  });

  it("updateJob - results - readable", async () => {
    await expect(processingService.updateJob(ID, JobStatus.running)).resolves.not.toThrow();
    await processOutbox();
    const stream = new Readable();
    stream.push("This is a test");
    stream.push(null);
    await expect(
      processingService.updateJob(ID, JobStatus.completed, [
        {
          type: ResultType.data,
          name: "Data",
          filename: "test.txt",
          mimeType: "text/plain",
          data: stream,
        },
      ]),
    ).resolves.not.toThrow();
    await processOutbox();
    const job = await SELECT.one.from("scheduling.Job").where({ ID });
    expect(job.status_code).toBe(JobStatus.completed);
    const jobResults = await SELECT.from("scheduling.JobResult").where({ job_ID: ID });
    const resultIDs = jobResults.map((j) => j.ID);
    expect(cleanData(jobResults)).toMatchSnapshot();
    const jobMessages = await SELECT.from("scheduling.JobResultMessage").where({ result_ID: { in: resultIDs } });
    expect(cleanData(jobMessages)).toMatchSnapshot();
    const result = await SELECT.one
      .from("scheduling.JobResult")
      .columns("data")
      .where({ job_ID: ID, type: ResultType.data });
    const data = await text(result.data);
    expect(data).toEqual("���r�^i֛�");
  });

  it("updateJob - results - arraybuffer", async () => {
    await expect(processingService.updateJob(ID, JobStatus.running)).resolves.not.toThrow();
    await processOutbox();
    const encoder = new util.TextEncoder();
    await expect(
      processingService.updateJob(ID, JobStatus.completed, [
        {
          type: ResultType.data,
          name: "Data",
          filename: "test.txt",
          mimeType: "text/plain",
          data: encoder.encode("This is a test"),
        },
      ]),
    ).resolves.not.toThrow();
    await processOutbox();
    expect(log.output).toEqual(expect.stringMatching(/ASSERT_DATA_TYPE.*LargeBinary { type: 'cds.LargeBinary' }/s));
  });

  it("cancelJob", async () => {
    const ws = await connectToWS("job-scheduling");
    let message = ws.message("jobStatusChanged");

    await expect(processingService.cancelJob(ID)).resolves.not.toThrow();

    await processOutbox("processing");

    const job = await SELECT.one.from("scheduling.Job").where({ ID });
    expect(job.status_code).toBe(JobStatus.canceled);

    await processOutbox("websocket");
    let event = await message;
    expect(event.ID).toBe(ID);
    expect(event.status).toBe(JobStatus.canceled);

    ws.close();
  });

  describe("Error Situations", () => {
    it("processJob", async () => {
      await expect(processingService.processJob("XXX")).resolves.not.toThrow();
      await processOutbox("processing");
      const entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/jobNotFound.*XXX/s));
      log.clear();
      await clearEventQueue();
    });

    it("updateJob - status", async () => {
      await expect(processingService.updateJob("XXX")).resolves.not.toThrow();
      await processOutbox("processing");
      let entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/jobNotFound.*XXX/s));
      log.clear();
      await clearEventQueue();

      await expect(processingService.updateJob(ID)).resolves.not.toThrow();
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/statusValueMissing/s));
      log.clear();
      await clearEventQueue();

      await expect(processingService.updateJob(ID, "XXX")).resolves.not.toThrow();
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/invalidJobStatus.*XXX/s));
      log.clear();
      await clearEventQueue();

      await expect(processingService.updateJob(ID, JobStatus.completed)).resolves.not.toThrow();
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/statusTransitionNotAllowed.*requested.*completed/s));
      log.clear();
      await clearEventQueue();
    });

    it("updateJob - results", async () => {
      await expect(processingService.updateJob(ID, JobStatus.completed, {})).resolves.not.toThrow();
      await processOutbox("processing");
      let entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/message: 'ASSERT_ARRAY', target: 'results'/s));
      log.clear();
      await clearEventQueue();

      await expect(processingService.updateJob(ID, JobStatus.running, [{}])).resolves.not.toThrow();
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/resultNameMissing/s));
      log.clear();
      await clearEventQueue();

      await expect(processingService.updateJob(ID, JobStatus.running, [{ name: "Link" }])).resolves.not.toThrow();
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/resultTypeMissing/s));
      log.clear();
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [{ name: "Link", type: "X" }]),
      ).resolves.not.toThrow();
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/invalidResultType.*'X'/s));
      log.clear();
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Link",
            type: ResultType.link,
          },
        ]),
      ).resolves.not.toThrow();
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/linkMissing/s));
      log.clear();
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Link",
            type: ResultType.link,
            link: "https://sap.com",
            mimeType: "plain/text",
          },
        ]),
      ).resolves.not.toThrow();
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/mimeTypeNotAllowed/s));
      log.clear();
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
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/filenameNotAllowed/s));
      log.clear();
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
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/dataNotAllowed/s));
      log.clear();
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
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/messagesNotAllowed/s));
      log.clear();
      await clearEventQueue();

      await expect(processingService.updateJob(ID, JobStatus.running, [{ name: "Data" }])).resolves.not.toThrow();
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/resultTypeMissing/s));
      log.clear();
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Data",
            type: ResultType.data,
          },
        ]),
      ).resolves.not.toThrow();
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/mimeTypeMissing/s));
      log.clear();
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Data",
            type: ResultType.data,
            mimeType: "plain/text",
          },
        ]),
      ).resolves.not.toThrow();
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/filenameMissing/s));
      log.clear();
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Data",
            type: ResultType.data,
            mimeType: "plain/text",
            filename: "test.txt",
          },
        ]),
      ).resolves.not.toThrow();
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/dataMissing/s));
      log.clear();
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Data",
            type: ResultType.data,
            mimeType: "plain/text",
            filename: "test.txt",
            data: btoa("This is a test"),
            link: "https://sap.com",
          },
        ]),
      ).resolves.not.toThrow();
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/linkNotAllowed/s));
      log.clear();
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Data",
            type: ResultType.data,
            mimeType: "plain/text",
            filename: "test.txt",
            data: btoa("This is a test"),
            messages: [],
          },
        ]),
      ).resolves.not.toThrow();
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/messagesNotAllowed/s));
      log.clear();
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Message",
            type: ResultType.message,
          },
        ]),
      ).resolves.not.toThrow();
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/messagesMissing/s));
      log.clear();
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
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/ASSERT_ARRAY', target: 'messages'/s));
      log.clear();
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
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/messagesMissing/s));
      log.clear();
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
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/textMissing/s));
      log.clear();
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Message",
            type: ResultType.message,
            messages: [{ text: "This is a message" }],
          },
        ]),
      ).resolves.not.toThrow();
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/severityMissing/s));
      log.clear();
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Message",
            type: ResultType.message,
            messages: [{ text: "This is a message", severity: "X" }],
          },
        ]),
      ).resolves.not.toThrow();
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/invalidMessageSeverity.*'X'/s));
      log.clear();
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Message",
            type: ResultType.message,
            messages: [{ text: "This is a message", severity: MessageSeverity.error }],
            link: "https://sap.com",
          },
        ]),
      ).resolves.not.toThrow();
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/linkNotAllowed/s));
      log.clear();
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Message",
            type: ResultType.message,
            messages: [{ text: "This is a message", severity: MessageSeverity.error }],
            mimeType: "text/plain",
          },
        ]),
      ).resolves.not.toThrow();
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/mimeTypeNotAllowed/s));
      log.clear();
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Message",
            type: ResultType.message,
            messages: [{ text: "This is a message", severity: MessageSeverity.error }],
            filename: "test.txt",
          },
        ]),
      ).resolves.not.toThrow();
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/filenameNotAllowed/s));
      log.clear();
      await clearEventQueue();

      await expect(
        processingService.updateJob(ID, JobStatus.running, [
          {
            name: "Message",
            type: ResultType.message,
            messages: [{ text: "This is a message", severity: MessageSeverity.error }],
            data: btoa("This is a test"),
          },
        ]),
      ).resolves.not.toThrow();
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/dataNotAllowed/s));
      log.clear();
      await clearEventQueue();
    });

    it("cancelJob", async () => {
      await expect(processingService.cancelJob("XXX")).resolves.not.toThrow();
      await processOutbox("processing");
      let entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/jobNotFound.*XXX/s));
      log.clear();
      await clearEventQueue();

      await expect(processingService.updateJob(ID, "running")).resolves.not.toThrow();
      await processOutbox("processing");
      log.clear();
      await clearEventQueue();
      await expect(processingService.cancelJob(ID)).resolves.not.toThrow();
      await processOutbox("processing");
      entry = await eventQueueEntry();
      expect(entry).toBeDefined();
      expect(entry.status).toBe(3);
      expect(log.output).toEqual(expect.stringMatching(/statusTransitionNotAllowed.*running.*canceled/s));
      log.clear();
      await clearEventQueue();
    });
  });
});
