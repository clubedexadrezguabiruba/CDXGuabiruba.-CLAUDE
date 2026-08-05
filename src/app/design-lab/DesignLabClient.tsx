"use client";

import { useState } from "react";
import Primitivos from "./Primitivos";
import VariantA from "./VariantA";

type Vista = "comp" | "primitivos";

const ABAS: { id: Vista; nome: string; resumo: string }[] = [
  {
    id: "comp",
    nome: "Quartel-General (comp)",
    resumo: "A direção A aprovada, montada com os primitivos.",
  },
  {
    id: "primitivos",
    nome: "Primitivos",
    resumo: "Button, Card, Badge, ProgressBar — e seus estados.",
  },
];

/** Largura de projeto do produto. Ver DESIGN.md, seção Layout. */
const LARGURA_ALVO = 375;

export default function DesignLabClient() {
  const [vista, setVista] = useState<Vista>("comp");
  const aba = ABAS.find((a) => a.id === vista)!;

  return (
    <div className="min-h-screen bg-zinc-100 font-sans">
      <header className="border-b border-zinc-300 bg-white px-5 py-4">
        <h1 className="text-lg font-semibold text-zinc-900">Vitrine de design</h1>
        <p className="mt-1 max-w-3xl text-sm text-zinc-600">
          Dados falsos, sem login. A régua é{" "}
          <strong className="font-semibold">{LARGURA_ALVO}px</strong>. As regras
          estão em{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">DESIGN.md</code>
          . Direção <strong className="font-semibold">A — Continuidade</strong>;
          as direções B e C foram construídas, comparadas e descartadas — o
          porquê está no DESIGN.md.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {ABAS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setVista(a.id)}
              aria-pressed={vista === a.id}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                vista === a.id
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {a.nome}
            </button>
          ))}
        </div>
      </header>

      <main className="flex justify-center p-5">
        <figure className="w-93.75">
          <figcaption className="mb-2">
            <p className="text-sm font-semibold text-zinc-900">{aba.nome}</p>
            <p className="text-xs text-zinc-600">{aba.resumo}</p>
          </figcaption>
          <div className="overflow-hidden rounded-2xl border border-zinc-300 bg-white shadow-sm">
            {vista === "comp" ? <VariantA /> : <Primitivos />}
          </div>
        </figure>
      </main>
    </div>
  );
}
