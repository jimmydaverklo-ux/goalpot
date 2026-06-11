import { Link } from "@/i18n/navigation";
import { getUserLeagues } from "@/lib/leagues";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("dashboard");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const leagues = await getUserLeagues(user.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Link
          href="/leagues/new"
          className="rounded-lg bg-turquoise px-4 py-2 text-sm font-medium text-navy transition-colors hover:bg-turquoise-dark"
        >
          {t("createNew")}
        </Link>
      </div>

      {leagues.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-navy-light p-12 text-center">
          <p className="mb-4 text-white/60">{t("empty")}</p>
          <Link
            href="/leagues/new"
            className="inline-block rounded-lg bg-turquoise px-6 py-2 font-medium text-navy transition-colors hover:bg-turquoise-dark"
          >
            {t("createNew")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {leagues.map((league) => (
            <Link
              key={league.id}
              href={`/leagues/${league.id}`}
              className="rounded-xl border border-white/10 bg-navy-light p-6 transition-colors hover:border-turquoise/30"
            >
              <h2 className="text-xl font-semibold">{league.name}</h2>
              <p className="mt-2 text-sm text-white/50">
                {t("members", { count: league.memberCount })}
              </p>
              <span className="mt-4 inline-block text-sm text-turquoise">
                {t("viewLeague")} →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
