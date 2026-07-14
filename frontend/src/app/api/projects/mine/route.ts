import { listMyProjectsForSession } from "@/features/projects/server/projects";
import {
  apiErrorFromUnknown,
  apiOk,
  apiUnauthorized,
} from "@/lib/api/response";

export async function GET() {
  try {
    const projects = await listMyProjectsForSession();

    if (!projects) {
      return apiUnauthorized();
    }

    return apiOk(projects);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
