import {
  createProposal,
  normalizeProposalPayload,
} from "@/features/applications/server/proposals";
import {
  apiCreated,
  apiErrorFromUnknown,
  apiUnauthorized,
} from "@/lib/api/response";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const values = normalizeProposalPayload(body);
    const proposal = await createProposal(values);

    if (!proposal) {
      return apiUnauthorized();
    }

    return apiCreated(proposal);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
