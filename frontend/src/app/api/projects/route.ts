import {
  createProject,
  listProjects,
  normalizeProjectPayload,
} from "@/features/projects/server/projects";
import {
  apiCreated,
  apiErrorFromUnknown,
  apiOk,
  apiUnauthorized,
} from "@/lib/api/response";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projects = await listProjects({
      query: searchParams.get("query")?.trim() ?? "",
      campus: searchParams.get("campus")?.trim() ?? "",
      role: searchParams.get("role")?.trim() ?? "",
      status: searchParams.get("status")?.trim() ?? "",
    });

    return apiOk(projects);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const values = normalizeProjectPayload(body);
    const project = await createProject(values);

    if (!project) {
      return apiUnauthorized();
    }

    return apiCreated(project);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
