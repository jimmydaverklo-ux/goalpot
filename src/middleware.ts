import createMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request);

  try {
    const supabaseResponse = await updateSession(request);
    if (supabaseResponse) {
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        intlResponse.cookies.set(cookie.name, cookie.value);
      });
    }
  } catch (error) {
    console.error("Supabase middleware error:", error);
  }

  return intlResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
