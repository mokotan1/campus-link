import { listReceivedApplications } from "@/features/applications/server/applications";
import {
  apiErrorFromUnknown,
  apiOk,
  apiUnauthorized,
} from "@/lib/api/response";

export async function GET() {
  try {
    const applications = await listReceivedApplications();

    if (!applications) {
      return apiUnauthorized();
    }

    return apiOk(applications);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
