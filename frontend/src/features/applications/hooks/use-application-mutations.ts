"use client";

import { useCallback, useState } from "react";
import type { Application, Project } from "@/shared/types";
import { idleSaveState, readApiResponse, type SaveState } from "@/shared/lib/api-client";
import { mapApplicationRecord } from "@/shared/lib/ui-mappers";
import type { MyApplicationRecord } from "@/features/applications/server/applications";

type NewApplicationInput = {
  title: string;
  type: Application["type"];
  meta: string;
  projectId?: string | number;
  talentId?: string | number;
};

type UseApplicationMutationsOptions = {
  initialApplications: Application[];
  projects: Project[];
};

export function useApplicationMutations({ initialApplications, projects }: UseApplicationMutationsOptions) {
  const [applications, setApplications] = useState(initialApplications);
  const [applicationSaveState, setApplicationSaveState] = useState<SaveState>(idleSaveState);

  const hasApplied = useCallback(
    ({
      projectId,
      talentId,
      type,
    }: {
      projectId?: string | number;
      talentId?: string | number;
      type: Application["type"];
    }) => {
      return applications.some((item) => {
        if (item.direction !== "sent" || item.type !== type) return false;
        if (projectId !== undefined) return String(item.projectId) === String(projectId);
        if (talentId !== undefined) return String(item.talentId) === String(talentId);
        return false;
      });
    },
    [applications],
  );

  const createApplication = useCallback(
    async (input: NewApplicationInput) => {
      setApplicationSaveState({ isSaving: true, error: null });
      try {
        if (hasApplied({ projectId: input.projectId, talentId: input.talentId, type: input.type })) {
          setApplicationSaveState({ isSaving: false, error: null });
          return;
        }

        const project = input.projectId
          ? projects.find((item) => String(item.id) === String(input.projectId))
          : undefined;

        if (input.type === "제안" || !input.projectId || !project) {
          setApplications((current) => [
            {
              id: Date.now(),
              title: input.title,
              type: input.type,
              direction: "sent",
              status: "대기",
              meta: input.meta,
              projectId: input.projectId,
              talentId: input.talentId,
            },
            ...current,
          ]);
          setApplicationSaveState({ isSaving: false, error: null });
          return;
        }

        const record = await readApiResponse<MyApplicationRecord>(
          await fetch("/api/applications", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              projectId: Number(input.projectId),
              targetRole: project.role,
              message: `${input.title}에 ${project.role} 역할로 참여하고 싶습니다.`,
            }),
          }),
        );

        setApplications((current) => [mapApplicationRecord(record), ...current]);
        setApplicationSaveState({ isSaving: false, error: null });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "지원/제안을 등록하지 못했습니다. 다시 시도해주세요.";
        setApplicationSaveState({ isSaving: false, error: message });
        throw error;
      }
    },
    [hasApplied, projects],
  );

  return {
    applications,
    createApplication,
    hasApplied,
    applicationSaveState,
  };
}
