import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

import type { PortfolioFormValues, PortfolioRecord } from "./portfolios";

type PortfolioListRow = Pick<
  Tables<"portfolio_items">,
  | "id"
  | "user_id"
  | "title"
  | "description"
  | "external_url"
  | "role_in_work"
  | "tools"
  | "created_at"
  | "cover_image_name"
>;

const PORTFOLIO_SELECT =
  "id, user_id, title, description, external_url, role_in_work, tools, created_at, cover_image_name" as const;

function mapPortfolioRow(row: PortfolioListRow): PortfolioRecord {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? "",
    externalUrl: row.external_url ?? "",
    roleInWork: row.role_in_work ?? "",
    tools: row.tools ?? [],
    createdAt: row.created_at,
    coverImageName: row.cover_image_name,
  };
}

export interface PortfolioRepository {
  listByUserId(userId: number): Promise<PortfolioRecord[]>;
  createOrUpdateByUrl(userId: number, values: PortfolioFormValues): Promise<PortfolioRecord>;
  findUserIdByProfileId(profileId: number): Promise<number | null>;
}

export const portfolioRepository: PortfolioRepository = {
  async listByUserId(userId) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("portfolio_items")
      .select(PORTFOLIO_SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((item) => mapPortfolioRow(item));
  },

  async createOrUpdateByUrl(userId, values) {
    const supabase = await createClient();
    const { data: existing, error: existingError } = await supabase
      .from("portfolio_items")
      .select(PORTFOLIO_SELECT)
      .eq("user_id", userId)
      .eq("external_url", values.externalUrl)
      .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message);
    }

    if (existing) {
      const { data, error } = await supabase
        .from("portfolio_items")
        .update({
          title: values.title,
          description: values.description || null,
          role_in_work: values.roleInWork || null,
          tools: values.tools,
          cover_image_name: values.coverImageName || null,
        })
        .eq("id", existing.id)
        .select(PORTFOLIO_SELECT)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return mapPortfolioRow(data);
    }

    const { data, error } = await supabase
      .from("portfolio_items")
      .insert({
        user_id: userId,
        title: values.title,
        description: values.description || null,
        item_type: "EXTERNAL_LINK",
        external_url: values.externalUrl,
        role_in_work: values.roleInWork || null,
        tools: values.tools,
        cover_image_name: values.coverImageName || null,
      })
      .select(PORTFOLIO_SELECT)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapPortfolioRow(data);
  },

  async findUserIdByProfileId(profileId) {
    const supabase = await createClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("id", profileId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return profile?.user_id ?? null;
  },
};
