-- Allow league creators to read their league immediately after creation
-- (before league_members row exists or when the trigger did not run)

create policy "Creators can view their leagues"
  on public.leagues for select
  to authenticated
  using (auth.uid() = created_by);
