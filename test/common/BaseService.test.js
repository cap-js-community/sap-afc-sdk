"use strict";

const BaseService = require("../../srv/common/BaseService");

describe("Base Service", () => {
  it("Instantiation", async () => {
    const baseService = new BaseService();
    expect(baseService).toBeDefined();
    await baseService.init();
  });
});
