import { tagToneClass } from "@/shared/constants";
import type { Application, Project, TagTone } from "@/shared/types";

export function Tag({ label, tone = "default" }: { label: string; tone?: TagTone }) {
  return (
    <span className={`inline-flex min-h-7 items-center rounded-full px-3 text-xs font-bold ring-1 ${tagToneClass[tone]}`}>
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: Application["status"] | Project["status"] }) {
  const tone: TagTone =
    status === "수락" || status === "모집중"
      ? "teal"
      : status === "대기" || status === "진행중"
        ? "amber"
        : status === "거절"
          ? "rose"
          : "default";

  return <Tag label={status} tone={tone} />;
}
