-- Least-privilege matching eligibility RPC.
-- Authenticated senders may read only the receiver flags needed for B6
-- authorization without broadening users/profiles SELECT policies.

create or replace function public.get_matching_eligibility(p_user_id bigint)
returns table (
  user_id bigint,
  email_verified boolean,
  onboarding_completed boolean,
  collaboration_status varchar
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if public.current_app_user_id() is null then
    raise exception 'UNAUTHORIZED';
  end if;

  return query
  select
    u.id,
    u.email_verified,
    p.onboarding_completed,
    p.collaboration_status
  from public.users u
  join public.profiles p on p.user_id = u.id
  where u.id = p_user_id;
end;
$$;

revoke all on function public.get_matching_eligibility(bigint) from public, anon;
grant execute on function public.get_matching_eligibility(bigint)
  to authenticated, service_role;
