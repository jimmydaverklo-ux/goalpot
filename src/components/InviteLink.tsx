"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

export function InviteLink({
  inviteCode,
  locale,
}: {
  inviteCode: string;
  locale: string;
}) {
  const t = useTranslations("league");
  const tCommon = useTranslations("common");
  const [copied, setCopied] = useState(false);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${locale}/join/${inviteCode}`
      : `/${locale}/join/${inviteCode}`;

  async function copyLink() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-white/10 bg-navy-light p-6">
      <h2 className="mb-2 text-lg font-semibold text-turquoise">
        {t("inviteTitle")}
      </h2>
      <p className="mb-4 text-sm text-white/60">{t("inviteDescription")}</p>
      <div className="flex gap-2">
        <input
          readOnly
          value={inviteUrl}
          className="flex-1 rounded-lg border border-white/15 bg-navy px-4 py-2 text-sm text-white/80 outline-none"
        />
        <button
          onClick={copyLink}
          className="rounded-lg bg-turquoise px-4 py-2 text-sm font-medium text-navy transition-colors hover:bg-turquoise-dark"
        >
          {copied ? tCommon("copied") : tCommon("copy")}
        </button>
      </div>
    </div>
  );
}
