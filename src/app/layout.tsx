import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Goalpot",
  description: "Create your own football tip leagues",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
