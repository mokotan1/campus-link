import type { Application, Portfolio, Project } from "@/shared/types";
import type { MyApplicationRecord } from "@/features/applications/server/applications";
import type { PortfolioRecord } from "@/features/portfolios/server/portfolios";
import type { ProjectRecord } from "@/features/projects/server/projects";

export function mapProjectStatus(status: string): Project["status"] {
  if (status === "RECRUITING") {
    return "모집중";
  }

  if (status === "CLOSED") {
    return "완료";
  }

  return status || "모집중";
}

export function mapApplicationStatus(status: string): Application["status"] {
  if (status === "PENDING") {
    return "대기";
  }

  if (status === "ACCEPTED") {
    return "수락";
  }

  if (status === "REJECTED") {
    return "거절";
  }

  if (status === "CANCELED") {
    return "취소";
  }

  return status || "대기";
}

export function mapProjectRecord(record: ProjectRecord): Project {
  const tags = [...record.requiredRoles, ...record.tools].filter(Boolean).map((label, index) => ({
    label,
    tone: index < record.requiredRoles.length ? ("blue" as const) : ("default" as const),
  }));

  return {
    id: String(record.id),
    title: record.title,
    campus: record.campus || "캠퍼스 미정",
    author: record.owner.name || record.owner.department || "Campus Link",
    category: record.requiredRoles[0] ?? "모집 역할 협의",
    recruitingRoles: record.requiredRoles,
    role: record.requiredRoles[0] ?? "모집 역할 협의",
    maxMembers: record.expectedMemberCount ?? 0,
    currentMembers: 0,
    deadline: record.endDate ?? "",
    createdAt: record.createdAt,
    status: mapProjectStatus(record.recruitmentStatus),
    summary: record.summary,
    content: record.description || record.summary,
    tags,
    verified: "실제 API 데이터",
    action: "지원하기",
    accent: (["blue", "amber", "green"] as const)[record.id % 3],
    coverImageName: record.coverImageName ?? undefined,
  };
}

export function mapPortfolioRecord(record: PortfolioRecord): Portfolio {
  return {
    id: record.id,
    title: record.title,
    role: record.roleInWork || "역할 미입력",
    summary: record.description || "설명 없음",
    content: record.description || "설명 없음",
    link: record.externalUrl || undefined,
    coverImageName: record.coverImageName ?? undefined,
    createdAt: record.createdAt,
  };
}

export function mapApplicationRecord(record: MyApplicationRecord): Application {
  return {
    id: record.id,
    title: record.project.title,
    type: "지원",
    direction: "sent",
    status: mapApplicationStatus(record.status),
    meta: [record.targetRole, record.project.campus, record.message].filter(Boolean).join(" · "),
    projectId: String(record.projectId),
  };
}
