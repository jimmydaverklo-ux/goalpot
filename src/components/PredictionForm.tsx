"use client";

import { savePrediction } from "@/app/actions/matches";
import { useTranslations } from "next-intl";
import { useState } from "react";

type Props = {
  matchId: string;
  leagueId: string;
  locale: string;
  initialHome?: number;
  initialAway?: number;
};

export function PredictionForm({
  matchId,
  leagueId,
  locale,
  initialHome,
  initialAway,
}: Props) {
  const t = useTranslations("matches");
  const [home, setHome] = useState(initialHome?.toString() ?? "");
  const [away, setAway] = useState(initialAway?.toString() ?? "");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    const formData = new FormData();
    formData.set("matchId", matchId);
    formData.set("leagueId", leagueId);
    formData.set("locale", locale);
    formData.set("predictedHome", home);
    formData.set("predictedAway", away);

    const result = await savePrediction(formData);
    setLoading(false);

    if (!result?.error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div>
        <label className="mb-1 block text-xs text-white/50">{t("yourTip")}</label>
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
        className="rounded-lg bg-turquoise px-3 py-1.5 text-sm font-medium text-navy transition-colors hover:bg-turquoise-dark disabled:opacity-50"
      >
        {saved ? t("saved") : t("saveTip")}
      </button>
    </form>
  );
}
