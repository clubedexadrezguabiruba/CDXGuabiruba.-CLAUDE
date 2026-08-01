import { notFound } from "next/navigation";
import type { Metadata } from "next";
import DesignLabClient from "./DesignLabClient";

/**
 * Vitrine de design — só existe fora de produção.
 *
 * Serve para o Claude (via Playwright MCP) poder FOTOGRAFAR o que construiu sem
 * login e sem tocar no Supabase. `npm run test:e2e` bate em produção e por isso
 * não pode ser o caminho de verificação visual.
 *
 * Guarda dupla: aqui, e no allow-list de src/lib/supabase/proxy.ts — ambos
 * condicionados a NODE_ENV !== "production".
 */

export const metadata: Metadata = {
  title: "Vitrine de design — Recruta 64",
  robots: { index: false, follow: false },
};

export default function DesignLabPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DesignLabClient />;
}
