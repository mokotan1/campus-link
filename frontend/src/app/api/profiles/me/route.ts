import {
  getMyProfile,
  updateMyProfile,
  type ProfileFormValues,
} from "@/features/profile/server/profile-me";
import {
  apiErrorFromUnknown,
  apiOk,
  apiUnauthorized,
} from "@/lib/api/response";

function parseRoleTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function parseProfilePayload(body: unknown): ProfileFormValues {
  const payload = (body ?? {}) as Record<string, unknown>;
  const collaborationStatus =
    payload.collaborationStatus === "CLOSED" ? "CLOSED" : "OPEN";

  return {
    displayName: String(payload.displayName ?? "").trim(),
    campus: String(payload.campus ?? "").trim(),
    studentId: String(payload.studentId ?? "").trim(),
    department: String(payload.department ?? "").trim(),
    grade: String(payload.grade ?? "").trim(),
    bio: String(payload.bio ?? "").trim(),
    roleTags: parseRoleTags(payload.roleTags),
    techStack: String(payload.techStack ?? "").trim(),
    availabilityStatus: String(payload.availabilityStatus ?? "").trim(),
    collaborationType: String(payload.collaborationType ?? "").trim(),
    weeklyHours: String(payload.weeklyHours ?? "").trim(),
    collaborationStatus,
    onboardingCompleted: payload.onboardingCompleted === true,
  };
}

export async function GET() {
  try {
    const profile = await getMyProfile();

    if (!profile) {
      return apiUnauthorized();
    }

    return apiOk(profile);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const values = parseProfilePayload(body);
    const profile = await updateMyProfile(values);

    if (!profile) {
      return apiUnauthorized();
    }

    return apiOk(profile);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
