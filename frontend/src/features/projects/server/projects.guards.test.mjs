import assert from "node:assert/strict";
import test from "node:test";

import { AppError } from "../../../lib/api/error.ts";
import {
  assertProjectAcceptingNewParticipants,
  validateProjectDates,
} from "./projects.guards.ts";

function assertAppError(fn, code) {
  assert.throws(fn, (error) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.code, code);
    return true;
  });
}

test("requires a future recruitment deadline", () => {
  assertAppError(
    () =>
      validateProjectDates(
        { startDate: "2026-07-15", endDate: "2026-07-10" },
        new Date("2026-07-14T00:00:00.000Z"),
      ),
    "VALIDATION_ERROR",
  );
});

test("rejects a project that starts after recruitment ends", () => {
  assertAppError(
    () =>
      validateProjectDates(
        { startDate: "2026-07-20", endDate: "2026-07-19" },
        new Date("2026-07-14T00:00:00.000Z"),
      ),
    "VALIDATION_ERROR",
  );
});

test("allows participation only while recruiting before the deadline", () => {
  assert.doesNotThrow(() =>
    assertProjectAcceptingNewParticipants(
      { recruitment_status: "RECRUITING", end_date: "2026-07-14" },
      new Date("2026-07-14T00:00:00.000Z"),
    ),
  );

  assertAppError(
    () =>
      assertProjectAcceptingNewParticipants(
        { recruitment_status: "RECRUITING", end_date: "2026-07-13" },
        new Date("2026-07-14T00:00:00.000Z"),
      ),
    "INVALID_STATE_TRANSITION",
  );
});
