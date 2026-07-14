import { AppError } from "../../../lib/api/error.ts";

export type ProjectFormValues = {
  title: string;
  summary: string;
  description: string;
  projectType: string;
  collaborationMode: string;
  recruitmentStatus: "RECRUITING" | "CLOSED";
  campus: string;
  requiredRoles: string[];
  tools: string[];
  expectedMemberCount: number | null;
  startDate: string;
  endDate: string;
  recruitmentDeadline: string;
  coverImageName: string;
};

export const EXPECTED_MEMBER_COUNT_MESSAGE =
  "예상 모집 인원은 비우거나 1 이상의 정수여야 합니다.";

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function isBlankExpectedMemberCount(raw: unknown): boolean {
  if (raw === null || raw === undefined) {
    return true;
  }

  if (typeof raw === "string" && raw.trim() === "") {
    return true;
  }

  return false;
}

/**
 * Database contract: `number | null` where a number is a positive integer.
 * Blank / missing values become null; invalid values throw VALIDATION_ERROR.
 */
export function normalizeExpectedMemberCount(raw: unknown): number | null {
  if (isBlankExpectedMemberCount(raw)) {
    return null;
  }

  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw <= 0) {
      throw new AppError("VALIDATION_ERROR", EXPECTED_MEMBER_COUNT_MESSAGE);
    }

    return raw;
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();

    if (!/^\d+$/.test(trimmed)) {
      throw new AppError("VALIDATION_ERROR", EXPECTED_MEMBER_COUNT_MESSAGE);
    }

    const parsed = Number(trimmed);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new AppError("VALIDATION_ERROR", EXPECTED_MEMBER_COUNT_MESSAGE);
    }

    return parsed;
  }

  throw new AppError("VALIDATION_ERROR", EXPECTED_MEMBER_COUNT_MESSAGE);
}

export function validateExpectedMemberCount(value: number | null) {
  if (value === null) {
    return;
  }

  if (!Number.isInteger(value) || value <= 0) {
    throw new AppError("VALIDATION_ERROR", EXPECTED_MEMBER_COUNT_MESSAGE);
  }
}

export function normalizeProjectPayload(body: unknown): ProjectFormValues {
  const payload = (body ?? {}) as Record<string, unknown>;
  const recruitmentStatus =
    payload.recruitmentStatus === "CLOSED" ? "CLOSED" : "RECRUITING";
  const startDate = String(payload.startDate ?? "").trim();
  const endDate = String(payload.endDate ?? "").trim();
  const rawRecruitmentDeadline = String(payload.recruitmentDeadline ?? "").trim();
  // LEGACY: if recruitmentDeadline missing/blank, use non-empty endDate as deadline temporarily
  const recruitmentDeadline = rawRecruitmentDeadline || endDate;

  return {
    title: String(payload.title ?? "").trim(),
    summary: String(payload.summary ?? "").trim(),
    description: String(payload.description ?? "").trim(),
    projectType: String(payload.projectType ?? "").trim(),
    collaborationMode: String(payload.collaborationMode ?? "").trim(),
    recruitmentStatus,
    campus: String(payload.campus ?? "").trim(),
    requiredRoles: toStringArray(payload.requiredRoles),
    tools: toStringArray(payload.tools),
    expectedMemberCount: normalizeExpectedMemberCount(payload.expectedMemberCount),
    startDate,
    endDate,
    recruitmentDeadline,
    coverImageName: String(payload.coverImageName ?? "").trim().slice(0, 255),
  };
}
