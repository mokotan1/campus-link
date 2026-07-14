# Task 1 Evidence: Reconfirm Remote Schema and Capture Failure

**Captured:** 2026-07-14  
**Project:** `cwbmfnenunqzwwypqipc` (capus_link)  
**Worktree:** `.worktrees/campus-link-project-deadline-create-500`  
**Verdict:** GO — schema present and consistent; proceed to Task 2 without DDL.

---

## 1. Branch / commit baseline

| Field | Value |
| --- | --- |
| Branch | `fix/project-deadline-and-create-500` |
| HEAD | `25c7dc79c6ba164f11a0a7fbf820272ebbb5fa97` |
| Tracks | `origin/main` (up to date) |
| `origin/main` | `25c7dc79c6ba164f11a0a7fbf820272ebbb5fa97` |
| Ancestor check | `origin/main` is ancestor of HEAD (exit 0) |

Message: `Merge pull request #47 from saebuk0537/agent/add-campus-link-logo`

---

## 2. Remote migration presence

`list_migrations` for project `cwbmfnenunqzwwypqipc`:

| Version | Name | Present |
| --- | --- | --- |
| `20260714014555` | `project_recruitment_status_and_deadline` | **yes** |
| `20260714024052` | `matching_eligibility_contract` | **yes** |

Local migration file read (no edits):  
`frontend/supabase/migrations/20260714014555_project_recruitment_status_and_deadline.sql`

Local types already include both columns:  
`frontend/src/lib/supabase/database.types.ts` (`project_status: string`, `recruitment_deadline: string | null`).

---

## 3. Column metadata (`information_schema.columns`)

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'projects'
  AND column_name IN ('project_status', 'recruitment_deadline', 'end_date', 'expected_member_count');
```

| column_name | data_type | is_nullable | column_default |
| --- | --- | --- | --- |
| `project_status` | character varying | NO | `'PREPARING'::character varying` |
| `recruitment_deadline` | date | YES | null |
| `end_date` | date | YES | null |
| `expected_member_count` | integer | YES | null |

Named CHECKs confirmed:

- `projects_project_status_check`: `CHECK (project_status IN ('PREPARING','IN_PROGRESS','COMPLETED'))`
- `projects_expected_member_count_positive_check`: `CHECK (expected_member_count IS NULL OR expected_member_count > 0)`

---

## 4. Project aggregates (no user content)

```sql
SELECT
  count(*) AS total_projects,
  count(*) FILTER (WHERE recruitment_deadline IS NULL) AS null_recruitment_deadline,
  count(*) FILTER (WHERE end_date IS NULL) AS null_end_date,
  count(*) FILTER (WHERE end_date IS DISTINCT FROM recruitment_deadline) AS disagreeing_deadlines
FROM public.projects;
```

| total_projects | null_recruitment_deadline | null_end_date | disagreeing_deadlines |
| --- | --- | --- | --- |
| 5 | 5 | 5 | 0 |

Note: all current rows have null deadlines on both columns (agree at null). Deadline contract mismatch remains an application concern for create/update paths (later tasks), not a missing-column / DDL issue.

---

## 5. Log evidence (last 24h)

### API — project POST is HTTP 400

Two failing inserts observed:

1. `POST | 400 | .../rest/v1/projects?select=...recruitment_deadline...`  
   - id: `40f1cf9f-1930-4214-9de4-cfbe717ed811`  
   - timestamp µs: `1784008051086000`
2. `POST | 400 | .../rest/v1/projects?select=...recruitment_deadline...`  
   - id: `ec98b61b-0d04-421a-a72c-b262180521f1`  
   - timestamp µs: `1784002430657000`

### Postgres — constraint name

Matching ERROR lines:

1. `new row for relation "projects" violates check constraint "projects_expected_member_count_positive_check"`  
   - id: `3c26cc0b-979e-4b4b-b755-e93a4d342d0e`  
   - timestamp µs: `1784008051644000` (pairs with API POST #1)
2. `new row for relation "projects" violates check constraint "projects_expected_member_count_positive_check"`  
   - id (second occurrence in same window)  
   - timestamp µs: `1784002431249000` (pairs with API POST #2)

Interpretation (consistent with plan baseline): null/omitted member count is being coerced to `0` on insert, which fails `expected_member_count > 0` while `NULL` would be allowed.

---

## 6. Stop-condition check

| Condition | Result |
| --- | --- |
| Migration `20260714014555` absent? | No — present |
| Migration `20260714024052` absent? | No — present |
| Column `project_status` absent? | No — present |
| Column `recruitment_deadline` absent? | No — present |

**GO for Task 2 without DDL.** Do not create a duplicate deadline migration.
