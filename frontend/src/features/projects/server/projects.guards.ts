import { AppError } from "../../../lib/api/error.ts";

type ProjectAvailability = {
  recruitment_status: string;
  end_date: string | null;
};

type ProjectDates = {
  startDate: string;
  endDate: string;
  recruitmentDeadline: string;
};

function parseDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function validateProjectDates(values: ProjectDates, referenceDate = new Date()) {
  if (!values.recruitmentDeadline) {
    throw new AppError("VALIDATION_ERROR", "모집 마감일은 필수입니다.");
  }

  if (!parseDateOnly(values.recruitmentDeadline)) {
    throw new AppError("VALIDATION_ERROR", "모집 마감일 형식이 올바르지 않습니다.");
  }

  if (values.recruitmentDeadline < toDateKey(referenceDate)) {
    throw new AppError("VALIDATION_ERROR", "모집 마감일은 오늘 또는 미래 날짜여야 합니다.");
  }

  if (values.startDate && !parseDateOnly(values.startDate)) {
    throw new AppError("VALIDATION_ERROR", "시작일 형식이 올바르지 않습니다.");
  }

  if (values.endDate && !parseDateOnly(values.endDate)) {
    throw new AppError("VALIDATION_ERROR", "종료일 형식이 올바르지 않습니다.");
  }

  if (values.startDate && values.endDate && values.startDate > values.endDate) {
    throw new AppError(
      "VALIDATION_ERROR",
      "시작일은 종료일보다 늦을 수 없습니다.",
    );
  }
}

export function isProjectAcceptingNewParticipants(
  project: ProjectAvailability,
  referenceDate = new Date(),
) {
  const deadline = project.end_date;

  return (
    project.recruitment_status === "RECRUITING" &&
    typeof deadline === "string" &&
    deadline >= toDateKey(referenceDate)
  );
}

export function assertProjectAcceptingNewParticipants(
  project: ProjectAvailability,
  referenceDate = new Date(),
) {
  if (!isProjectAcceptingNewParticipants(project, referenceDate)) {
    throw new AppError(
      "INVALID_STATE_TRANSITION",
      "모집 중이며 마감일이 지나지 않은 프로젝트에만 요청할 수 있습니다.",
    );
  }
}
