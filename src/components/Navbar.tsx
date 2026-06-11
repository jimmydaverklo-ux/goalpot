import { Link } from "@/i18n/navigation";
import { getServerUser } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { LogoutButton } from "./LogoutButton";

export async function Navbar() {
  const t = await getTranslations("nav");
  const user = await getServerUser();

  return (
    <header className="border-b border-white/10 bg-navy/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-turquoise">
          Goalpot
        </Link>

        <nav className="flex items-center gap-4">
          <LanguageSwitcher />
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-white/80 transition-colors hover:text-turquoise"
              >
                {t("dashboard")}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-white/80 transition-colors hover:text-turquoise"
              >
                {t("login")}
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-turquoise px-4 py-2 text-sm font-medium text-navy transition-colors hover:bg-turquoise-dark"
              >
                {t("signup")}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
