import assert from "node:assert/strict";
import test from "node:test";

import { isSchoolEmail, schoolEmailMessage } from "./school-email.ts";

test("allows KMU student email subdomain", () => {
  assert.equal(isSchoolEmail("5702341@stu.kmu.ac.kr"), true);
});

test("mentions both allowed KMU email domains", () => {
  const message = schoolEmailMessage();

  assert.match(message, /kmu\.ac\.kr/);
  assert.match(message, /stu\.kmu\.ac\.kr/);
});
