"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function assertLeagueCreator(leagueId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized", user: null };

  const { data: league } = await supabase
    .from("leagues")
    .select("created_by")
    .eq("id", leagueId)
    .single();

  if (!league || league.created_by !== user.id) {
    return { error: "Unauthorized", user: null };
  }

  return { error: null, user };
}

export async function createMatch(formData: FormData) {
  const leagueId = formData.get("leagueId") as string;
  const locale = (formData.get("locale") as string) || "sv";
  const homeTeam = (formData.get("homeTeam") as string)?.trim();
  const awayTeam = (formData.get("awayTeam") as string)?.trim();
  const kickoffAt = formData.get("kickoffAt") as string;

  if (!homeTeam || !awayTeam || !kickoffAt) {
    return { error: "All fields required" };
  }

  const { error: authError } = await assertLeagueCreator(leagueId);
  if (authError) return { error: authError };

  const supabase = await createClient();
  const { error } = await supabase.from("matches").insert({
    league_id: leagueId,
    home_team: homeTeam,
    away_team: awayTeam,
    kickoff_at: new Date(kickoffAt).toISOString(),
  });

  if (error) return { error: error.message };

  revalidatePath(`/${locale}/leagues/${leagueId}`);
  return { success: true };
}

export async function setMatchResult(formData: FormData) {
  const matchId = formData.get("matchId") as string;
  const leagueId = formData.get("leagueId") as string;
  const locale = (formData.get("locale") as string) || "sv";
  const resultHome = parseInt(formData.get("resultHome") as string, 10);
  const resultAway = parseInt(formData.get("resultAway") as string, 10);

  if (isNaN(resultHome) || isNaN(resultAway) || resultHome < 0 || resultAway < 0) {
    return { error: "Invalid result" };
  }

  const { error: authError } = await assertLeagueCreator(leagueId);
  if (authError) return { error: authError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("matches")
    .update({ result_home: resultHome, result_away: resultAway })
    .eq("id", matchId);

  if (error) return { error: error.message };

  revalidatePath(`/${locale}/leagues/${leagueId}`);
  return { success: true };
}

export async function savePrediction(formData: FormData) {
  const matchId = formData.get("matchId") as string;
  const leagueId = formData.get("leagueId") as string;
  const locale = (formData.get("locale") as string) || "sv";
  const predictedHome = parseInt(formData.get("predictedHome") as string, 10);
  const predictedAway = parseInt(formData.get("predictedAway") as string, 10);

  if (
    isNaN(predictedHome) ||
    isNaN(predictedAway) ||
    predictedHome < 0 ||
    predictedAway < 0
  ) {
    return { error: "Invalid prediction" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data: match } = await supabase
    .from("matches")
    .select("kickoff_at, result_home, result_away")
    .eq("id", matchId)
    .single();

  if (!match) return { error: "Match not found" };

  if (new Date(match.kickoff_at) <= new Date()) {
    return { error: "Match is locked" };
  }

  const { data: existing } = await supabase
    .from("predictions")
    .select("id")
    .eq("match_id", matchId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("predictions")
      .update({
        predicted_home: predictedHome,
        predicted_away: predictedAway,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("predictions").insert({
      match_id: matchId,
      user_id: user.id,
      predicted_home: predictedHome,
      predicted_away: predictedAway,
    });

    if (error) return { error: error.message };
  }

  revalidatePath(`/${locale}/leagues/${leagueId}`);
  return { success: true };
}
