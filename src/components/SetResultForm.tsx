"use client";

import { setMatchResult } from "@/app/actions/matches";
import { useTranslations } from "next-intl";
import { useState } from "react";

type Props = {
  matchId: string;
  leagueId: string;
  locale: string;
  initialHome?: number | null;
  initialAway?: number | null;
};

export function SetResultForm({
  matchId,
  leagueId,
  locale,
  initialHome,
  initialAway,
}: Props) {
  const t = useTranslations("matches");
  const [home, setHome] = useState(initialHome?.toString() ?? "");
  const [away, setAway] = useState(initialAway?.toString() ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.set("matchId", matchId);
    formData.set("leagueId", leagueId);
    formData.set("locale", locale);
    formData.set("resultHome", home);
    formData.set("resultAway", away);

    await setMatchResult(formData);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div>
        <label className="mb-1 block text-xs text-white/50">{t("setResult")}</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={home}
            onChange={(e) => setHome(e.target.value)}
            required
            className="w-14 rounded border border-white/15 bg-navy px-2 py-1 text-center text-white outline-none focus:border-turquoise"
          />
          <span className="text-white/40">–</span>
          <input
            type="number"
            min={0}
            value={away}
            onChange={(e) => setAway(e.target.value)}
            required
            className="w-14 rounded border border-white/15 bg-navy px-2 py-1 text-center text-white outline-none focus:border-turquoise"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg border border-turquoise/50 px-3 py-1.5 text-sm text-turquoise transition-colors hover:bg-turquoise/10 disabled:opacity-50"
      >
        {t("saveResult")}
      </button>
    </form>
  );
}
