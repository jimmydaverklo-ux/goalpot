"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: "sv" | "en") {
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <div className="flex gap-1 rounded-lg bg-navy-lighter p-1">
      <button
        onClick={() => switchLocale("sv")}
        className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
          locale === "sv"
            ? "bg-turquoise text-navy"
            : "text-white/70 hover:text-white"
        }`}
      >
        SV
      </button>
      <button
        onClick={() => switchLocale("en")}
        className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
          locale === "en"
            ? "bg-turquoise text-navy"
            : "text-white/70 hover:text-white"
        }`}
      >
        EN
      </button>
    </div>
  );
}
