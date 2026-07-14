import assert from "node:assert/strict";
import test from "node:test";

import { AppError } from "../../../lib/api/error.ts";
import {
  assertProjectAcceptingNewParticipants,
  isProjectAcceptingNewParticipants,
  validateProjectDates,
} from "./projects.guards.ts";

function assertAppError(fn, code) {
  assert.throws(fn, (error) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.code, code);
    return true;
  });
}

const referenceDate = new Date("2026-07-14T00:00:00.000Z");

test("rejects a missing recruitment deadline", () => {
  assertAppError(
    () =>
      validateProjectDates(
        { startDate: "", endDate: "", recruitmentDeadline: "" },
        referenceDate,
      ),
    "VALIDATION_ERROR",
  );
});

test("rejects yesterday as recruitment deadline", () => {
  assertAppError(
    () =>
      validateProjectDates(
        { startDate: "", endDate: "", recruitmentDeadline: "2026-07-13" },
        referenceDate,
      ),
    "VALIDATION_ERROR",
  );
});

test("allows today as recruitment deadline", () => {
  assert.doesNotThrow(() =>
    validateProjectDates(
      { startDate: "", endDate: "", recruitmentDeadline: "2026-07-14" },
      referenceDate,
    ),
  );
});

test("allows a future recruitment deadline", () => {
  assert.doesNotThrow(() =>
    validateProjectDates(
      { startDate: "", endDate: "", recruitmentDeadline: "2026-08-01" },
      referenceDate,
    ),
  );
});

test("rejects an invalid recruitment deadline format", () => {
  assertAppError(
    () =>
      validateProjectDates(
        { startDate: "", endDate: "", recruitmentDeadline: "07/14/2026" },
        referenceDate,
      ),
    "VALIDATION_ERROR",
  );
});

test("when both schedule dates are present, requires startDate <= endDate", () => {
  assertAppError(
    () =>
      validateProjectDates(
        {
          startDate: "2026-08-01",
          endDate: "2026-07-20",
          recruitmentDeadline: "2026-07-14",
        },
        referenceDate,
      ),
    "VALIDATION_ERROR",
  );

  assert.doesNotThrow(() =>
    validateProjectDates(
      {
        startDate: "2026-07-20",
        endDate: "2026-08-01",
        recruitmentDeadline: "2026-07-14",
      },
      referenceDate,
    ),
  );
});

test("does not compare project start date to recruitment deadline", () => {
  assert.doesNotThrow(() =>
    validateProjectDates(
      {
        startDate: "2026-08-01",
        endDate: "",
        recruitmentDeadline: "2026-07-14",
      },
      referenceDate,
    ),
  );
});

test("allows participation only while recruiting before the deadline", () => {
  assert.doesNotThrow(() =>
    assertProjectAcceptingNewParticipants(
      { recruitment_status: "RECRUITING", recruitment_deadline: "2026-07-14" },
      referenceDate,
    ),
  );

  assertAppError(
    () =>
      assertProjectAcceptingNewParticipants(
        { recruitment_status: "RECRUITING", recruitment_deadline: "2026-07-13" },
        referenceDate,
      ),
    "INVALID_STATE_TRANSITION",
  );
});

test("today is eligible and yesterday is closed for participation", () => {
  assert.equal(
    isProjectAcceptingNewParticipants(
      { recruitment_status: "RECRUITING", recruitment_deadline: "2026-07-14" },
      referenceDate,
    ),
    true,
  );

  assert.equal(
    isProjectAcceptingNewParticipants(
      { recruitment_status: "RECRUITING", recruitment_deadline: "2026-07-13" },
      referenceDate,
    ),
    false,
  );
});

test("recruitment_deadline, not a conflicting end_date, decides eligibility", () => {
  assert.equal(
    isProjectAcceptingNewParticipants(
      {
        recruitment_status: "RECRUITING",
        recruitment_deadline: "2026-07-14",
        end_date: "2026-07-13",
      },
      referenceDate,
    ),
    true,
  );

  assert.equal(
    isProjectAcceptingNewParticipants(
      {
        recruitment_status: "RECRUITING",
        recruitment_deadline: "2026-07-13",
        end_date: "2026-07-20",
      },
      referenceDate,
    ),
    false,
  );
});
