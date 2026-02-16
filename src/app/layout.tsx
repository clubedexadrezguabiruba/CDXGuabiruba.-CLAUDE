import type { Metadata } from "next";
import "./globals.css";
import AppHeader from "@/components/layout/AppHeader";

export const metadata: Metadata = {
  title: "CdxGuabiruba",
  description: "Plataforma educacional de xadrez",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">
        <AppHeader />
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
