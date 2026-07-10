import "server-only";

import { getCurrentAppUser } from "@/features/auth/server/current-app-user";
import { AppError } from "@/lib/api/error";

import { portfolioRepository } from "./portfolios.repository";

export type PortfolioFormValues = {
  title: string;
  description: string;
  externalUrl: string;
  roleInWork: string;
  tools: string[];
  coverImageName: string;
};

export type PortfolioRecord = {
  id: number;
  userId: number;
  title: string;
  description: string;
  externalUrl: string;
  roleInWork: string;
  tools: string[];
  createdAt: string;
  coverImageName: string | null;
};

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

export function normalizePortfolioPayload(body: unknown): PortfolioFormValues {
  const payload = (body ?? {}) as Record<string, unknown>;

  return {
    title: String(payload.title ?? "").trim(),
    description: String(payload.description ?? "").trim(),
    externalUrl: String(payload.externalUrl ?? "").trim(),
    roleInWork: String(payload.roleInWork ?? "").trim(),
    tools: toStringArray(payload.tools),
    coverImageName: String(payload.coverImageName ?? "").trim().slice(0, 255),
  };
}

export function validatePortfolioPayload(values: PortfolioFormValues) {
  if (!values.title) {
    throw new AppError("VALIDATION_ERROR", "포트폴리오 제목은 필수입니다.");
  }

  if (!values.externalUrl) {
    throw new AppError("VALIDATION_ERROR", "포트폴리오 외부 링크는 필수입니다.");
  }

  if (!values.roleInWork) {
    throw new AppError("VALIDATION_ERROR", "작업물 내 역할은 필수입니다.");
  }

  try {
    const url = new URL(values.externalUrl);

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new AppError("VALIDATION_ERROR", "올바른 외부 링크 주소가 필요합니다.");
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("VALIDATION_ERROR", "올바른 외부 링크 주소가 필요합니다.");
  }
}

export async function listMyPortfolios() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  return portfolioRepository.listByUserId(currentUser.id);
}

export async function createPortfolio(values: PortfolioFormValues) {
  validatePortfolioPayload(values);

  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  return portfolioRepository.createOrUpdateByUrl(currentUser.id, values);
}

export async function listPortfoliosByProfileId(profileId: number) {
  if (!Number.isInteger(profileId) || profileId <= 0) {
    throw new AppError("VALIDATION_ERROR", "올바른 프로필 ID가 필요합니다.");
  }

  const userId = await portfolioRepository.findUserIdByProfileId(profileId);

  if (!userId) {
    return null;
  }

  return portfolioRepository.listByUserId(userId);
}
