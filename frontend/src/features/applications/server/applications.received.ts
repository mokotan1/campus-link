export type ReceivedApplicationRow = {
  id: number;
  project_id: number;
  applicant_user_id: number;
  message: string | null;
  application_status: string;
  target_role: string | null;
  created_at: string;
};

export type ReceivedProjectRow = {
  id: number;
  title: string;
  campus: string | null;
  recruitment_status: string;
};

export type ReceivedApplicantRow = {
  id: number;
  name: string | null;
  campus: string | null;
};

export type ReceivedApplicantProfileRow = {
  user_id: number;
  display_name: string | null;
  department: string | null;
};

export type ReceivedApplicationRecord = {
  id: number;
  projectId: number;
  message: string;
  status: string;
  targetRole: string;
  createdAt: string;
  project: {
    id: number;
    title: string;
    campus: string;
    recruitmentStatus: string;
  };
  applicant: {
    userId: number;
    name: string | null;
    campus: string;
    department: string;
  };
};

export function mapReceivedApplicationRows(
  rows: ReceivedApplicationRow[],
  projects: Map<number, ReceivedProjectRow>,
  applicants: Map<number, ReceivedApplicantRow>,
  profiles: Map<number, ReceivedApplicantProfileRow>,
): ReceivedApplicationRecord[] {
  return rows.flatMap((row) => {
    const project = projects.get(row.project_id);

    if (!project) {
      return [];
    }

    const applicant = applicants.get(row.applicant_user_id);
    const profile = profiles.get(row.applicant_user_id);

    return [
      {
        id: row.id,
        projectId: row.project_id,
        message: row.message ?? "",
        status: row.application_status,
        targetRole: row.target_role ?? "",
        createdAt: row.created_at,
        project: {
          id: project.id,
          title: project.title,
          campus: project.campus ?? "",
          recruitmentStatus: project.recruitment_status,
        },
        applicant: {
          userId: row.applicant_user_id,
          name: profile?.display_name ?? applicant?.name ?? null,
          campus: applicant?.campus ?? "",
          department: profile?.department ?? "",
        },
      },
    ];
  });
}
