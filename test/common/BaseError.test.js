"use strict";

const BaseError = require("../../srv/common/BaseError");

describe("Base Error", () => {
  it("Instantiation", async () => {
    const baseError = new BaseError("test", {
      args: [],
      httpStatus: 400,
      target: "name",
      severity: "E",
      cause: null,
      info: { a: 1 },
    });
    expect(baseError.info).toMatchObject({ a: 1 });
    expect(BaseError.isError(baseError)).toBe(true);
    expect(BaseError.toError(baseError)).toBe(baseError);
    expect(BaseError.isError("baseError")).toBe(false);
    expect(BaseError.toError("baseError")).toMatchObject(new Error("'baseError'"));
    const baseError2 = new BaseError("test");
    expect(BaseError.isError(baseError2)).toBe(true);
    const baseError3 = new BaseError("test", { cause: baseError2 });
    expect(BaseError.isError(baseError3)).toBe(true);
  });
});
