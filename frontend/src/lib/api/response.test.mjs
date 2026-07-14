import assert from "node:assert/strict";
import test from "node:test";

import { AppError, INTERNAL_ERROR_MESSAGE } from "./error.ts";
import { resolveApiError } from "./response.ts";

test("resolveApiError maps native AppError instances to their public status", () => {
  const resolved = resolveApiError(
    new AppError("VALIDATION_ERROR", "모집 마감일은 필수입니다."),
  );

  assert.equal(resolved.status, 400);
  assert.equal(resolved.body.error.code, "VALIDATION_ERROR");
  assert.equal(resolved.body.error.message, "모집 마감일은 필수입니다.");
});

test("resolveApiError recognizes AppError-shaped objects from a duplicated module copy", () => {
  // Simulate Next bundling `@/lib/api/error` separately from `./error.ts`.
  class ForeignAppError extends Error {
    constructor(message) {
      super(message);
      this.name = "AppError";
      this.code = "VALIDATION_ERROR";
    }
  }

  const resolved = resolveApiError(
    new ForeignAppError("예상 모집 인원은 비우거나 1 이상의 정수여야 합니다."),
  );

  assert.equal(resolved.status, 400);
  assert.equal(resolved.body.error.code, "VALIDATION_ERROR");
  assert.equal(
    resolved.body.error.message,
    "예상 모집 인원은 비우거나 1 이상의 정수여야 합니다.",
  );
});

test("resolveApiError keeps unexpected errors as opaque INTERNAL_ERROR 500", () => {
  const resolved = resolveApiError(
    new Error(
      'new row for relation "projects" violates check constraint "projects_expected_member_count_positive_check"',
    ),
  );

  assert.equal(resolved.status, 500);
  assert.equal(resolved.body.error.code, "INTERNAL_ERROR");
  assert.equal(resolved.body.error.message, INTERNAL_ERROR_MESSAGE);
  assert.equal(
    JSON.stringify(resolved.body).includes("projects_expected_member_count_positive_check"),
    false,
  );
});

test("resolveApiError maps UNAUTHORIZED duck-typed errors to HTTP 401", () => {
  const resolved = resolveApiError({
    name: "AppError",
    code: "UNAUTHORIZED",
    message: "로그인이 필요합니다.",
  });

  assert.equal(resolved.status, 401);
  assert.equal(resolved.body.error.code, "UNAUTHORIZED");
});
