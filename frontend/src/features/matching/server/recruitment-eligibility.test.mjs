import assert from "node:assert/strict";
import test from "node:test";

import { AppError } from "../../../lib/api/error.ts";
import {
  assertActorEligible,
  assertProposalReceiverEligible,
  assertRecruitmentOpen,
  isRecruitmentOpen,
} from "./recruitment-eligibility.ts";

/** Injected calendar day — never read the machine clock. */
const TODAY = "2026-07-14";

function assertAppError(fn, code) {
  assert.throws(fn, (error) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.code, code);
    return true;
  });
}

test("recruiting with future, today, or legacy-null deadline is open", () => {
  assert.equal(
    isRecruitmentOpen(
      { recruitment_status: "RECRUITING", recruitment_deadline: "2026-07-20" },
      TODAY,
    ),
    true,
  );
  assert.equal(
    isRecruitmentOpen(
      { recruitment_status: "RECRUITING", recruitment_deadline: TODAY },
      TODAY,
    ),
    true,
  );
  assert.equal(
    isRecruitmentOpen(
      { recruitment_status: "RECRUITING", recruitment_deadline: null },
      TODAY,
    ),
    true,
  );
  assert.doesNotThrow(() =>
    assertRecruitmentOpen(
      { recruitment_status: "RECRUITING", recruitment_deadline: TODAY },
      TODAY,
    ),
  );
});

test("closed status is never open", () => {
  assert.equal(
    isRecruitmentOpen(
      { recruitment_status: "CLOSED", recruitment_deadline: "2026-07-20" },
      TODAY,
    ),
    false,
  );
  assert.equal(
    isRecruitmentOpen(
      { recruitment_status: "CLOSED", recruitment_deadline: null },
      TODAY,
    ),
    false,
  );
  assertAppError(
    () =>
      assertRecruitmentOpen(
        { recruitment_status: "CLOSED", recruitment_deadline: "2026-07-20" },
        TODAY,
      ),
    "INVALID_STATE_TRANSITION",
  );
});

test("past deadline is closed", () => {
  assert.equal(
    isRecruitmentOpen(
      { recruitment_status: "RECRUITING", recruitment_deadline: "2026-07-13" },
      TODAY,
    ),
    false,
  );
  assertAppError(
    () =>
      assertRecruitmentOpen(
        { recruitment_status: "RECRUITING", recruitment_deadline: "2026-07-13" },
        TODAY,
      ),
    "INVALID_STATE_TRANSITION",
  );
});

test("actor must be email verified and onboarding complete", () => {
  assert.doesNotThrow(() =>
    assertActorEligible({
      email_verified: true,
      onboarding_completed: true,
      collaboration_status: "CLOSED",
    }),
  );

  assertAppError(
    () =>
      assertActorEligible({
        email_verified: false,
        onboarding_completed: true,
        collaboration_status: "OPEN",
      }),
    "FORBIDDEN",
  );
  assertAppError(
    () =>
      assertActorEligible({
        email_verified: true,
        onboarding_completed: false,
        collaboration_status: "OPEN",
      }),
    "FORBIDDEN",
  );
});

test("proposal receiver must be onboarding complete and collaboration OPEN", () => {
  assert.doesNotThrow(() =>
    assertProposalReceiverEligible({
      email_verified: false,
      onboarding_completed: true,
      collaboration_status: "OPEN",
    }),
  );

  assertAppError(
    () =>
      assertProposalReceiverEligible({
        email_verified: true,
        onboarding_completed: false,
        collaboration_status: "OPEN",
      }),
    "FORBIDDEN",
  );
  assertAppError(
    () =>
      assertProposalReceiverEligible({
        email_verified: true,
        onboarding_completed: true,
        collaboration_status: "CLOSED",
      }),
    "FORBIDDEN",
  );
});
