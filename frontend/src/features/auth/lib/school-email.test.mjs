import assert from "node:assert/strict";
import test from "node:test";

import { isSchoolEmail, schoolEmailMessage } from "./school-email.ts";

test("allows KMU student email subdomain", () => {
  assert.equal(isSchoolEmail("5702341@stu.kmu.ac.kr"), true);
});

test("allows Naver and Gmail email domains", () => {
  assert.equal(isSchoolEmail("campus.link@naver.com"), true);
  assert.equal(isSchoolEmail("campus.link@gmail.com"), true);
});

test("mentions every allowed email domain", () => {
  const message = schoolEmailMessage();

  assert.match(message, /kmu\.ac\.kr/);
  assert.match(message, /stu\.kmu\.ac\.kr/);
  assert.match(message, /naver\.com/);
  assert.match(message, /gmail\.com/);
});
