"use strict";

expect.extend({
  async toThrowAPIError(received, status, code, args) {
    let message = cds.i18n.messages.at(code, args);
    if (!message) {
      message = code;
      code = status;
    }
    const expected = `${status}: ${code} - ${message}`;
    const response = received.response.data?.error ?? received.response.data;
    const current = `${received.response.status}: ${response.code} - ${response.message}`;
    return {
      message: () => `Expected '${current}' to equal '${expected}'`,
      pass: current === expected,
    };
  },

  async toThrowAPIUnexpectedError(received) {
    const status = 500;
    let code = "unexpectedError";
    let message = cds.i18n.messages.at(code);
    if (!message) {
      message = code;
      code = status;
    }
    message = message.substring(0, message.indexOf(":"));
    const expected = `${status}: ${code} - ${message}`;
    const response = received.response.data?.error ?? received.response.data;
    const current = `${received.response.status}: ${response.code} - ${response.message}`;
    return {
      message: () => `Expected '${current}' start with '${expected}'`,
      pass: current.startsWith(expected),
    };
  },
});
