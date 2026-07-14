import assert from "node:assert/strict";
import test from "node:test";

import { AppError } from "../../../lib/api/error.ts";
import {
  assertActorEligible,
  assertProposalReceiverEligible,
  assertRecruitmentOpen,
} from "../../matching/server/recruitment-eligibility.ts";
import {
  assertDistinctProposalUsers,
  assertNoDuplicateProposal,
  assertProjectOwnerForProposal,
  assertProposalReceiverExists,
  assertReceiverForProposalDecision,
} from "./proposals.guards.ts";

/** Injected calendar day — never read the machine clock. */
const TODAY = "2026-07-14";

const owner = { id: 1, authUserId: "owner-auth", email: "owner@test.local" };
const receiver = { id: 2, authUserId: "receiver-auth", email: "receiver@test.local" };
const recruitingProject = {
  id: 10,
  owner_user_id: 1,
  title: "Campus App",
  campus: "Seoul",
  recruitment_status: "RECRUITING",
  recruitment_deadline: "2026-07-20",
};

const eligibleActor = {
  email_verified: true,
  onboarding_completed: true,
  collaboration_status: "CLOSED",
};

const eligibleReceiver = {
  email_verified: true,
  onboarding_completed: true,
  collaboration_status: "OPEN",
};

function assertAppError(fn, code) {
  assert.throws(fn, (error) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.code, code);
    return true;
  });
}

test("non-owner cannot propose", () => {
  assert.doesNotThrow(() => assertProjectOwnerForProposal(owner, recruitingProject));

  assertAppError(
    () => assertProjectOwnerForProposal(receiver, recruitingProject),
    "FORBIDDEN",
  );
});

test("closed project cannot propose", () => {
  assertAppError(
    () =>
      assertRecruitmentOpen(
        { recruitment_status: "CLOSED", recruitment_deadline: "2026-07-20" },
        TODAY,
      ),
    "INVALID_STATE_TRANSITION",
  );
});

test("past-deadline project cannot propose", () => {
  assertAppError(
    () =>
      assertRecruitmentOpen(
        { recruitment_status: "RECRUITING", recruitment_deadline: "2026-07-13" },
        TODAY,
      ),
    "INVALID_STATE_TRANSITION",
  );
});

test("deadline-today project can propose", () => {
  assert.doesNotThrow(() =>
    assertRecruitmentOpen(
      { recruitment_status: "RECRUITING", recruitment_deadline: TODAY },
      TODAY,
    ),
  );
});

test("sender must be verified and onboarding complete", () => {
  assert.doesNotThrow(() => assertActorEligible(eligibleActor));

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

test("receiver must exist", () => {
  assert.doesNotThrow(() => assertProposalReceiverExists(eligibleReceiver));

  assertAppError(() => assertProposalReceiverExists(null), "NOT_FOUND");
});

test("receiver must be verified, onboarding complete, and collaboration OPEN", () => {
  assert.doesNotThrow(() => assertProposalReceiverEligible(eligibleReceiver));

  assertAppError(
    () =>
      assertProposalReceiverEligible({
        email_verified: false,
        onboarding_completed: true,
        collaboration_status: "OPEN",
      }),
    "FORBIDDEN",
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

test("sender cannot equal receiver", () => {
  assertAppError(() => assertDistinctProposalUsers(owner, owner.id), "FORBIDDEN");
  assert.doesNotThrow(() => assertDistinctProposalUsers(owner, receiver.id));
});

test("same project/sender/receiver duplicate is rejected", () => {
  assertAppError(() => assertNoDuplicateProposal({ id: 55 }), "DUPLICATE_RESOURCE");
  assert.doesNotThrow(() => assertNoDuplicateProposal(null));
});

test("only proposal receiver accepts or rejects proposal", () => {
  assert.doesNotThrow(() => assertReceiverForProposalDecision(receiver, receiver.id));

  assertAppError(
    () => assertReceiverForProposalDecision(owner, receiver.id),
    "FORBIDDEN",
  );
});
