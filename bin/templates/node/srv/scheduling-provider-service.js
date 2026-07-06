import sdk from "@cap-js-community/sap-afc-sdk";

const { SchedulingProviderService } = sdk;

export default class CustomSchedulingProviderService extends SchedulingProviderService {
  async init() {
    const { Job, JobResult } = this.entities;

    this.on("CREATE", Job, async (req, next) => {
      // Your logic goes here
      await next();
    });

    this.on(Job.actions.cancel, Job, async (req, next) => {
      // Your logic goes here
      await next();
    });

    this.on(JobResult.actions.data, JobResult, async (req, next) => {
      // Your logic goes here
      await next();
    });

    super.init();
  }
}
