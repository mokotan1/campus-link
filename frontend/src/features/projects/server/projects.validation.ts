import { AppError } from "../../../lib/api/error.ts";

import { validateProjectDates } from "./projects.guards.ts";
import {
  type ProjectFormValues,
  validateExpectedMemberCount,
} from "./projects.payload.ts";

export function validateProjectPayload(
  values: ProjectFormValues,
  referenceDate: Date = new Date(),
) {
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
