import assert from "node:assert/strict";
import test from "node:test";

import { mapProjectRecord } from "./ui-mappers.ts";

function baseProjectRecord(overrides = {}) {
  return {
    id: 1,
    title: "Campus App",
    summary: "Build a campus matching app",
    description: "Longer description",
    projectType: "side",
    collaborationMode: "online",
    recruitmentStatus: "RECRUITING",
    projectStatus: "RECRUITING",
    campus: "Seoul",
    requiredRoles: ["Backend"],
    tools: ["TypeScript"],
    expectedMemberCount: 3,
    startDate: "2026-08-01",
    endDate: "2026-09-01",
    recruitmentDeadline: "2026-07-20",
    createdAt: "2026-07-01T00:00:00.000Z",
    coverImageName: null,
    owner: {
      userId: 42,
      email: "owner@test.local",
      name: "Owner",
      department: "CS",
    },
    ...overrides,
  };
}

test("displayed deadline prefers recruitmentDeadline over endDate", () => {
  const mapped = mapProjectRecord(
    baseProjectRecord({
      recruitmentDeadline: "2026-07-20",
      endDate: "2026-09-01",
    }),
  );

  assert.equal(mapped.deadline, "2026-07-20");
});

test("legacy record can fall back to endDate when recruitmentDeadline is missing", () => {
  const mapped = mapProjectRecord(
    baseProjectRecord({
      recruitmentDeadline: null,
      endDate: "2026-08-15",
    }),
  );

  assert.equal(mapped.deadline, "2026-08-15");
});

test("deadline is blank when both recruitmentDeadline and endDate are missing", () => {
  const mapped = mapProjectRecord(
    baseProjectRecord({
      recruitmentDeadline: null,
      endDate: null,
    }),
  );

  assert.equal(mapped.deadline, "");
});
