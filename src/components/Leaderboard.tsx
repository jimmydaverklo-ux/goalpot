import type { LeaderboardEntry } from "@/types/database";
import { getTranslations } from "next-intl/server";

type Props = {
  entries: LeaderboardEntry[];
  currentUserId: string;
};

export async function Leaderboard({ entries, currentUserId }: Props) {
  const t = await getTranslations("league");

  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-white/50">{t("noMembers")}</p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10 bg-navy-light text-left text-sm text-white/60">
            <th className="px-4 py-3 font-medium">{t("rank")}</th>
            <th className="px-4 py-3 font-medium">{t("player")}</th>
            <th className="px-4 py-3 text-right font-medium">{t("points")}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.user_id}
              className={`border-b border-white/5 transition-colors ${
                entry.user_id === currentUserId ? "bg-turquoise/10" : ""
              }`}
            >
              <td className="px-4 py-3">
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    entry.rank === 1
                      ? "bg-turquoise text-navy"
                      : "bg-navy-lighter text-white/80"
                  }`}
                >
                  {entry.rank}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {entry.avatar_url ? (
                    <img
                      src={entry.avatar_url}
                      alt=""
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-lighter text-sm font-medium text-turquoise">
                      {(entry.display_name ?? "?")[0].toUpperCase()}
                    </div>
                  )}
                  <span>
                    {entry.display_name ?? "—"}
                    {entry.user_id === currentUserId && (
                      <span className="ml-2 text-xs text-turquoise">
                        ({t("you")})
                      </span>
                    )}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-right font-semibold text-turquoise">
                {entry.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
