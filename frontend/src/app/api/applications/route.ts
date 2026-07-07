import {
  createApplication,
  normalizeApplicationPayload,
} from "@/features/applications/server/applications";
import {
  apiCreated,
  apiErrorFromUnknown,
  apiUnauthorized,
} from "@/lib/api/response";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const values = normalizeApplicationPayload(body);
    const application = await createApplication(values);

    if (!application) {
      return apiUnauthorized();
    }

    return apiCreated(application);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
