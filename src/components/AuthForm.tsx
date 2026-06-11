"use client";

import { createClient } from "@/lib/supabase/client";
import { Link, stripLocalePrefix, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { OAuthButtons } from "./OAuthButtons";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = stripLocalePrefix(searchParams.get("next") ?? "/dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (mode === "signup" && password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      router.push(nextPath);
      router.refresh();
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setMessage(t("checkEmail"));
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <h1 className="text-center text-2xl font-bold">
        {mode === "login" ? t("loginTitle") : t("signupTitle")}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-white/70">
            {t("email")}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-white/15 bg-navy-light px-4 py-3 text-white outline-none transition-colors focus:border-turquoise"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm text-white/70"
          >
            {t("password")}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-white/15 bg-navy-light px-4 py-3 text-white outline-none transition-colors focus:border-turquoise"
          />
        </div>

        {mode === "signup" && (
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm text-white/70"
            >
              {t("confirmPassword")}
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-white/15 bg-navy-light px-4 py-3 text-white outline-none transition-colors focus:border-turquoise"
            />
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        {message && (
          <p className="rounded-lg bg-turquoise/20 px-4 py-2 text-sm text-turquoise">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-turquoise py-3 font-medium text-navy transition-colors hover:bg-turquoise-dark disabled:opacity-50"
        >
          {mode === "login" ? t("loginButton") : t("signupButton")}
        </button>
      </form>

      <OAuthButtons />

      <p className="text-center text-sm text-white/60">
        {mode === "login" ? t("noAccount") : t("hasAccount")}{" "}
        <Link
          href={mode === "login" ? "/signup" : "/login"}
          className="text-turquoise hover:underline"
        >
          {mode === "login" ? tNav("signup") : tNav("login")}
        </Link>
      </p>
    </div>
  );
}
