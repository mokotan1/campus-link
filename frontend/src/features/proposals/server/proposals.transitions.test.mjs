import assert from "node:assert/strict";
import test from "node:test";

import { AppError } from "../../../lib/api/error.ts";
import {
  assertDistinctProposalUsers,
  assertNoDuplicateProposal,
  assertProjectOwnerForProposal,
  assertReceiverForProposalDecision,
} from "./proposals.guards.ts";

const owner = { id: 1, authUserId: "owner-auth", email: "owner@test.local" };
const receiver = { id: 2, authUserId: "receiver-auth", email: "receiver@test.local" };
const recruitingProject = {
  id: 10,
  owner_user_id: 1,
  title: "Campus App",
  campus: "Seoul",
  recruitment_status: "RECRUITING",
};

function assertAppError(fn, code) {
  assert.throws(fn, (error) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.code, code);
    return true;
  });
}

test("only project owner can create a proposal", () => {
  assert.doesNotThrow(() => assertProjectOwnerForProposal(owner, recruitingProject));

  assertAppError(
    () => assertProjectOwnerForProposal(receiver, recruitingProject),
    "FORBIDDEN",
  );
});

test("duplicate proposal returns DUPLICATE_RESOURCE", () => {
  assertAppError(() => assertNoDuplicateProposal({ id: 55 }), "DUPLICATE_RESOURCE");
});

test("only proposal receiver accepts or rejects proposal", () => {
  assert.doesNotThrow(() => assertReceiverForProposalDecision(receiver, receiver.id));

  assertAppError(
    () => assertReceiverForProposalDecision(owner, receiver.id),
    "FORBIDDEN",
  );
});

test("cannot send a proposal to yourself", () => {
  assertAppError(() => assertDistinctProposalUsers(owner, owner.id), "FORBIDDEN");
});
