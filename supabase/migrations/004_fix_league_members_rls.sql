-- Fix infinite recursion on league_members RLS.
-- Policies must never subquery league_members directly; use a private security definer helper.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to postgres, authenticated, service_role;

create or replace function private.is_league_member(p_league_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.league_members
    where league_id = p_league_id
      and user_id = (select auth.uid())
  );
$$;

alter function private.is_league_member(uuid) owner to postgres;
revoke all on function private.is_league_member(uuid) from public;
grant execute on function private.is_league_member(uuid) to authenticated, service_role;

drop function if exists public.is_league_member(uuid, uuid);

drop policy if exists "Members can view league members" on public.league_members;
create policy "Members can view league members"
  on public.league_members for select
  to authenticated
  using ((select private.is_league_member(league_id)));

drop policy if exists "Members can view their leagues" on public.leagues;
create policy "Members can view their leagues"
  on public.leagues for select
  to authenticated
  using ((select private.is_league_member(id)));

drop policy if exists "Members can view league matches" on public.matches;
create policy "Members can view league matches"
  on public.matches for select
  to authenticated
  using ((select private.is_league_member(league_id)));

drop policy if exists "Members can view predictions" on public.predictions;
create policy "Members can view predictions"
  on public.predictions for select
  to authenticated
  using (
    (select private.is_league_member(
      (select m.league_id from public.matches m where m.id = predictions.match_id)
    ))
  );

drop policy if exists "Members can insert predictions before kickoff" on public.predictions;
create policy "Members can insert predictions before kickoff"
  on public.predictions for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and (select private.is_league_member(
      (select m.league_id from public.matches m where m.id = match_id)
    ))
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and m.kickoff_at > now()
    )
  );
