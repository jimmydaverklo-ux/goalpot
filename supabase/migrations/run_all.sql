-- Goalpot: run all migrations in one go
-- Paste this in Supabase SQL Editor if MCP is unavailable

-- ========== 001_initial_schema.sql ==========

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.league_members (
  league_id uuid not null references public.leagues (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  points integer not null default 0,
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);

create index if not exists league_members_league_id_idx on public.league_members (league_id);
create index if not exists league_members_points_idx on public.league_members (league_id, points desc);
create index if not exists leagues_invite_code_idx on public.leagues (invite_code);

alter table public.profiles enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;

drop policy if exists "Users can view all profiles" on public.profiles;
create policy "Users can view all profiles"
  on public.profiles for select to authenticated using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

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

drop policy if exists "Members can view their leagues" on public.leagues;
create policy "Members can view their leagues"
  on public.leagues for select to authenticated
  using ((select private.is_league_member(id)));

drop policy if exists "Creators can view their leagues" on public.leagues;
create policy "Creators can view their leagues"
  on public.leagues for select to authenticated
  using (auth.uid() = created_by);

drop policy if exists "Authenticated users can create leagues" on public.leagues;
create policy "Authenticated users can create leagues"
  on public.leagues for insert to authenticated with check (auth.uid() = created_by);

drop policy if exists "Creators can update their leagues" on public.leagues;
create policy "Creators can update their leagues"
  on public.leagues for update to authenticated
  using (auth.uid() = created_by) with check (auth.uid() = created_by);

drop policy if exists "Members can view league members" on public.league_members;
create policy "Members can view league members"
  on public.league_members for select to authenticated
  using ((select private.is_league_member(league_id)));

drop policy if exists "Users can join leagues" on public.league_members;
create policy "Users can join leagues"
  on public.league_members for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Creators can update member points" on public.league_members;
create policy "Creators can update member points"
  on public.league_members for update to authenticated
  using (exists (
    select 1 from public.leagues
    where leagues.id = league_members.league_id and leagues.created_by = auth.uid()
  ))
  with check (exists (
    select 1 from public.leagues
    where leagues.id = league_members.league_id and leagues.created_by = auth.uid()
  ));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.handle_new_league()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.league_members (league_id, user_id) values (new.id, new.created_by);
  return new;
end;
$$;

drop trigger if exists on_league_created on public.leagues;
create trigger on_league_created
  after insert on public.leagues for each row execute function public.handle_new_league();

create or replace function public.get_league_by_invite_code(code text)
returns table (id uuid, name text, invite_code text)
language sql security definer set search_path = public as $$
  select l.id, l.name, l.invite_code from public.leagues l
  where l.invite_code = upper(code) limit 1;
$$;

grant execute on function public.get_league_by_invite_code(text) to authenticated, anon;

-- ========== 002_matches_and_predictions.sql ==========

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues (id) on delete cascade,
  home_team text not null,
  away_team text not null,
  kickoff_at timestamptz not null,
  result_home integer,
  result_away integer,
  created_at timestamptz not null default now(),
  constraint result_home_nonneg check (result_home is null or result_home >= 0),
  constraint result_away_nonneg check (result_away is null or result_away >= 0)
);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  predicted_home integer not null,
  predicted_away integer not null,
  points_earned integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, user_id),
  constraint predicted_home_nonneg check (predicted_home >= 0),
  constraint predicted_away_nonneg check (predicted_away >= 0)
);

create index if not exists matches_league_id_idx on public.matches (league_id);
create index if not exists matches_kickoff_at_idx on public.matches (kickoff_at);
create index if not exists predictions_match_id_idx on public.predictions (match_id);
create index if not exists predictions_user_id_idx on public.predictions (user_id);

alter table public.matches enable row level security;
alter table public.predictions enable row level security;

drop policy if exists "Members can view league matches" on public.matches;
create policy "Members can view league matches"
  on public.matches for select to authenticated
  using ((select private.is_league_member(league_id)));

