### Connect to AFC

#### CAP Node.js

**Configuration:**

```json
{
  "cds": {
    "requires": {
      "afc": {
        "kind": "rest",
        "model": "srv/external/afc",
        "service": "sap.afc.IntegrationService",
        "queued": {
          "kind": "persistent-queue"
        },
        "[production]": {
          "credentials": {
            "destination": "SAP_AFC",
            "path": "/api/integration/v1"
          },
          "destinationOptions": {
            "selectionStrategy": "alwaysProvider",
            "jwt": null
          }
        }
      }
    }
  }
}
```

**Usage:**

```js
class CustomSchedulingProcessingService extends SchedulingProcessingService {
  async init() {
    const { processJob } = this.operations;

    this.on(processJob, async (req, next) => {
      const afcJob = await this.afcReadJob(req, req.job);
      // ...
      await this.afcUpdateJob(req, req.job, JobStatus.completed, [
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
      await next();
    });
    super.init();
  }
}

module.exports = CustomSchedulingProcessingService;
```

#### CAP Java

**Configuration:**

```yaml
cds:
  remote.services:
    "[sap.afc.IntegrationService]":
      type: odata-v4
      destination:
        name: "SAP_AFC"
      http:
        service: "/odata/integration/v1"
```

**Usage:**

```java
@Component
@ServiceName(ProcessingService_.CDS_NAME)
public class CustomSchedulingProcessingHandler extends SchedulingProcessingBase {

  @On(event = ProcessJobContext.CDS_NAME)
  @HandlerOrder(HandlerOrder.EARLY)
  public void processJob(ProcessJobContext context) {
    Job job = (Job) context.get("job");
    Optional<TaskExternalJob> afcJob = this.afcReadJob(context, job);
    // ...
    JobResult result = JobResult.create();
    result.setType(ResultTypeCode.MESSAGE);
    result.setName("messages");
    JobResultMessage message = JobResultMessage.create();
    message.setCode("jobCompleted");
    message.setSeverity(MessageSeverityCode.INFO);
    result.setMessages(List.of(message));
    this.afcUpdateJob(context, job, JobStatusCode.COMPLETED, List.of(result));
    context.proceed();
  }
}
```
