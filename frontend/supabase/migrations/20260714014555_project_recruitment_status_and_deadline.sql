-- Separate project progress state from recruitment state, and enforce
-- deadline-aware visibility / insert eligibility via RLS.
--
-- Forward-only: does not drop or rename end_date; backfills recruitment_deadline
-- from existing non-null end_date values for legacy rows.

-- ---------------------------------------------------------------------------
-- 1. Independent project state and recruitment deadline columns
-- ---------------------------------------------------------------------------

alter table public.projects
  add column if not exists project_status varchar(40) not null default 'PREPARING',
  add column if not exists recruitment_deadline date;

update public.projects
set recruitment_deadline = end_date
where recruitment_deadline is null
  and end_date is not null;

-- ---------------------------------------------------------------------------
-- 2. Named static CHECK constraints (varchar columns + named CHECK)
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_project_status_check'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
      add constraint projects_project_status_check
      check (project_status in ('PREPARING', 'IN_PROGRESS', 'COMPLETED'));
  end if;
end;
$$;

-- Normalize legacy non-positive counts before enforcing the CHECK.
update public.projects
set expected_member_count = null
where expected_member_count is not null
  and expected_member_count <= 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_expected_member_count_positive_check'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
      add constraint projects_expected_member_count_positive_check
      check (expected_member_count is null or expected_member_count > 0);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Indexes for deadline-aware list/filter paths
-- ---------------------------------------------------------------------------

create index if not exists projects_owner_recruitment_deadline_idx
  on public.projects (owner_user_id, recruitment_status, recruitment_deadline);

create index if not exists projects_recruitment_deadline_idx
  on public.projects (recruitment_status, recruitment_deadline);

create index if not exists applications_project_created_at_idx
  on public.applications (project_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 4. Replace projects SELECT: owners see all own rows; others only
--    RECRUITING projects whose deadline is null or not yet past.
-- ---------------------------------------------------------------------------

drop policy if exists projects_select_recruiting_or_own on public.projects;

create policy projects_select_recruiting_or_own
  on public.projects
  for select
  to authenticated
  using (
    owner_user_id = public.current_app_user_id()
    or (
      recruitment_status = 'RECRUITING'
      and (
        recruitment_deadline is null
        or recruitment_deadline >= current_date
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 5. Replace applications INSERT: preserve ownership/pending/RECRUITING
--    checks and add deadline eligibility.
-- ---------------------------------------------------------------------------

drop policy if exists applications_insert_own_pending on public.applications;

create policy applications_insert_own_pending
  on public.applications
  for insert
  to authenticated
  with check (
    applicant_user_id = public.current_app_user_id()
    and application_status = 'PENDING'
    and exists (
      select 1
      from public.projects as p
      where p.id = project_id
        and p.recruitment_status = 'RECRUITING'
        and p.owner_user_id <> public.current_app_user_id()
        and (
          p.recruitment_deadline is null
          or p.recruitment_deadline >= current_date
        )
    )
  );

-- ---------------------------------------------------------------------------
-- 6. Replace proposals INSERT: preserve sender/PENDING/owner/RECRUITING
--    checks and add the same deadline eligibility.
--    Proposal transition RPCs and proposals SELECT policies are untouched.
-- ---------------------------------------------------------------------------

drop policy if exists proposals_insert_sender_pending on public.proposals;

create policy proposals_insert_sender_pending
  on public.proposals
  for insert
  to authenticated
  with check (
    sender_user_id = public.current_app_user_id()
    and proposal_status = 'PENDING'
    and exists (
      select 1
      from public.projects as p
      where p.id = project_id
        and p.owner_user_id = public.current_app_user_id()
        and p.recruitment_status = 'RECRUITING'
        and (
          p.recruitment_deadline is null
          or p.recruitment_deadline >= current_date
        )
    )
  );
