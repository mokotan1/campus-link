# Backend is Phase 2, not part of the MVP

## MVP runtime boundary

The current MVP runs as `frontend/` (Next.js) against Supabase Auth and Supabase Postgres.
`frontend/supabase/migrations/` is the only authoritative MVP schema history.
`backend/` and its Flyway migrations are retained only for Phase 2 evaluation and are not run by Docker Compose or CI.

## What this means in practice

- `docker compose up` starts only the `frontend` service. There is no `backend` or `db` service.
- No CI workflow builds, tests, or deploys `backend/`.
- `backend/src/main/resources/db/migration` (Flyway) is not applied to any environment the MVP uses. It does not track the live Supabase schema and must not be treated as a source of truth.
- Any Supabase/PostgreSQL access code in `backend/` is reference material for a possible future Spring Boot service, not a running dependency of the product.

## Why it still exists in the repository

The Spring Boot code and its domain package layout (`identity`, `profile`, `portfolio`, `project`, `application`) document one option for a future Phase 2 service boundary. Keeping it in the repository avoids losing that design work, but it must not be confused with the shipped MVP.

## Before resuming backend work

If Phase 2 work on `backend/` resumes, first reconcile its schema against `frontend/supabase/migrations/`, since the two have diverged and only the Supabase migrations reflect the live database.
