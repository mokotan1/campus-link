import { getProjectById } from "@/features/projects/server/projects";
import { apiErrorFromUnknown, apiNotFound, apiOk } from "@/lib/api/response";

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
