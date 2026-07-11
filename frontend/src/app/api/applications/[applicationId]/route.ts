import {
  normalizeApplicationDecisionPayload,
  updateReceivedApplicationStatus,
} from "@/features/applications/server/applications";
import {
  apiErrorFromUnknown,
  apiOk,
  apiUnauthorized,
} from "@/lib/api/response";

type RouteContext = {
  params: Promise<{ applicationId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { applicationId } = await context.params;
    const body = await request.json();
    const values = normalizeApplicationDecisionPayload(body);
    const application = await updateReceivedApplicationStatus(
      Number(applicationId),
      values,
    );

    if (!application) {
      return apiUnauthorized();
    }

    return apiOk(application);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
