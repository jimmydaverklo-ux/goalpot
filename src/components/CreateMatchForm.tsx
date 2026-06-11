"use client";

import { createMatch } from "@/app/actions/matches";
import { useTranslations } from "next-intl";
import { useState } from "react";

type Props = {
  leagueId: string;
  locale: string;
};

export function CreateMatchForm({ leagueId, locale }: Props) {
  const t = useTranslations("matches");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createMatch(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    e.currentTarget.reset();
    setLoading(false);
  }

  const defaultKickoff = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const defaultValue = defaultKickoff.toISOString().slice(0, 16);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-navy-light p-6">
      <h3 className="font-semibold text-turquoise">{t("addMatch")}</h3>
      <input type="hidden" name="leagueId" value={leagueId} />
      <input type="hidden" name="locale" value={locale} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-white/70">{t("homeTeam")}</label>
          <input
            name="homeTeam"
            required
            placeholder={t("homeTeamPlaceholder")}
            className="w-full rounded-lg border border-white/15 bg-navy px-4 py-2 text-white outline-none focus:border-turquoise"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-white/70">{t("awayTeam")}</label>
          <input
            name="awayTeam"
            required
            placeholder={t("awayTeamPlaceholder")}
            className="w-full rounded-lg border border-white/15 bg-navy px-4 py-2 text-white outline-none focus:border-turquoise"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-white/70">{t("kickoff")}</label>
        <input
          name="kickoffAt"
          type="datetime-local"
          required
          defaultValue={defaultValue}
          className="w-full rounded-lg border border-white/15 bg-navy px-4 py-2 text-white outline-none focus:border-turquoise"
        />
      </div>

      {error && (
        <p className="text-sm text-red-300">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-turquoise px-4 py-2 text-sm font-medium text-navy transition-colors hover:bg-turquoise-dark disabled:opacity-50"
      >
        {t("addMatchButton")}
      </button>
    </form>
  );
}
