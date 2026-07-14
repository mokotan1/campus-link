import assert from "node:assert/strict";
import test from "node:test";

import { mapReceivedApplicationRows } from "./applications.received.ts";

test("maps a received application with applicant and owned project details", () => {
  const rows = [
    {
      id: 22,
      project_id: 10,
      applicant_user_id: 7,
      message: "함께 작업하고 싶습니다.",
      application_status: "PENDING",
      target_role: "BACKEND",
      created_at: "2026-07-14T08:00:00.000Z",
    },
  ];

  const projects = new Map([
    [
      10,
      {
        id: 10,
        title: "캠퍼스 링크",
        campus: "대명캠",
        recruitment_status: "RECRUITING",
      },
    ],
  ]);
  const applicants = new Map([
    [
      7,
      {
        id: 7,
        name: "지원자",
        campus: "성서캠",
        email: "applicant@example.com",
      },
    ],
  ]);
  const profiles = new Map([
    [
      7,
      {
        user_id: 7,
        display_name: "지원자 별명",
        department: "컴퓨터공학과",
      },
    ],
  ]);

  assert.deepEqual(
    mapReceivedApplicationRows(rows, projects, applicants, profiles),
    [
      {
        id: 22,
        projectId: 10,
        message: "함께 작업하고 싶습니다.",
        status: "PENDING",
        targetRole: "BACKEND",
        createdAt: "2026-07-14T08:00:00.000Z",
        project: {
          id: 10,
          title: "캠퍼스 링크",
          campus: "대명캠",
          recruitmentStatus: "RECRUITING",
        },
        applicant: {
          userId: 7,
          name: "지원자 별명",
          campus: "성서캠",
          department: "컴퓨터공학과",
        },
      },
    ],
  );
});
