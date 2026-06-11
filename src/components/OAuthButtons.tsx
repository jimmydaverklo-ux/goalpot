"use client";

import { createClient } from "@/lib/supabase/client";
import { stripLocalePrefix } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

type Provider = "google" | "facebook" | "apple";

const providerIcons: Record<Provider, string> = {
  google: "G",
  facebook: "f",
  apple: "",
};

export function OAuthButtons() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const nextPath = stripLocalePrefix(searchParams.get("next") ?? "/dashboard");

  async function signInWith(provider: Provider) {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
  }

  const providers: { id: Provider; label: string }[] = [
    { id: "google", label: t("google") },
    { id: "facebook", label: t("facebook") },
    { id: "apple", label: t("apple") },
  ];

  return (
    <div className="space-y-3">
      <p className="text-center text-sm text-white/50">{t("orContinueWith")}</p>
      <div className="grid gap-3">
        {providers.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => signInWith(id)}
            className="flex items-center justify-center gap-3 rounded-lg border border-white/15 bg-navy-light px-4 py-3 text-sm font-medium transition-colors hover:border-turquoise/50 hover:bg-navy-lighter"
          >
            <span className="flex h-5 w-5 items-center justify-center text-turquoise">
              {id === "apple" ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              ) : (
                providerIcons[id]
              )}
            </span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
