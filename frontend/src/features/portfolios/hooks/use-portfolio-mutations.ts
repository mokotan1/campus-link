"use client";

import { useCallback, useState } from "react";
import { idleSaveState, readApiResponse, type SaveState } from "@/shared/lib/api-client";
import type { PortfolioRecord } from "@/features/portfolios/server/portfolios";

type NewPortfolioInput = {
  title: string;
  role: string;
  summary: string;
  content: string;
  link?: string;
  coverImageName?: string;
};

export function usePortfolioMutations() {
  const [portfolioSaveState, setPortfolioSaveState] = useState<SaveState>(idleSaveState);

  const createPortfolio = useCallback(async (input: NewPortfolioInput) => {
    setPortfolioSaveState({ isSaving: true, error: null });
    try {
      await readApiResponse<PortfolioRecord>(
        await fetch("/api/portfolios", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: input.title,
            description: input.content,
            externalUrl: input.link,
            roleInWork: input.role,
            tools: [],
            coverImageName: input.coverImageName ?? "",
          }),
        }),
      );

      setPortfolioSaveState({ isSaving: false, error: null });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "포트폴리오를 등록하지 못했습니다. 다시 시도해주세요.";
      setPortfolioSaveState({ isSaving: false, error: message });
      throw error;
    }
  }, []);

  return { createPortfolio, portfolioSaveState };
}
