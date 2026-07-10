-- Task 3: default-deny RLS and P0 ownership policies for MVP tables.
--
-- Tables covered: users, profiles, portfolio_items, projects, applications.
-- Identity mapping uses public.current_app_user_id() from 202607100001.

-- ---------------------------------------------------------------------------
-- 1. Authorization-safe data constraints
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'applications_application_status_check'
      and conrelid = 'public.applications'::regclass
  ) then
    alter table public.applications
      add constraint applications_application_status_check
      check (application_status in ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELED'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_recruitment_status_check'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
      add constraint projects_recruitment_status_check
      check (recruitment_status in ('RECRUITING', 'CLOSED'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_collaboration_status_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_collaboration_status_check
      check (collaboration_status in ('OPEN', 'CLOSED'));
  end if;
end;
$$;

-- PostgREST UPDATE policies cannot compare OLD and NEW status safely, so
-- privileged transitions are enforced in security-definer functions.
create or replace function public.owner_decide_application(
  p_application_id bigint,
  p_decision text
)
returns public.applications
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor bigint;
  v_app public.applications%rowtype;
begin
  v_actor := public.current_app_user_id();

  if v_actor is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if p_decision not in ('ACCEPTED', 'REJECTED') then
    raise exception 'INVALID_DECISION';
  end if;

  select a.*
  into v_app
  from public.applications as a
  inner join public.projects as p on p.id = a.project_id
  where a.id = p_application_id
    and p.owner_user_id = v_actor
  for update;

  if not found then
    raise exception 'NOT_FOUND_OR_FORBIDDEN';
  end if;

  if v_app.application_status <> 'PENDING' then
    raise exception 'INVALID_TRANSITION';
  end if;

  update public.applications
  set application_status = p_decision
  where id = p_application_id
  returning * into v_app;

  return v_app;
end;
$$;

create or replace function public.applicant_withdraw_application(
  p_application_id bigint
)
returns public.applications
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor bigint;
  v_app public.applications%rowtype;
begin
  v_actor := public.current_app_user_id();

  if v_actor is null then
    raise exception 'UNAUTHORIZED';
  end if;

  select *
  into v_app
  from public.applications
  where id = p_application_id
    and applicant_user_id = v_actor
  for update;

  if not found then
    raise exception 'NOT_FOUND_OR_FORBIDDEN';
  end if;

  if v_app.application_status <> 'PENDING' then
    raise exception 'INVALID_TRANSITION';
  end if;

  update public.applications
  set application_status = 'CANCELED'
  where id = p_application_id
  returning * into v_app;

  return v_app;
end;
$$;

revoke all on function public.owner_decide_application(bigint, text) from public;
revoke all on function public.applicant_withdraw_application(bigint) from public;
grant execute on function public.owner_decide_application(bigint, text) to authenticated, service_role;
grant execute on function public.applicant_withdraw_application(bigint) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Enable RLS (default deny until a policy matches)
-- ---------------------------------------------------------------------------

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.projects enable row level security;
alter table public.applications enable row level security;

-- ---------------------------------------------------------------------------
-- 3. users
-- ---------------------------------------------------------------------------

create policy users_select_self
  on public.users
  for select
  to authenticated
  using (auth_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4. profiles
-- ---------------------------------------------------------------------------

create policy profiles_select_authenticated
  on public.profiles
  for select
  to authenticated
  using (public.current_app_user_id() is not null);

create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (user_id = public.current_app_user_id());

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (user_id = public.current_app_user_id())
  with check (user_id = public.current_app_user_id());

-- ---------------------------------------------------------------------------
-- 5. portfolio_items
-- ---------------------------------------------------------------------------

create policy portfolio_items_select_authenticated
  on public.portfolio_items
  for select
  to authenticated
  using (public.current_app_user_id() is not null);

create policy portfolio_items_insert_own
  on public.portfolio_items
  for insert
  to authenticated
  with check (user_id = public.current_app_user_id());

create policy portfolio_items_update_own
  on public.portfolio_items
  for update
  to authenticated
  using (user_id = public.current_app_user_id())
  with check (user_id = public.current_app_user_id());

create policy portfolio_items_delete_own
  on public.portfolio_items
  for delete
  to authenticated
  using (user_id = public.current_app_user_id());

-- ---------------------------------------------------------------------------
-- 6. projects
-- ---------------------------------------------------------------------------

create policy projects_select_recruiting_or_own
  on public.projects
  for select
  to authenticated
  using (
    recruitment_status = 'RECRUITING'
    or owner_user_id = public.current_app_user_id()
  );

create policy projects_insert_own
  on public.projects
  for insert
  to authenticated
  with check (owner_user_id = public.current_app_user_id());

create policy projects_update_own
  on public.projects
  for update
  to authenticated
  using (owner_user_id = public.current_app_user_id())
  with check (owner_user_id = public.current_app_user_id());

create policy projects_delete_own
  on public.projects
  for delete
  to authenticated
  using (owner_user_id = public.current_app_user_id());

-- ---------------------------------------------------------------------------
-- 7. applications
-- ---------------------------------------------------------------------------

create policy applications_insert_own_pending
  on public.applications
  for insert
  to authenticated
  with check (
    applicant_user_id = public.current_app_user_id()
    and application_status = 'PENDING'
  );

create policy applications_select_applicant
  on public.applications
  for select
  to authenticated
  using (applicant_user_id = public.current_app_user_id());

create policy applications_select_project_owner
  on public.applications
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.projects as p
      where p.id = applications.project_id
        and p.owner_user_id = public.current_app_user_id()
    )
  );

-- No direct UPDATE policy: transitions go through owner_decide_application()
-- and applicant_withdraw_application().
