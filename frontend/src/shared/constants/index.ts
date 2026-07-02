import type { Application, Campus, Project, Talent, TagTone } from "@/shared/types";

export const roles = ["개발", "기획", "2D 아트", "3D 모델링", "애니메이션", "UI/UX"];
export const collaborationTypes = ["졸업작품", "게임잼", "공모전", "포트폴리오 단기 프로젝트"];
export const availabilityOptions = ["3시간 이하", "4-7시간", "8-12시간", "13시간 이상"];
export const campuses: (Campus | "전체 캠퍼스")[] = ["전체 캠퍼스", "대명캠", "성서캠"];
export const roleFilters = ["모든 역할", "개발", "기획", "2D 아트", "애니메이션", "UI/UX"];
export const statusFilters = ["전체 상태", "모집중", "진행중", "완료"];

export const tagToneClass: Record<TagTone, string> = {
  default: "bg-slate-100 text-slate-700 ring-slate-200",
  teal: "bg-teal-50 text-teal-700 ring-teal-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export const projectMediaClass: Record<Project["accent"], string> = {
  blue: "from-blue-100 via-slate-100 to-teal-100",
  amber: "from-amber-100 via-stone-100 to-rose-100",
  green: "from-teal-100 via-emerald-50 to-lime-100",
};

export const initialProjects: Project[] = [
  {
    id: 1,
    title: "리듬 액션 졸업작품 팀",
    campus: "성서캠",
    role: "2D 아트",
    status: "모집중",
    summary: "Unity 프로토타입은 완성했고 캐릭터 애니메이션과 UI 아트를 함께 다듬을 팀원을 찾습니다.",
    content:
      "Unity 프로토타입은 완성했고 캐릭터 애니메이션과 UI 아트를 함께 다듬을 팀원을 찾습니다. 리듬 액션 장르 특성상 타이밍에 맞는 모션과 이펙트가 중요해서, 애니메이션 감각이 있는 분과 함께 디테일을 다듬고 싶습니다.",
    tags: [
      { label: "Unity", tone: "blue" },
      { label: "2D 애니메이션", tone: "rose" },
      { label: "졸업작품", tone: "amber" },
    ],
    verified: "기획서 · 프로토타입 확인됨",
    action: "지원하기",
    accent: "blue",
  },
  {
    id: 2,
    title: "스토리 퍼즐 어드벤처",
    campus: "대명캠",
    role: "개발",
    status: "모집중",
    summary: "콘셉트 아트와 시나리오 초안이 준비된 팀에서 플레이어블 데모를 구현할 개발 파트너를 찾습니다.",
    content:
      "콘셉트 아트와 시나리오 초안이 준비된 팀에서 플레이어블 데모를 구현할 개발 파트너를 찾습니다. Figma로 UI 와이어프레임까지 나온 상태라 바로 구현에 들어갈 수 있습니다.",
    tags: [
      { label: "프론트 개발", tone: "blue" },
      { label: "게임잼", tone: "amber" },
      { label: "Figma" },
    ],
    verified: "아트보드 · 시나리오 확인됨",
    action: "제안하기",
    accent: "amber",
  },
  {
    id: 3,
    title: "협동 로그라이크 프로토타입",
    campus: "성서캠",
    role: "애니메이션",
    status: "진행중",
    summary: "개발팀 3명이 전투 루프를 제작 중이며 몬스터 디자인과 이펙트 작업자를 모집합니다.",
    content:
      "개발팀 3명이 전투 루프를 제작 중이며 몬스터 디자인과 이펙트 작업자를 모집합니다. Godot 기반이며 주 2회 정기 회의로 진행 상황을 공유합니다.",
    tags: [
      { label: "Godot", tone: "blue" },
      { label: "캐릭터 디자인", tone: "rose" },
      { label: "VFX" },
    ],
    verified: "팀 구성 · 일정 확인됨",
    action: "지원하기",
    accent: "green",
  },
];

export const initialTalents: Talent[] = [
  {
    id: 1,
    name: "이서윤",
    campus: "대명캠",
    role: "2D 애니메이션",
    tools: [
      { label: "Clip Studio", tone: "rose" },
      { label: "Spine" },
      { label: "바로 가능", tone: "teal" },
    ],
    availability: "졸업작품 · 주 8-12시간",
    portfolio: "캐릭터 러프부터 완성 컷까지 이어지는 애니메이션 샘플 보유",
  },
  {
    id: 2,
    name: "박도현",
    campus: "성서캠",
    role: "Unity 개발",
    tools: [
      { label: "Unity", tone: "blue" },
      { label: "GitHub" },
      { label: "공모전 선호", tone: "amber" },
    ],
    availability: "게임잼 · 주 4-7시간",
    portfolio: "플레이 영상과 GitHub 저장소로 구현 범위 확인 가능",
  },
  {
    id: 3,
    name: "정민아",
    campus: "대명캠",
    role: "UI/UX",
    tools: [
      { label: "Figma", tone: "blue" },
      { label: "Photoshop" },
      { label: "일정 맞으면 가능", tone: "green" },
    ],
    availability: "포트폴리오 단기 프로젝트",
    portfolio: "메뉴 플로우, HUD, 온보딩 화면 설계 경험",
  },
];

export const initialApplications: Application[] = [
  {
    id: 1,
    title: "리듬 액션 졸업작품 팀",
    type: "지원",
    status: "대기",
    meta: "2D 아트 역할로 지원 완료",
  },
  {
    id: 2,
    title: "이서윤",
    type: "제안",
    status: "수락",
    meta: "캐릭터 애니메이션 협업 제안",
  },
];
