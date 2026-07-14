import assert from "node:assert/strict";
import test from "node:test";

import { listMyProjectsForUser, mapProjectRow } from "./projects.mapper.ts";

test("unauthenticated returns the service sentinel used by routes", async () => {
  const result = await listMyProjectsForUser(null, async () => {
    assert.fail("listMine must not be called when unauthenticated");
  });

  assert.equal(result, null);
});

test("passes the owner user id to listMine", async () => {
  /** @type {number[]} */
  const calls = [];

  const result = await listMyProjectsForUser({ id: 42 }, async (ownerUserId) => {
    calls.push(ownerUserId);
    return [];
  });

  assert.deepEqual(calls, [42]);
  assert.deepEqual(result, []);
});

test("mapped records include projectStatus and recruitmentDeadline", () => {
  const mapped = mapProjectRow(
    {
      id: 7,
      owner_user_id: 42,
      title: "Owner Project",
      summary: "Closed but still mine",
      description: null,
      project_type: "side",
      collaboration_mode: "online",
      recruitment_status: "CLOSED",
      project_status: "IN_PROGRESS",
      campus: "Seoul",
      required_roles: ["Backend"],
      tools: ["TypeScript"],
      expected_member_count: 3,
      start_date: null,
      end_date: null,
      recruitment_deadline: "2026-07-01",
      created_at: "2026-07-01T00:00:00.000Z",
      cover_image_name: null,
    },
    new Map(),
    { id: 42, email: "owner@test.local", name: "Owner" },
  );

  assert.equal(mapped.projectStatus, "IN_PROGRESS");
  assert.equal(mapped.recruitmentDeadline, "2026-07-01");
  assert.equal(mapped.recruitmentStatus, "CLOSED");
});
