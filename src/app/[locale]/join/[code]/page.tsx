import { joinLeagueAction } from "@/app/actions/leagues";
import { Link } from "@/i18n/navigation";
import { getLeagueByInviteCode } from "@/lib/leagues";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string; code: string }>;
};

export default async function JoinPage({ params }: Props) {
  const { locale, code } = await params;
  const t = await getTranslations("league");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const league = await getLeagueByInviteCode(code);

  if (!league) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-red-400">{t("notFound")}</h1>
        <Link
          href="/"
          className="mt-6 inline-block text-turquoise hover:underline"
        >
          Goalpot
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="mb-2 text-2xl font-bold">{t("joinTitle")}</h1>
        <p className="mb-2 text-white/70">{league.name}</p>
        <p className="mb-8 text-white/50">{t("loginToJoin")}</p>
        <Link
          href={`/login?next=/join/${code}`}
          className="rounded-lg bg-turquoise px-8 py-3 font-medium text-navy transition-colors hover:bg-turquoise-dark"
        >
          {t("joinButton")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="mb-2 text-2xl font-bold">{t("joinTitle")}</h1>
      <p className="mb-8 text-lg text-white/70">{league.name}</p>
      <form action={joinLeagueAction}>
        <input type="hidden" name="code" value={code} />
        <input type="hidden" name="locale" value={locale} />
        <button
          type="submit"
          className="rounded-lg bg-turquoise px-8 py-3 font-medium text-navy transition-colors hover:bg-turquoise-dark"
        >
          {t("joinButton")}
        </button>
      </form>
    </div>
  );
}
