import assert from "node:assert/strict";
import test from "node:test";

import { AppError } from "../../../lib/api/error.ts";
import { assertContactDisclosureAllowed } from "../../matching/server/contact-disclosure.guards.ts";

function assertAppError(fn, code) {
  assert.throws(fn, (error) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.code, code);
    return true;
  });
}

test("pending pair cannot read contact details", () => {
  assertAppError(() => assertContactDisclosureAllowed("PENDING"), "FORBIDDEN");
});

test("rejected pair cannot read contact details", () => {
  assertAppError(() => assertContactDisclosureAllowed("REJECTED"), "FORBIDDEN");
});

test("accepted pair can read contact details", () => {
  assert.doesNotThrow(() => assertContactDisclosureAllowed("ACCEPTED"));
});
