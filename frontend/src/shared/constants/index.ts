import type { Application, Campus, TagTone } from "@/shared/types";
import { projectsCsvRaw } from "@/shared/data/projects-csv";
import { studentsCsvRaw } from "@/shared/data/students-csv";
import { projectsFromCsv, talentsFromCsv } from "@/shared/lib/transform-csv";

export const roles = [
  "기획",
  "PM",
  "리서처",
  "프론트엔드",
  "백엔드",
  "개발자",
  "AI 엔지니어",
  "데이터 분석",
  "디자이너",
  "UX/UI",
  "브랜딩",
  "콘텐츠 제작",
  "마케팅",
];
export const collaborationTypes = ["졸업작품", "게임잼", "공모전", "포트폴리오 단기 프로젝트"];
export const availabilityOptions = ["3시간 이하", "4-7시간", "8-12시간", "13시간 이상"];
export const campuses: (Campus | "전체 캠퍼스")[] = ["전체 캠퍼스", "대명캠", "성서캠"];
export const roleFilters = ["모든 역할", ...roles];
export const statusFilters = ["전체 상태", "모집중", "진행중", "완료"];

export const tagToneClass: Record<TagTone, string> = {
  default: "bg-slate-100 text-slate-700 ring-slate-200",
  teal: "bg-teal-50 text-teal-700 ring-teal-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export const projectMediaClass: Record<"blue" | "amber" | "green", string> = {
  blue: "from-blue-100 via-slate-100 to-teal-100",
  amber: "from-amber-100 via-stone-100 to-rose-100",
  green: "from-teal-100 via-emerald-50 to-lime-100",
};

// CSV 기반 더미데이터 (projects.csv 100건 / students.csv 100건을
// 화면용 타입으로 변환한 결과). DB 연동 전 프론트 MVP 데이터 소스로 사용한다.
export const initialProjects = projectsFromCsv(projectsCsvRaw);
export const initialTalents = talentsFromCsv(studentsCsvRaw);

// 지원 현황 데모용 초기 데이터.
// - direction "sent": 내가 프로젝트에 지원했거나 인재에게 제안한 내역
// - direction "received": 다른 학생이 내 프로젝트에 지원했거나 나에게 제안한 내역
// 대기/수락/거절/취소 네 가지 상태가 모두 보이도록 구성했다.
export const initialApplications: Application[] = [
  {
    id: 1,
    title: initialProjects[0]?.title ?? "프로젝트",
    type: "지원",
    direction: "sent",
    status: "대기",
    meta: `${initialProjects[0]?.role ?? ""} 역할로 지원 완료`,
    projectId: initialProjects[0]?.id,
  },
  {
    id: 2,
    title: initialTalents[0]?.name ?? "학생",
    type: "제안",
    direction: "sent",
    status: "수락",
    meta: `${initialTalents[0]?.role ?? ""} 협업 제안`,
    talentId: initialTalents[0]?.id,
  },
  {
    id: 3,
    title: initialTalents[1]?.name ?? "학생",
    type: "제안",
    direction: "received",
    status: "대기",
    meta: `${initialTalents[1]?.name ?? ""}님이 함께하고 싶다는 제안을 보냈습니다.`,
    talentId: initialTalents[1]?.id,
  },
  {
    id: 4,
    title: initialTalents[2]?.name ?? "학생",
    type: "지원",
    direction: "received",
    status: "거절",
    meta: `${initialTalents[2]?.name ?? ""}님이 내 프로젝트에 지원했습니다.`,
    talentId: initialTalents[2]?.id,
  },
  {
    id: 5,
    title: initialTalents[3]?.name ?? "학생",
    type: "제안",
    direction: "received",
    status: "취소",
    meta: `${initialTalents[3]?.name ?? ""}님이 제안을 취소했습니다.`,
    talentId: initialTalents[3]?.id,
  },
];
