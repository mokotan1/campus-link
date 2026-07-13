import assert from "node:assert/strict";
import test from "node:test";

import {
  rankProfiles,
  rankProjects,
} from "./recommendations.ts";

const referenceDate = new Date("2026-07-10T12:00:00.000Z");

const viewerProfile = {
  userId: 1,
  campus: "Seoul",
  displayName: "Campus User",
  roleTags: ["Backend", "Frontend"],
  toolTags: ["React", "TypeScript", "Node.js"],
  appliedProjectIds: [],
};

const rankingProjects = [
  {
    id: 12,
    ownerUserId: 99,
    title: "Best Match",
    summary: "Full stack project",
    campus: "Seoul",
    requiredRoles: ["Backend"],
    tools: ["React", "TypeScript", "Node.js"],
    recruitmentStatus: "RECRUITING",
    endDate: "2026-08-01",
    createdAt: "2026-07-09T10:00:00.000Z",
  },
  {
    id: 7,
    ownerUserId: 100,
    title: "Partial Tool Match",
    summary: "Backend project",
    campus: "Seoul",
    requiredRoles: ["Backend"],
    tools: ["React", "Python"],
    recruitmentStatus: "RECRUITING",
    endDate: null,
    createdAt: "2026-07-10T10:00:00.000Z",
  },
  {
    id: 3,
    ownerUserId: 101,
    title: "Frontend Only",
    summary: "Frontend project",
    campus: "Busan",
    requiredRoles: ["Frontend"],
    tools: ["Vue"],
    recruitmentStatus: "RECRUITING",
    endDate: null,
    createdAt: "2026-07-08T10:00:00.000Z",
  },
];

test("sorts project recommendations by score then role score then recency", () => {
  assert.deepEqual(
    rankProjects(viewerProfile, rankingProjects, { referenceDate }).map(({ id }) => id),
    [12, 7, 3],
  );
});

test("excludes own projects and already-applied projects", () => {
  const ranked = rankProjects(
    {
      ...viewerProfile,
      appliedProjectIds: [7],
    },
    [
      ...rankingProjects,
      {
        id: 50,
        ownerUserId: 1,
        title: "Own Project",
        summary: "Should be excluded",
        campus: "Seoul",
        requiredRoles: ["Backend"],
        tools: ["React"],
        recruitmentStatus: "RECRUITING",
        endDate: "2026-08-01",
        createdAt: "2026-07-11T10:00:00.000Z",
      },
    ],
    { referenceDate },
  );

  assert.deepEqual(
    ranked.map(({ id }) => id),
    [12, 3],
  );
});

test("returns explainable reason codes for project recommendations", () => {
  const [top] = rankProjects(viewerProfile, rankingProjects, { referenceDate });

  assert.deepEqual(top.reasons, [
    "ROLE_MATCH",
    "TOOL_MATCH",
    "CAMPUS_MATCH",
    "RECRUITING_NOW",
  ]);
  assert.equal(top.score, 90);
});

test("sorts profile recommendations by score then role score then recency", () => {
  const project = {
    id: 20,
    ownerUserId: 1,
    campus: "Seoul",
    requiredRoles: ["Backend"],
    tools: ["React", "Node.js"],
  };

  const profiles = [
    {
      userId: 30,
      displayName: "Strong Match",
      campus: "Seoul",
      roleTags: ["Backend"],
      toolTags: ["React", "Node.js", "PostgreSQL"],
      availabilityStatus: "바로 가능",
      hasPublicPortfolio: true,
      profileCreatedAt: "2026-07-09T10:00:00.000Z",
    },
    {
      userId: 31,
      displayName: "Partial Match",
      campus: "Seoul",
      roleTags: ["Backend"],
      toolTags: ["React"],
      availabilityStatus: "일정 맞으면 가능",
      hasPublicPortfolio: false,
      profileCreatedAt: "2026-07-10T10:00:00.000Z",
    },
    {
      userId: 32,
      displayName: "Weak Match",
      campus: "Busan",
      roleTags: ["Designer"],
      toolTags: ["Figma"],
      availabilityStatus: "구경만",
      hasPublicPortfolio: false,
      profileCreatedAt: "2026-07-08T10:00:00.000Z",
    },
  ];

  assert.deepEqual(
    rankProfiles(project, profiles).map(({ userId }) => userId),
    [30, 31, 32],
  );
});

test("excludes project owner from profile recommendations", () => {
  const ranked = rankProfiles(
    {
      id: 20,
      ownerUserId: 1,
      campus: "Seoul",
      requiredRoles: ["Backend"],
      tools: ["React"],
    },
    [
      {
        userId: 1,
        displayName: "Owner",
        campus: "Seoul",
        roleTags: ["Backend"],
        toolTags: ["React"],
        availabilityStatus: "바로 가능",
        hasPublicPortfolio: true,
        profileCreatedAt: "2026-07-11T10:00:00.000Z",
      },
      {
        userId: 40,
        displayName: "Candidate",
        campus: "Seoul",
        roleTags: ["Backend"],
        toolTags: ["React"],
        availabilityStatus: "바로 가능",
        hasPublicPortfolio: true,
        profileCreatedAt: "2026-07-10T10:00:00.000Z",
      },
    ],
  );

  assert.deepEqual(ranked.map(({ userId }) => userId), [40]);
});
