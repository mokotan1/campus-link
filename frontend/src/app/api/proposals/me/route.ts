import { listMyProposals } from "@/features/applications/server/proposals";
import {
  apiErrorFromUnknown,
  apiOk,
  apiUnauthorized,
} from "@/lib/api/response";

export async function GET() {
  try {
    const proposals = await listMyProposals();

    if (!proposals) {
      return apiUnauthorized();
    }

    return apiOk(proposals);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
