import { decideProposalForSession } from "@/features/proposals/server/proposals";
import {
  apiErrorFromUnknown,
  apiOk,
  apiUnauthorized,
} from "@/lib/api/response";

type RouteContext = {
  params: Promise<{
    proposalId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { proposalId } = await context.params;
    const proposal = await decideProposalForSession(Number(proposalId), "ACCEPTED");

    if (!proposal) {
      return apiUnauthorized();
    }

    return apiOk(proposal);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
