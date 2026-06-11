-- Goalpot v1 schema

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.league_members (
  league_id uuid not null references public.leagues (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  points integer not null default 0,
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);

create index league_members_league_id_idx on public.league_members (league_id);
create index league_members_points_idx on public.league_members (league_id, points desc);
create index leagues_invite_code_idx on public.leagues (invite_code);

alter table public.profiles enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;

-- Profiles
create policy "Users can view all profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

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

-- Leagues
create policy "Members can view their leagues"
  on public.leagues for select
  to authenticated
  using ((select private.is_league_member(id)));

create policy "Creators can view their leagues"
  on public.leagues for select
  to authenticated
  using (auth.uid() = created_by);

create policy "Authenticated users can create leagues"
  on public.leagues for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Creators can update their leagues"
  on public.leagues for update
  to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- League members
create policy "Members can view league members"
  on public.league_members for select
  to authenticated
  using ((select private.is_league_member(league_id)));

create policy "Users can join leagues"
  on public.league_members for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Creators can update member points"
  on public.league_members for update
  to authenticated
  using (
    exists (
      select 1 from public.leagues
      where leagues.id = league_members.league_id
        and leagues.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.leagues
      where leagues.id = league_members.league_id
        and leagues.created_by = auth.uid()
    )
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-add creator as league member
create or replace function public.handle_new_league()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.league_members (league_id, user_id)
  values (new.id, new.created_by);
  return new;
end;
$$;

create trigger on_league_created
  after insert on public.leagues
  for each row execute function public.handle_new_league();

-- Lookup league by invite code (for join flow, bypasses member-only RLS)
create or replace function public.get_league_by_invite_code(code text)
returns table (id uuid, name text, invite_code text)
language sql
security definer
set search_path = public
as $$
  select l.id, l.name, l.invite_code
  from public.leagues l
  where l.invite_code = upper(code)
  limit 1;
$$;

grant execute on function public.get_league_by_invite_code(text) to authenticated, anon;
