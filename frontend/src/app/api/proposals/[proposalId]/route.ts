import {
  normalizeProposalDecisionPayload,
  updateReceivedProposalStatus,
} from "@/features/applications/server/proposals";
import {
  apiErrorFromUnknown,
  apiOk,
  apiUnauthorized,
} from "@/lib/api/response";

type RouteContext = {
  params: Promise<{ proposalId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { proposalId } = await context.params;
    const body = await request.json();
    const values = normalizeProposalDecisionPayload(body);
    const proposal = await updateReceivedProposalStatus(Number(proposalId), values);

    if (!proposal) {
      return apiUnauthorized();
    }

    return apiOk(proposal);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
