import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="sv">
      <body className="flex min-h-screen items-center justify-center bg-[#0A1628] text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#00C9A7]">404</h1>
          <p className="mt-2 text-white/60">Page not found</p>
          <Link href="/sv" className="mt-6 inline-block text-[#00C9A7] hover:underline">
            Goalpot
          </Link>
        </div>
      </body>
    </html>
  );
}
