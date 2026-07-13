import assert from "node:assert/strict";
import test from "node:test";

import { AppError } from "./error.ts";
import { apiErrorFromUnknown } from "./response.ts";

test("returns a declared forbidden error", async () => {
  const response = apiErrorFromUnknown(
    new AppError("FORBIDDEN", "접근 권한이 없습니다."),
  );

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), {
    success: false,
    error: { code: "FORBIDDEN", message: "접근 권한이 없습니다." },
  });
});

test("hides an unknown database error", async () => {
  const response = apiErrorFromUnknown(
    new Error('relation "users" does not exist'),
  );

  assert.equal(response.status, 500);
  assert.equal((await response.json()).error.code, "INTERNAL_ERROR");
});
