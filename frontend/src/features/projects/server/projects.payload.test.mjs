import assert from "node:assert/strict";
import test from "node:test";

import { AppError } from "../../../lib/api/error.ts";
import {
  normalizeExpectedMemberCount,
  normalizeProjectPayload,
} from "./projects.payload.ts";

function assertAppError(fn, code) {
  assert.throws(fn, (error) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.code, code);
    return true;
  });
}

test("blank expectedMemberCount values normalize to null", () => {
  assert.equal(normalizeExpectedMemberCount(null), null);
  assert.equal(normalizeExpectedMemberCount(undefined), null);
  assert.equal(normalizeExpectedMemberCount(""), null);
  assert.equal(normalizeExpectedMemberCount("   "), null);
});

test("positive integer expectedMemberCount values are accepted", () => {
  assert.equal(normalizeExpectedMemberCount(3), 3);
  assert.equal(normalizeExpectedMemberCount("3"), 3);
});

test("invalid expectedMemberCount values are rejected as VALIDATION_ERROR", () => {
  assertAppError(() => normalizeExpectedMemberCount(0), "VALIDATION_ERROR");
  assertAppError(() => normalizeExpectedMemberCount(-1), "VALIDATION_ERROR");
  assertAppError(() => normalizeExpectedMemberCount(1.5), "VALIDATION_ERROR");
  assertAppError(() => normalizeExpectedMemberCount("1.5"), "VALIDATION_ERROR");
  assertAppError(() => normalizeExpectedMemberCount("abc"), "VALIDATION_ERROR");
  assertAppError(() => normalizeExpectedMemberCount(Infinity), "VALIDATION_ERROR");
  assertAppError(() => normalizeExpectedMemberCount(-Infinity), "VALIDATION_ERROR");
  assertAppError(() => normalizeExpectedMemberCount(NaN), "VALIDATION_ERROR");
});

test("normalizeProjectPayload maps blank expectedMemberCount to null", () => {
  const values = normalizeProjectPayload({
    title: "Demo",
    expectedMemberCount: null,
  });

  assert.equal(values.expectedMemberCount, null);
});

test("normalizeProjectPayload accepts numeric and string positive counts", () => {
  assert.equal(
    normalizeProjectPayload({ expectedMemberCount: 3 }).expectedMemberCount,
    3,
  );
  assert.equal(
    normalizeProjectPayload({ expectedMemberCount: "3" }).expectedMemberCount,
    3,
  );
});

test("normalizeProjectPayload rejects invalid expectedMemberCount", () => {
  assertAppError(
    () => normalizeProjectPayload({ expectedMemberCount: 0 }),
    "VALIDATION_ERROR",
  );
  assertAppError(
    () => normalizeProjectPayload({ expectedMemberCount: "nope" }),
    "VALIDATION_ERROR",
  );
});
