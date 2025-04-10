"use strict";

const {
  merge,
  isObject,
  toObject,
  wildcard,
  toMap,
  unique,
  labelLocales,
  messageLocales,
} = require("../../src/util/helper");

describe("Helper", () => {
  it("merge", async () => {
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
    expect(merge(...objects)).toEqual({
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

  it("isObject", async () => {
    expect(isObject({})).toBe(true);
    expect(isObject(null)).toBe(false);
    expect(isObject(undefined)).toBe(false);
    expect(isObject("text")).toBe(false);
    expect(isObject(false)).toBe(false);
    expect(isObject(1)).toBe(false);
  });

  it("toObject", async () => {
    expect(toObject({ a: 1 })).toEqual({ a: 1 });
    expect(toObject(false)).toEqual({});
  });

  it("wildcard", async () => {
    expect(wildcard("*search*")).toBe("%search%");
    expect(wildcard("*search")).toBe("%search");
    expect(wildcard("search*")).toBe("search%");
    expect(wildcard("*sea*rch*")).toBe("%sea*rch%");
    expect(wildcard("sea*rch")).toBe("sea*rch");
    expect(wildcard("search")).toBe("search");
  });

  it("toMap", async () => {
    expect(
      toMap([
        {
          name: "a",
          value: 1,
        },
        {
          name: "b",
          value: 2,
        },
      ]),
    ).toEqual({
      a: {
        name: "a",
        value: 1,
      },
      b: {
        name: "b",
        value: 2,
      },
    });
    expect(
      toMap(
        [
          {
            key: "a",
            value: 1,
          },
          {
            key: "b",
            value: 2,
          },
        ],
        "key",
      ),
    ).toEqual({
      a: {
        key: "a",
        value: 1,
      },
      b: {
        key: "b",
        value: 2,
      },
    });
  });

  it("unique", async () => {
    expect(unique([3, 2, 3, 1, 2])).toEqual([1, 2, 3]);
  });

  it("labelLocales", async () => {
    expect(labelLocales()).toMatchSnapshot();
  });

  it("messageLocales", async () => {
    expect(messageLocales()).toMatchSnapshot();
  });
});
