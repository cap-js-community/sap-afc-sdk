"use strict";

const BaseApplicationService = require("../../srv/common/BaseApplicationService");

describe("Base Application Service", () => {
  it("Instantiation", async () => {
    const baseApplicationService = new BaseApplicationService();
    expect(baseApplicationService).toBeDefined();
    baseApplicationService.model = {
      definitions: {},
    };
    await baseApplicationService.init();
  });
});
