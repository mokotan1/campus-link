import {
  getProjectById,
  normalizeProjectPayload,
  updateProject,
} from "@/features/projects/server/projects";
import {
  apiErrorFromUnknown,
  apiNotFound,
  apiOk,
  apiUnauthorized,
} from "@/lib/api/response";

type RouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { projectId } = await context.params;
    const project = await getProjectById(Number(projectId));

    if (!project) {
      return apiNotFound("프로젝트를 찾을 수 없습니다.");
    }

    return apiOk(project);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { projectId } = await context.params;
    const body = await request.json();
    const values = normalizeProjectPayload(body);
    const project = await updateProject(Number(projectId), values);

    if (!project) {
      return apiUnauthorized();
    }

    return apiOk(project);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
