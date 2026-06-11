"use client";

import {
  createLeague,
  type CreateLeagueState,
} from "@/app/actions/leagues";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

const errorKeys = new Set([
  "name_required",
  "create_failed",
  "invite_code_failed",
]);

export function CreateLeagueForm({ locale }: { locale: string }) {
  const t = useTranslations("league");
  const [state, formAction, pending] = useActionState<
    CreateLeagueState,
    FormData
  >(createLeague, null);

  const errorMessage = state?.error
    ? errorKeys.has(state.error)
      ? t(state.error as "name_required")
      : state.error
    : null;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <div>
        <label htmlFor="name" className="mb-1 block text-sm text-white/70">
          {t("nameLabel")}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder={t("namePlaceholder")}
          className="w-full rounded-lg border border-white/15 bg-navy-light px-4 py-3 text-white outline-none transition-colors focus:border-turquoise"
        />
      </div>

      {errorMessage && (
        <p className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-300">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-turquoise py-3 font-medium text-navy transition-colors hover:bg-turquoise-dark disabled:opacity-50"
      >
        {pending ? t("creating") : t("createButton")}
      </button>
    </form>
  );
}
