import { NextResponse } from "next/server";

import {
  getMyProfile,
  updateMyProfile,
  type ProfileFormValues,
} from "@/features/profile/server/profile-me";

function parseProfilePayload(body: unknown): ProfileFormValues {
  const payload = (body ?? {}) as Record<string, unknown>;
  const collaborationStatus =
    payload.collaborationStatus === "CLOSED" ? "CLOSED" : "OPEN";

  return {
    studentId: String(payload.studentId ?? "").trim(),
    department: String(payload.department ?? "").trim(),
    grade: String(payload.grade ?? "").trim(),
    bio: String(payload.bio ?? "").trim(),
    techStack: String(payload.techStack ?? "").trim(),
    collaborationStatus,
  };
}

export async function GET() {
  try {
    const profile = await getMyProfile();

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";

    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const values = parseProfilePayload(body);
    const profile = await updateMyProfile(values);

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";

    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
