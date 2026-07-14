import { parseCsv, splitList } from "@/shared/lib/csv";
import type { Campus, Project, Talent, TagTone } from "@/shared/types";

/**
 * projects.csv / students.csv (실제 더미데이터) 를 화면에서 쓰는
 * Project / Talent 타입으로 변환한다.
 * (docs: "2주차 프론트엔드 목표" 1. CSV 더미데이터 반영 참고)
 */

const ACCENTS: Project["accent"][] = ["blue", "amber", "green"];
const TAG_TONES: TagTone[] = ["blue", "amber", "green", "rose", "teal"];

export function convertCampus(raw: string): Campus {
  if (raw.includes("대명")) return "대명캠";
  if (raw.includes("성서")) return "성서캠";
  // 알 수 없는 값은 기본값으로 처리
  return "대명캠";
}

/** "PRJ001" -> 1, "STU037" -> 37. 태그/색상 로테이션 등 표시용으로만 사용한다. */
function numericSuffix(id: string): number {
  const digits = id.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

/**
 * 대부분의 마감일이 이미 지난 더미데이터이므로, 마감일이 아니라
 * 인원 비율을 기준으로 화면용 상태값을 만든다.
 */
function deriveProjectStatus(currentMembers: number, maxMembers: number): Project["status"] {
  if (maxMembers <= 0) return "모집중";
  if (currentMembers >= maxMembers) return "완료";
  if (currentMembers / maxMembers >= 0.5) return "진행중";
  return "모집중";
}

export function projectsFromCsv(raw: string): Project[] {
  const rows = parseCsv(raw);

  return rows.map((row) => {
    const id = row.project_id;
    const numericId = numericSuffix(id);
    const campus = convertCampus(row.campus ?? "");
    const recruitingRoles = splitList(row.recruiting_roles ?? "");
    const role = recruitingRoles[0] ?? "역할 미정";
    const maxMembers = Number(row.max_members) || 0;
    const currentMembers = Number(row.current_members) || 0;
    const deadline = row.deadline ?? "";
    const status = deriveProjectStatus(currentMembers, maxMembers);
    const content = row.content ?? "";
    const summary = content.length > 70 ? `${content.slice(0, 70)}…` : content;

    const tags = [
      { label: row.category, tone: TAG_TONES[numericId % TAG_TONES.length] },
      ...recruitingRoles.slice(0, 2).map((label, index) => ({
        label,
        tone: TAG_TONES[(numericId + index + 1) % TAG_TONES.length],
      })),
    ].filter((tag) => Boolean(tag.label));

    return {
      id,
      title: row.title ?? "",
      campus,
      author: row.author ?? "",
      category: row.category ?? "",
      recruitingRoles,
      role,
      maxMembers,
      currentMembers,
      deadline,
      createdAt: row.created_at ?? "",
      status,
      summary,
      content,
      tags,
      action: "지원하기",
      accent: ACCENTS[numericId % ACCENTS.length],
    } satisfies Project;
  });
}

const availabilityByGrade: Record<string, string> = {
  "1학년": "학기 중 병행 가능",
  "2학년": "학기 중 병행 가능",
  "3학년": "주 4-7시간 가능",
  "4학년": "포트폴리오 마무리 중 · 협업 가능",
};

export function talentsFromCsv(raw: string): Talent[] {
  const rows = parseCsv(raw);

  return rows.map((row) => {
    const id = row.student_id;
    const numericId = numericSuffix(id);
    const campus = convertCampus(row.campus ?? "");
    const skills = splitList(row.skills ?? "");
    const interests = splitList(row.interests ?? "");
    const grade = row.grade ? `${row.grade}학년` : "학년 미정";
    const role = skills[0] ?? row.major ?? "역할 미정";

    const tools = [
      ...skills.slice(0, 2).map((label, index) => ({ label, tone: TAG_TONES[(numericId + index) % TAG_TONES.length] })),
      ...interests.slice(0, 1).map((label) => ({ label, tone: "teal" as const })),
    ];

    return {
      id,
      name: row.name ?? "",
      studentNumber: row.student_number ?? "",
      campus,
      major: row.major ?? "",
      grade,
      role,
      interests,
      skills,
      introduction: row.introduction ?? "",
      email: row.email ?? "",
      tools,
      availability: `${grade} · ${availabilityByGrade[grade] ?? "협업 가능"}`,
      portfolio: row.introduction ?? "",
    } satisfies Talent;
  });
}
