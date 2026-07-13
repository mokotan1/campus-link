import assert from "node:assert/strict";
import test from "node:test";

import { isAuthSessionError } from "./auth-session-error.ts";

test("detects missing auth session errors as session errors", () => {
  assert.equal(isAuthSessionError(new Error("Auth session missing!")), true);
});

test("does not treat unrelated errors as session errors", () => {
  assert.equal(isAuthSessionError(new Error("database connection failed")), false);
});
