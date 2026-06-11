import { CreateLeagueForm } from "@/components/CreateLeagueForm";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function NewLeaguePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("league");
  const tCommon = await getTranslations("common");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Link
        href="/dashboard"
        className="mb-6 inline-block text-sm text-white/60 transition-colors hover:text-turquoise"
      >
        ← {tCommon("back")}
      </Link>
      <h1 className="mb-8 text-3xl font-bold">{t("createTitle")}</h1>
      <CreateLeagueForm locale={locale} />
    </div>
  );
}
