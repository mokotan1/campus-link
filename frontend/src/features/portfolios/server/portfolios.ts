import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppUser } from "@/features/auth/server/current-app-user";

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

type PortfolioRow = {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  external_url: string | null;
  role_in_work: string | null;
  tools: string[] | null;
  created_at: string;
};

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function mapPortfolioRow(row: PortfolioRow) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? "",
    externalUrl: row.external_url ?? "",
    roleInWork: row.role_in_work ?? "",
    tools: row.tools ?? [],
    createdAt: row.created_at,
    coverImageName: null,
  } satisfies PortfolioRecord;
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
    throw new Error("포트폴리오 제목은 필수입니다.");
  }

  if (!values.externalUrl) {
    throw new Error("포트폴리오 외부 링크는 필수입니다.");
  }

  if (!values.roleInWork) {
    throw new Error("작업물 내 역할은 필수입니다.");
  }

  try {
    const url = new URL(values.externalUrl);

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("invalid");
    }
  } catch {
    throw new Error("올바른 외부 링크 주소가 필요합니다.");
  }
}

export async function listMyPortfolios() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("portfolio_items")
    .select("id, user_id, title, description, external_url, role_in_work, tools, created_at")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => mapPortfolioRow(item as PortfolioRow));
}

export async function createPortfolio(values: PortfolioFormValues) {
  validatePortfolioPayload(values);

  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return null;
  }

  const admin = createAdminClient();
  const { data: existing, error: existingError } = await admin
    .from("portfolio_items")
    .select("id, user_id, title, description, external_url, role_in_work, tools, created_at")
    .eq("user_id", currentUser.id)
    .eq("external_url", values.externalUrl)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    const { data, error } = await admin
      .from("portfolio_items")
      .update({
        title: values.title,
        description: values.description || null,
        role_in_work: values.roleInWork || null,
        tools: values.tools,
      })
      .eq("id", existing.id)
      .select("id, user_id, title, description, external_url, role_in_work, tools, created_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapPortfolioRow(data as PortfolioRow);
  }

  const { data, error } = await admin
    .from("portfolio_items")
    .insert({
      user_id: currentUser.id,
      title: values.title,
      description: values.description || null,
      item_type: "EXTERNAL_LINK",
      external_url: values.externalUrl,
      role_in_work: values.roleInWork || null,
      tools: values.tools,
    })
    .select("id, user_id, title, description, external_url, role_in_work, tools, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapPortfolioRow(data as PortfolioRow);
}

export async function listPortfoliosByProfileId(profileId: number) {
  if (!Number.isInteger(profileId) || profileId <= 0) {
    throw new Error("올바른 프로필 ID가 필요합니다.");
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("user_id")
    .eq("id", profileId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile) {
    return null;
  }

  const { data, error } = await admin
    .from("portfolio_items")
    .select("id, user_id, title, description, external_url, role_in_work, tools, created_at")
    .eq("user_id", profile.user_id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => mapPortfolioRow(item as PortfolioRow));
}
