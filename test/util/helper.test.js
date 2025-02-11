"use strict";

const { mergeDeep } = require("../../src/util/helper");

describe("Helper", () => {
  it("mergeDeep", async () => {
    const objects = [
      {
        a: 1,
        b: "1",
        c: ["1"],
        d: {
          da: 1,
          db: "1",
          dc: ["1"],
        },
      },
      {
        a: 2,
        b: "2",
        c: ["2"],
        d: {
          da: 2,
          db: "2",
          dc: ["2"],
        },
      },
      {
        a: 3,
        b: "3",
        c: ["3"],
        d: {
          da: 3,
          db: "3",
          dc: ["3"],
        },
      },
    ];
    expect(mergeDeep(...objects)).toEqual({
      a: 3,
      b: "3",
      c: ["1", "2", "3"],
      d: {
        da: 3,
        db: "3",
        dc: ["1", "2", "3"],
      },
    });
  });
});
