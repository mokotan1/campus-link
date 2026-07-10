import { withdrawApplicationForSession } from "@/features/applications/server/applications";
import {
  apiErrorFromUnknown,
  apiOk,
  apiUnauthorized,
} from "@/lib/api/response";

type RouteContext = {
  params: Promise<{
    applicationId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { applicationId } = await context.params;
    const application = await withdrawApplicationForSession(Number(applicationId));

    if (!application) {
      return apiUnauthorized();
    }

    return apiOk(application);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
