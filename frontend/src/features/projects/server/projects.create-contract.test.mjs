import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { AppError, INTERNAL_ERROR_MESSAGE } from "../../../lib/api/error.ts";
import { apiCreated, resolveApiError } from "../../../lib/api/response.ts";
import { mapProjectRecord } from "../../../shared/lib/ui-mappers.ts";
import { validateProjectDates } from "./projects.guards.ts";
import { mapProjectRow } from "./projects.mapper.ts";
import {
  normalizeProjectPayload,
  validateExpectedMemberCount,
} from "./projects.payload.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REFERENCE_DATE = new Date("2026-07-14T00:00:00.000Z");
const FUTURE_DEADLINE = "2099-01-01";

function assertAppError(fn, code) {
  assert.throws(fn, (error) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.code, code);
    return true;
  });
}

/**
 * `projects.ts` re-exports `validateProjectPayload`, but that module imports
 * "server-only" (and Supabase-backed collaborators) and cannot be loaded in a
 * plain Node test process. This mirrors its logic 1:1 using the same
 * import-safe building blocks (`projects.payload.ts` / `projects.guards.ts`)
 * so the contract stays faithful without importing the guarded module.
 */
function assertValidatesAsProjectPayload(values, referenceDate) {
  if (!values.title) {
    throw new AppError("VALIDATION_ERROR", "프로젝트 제목은 필수입니다.");
  }

  if (!values.summary) {
    throw new AppError("VALIDATION_ERROR", "프로젝트 한 줄 소개는 필수입니다.");
  }

  if (!values.projectType) {
    throw new AppError("VALIDATION_ERROR", "프로젝트 유형은 필수입니다.");
  }

  if (!values.collaborationMode) {
    throw new AppError("VALIDATION_ERROR", "협업 방식은 필수입니다.");
  }

  validateExpectedMemberCount(values.expectedMemberCount);
  validateProjectDates(values, referenceDate);
}

function validCreationBody(overrides = {}) {
  return {
    title: "Campus Matching App",
    summary: "Build a campus matching app",
    description: "Longer description",
    projectType: "side",
    collaborationMode: "online",
    recruitmentStatus: "RECRUITING",
    campus: "Seoul",
    requiredRoles: ["Backend"],
    tools: ["TypeScript"],
    expectedMemberCount: null,
    startDate: "",
    endDate: "",
    recruitmentDeadline: FUTURE_DEADLINE,
    coverImageName: "",
    ...overrides,
  };
}

function mockProjectListRow(overrides = {}) {
  return {
    id: 7,
    owner_user_id: 42,
    title: "Campus Matching App",
    summary: "Build a campus matching app",
    description: "Longer description",
    project_type: "side",
    collaboration_mode: "online",
    recruitment_status: "RECRUITING",
    project_status: "RECRUITING",
    campus: "Seoul",
    required_roles: ["Backend"],
    tools: ["TypeScript"],
    expected_member_count: null,
    start_date: null,
    end_date: null,
    recruitment_deadline: FUTURE_DEADLINE,
    created_at: "2026-07-14T00:00:00.000Z",
    cover_image_name: null,
    ...overrides,
  };
}

test("a valid creation payload with expectedMemberCount: null and a future deadline passes normalization and validation", () => {
  const body = validCreationBody();
  const values = normalizeProjectPayload(body);

  assert.equal(values.expectedMemberCount, null);
  assert.equal(values.recruitmentDeadline, FUTURE_DEADLINE);
  assert.doesNotThrow(() => assertValidatesAsProjectPayload(values, REFERENCE_DATE));
});

test("invalid expectedMemberCount produces the public VALIDATION_ERROR response with HTTP 400", () => {
  for (const invalid of [0, -1, 1.5, "abc"]) {
    let caught;

    try {
      normalizeProjectPayload(validCreationBody({ expectedMemberCount: invalid }));
    } catch (error) {
      caught = error;
    }

    assert.ok(caught instanceof AppError, `expected AppError for ${invalid}`);
    assert.equal(caught.code, "VALIDATION_ERROR");

    const resolved = resolveApiError(caught);
    assert.equal(resolved.status, 400);
    assert.equal(resolved.body.error.code, "VALIDATION_ERROR");
  }

  assertAppError(() => validateExpectedMemberCount(0), "VALIDATION_ERROR");
  assertAppError(() => validateExpectedMemberCount(-1), "VALIDATION_ERROR");
});

test("a missing recruitment deadline produces the public VALIDATION_ERROR response with HTTP 400", () => {
  const values = normalizeProjectPayload(
    validCreationBody({ recruitmentDeadline: "", endDate: "" }),
  );

  assert.equal(values.recruitmentDeadline, "");

  let caught;

  try {
    assertValidatesAsProjectPayload(values, REFERENCE_DATE);
  } catch (error) {
    caught = error;
  }

  assert.ok(caught instanceof AppError);
  assert.equal(caught.code, "VALIDATION_ERROR");

  const resolved = resolveApiError(caught);
  assert.equal(resolved.status, 400);
  assert.equal(resolved.body.error.code, "VALIDATION_ERROR");
});

test("unexpected Supabase/PostgREST errors stay a generic 500 without leaking constraint names or SQL", () => {
  const rawSupabaseError = new Error(
    'new row for relation "projects" violates check constraint "projects_expected_member_count_positive_check"',
  );

  const resolved = resolveApiError(rawSupabaseError);

  assert.equal(resolved.status, 500);
  assert.equal(resolved.body.error.code, "INTERNAL_ERROR");
  assert.equal(resolved.body.error.message, INTERNAL_ERROR_MESSAGE);

  const serialized = JSON.stringify(resolved.body);
  assert.equal(serialized.includes("constraint"), false);
  assert.equal(serialized.includes("projects_expected_member_count_positive_check"), false);
  assert.equal(serialized.includes("relation"), false);
});

test("createProject validates the payload before touching the repository (source order guard)", () => {
  const source = fs.readFileSync(path.join(HERE, "projects.ts"), "utf8");
  const fnStart = source.indexOf("export async function createProject");
  assert.ok(fnStart !== -1, "createProject function not found in projects.ts");

  const fnEnd = source.indexOf("\n}", fnStart);
  assert.ok(fnEnd !== -1, "could not locate end of createProject function");

  const fnBody = source.slice(fnStart, fnEnd);
  const validateIndex = fnBody.indexOf("validateProjectPayload(values)");
  const repositoryIndex = fnBody.indexOf("projectRepository.create(");

  assert.ok(validateIndex !== -1, "validateProjectPayload call not found in createProject");
  assert.ok(repositoryIndex !== -1, "projectRepository.create call not found in createProject");
  assert.ok(
    validateIndex < repositoryIndex,
    "validateProjectPayload must run before repository access so bad input never reaches Supabase",
  );
});

test("a successful creation response echoes recruitmentDeadline, and list/detail mapping displays the same date", async () => {
  const row = mockProjectListRow({ recruitment_deadline: FUTURE_DEADLINE });
  const record = mapProjectRow(row, new Map(), null);

  assert.equal(record.recruitmentDeadline, FUTURE_DEADLINE);

  const response = apiCreated(record);
  assert.equal(response.status, 201);

  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.recruitmentDeadline, FUTURE_DEADLINE);

  const uiProject = mapProjectRecord(record);
  assert.equal(uiProject.deadline, FUTURE_DEADLINE);
});
