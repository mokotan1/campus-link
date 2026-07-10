import assert from "node:assert/strict";
import test from "node:test";

import { toAppUser } from "./current-app-user.mapper.ts";

test("toAppUser rejects an app user that is not linked to the auth subject", () => {
  assert.throws(() => toAppUser({ id: 1, auth_user_id: null, email: "student@school.ac.kr" }), /UNAUTHORIZED/);
});

test("toAppUser rejects a missing app user record", () => {
  assert.throws(() => toAppUser(null), /UNAUTHORIZED/);
  assert.throws(() => toAppUser(undefined), /UNAUTHORIZED/);
});

test("toAppUser rejects a row whose auth_user_id does not match the authenticated session", () => {
  assert.throws(
    () => toAppUser({ id: 1, auth_user_id: "11111111-1111-1111-1111-111111111111", email: "student@school.ac.kr" }, "22222222-2222-2222-2222-222222222222"),
    /UNAUTHORIZED/
  );
});

test("toAppUser rejects a linked row that is missing an email", () => {
  assert.throws(
    () => toAppUser({ id: 1, auth_user_id: "11111111-1111-1111-1111-111111111111", email: null }),
    /UNAUTHORIZED/
  );
});

test("toAppUser maps a properly linked row to a CurrentAppUser", () => {
  const authUserId = "11111111-1111-1111-1111-111111111111";

  assert.deepEqual(toAppUser({ id: 1, auth_user_id: authUserId, email: "student@school.ac.kr" }, authUserId), {
    id: 1,
    authUserId,
    email: "student@school.ac.kr",
  });
});
