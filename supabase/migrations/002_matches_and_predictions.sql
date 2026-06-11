-- Matches and predictions with automatic scoring

create table public.matches (
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

create table public.predictions (
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

create index matches_league_id_idx on public.matches (league_id);
create index matches_kickoff_at_idx on public.matches (kickoff_at);
create index predictions_match_id_idx on public.predictions (match_id);
create index predictions_user_id_idx on public.predictions (user_id);

alter table public.matches enable row level security;
alter table public.predictions enable row level security;

-- Matches: members can view, creator can manage
create policy "Members can view league matches"
  on public.matches for select
  to authenticated
  using ((select private.is_league_member(league_id)));

create policy "Creators can insert matches"
  on public.matches for insert
  to authenticated
  with check (
    exists (
      select 1 from public.leagues
      where leagues.id = league_id
        and leagues.created_by = auth.uid()
    )
  );

create policy "Creators can update matches"
  on public.matches for update
  to authenticated
  using (
    exists (
      select 1 from public.leagues
      where leagues.id = league_id
        and leagues.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.leagues
      where leagues.id = league_id
        and leagues.created_by = auth.uid()
    )
  );

create policy "Creators can delete matches"
  on public.matches for delete
  to authenticated
  using (
    exists (
      select 1 from public.leagues
      where leagues.id = league_id
        and leagues.created_by = auth.uid()
    )
  );

-- Predictions: members can view (app hides others before kickoff)
create policy "Members can view predictions"
  on public.predictions for select
  to authenticated
  using (
    (select private.is_league_member(
      (select m.league_id from public.matches m where m.id = predictions.match_id)
    ))
  );

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

create policy "Members can update own predictions before kickoff"
  on public.predictions for update
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and m.kickoff_at > now()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and m.kickoff_at > now()
    )
  );

-- Scoring helpers
create or replace function public.match_outcome(home_goals integer, away_goals integer)
returns text
language sql
immutable
as $$
  select case
    when home_goals > away_goals then '1'
    when home_goals < away_goals then '2'
    else 'X'
  end;
$$;

create or replace function public.calculate_prediction_points(
  pred_home integer,
  pred_away integer,
  res_home integer,
  res_away integer
)
returns integer
language plpgsql
immutable
as $$
begin
  if pred_home = res_home and pred_away = res_away then
    return 3;
  elsif public.match_outcome(pred_home, pred_away) = public.match_outcome(res_home, res_away) then
    return 1;
  else
    return 0;
  end if;
end;
$$;

-- Recalculate league totals after match result
create or replace function public.recalculate_league_points(p_league_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.league_members lm
  set points = coalesce((
    select sum(pr.points_earned)
    from public.predictions pr
    join public.matches m on m.id = pr.match_id
    where m.league_id = p_league_id
      and pr.user_id = lm.user_id
  ), 0)
  where lm.league_id = p_league_id;
end;
$$;

create or replace function public.process_match_result()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.result_home is not null
     and new.result_away is not null
     and (
       old.result_home is distinct from new.result_home
       or old.result_away is distinct from new.result_away
     ) then
    update public.predictions p
    set
      points_earned = public.calculate_prediction_points(
        p.predicted_home,
        p.predicted_away,
        new.result_home,
        new.result_away
      ),
      updated_at = now()
    where p.match_id = new.id;

    perform public.recalculate_league_points(new.league_id);
  end if;

  return new;
end;
$$;

create trigger on_match_result_set
  after update on public.matches
  for each row execute function public.process_match_result();
