import { listSentProposalsForSession } from "@/features/proposals/server/proposals";
import {
  apiErrorFromUnknown,
  apiOk,
  apiUnauthorized,
} from "@/lib/api/response";

export async function GET() {
  try {
    const proposals = await listSentProposalsForSession();

    if (!proposals) {
      return apiUnauthorized();
    }

    return apiOk(proposals);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
