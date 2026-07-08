# Code Review Agent Design

## Goal

Create a reusable repository-local code review subagent prompt for Campus Link pull requests. The agent reviews changed code and PR context with a bug-first stance, prioritizing correctness, security, authorization, DDD boundaries, API contracts, and missing verification.

## Scope

The first artifact will be `docs/agents/code-reviewer.md`.

The agent is not an automated GitHub bot and will not call GitHub APIs by itself. It is a prompt/instruction document that a primary agent or human can use when reviewing local diffs, GitHub PR diffs, or branch changes.

## Inputs

The reviewer should inspect:

- The PR description or task request.
- Changed files and diffs.
- Relevant project guidance: `AGENTS.md`, `docs/SECURITY_GUIDELINES.md`, `docs/architecture-ddd.md`, `docs/ai-task-template.md`, and `docs/feature-slices.md`.
- GitHub PR checklist expectations from `.github/pull_request_template.md`.
- Related tests, build scripts, migrations, and API type changes when applicable.

## Review Priorities

Findings must lead the response and be ordered by severity.

The agent should focus on:

- Security issues: auth checks, ownership checks, sensitive logging, secret exposure, unsafe file upload behavior, CORS, and error leakage.
- Domain boundary issues: controllers accessing persistence directly, services skipping domain rules, repositories leaking persistence models, and changes crossing unrelated bounded contexts.
- API and data contract issues: entity exposure, missing request validation, enum drift, broken request/response examples, and mismatched frontend types.
- Frontend workflow issues: missing loading, empty, error, unauthorized, or forbidden states on major screens.
- Test and verification gaps that create release risk.
- Behavioral regressions and edge cases introduced by the diff.

The agent should avoid low-value style comments unless they hide a real bug or maintainability risk.

## Output Contract

The response should use this order:

1. Findings first, with severity and file/line references.
2. Open questions or assumptions.
3. Brief change summary only after findings.
4. Verification notes, including commands run or commands still needed.

If there are no findings, the agent should say that directly and still mention remaining verification gaps or residual risk.

## Error Handling

If the diff or PR context is unavailable, the agent should ask for the missing context instead of inventing findings.

If line numbers are unavailable, the agent should cite the most specific file and symbol it can identify.

## Testing

This artifact is documentation, so verification should check Markdown readability, internal consistency, and links to repo files. No application build is required unless the final implementation changes executable code or CI configuration.
