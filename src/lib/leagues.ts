import { createClient } from "@/lib/supabase/server";
import type { LeaderboardEntry } from "@/types/database";

export async function getUserLeagues(userId: string) {
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("league_members")
    .select("league_id")
    .eq("user_id", userId);

  if (!memberships?.length) return [];

  const leagueIds = memberships.map((m) => m.league_id);

  const { data: leagues } = await supabase
    .from("leagues")
    .select("id, name, invite_code, created_at")
    .in("id", leagueIds)
    .order("created_at", { ascending: false });

  const leaguesWithCounts = await Promise.all(
    (leagues ?? []).map(async (league) => {
      const { count } = await supabase
        .from("league_members")
        .select("*", { count: "exact", head: true })
        .eq("league_id", league.id);

      return { ...league, memberCount: count ?? 0 };
    })
  );

  return leaguesWithCounts;
}

export async function getLeagueById(leagueId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leagues")
    .select("*")
    .eq("id", leagueId)
    .single();

  return data;
}

export async function getLeagueByInviteCode(code: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_league_by_invite_code", {
    code: code.toUpperCase(),
  });

  return data?.[0] ?? null;
}

export async function getLeaderboard(leagueId: string): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("league_members")
    .select("user_id, points")
    .eq("league_id", leagueId)
    .order("points", { ascending: false });

  if (!members?.length) return [];

  const userIds = members.map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", userIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

  return members.map((member, index) => {
    const profile = profileMap.get(member.user_id);
    return {
      user_id: member.user_id,
      points: member.points,
      display_name: profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      rank: index + 1,
    };
  });
}
