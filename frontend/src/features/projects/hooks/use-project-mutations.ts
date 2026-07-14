"use client";

import { useCallback, useState } from "react";
import type { Project } from "@/shared/types";
import { idleSaveState, readApiResponse, type SaveState } from "@/shared/lib/api-client";
import type { ProjectRecord } from "@/features/projects/server/projects";

type NewProjectInput = {
  title: string;
  campus: Project["campus"];
  role: string;
  status: Project["status"];
  recruitmentDeadline: string;
  summary: string;
  content: string;
  tagLabels: string[];
  coverImageName?: string;
};

export function useProjectMutations() {
  const [projectSaveState, setProjectSaveState] = useState<SaveState>(idleSaveState);

  const createProject = useCallback(async (input: NewProjectInput) => {
    setProjectSaveState({ isSaving: true, error: null });
    try {
      await readApiResponse<ProjectRecord>(
        await fetch("/api/projects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: input.title,
            summary: input.summary,
            description: input.content,
            projectType: "GENERAL",
            collaborationMode: "MIXED",
            recruitmentStatus: input.status === "완료" ? "CLOSED" : "RECRUITING",
            campus: input.campus,
            requiredRoles: [input.role],
            tools: input.tagLabels,
            expectedMemberCount: null,
            startDate: "",
            endDate: "",
            recruitmentDeadline: input.recruitmentDeadline,
            coverImageName: input.coverImageName ?? "",
          }),
        }),
      );

      setProjectSaveState({ isSaving: false, error: null });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "프로젝트를 등록하지 못했습니다. 다시 시도해주세요.";
      setProjectSaveState({ isSaving: false, error: message });
      throw error;
    }
  }, []);

  return { createProject, projectSaveState };
}
