"use server";

import { generateInviteCode } from "@/lib/invite-code";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CreateLeagueState = { error: string } | null;

export async function createLeague(
  _prevState: CreateLeagueState,
  formData: FormData
): Promise<CreateLeagueState> {
  const name = formData.get("name") as string;
  const locale = (formData.get("locale") as string) || "sv";

  if (!name?.trim()) {
    return { error: "name_required" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  let inviteCode = generateInviteCode();
  let attempts = 0;

  while (attempts < 5) {
    const { data: league, error: insertError } = await supabase
      .from("leagues")
      .insert({
        name: name.trim(),
        invite_code: inviteCode,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (!insertError && league) {
      const { error: memberError } = await supabase
        .from("league_members")
        .insert({ league_id: league.id, user_id: user.id });

      if (memberError && memberError.code !== "23505") {
        return { error: memberError.message };
      }

      revalidatePath(`/${locale}/dashboard`);
      redirect(`/${locale}/leagues/${league.id}`);
    }

    if (insertError?.code === "23505") {
      inviteCode = generateInviteCode();
      attempts++;
      continue;
    }

    return { error: insertError?.message ?? "create_failed" };
  }

  return { error: "invite_code_failed" };
}

export async function joinLeagueAction(formData: FormData): Promise<void> {
  const inviteCode = formData.get("code") as string;
  const locale = (formData.get("locale") as string) || "sv";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?next=/join/${inviteCode}`);
  }

  const { data: leagueRows } = await supabase.rpc("get_league_by_invite_code", {
    code: inviteCode.toUpperCase(),
  });

  const league = leagueRows?.[0];

  if (!league) {
    redirect(`/${locale}/join/${inviteCode}`);
  }

  const { data: existing } = await supabase
    .from("league_members")
    .select("user_id")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    redirect(`/${locale}/leagues/${league.id}`);
  }

  const { error } = await supabase.from("league_members").insert({
    league_id: league.id,
    user_id: user.id,
  });

  if (error) {
    redirect(`/${locale}/join/${inviteCode}?error=join_failed`);
  }

  revalidatePath(`/${locale}/leagues/${league.id}`);
  redirect(`/${locale}/leagues/${league.id}`);
}
