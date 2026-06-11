import { PredictionForm } from "@/components/PredictionForm";
import { SetResultForm } from "@/components/SetResultForm";
import type { MatchWithPrediction } from "@/types/database";
import { getTranslations } from "next-intl/server";

type Props = {
  matches: MatchWithPrediction[];
  leagueId: string;
  locale: string;
  isCreator: boolean;
};

function formatKickoff(kickoffAt: string, locale: string) {
  return new Date(kickoffAt).toLocaleString(locale === "sv" ? "sv-SE" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export async function MatchList({ matches, leagueId, locale, isCreator }: Props) {
  const t = await getTranslations("matches");

  if (matches.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-navy-light p-8 text-center text-white/50">
        {t("noMatches")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/50">{t("scoringRules")}</p>

      {matches.map((match) => (
        <div
          key={match.id}
          className="rounded-xl border border-white/10 bg-navy-light p-5"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">
              {match.home_team}{" "}
              <span className="text-white/40">vs</span> {match.away_team}
            </h3>
            <span className="text-sm text-white/50">
              {formatKickoff(match.kickoff_at, locale)}
            </span>
          </div>

          {match.isFinished ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-sm text-white/50">{t("result")}: </span>
                <span className="font-semibold text-turquoise">
                  {match.result_home} – {match.result_away}
                </span>
              </div>
              {match.userPrediction && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-white/50">
                    {t("yourTip")}: {match.userPrediction.predicted_home} –{" "}
                    {match.userPrediction.predicted_away}
                  </span>
                  <span className="rounded-full bg-turquoise/20 px-3 py-0.5 font-medium text-turquoise">
                    +{match.userPrediction.points_earned} {t("pts")}
                  </span>
                </div>
              )}
              {isCreator && (
                <SetResultForm
                  matchId={match.id}
                  leagueId={leagueId}
                  locale={locale}
                  initialHome={match.result_home}
                  initialAway={match.result_away}
                />
              )}
            </div>
          ) : match.isLocked ? (
            <div className="space-y-2">
              <p className="text-sm text-amber-400/80">{t("locked")}</p>
              {match.userPrediction ? (
                <p className="text-sm text-white/70">
                  {t("yourTip")}: {match.userPrediction.predicted_home} –{" "}
                  {match.userPrediction.predicted_away}
                </p>
              ) : (
                <p className="text-sm text-white/40">{t("noTip")}</p>
              )}
              {isCreator && (
                <SetResultForm
                  matchId={match.id}
                  leagueId={leagueId}
                  locale={locale}
                />
              )}
            </div>
          ) : (
            <PredictionForm
              matchId={match.id}
              leagueId={leagueId}
              locale={locale}
              initialHome={match.userPrediction?.predicted_home}
              initialAway={match.userPrediction?.predicted_away}
            />
          )}
        </div>
      ))}
    </div>
  );
}
