import { CreateMatchForm } from "@/components/CreateMatchForm";
import { InviteLink } from "@/components/InviteLink";
import { Leaderboard } from "@/components/Leaderboard";
import { MatchList } from "@/components/MatchList";
import { Link } from "@/i18n/navigation";
import { getLeaderboard, getLeagueById } from "@/lib/leagues";
import { getLeagueMatches } from "@/lib/matches";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function LeaguePage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations("league");
  const tMatches = await getTranslations("matches");
  const tCommon = await getTranslations("common");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const league = await getLeagueById(id);
  if (!league) {
    notFound();
  }

  const [entries, matches] = await Promise.all([
    getLeaderboard(id),
    getLeagueMatches(id, user.id),
  ]);
  const isCreator = league.created_by === user.id;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/dashboard"
        className="mb-6 inline-block text-sm text-white/60 transition-colors hover:text-turquoise"
      >
        ← {tCommon("back")}
      </Link>

      <h1 className="mb-8 text-3xl font-bold">{league.name}</h1>

      {isCreator && (
        <div className="mb-8">
          <InviteLink inviteCode={league.invite_code} locale={locale} />
        </div>
      )}

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold text-turquoise">
          {tMatches("title")}
        </h2>
        {isCreator && (
          <div className="mb-6">
            <CreateMatchForm leagueId={id} locale={locale} />
          </div>
        )}
        <MatchList
          matches={matches}
          leagueId={id}
          locale={locale}
          isCreator={isCreator}
        />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-turquoise">
          {t("leaderboard")}
        </h2>
        <Leaderboard entries={entries} currentUserId={user.id} />
      </section>
    </div>
  );
}
