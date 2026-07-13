import { listMyApplications } from "@/features/applications/server/applications";
import { getProjectById } from "@/features/projects/server/projects";
import { ProjectDetailScreen } from "@/features/projects/components/project-detail-screen";
import { mapApplicationRecord, mapProjectRecord } from "@/shared/lib/ui-mappers";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectId = Number(id);

  const [projectRecord, applicationRecords] = await Promise.all([
    Number.isInteger(projectId) && projectId > 0 ? getProjectById(projectId) : Promise.resolve(null),
    listMyApplications(),
  ]);

  const project = projectRecord ? mapProjectRecord(projectRecord) : null;
  const initialApplications = (applicationRecords ?? []).map(mapApplicationRecord);

  return <ProjectDetailScreen project={project} initialApplications={initialApplications} />;
}
