import { createClient } from "@/lib/supabase/server";
import type { MatchWithPrediction } from "@/types/database";

export async function getLeagueMatches(
  leagueId: string,
  userId: string
): Promise<MatchWithPrediction[]> {
  const supabase = await createClient();

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("league_id", leagueId)
    .order("kickoff_at", { ascending: true });

  if (!matches?.length) return [];

  const matchIds = matches.map((m) => m.id);
  const { data: predictions } = await supabase
    .from("predictions")
    .select("*")
    .in("match_id", matchIds)
    .eq("user_id", userId);

  const predictionMap = new Map(
    predictions?.map((p) => [p.match_id, p]) ?? []
  );

  const now = new Date();

  return matches.map((match) => {
    const kickoff = new Date(match.kickoff_at);
    const isFinished =
      match.result_home !== null && match.result_away !== null;
    const isLocked = kickoff <= now || isFinished;

    return {
      ...match,
      userPrediction: predictionMap.get(match.id) ?? null,
      isLocked,
      isFinished,
    };
  });
}
