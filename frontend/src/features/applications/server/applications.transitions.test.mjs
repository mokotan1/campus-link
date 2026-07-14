import assert from "node:assert/strict";
import test from "node:test";

import { AppError } from "../../../lib/api/error.ts";
import {
  assertActorEligible,
} from "../../matching/server/recruitment-eligibility.ts";
import {
  assertApplicantForWithdraw,
  assertApplicationTransitionResult,
  assertCanApplyToProject,
  assertNoDuplicateApplication,
  assertPendingApplicationStatus,
  assertProjectOwnerForApplicationDecision,
} from "./applications.guards.ts";

const TODAY = "2026-07-14";

const owner = { id: 1, authUserId: "owner-auth", email: "owner@test.local" };
const applicant = { id: 2, authUserId: "applicant-auth", email: "applicant@test.local" };
const recruitingProject = {
  id: 10,
  owner_user_id: 1,
  title: "Campus App",
  campus: "Seoul",
  recruitment_status: "RECRUITING",
  recruitment_deadline: "2026-07-20",
  required_roles: ["Developer"],
};

const acceptedRow = {
  id: 42,
  project_id: 10,
  applicant_user_id: 2,
  message: "hello",
  application_status: "ACCEPTED",
  target_role: "Developer",
  created_at: "2026-07-01T00:00:00Z",
};

function assertAppError(fn, code) {
  assert.throws(fn, (error) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.code, code);
    return true;
  });
}

test("cannot apply to own project", () => {
  assertAppError(
    () => assertCanApplyToProject(owner, recruitingProject, TODAY),
    "FORBIDDEN",
  );
});

test("past deadline -> INVALID_STATE_TRANSITION", () => {
  assertAppError(
    () =>
      assertCanApplyToProject(
        applicant,
        {
          ...recruitingProject,
          recruitment_deadline: "2026-07-13",
        },
        TODAY,
      ),
    "INVALID_STATE_TRANSITION",
  );
});

test("deadline today -> allowed", () => {
  assert.doesNotThrow(() =>
    assertCanApplyToProject(
      applicant,
      {
        ...recruitingProject,
        recruitment_deadline: TODAY,
      },
      TODAY,
    ),
  );
});

test("unverified or incomplete applicant -> FORBIDDEN", () => {
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

test("duplicate application returns DUPLICATE_RESOURCE", () => {
  assertAppError(() => assertNoDuplicateApplication({ id: 99 }), "DUPLICATE_RESOURCE");
});

test("only project owner accepts or rejects application", () => {
  assert.doesNotThrow(() =>
    assertProjectOwnerForApplicationDecision(owner, recruitingProject.owner_user_id),
  );

  assertAppError(
    () => assertProjectOwnerForApplicationDecision(applicant, recruitingProject.owner_user_id),
    "FORBIDDEN",
  );
});

test("only applicant can withdraw application", () => {
  assert.doesNotThrow(() => assertApplicantForWithdraw(applicant, applicant.id));

  assertAppError(
    () => assertApplicantForWithdraw(owner, applicant.id),
    "FORBIDDEN",
  );
});

test("accept returns requested application id and ACCEPTED", () => {
  const result = assertApplicationTransitionResult(acceptedRow, 42, "ACCEPTED");
  assert.equal(result.id, 42);
  assert.equal(result.application_status, "ACCEPTED");
});

test("reject returns requested application id and REJECTED", () => {
  const result = assertApplicationTransitionResult(
    { ...acceptedRow, application_status: "REJECTED" },
    42,
    "REJECTED",
  );
  assert.equal(result.id, 42);
  assert.equal(result.application_status, "REJECTED");
});

test("withdraw returns requested application id and CANCELED", () => {
  const result = assertApplicationTransitionResult(
    { ...acceptedRow, application_status: "CANCELED" },
    42,
    "CANCELED",
  );
  assert.equal(result.id, 42);
  assert.equal(result.application_status, "CANCELED");
});

test("RPC null, wrong id, or wrong status -> INTERNAL_ERROR", () => {
  assertAppError(
    () => assertApplicationTransitionResult(null, 42, "ACCEPTED"),
    "INTERNAL_ERROR",
  );
  assertAppError(
    () => assertApplicationTransitionResult([acceptedRow], 42, "ACCEPTED"),
    "INTERNAL_ERROR",
  );
  assertAppError(
    () => assertApplicationTransitionResult({ ...acceptedRow, id: 99 }, 42, "ACCEPTED"),
    "INTERNAL_ERROR",
  );
  assertAppError(
    () =>
      assertApplicationTransitionResult(
        { ...acceptedRow, application_status: "REJECTED" },
        42,
        "ACCEPTED",
      ),
    "INTERNAL_ERROR",
  );
});

test("already transitioned application -> INVALID_STATE_TRANSITION", () => {
  assertAppError(
    () => assertPendingApplicationStatus("ACCEPTED"),
    "INVALID_STATE_TRANSITION",
  );
  assertAppError(
    () => assertPendingApplicationStatus("REJECTED"),
    "INVALID_STATE_TRANSITION",
  );
  assertAppError(
    () => assertPendingApplicationStatus("CANCELED"),
    "INVALID_STATE_TRANSITION",
  );
});
