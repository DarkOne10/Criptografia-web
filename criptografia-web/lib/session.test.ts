import assert from "node:assert/strict";
import test from "node:test";

import { isSecureRequest } from "./session.js";

test("isSecureRequest returns true for HTTPS-forwarded requests", () => {
  const request = new Request("https://example.com/api/auth/login", {
    headers: {
      "x-forwarded-proto": "https",
    },
  });

  assert.equal(isSecureRequest(request), true);
});

test("isSecureRequest returns false for plain HTTP requests", () => {
  const request = new Request("http://example.com/api/auth/login");

  assert.equal(isSecureRequest(request), false);
});
