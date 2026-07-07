import { NextResponse } from "next/server";

import { bootstrapUser } from "@/features/auth/server/bootstrap-user";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const authUserId = String(body.authUserId ?? "").trim();
    const email = String(body.email ?? "").trim();

    if (!authUserId || !email) {
      return NextResponse.json(
        { success: false, message: "authUserId와 email이 필요합니다." },
        { status: 400 }
      );
    }

    const result = await bootstrapUser({ authUserId, email });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";

    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
