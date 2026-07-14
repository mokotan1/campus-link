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
    recruitmentDeadline: "2026-08-01",
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
    recruitmentDeadline: null,
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
    recruitmentDeadline: null,
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
        recruitmentDeadline: "2026-08-01",
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

test("excludes closed and expired projects before scoring", () => {
  const ranked = rankProjects(
    viewerProfile,
    [
      {
        id: 101,
        ownerUserId: 200,
        title: "Closed",
        summary: "Closed project",
        campus: "Seoul",
        requiredRoles: ["Backend"],
        tools: ["React", "TypeScript", "Node.js"],
        recruitmentStatus: "CLOSED",
        recruitmentDeadline: "2026-08-01",
        createdAt: "2026-07-11T10:00:00.000Z",
      },
      {
        id: 102,
        ownerUserId: 201,
        title: "Yesterday Deadline",
        summary: "Expired yesterday",
        campus: "Seoul",
        requiredRoles: ["Backend"],
        tools: ["React", "TypeScript", "Node.js"],
        recruitmentStatus: "RECRUITING",
        recruitmentDeadline: "2026-07-09",
        createdAt: "2026-07-11T09:00:00.000Z",
      },
      {
        id: 103,
        ownerUserId: 202,
        title: "Today Deadline",
        summary: "Closes today",
        campus: "Seoul",
        requiredRoles: ["Backend"],
        tools: ["React"],
        recruitmentStatus: "RECRUITING",
        recruitmentDeadline: "2026-07-10",
        createdAt: "2026-07-09T10:00:00.000Z",
      },
      {
        id: 104,
        ownerUserId: 203,
        title: "Future Deadline",
        summary: "Still open",
        campus: "Seoul",
        requiredRoles: ["Backend"],
        tools: ["React"],
        recruitmentStatus: "RECRUITING",
        recruitmentDeadline: "2026-08-01",
        createdAt: "2026-07-08T10:00:00.000Z",
      },
      {
        id: 105,
        ownerUserId: 204,
        title: "Legacy Null Deadline",
        summary: "No deadline set",
        campus: "Seoul",
        requiredRoles: ["Backend"],
        tools: ["React"],
        recruitmentStatus: "RECRUITING",
        recruitmentDeadline: null,
        createdAt: "2026-07-07T10:00:00.000Z",
      },
    ],
    { referenceDate },
  );

  const rankedIds = ranked.map(({ id }) => id);

  assert.deepEqual(rankedIds.slice().sort((left, right) => left - right), [103, 104, 105]);
  assert.ok(!rankedIds.includes(101));
  assert.ok(!rankedIds.includes(102));
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

test("excludes incomplete, unavailable, and already-proposed profiles", () => {
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
        userId: 51,
        displayName: "Ready",
        campus: "Seoul",
        roleTags: ["Backend"],
        toolTags: ["React"],
        availabilityStatus: "바로 가능",
        hasPublicPortfolio: true,
        profileCreatedAt: "2026-07-11T10:00:00.000Z",
        onboardingCompleted: true,
        collaborationStatus: "OPEN",
        alreadyProposed: false,
      },
      {
        userId: 52,
        displayName: "Incomplete",
        campus: "Seoul",
        roleTags: ["Backend"],
        toolTags: ["React"],
        availabilityStatus: "바로 가능",
        hasPublicPortfolio: true,
        profileCreatedAt: "2026-07-11T10:00:00.000Z",
        onboardingCompleted: false,
        collaborationStatus: "OPEN",
        alreadyProposed: false,
      },
      {
        userId: 53,
        displayName: "Unavailable",
        campus: "Seoul",
        roleTags: ["Backend"],
        toolTags: ["React"],
        availabilityStatus: "바로 가능",
        hasPublicPortfolio: true,
        profileCreatedAt: "2026-07-11T10:00:00.000Z",
        onboardingCompleted: true,
        collaborationStatus: "CLOSED",
        alreadyProposed: false,
      },
      {
        userId: 54,
        displayName: "Already Proposed",
        campus: "Seoul",
        roleTags: ["Backend"],
        toolTags: ["React"],
        availabilityStatus: "바로 가능",
        hasPublicPortfolio: true,
        profileCreatedAt: "2026-07-11T10:00:00.000Z",
        onboardingCompleted: true,
        collaborationStatus: "OPEN",
        alreadyProposed: true,
      },
    ],
  );

  assert.deepEqual(ranked.map(({ userId }) => userId), [51]);
});
