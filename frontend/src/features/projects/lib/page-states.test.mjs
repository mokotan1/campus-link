import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveApplicationsPageState,
  resolvePageRenderState,
  resolveProjectDetailState,
  resolveProjectsListState,
} from "./page-states.ts";

test("resolvePageRenderState prioritizes error and forbidden", () => {
  assert.equal(
    resolvePageRenderState({ authenticated: true, error: true, hasData: true }),
    "error",
  );
  assert.equal(
    resolvePageRenderState({ authenticated: true, forbidden: true, hasData: true }),
    "forbidden",
  );
  assert.equal(
    resolvePageRenderState({ authenticated: false, notFound: true }),
    "not-found",
  );
  assert.equal(resolvePageRenderState({ authenticated: false }), "unauthorized");
  assert.equal(resolvePageRenderState({ authenticated: true, hasData: false }), "empty");
  assert.equal(resolvePageRenderState({ authenticated: true, hasData: true }), "ready");
});

test("route-specific helpers match P0 rendering contract", () => {
  assert.equal(resolveProjectsListState(3), "ready");
  assert.equal(resolveProjectsListState(0), "empty");
  assert.equal(resolveProjectDetailState(true), "ready");
  assert.equal(resolveProjectDetailState(false), "not-found");
  assert.equal(resolveApplicationsPageState(false, 0), "unauthorized");
  assert.equal(resolveApplicationsPageState(true, 0), "empty");
  assert.equal(resolveApplicationsPageState(true, 2), "ready");
});
