import assert from "node:assert/strict";
import test from "node:test";

import { AppError } from "../../../lib/api/error.ts";
import {
  assertApplicantForWithdraw,
  assertCanApplyToProject,
  assertNoDuplicateApplication,
  assertProjectOwnerForApplicationDecision,
} from "./applications.guards.ts";

const owner = { id: 1, authUserId: "owner-auth", email: "owner@test.local" };
const applicant = { id: 2, authUserId: "applicant-auth", email: "applicant@test.local" };
const recruitingProject = {
  id: 10,
  owner_user_id: 1,
  title: "Campus App",
  campus: "Seoul",
  recruitment_status: "RECRUITING",
  required_roles: ["Developer"],
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
    () => assertCanApplyToProject(owner, recruitingProject),
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
