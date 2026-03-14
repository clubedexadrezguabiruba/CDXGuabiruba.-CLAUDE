import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CdxGuabiruba",
  description: "Plataforma educacional de xadrez",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
