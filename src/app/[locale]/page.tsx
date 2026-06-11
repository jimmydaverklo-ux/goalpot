import { Link } from "@/i18n/navigation";
import { getServerUser } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations("home");
  const tCommon = await getTranslations("common");
  const user = await getServerUser();

  return (
    <div className="mx-auto max-w-5xl px-4 py-20 text-center">
      <div className="mb-6 inline-block rounded-full bg-turquoise/10 px-4 py-1 text-sm font-medium text-turquoise">
        {tCommon("tagline")}
      </div>

      <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-6xl">
        {t("hero")}
      </h1>

      <p className="mx-auto mb-10 max-w-2xl text-lg text-white/70">
        {t("description")}
      </p>

      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
        {user ? (
          <>
            <Link
              href="/dashboard"
              className="rounded-lg bg-turquoise px-8 py-3 font-medium text-navy transition-colors hover:bg-turquoise-dark"
            >
              {t("getStarted")}
            </Link>
            <Link
              href="/leagues/new"
              className="rounded-lg border border-turquoise/50 px-8 py-3 font-medium text-turquoise transition-colors hover:bg-turquoise/10"
            >
              {t("createLeague")}
            </Link>
          </>
        ) : (
          <Link
            href="/signup"
            className="rounded-lg bg-turquoise px-8 py-3 font-medium text-navy transition-colors hover:bg-turquoise-dark"
          >
            {t("getStarted")}
          </Link>
        )}
      </div>

      <div className="mt-24 grid gap-6 md:grid-cols-3">
        {[
          { icon: "⚽", title: t("feature1Title"), desc: t("feature1Desc") },
          { icon: "🔗", title: t("feature2Title"), desc: t("feature2Desc") },
          { icon: "🏆", title: t("feature3Title"), desc: t("feature3Desc") },
        ].map((feature) => (
          <div
            key={feature.title}
            className="rounded-xl border border-white/10 bg-navy-light p-6 text-left"
          >
            <span className="text-3xl">{feature.icon}</span>
            <h3 className="mt-3 font-semibold">{feature.title}</h3>
            <p className="mt-1 text-sm text-white/60">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
