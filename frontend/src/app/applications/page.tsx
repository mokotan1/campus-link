import { listMyApplications } from "@/features/applications/server/applications";
import { getCurrentAppUser } from "@/features/auth/server/current-app-user";
import { ApplicationsScreen } from "@/features/applications/components/applications-screen";
import { mapApplicationRecord } from "@/shared/lib/ui-mappers";

export default async function ApplicationsPage() {
  const currentUser = await getCurrentAppUser();
  const applicationRecords = currentUser ? await listMyApplications() : null;
  const initialApplications = (applicationRecords ?? []).map(mapApplicationRecord);

  return (
    <ApplicationsScreen
      initialApplications={initialApplications}
      authenticated={Boolean(currentUser)}
    />
  );
}