drop policy if exists "Creators can insert matches" on public.matches;
create policy "Creators can insert matches"
  on public.matches for insert to authenticated
  with check (exists (
    select 1 from public.leagues where leagues.id = league_id and leagues.created_by = auth.uid()
  ));

drop policy if exists "Creators can update matches" on public.matches;
create policy "Creators can update matches"
  on public.matches for update to authenticated
  using (exists (select 1 from public.leagues where leagues.id = league_id and leagues.created_by = auth.uid()))
  with check (exists (select 1 from public.leagues where leagues.id = league_id and leagues.created_by = auth.uid()));

drop policy if exists "Creators can delete matches" on public.matches;
create policy "Creators can delete matches"
  on public.matches for delete to authenticated
  using (exists (select 1 from public.leagues where leagues.id = league_id and leagues.created_by = auth.uid()));

drop policy if exists "Members can view predictions" on public.predictions;
create policy "Members can view predictions"
  on public.predictions for select to authenticated
  using (
    (select private.is_league_member(
      (select m.league_id from public.matches m where m.id = predictions.match_id)
    ))
  );

drop policy if exists "Members can insert predictions before kickoff" on public.predictions;
create policy "Members can insert predictions before kickoff"
  on public.predictions for insert to authenticated
  with check (
    auth.uid() = user_id
    and (select private.is_league_member(
      (select m.league_id from public.matches m where m.id = match_id)
    ))
    and exists (
      select 1 from public.matches m
      where m.id = match_id and m.kickoff_at > now()
    )
  );

drop policy if exists "Members can update own predictions before kickoff" on public.predictions;
create policy "Members can update own predictions before kickoff"
  on public.predictions for update to authenticated
  using (auth.uid() = user_id and exists (
    select 1 from public.matches m where m.id = match_id and m.kickoff_at > now()
  ))
  with check (auth.uid() = user_id and exists (
    select 1 from public.matches m where m.id = match_id and m.kickoff_at > now()
  ));

create or replace function public.match_outcome(home_goals integer, away_goals integer)
returns text language sql immutable as $$
  select case when home_goals > away_goals then '1' when home_goals < away_goals then '2' else 'X' end;
$$;

create or replace function public.calculate_prediction_points(
  pred_home integer, pred_away integer, res_home integer, res_away integer
) returns integer language plpgsql immutable as $$
begin
  if pred_home = res_home and pred_away = res_away then return 3;
  elsif public.match_outcome(pred_home, pred_away) = public.match_outcome(res_home, res_away) then return 1;
  else return 0;
  end if;
end;
$$;

create or replace function public.recalculate_league_points(p_league_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.league_members lm
  set points = coalesce((
    select sum(pr.points_earned) from public.predictions pr
    join public.matches m on m.id = pr.match_id
    where m.league_id = p_league_id and pr.user_id = lm.user_id
  ), 0)
  where lm.league_id = p_league_id;
end;
$$;

create or replace function public.process_match_result()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.result_home is not null and new.result_away is not null
     and (old.result_home is distinct from new.result_home or old.result_away is distinct from new.result_away) then
    update public.predictions p
    set points_earned = public.calculate_prediction_points(
      p.predicted_home, p.predicted_away, new.result_home, new.result_away
    ), updated_at = now()
    where p.match_id = new.id;
    perform public.recalculate_league_points(new.league_id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_match_result_set on public.matches;
create trigger on_match_result_set
  after update on public.matches for each row execute function public.process_match_result();

-- ========== 003_creator_league_access.sql ==========

drop policy if exists "Creators can view their leagues" on public.leagues;
create policy "Creators can view their leagues"
  on public.leagues for select
  to authenticated
  using (auth.uid() = created_by);

-- ========== 004_fix_league_members_rls.sql ==========
-- (function and policies already applied above in this consolidated file)
