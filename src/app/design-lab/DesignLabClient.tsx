"use client";

import { useState } from "react";
import VariantA from "./VariantA";
import VariantB from "./VariantB";
import VariantC from "./VariantC";
import { ALUNO, PATENTES, patentePorNome } from "./data";

type Vista = "contato" | "a" | "b" | "c";

const DIRECOES = [
  {
    id: "a" as const,
    nome: "A — Continuidade",
    resumo: "ESCOLHIDA · navy, ouro, Cinzel. Estende a landing.",
    escolhida: true,
  },
  {
    id: "b" as const,
    nome: "B — Kokeshi",
    resumo: "Descartada · infantiliza e briga com o tabuleiro.",
    escolhida: false,
  },
  {
    id: "c" as const,
    nome: "C — Patentes",
    resumo: "Descartada · seis temas para manter em vez de um.",
    escolhida: false,
  },
];

/** Largura de projeto do produto. Ver DESIGN.md, seção Layout. */
const LARGURA_ALVO = 375;

export default function DesignLabClient() {
  const [vista, setVista] = useState<Vista>("a");
  const [patenteNome, setPatenteNome] = useState<string>(ALUNO.patente);
  const patente = patentePorNome(patenteNome);

  return (
    <div className="min-h-screen bg-zinc-100 font-sans">
      <header className="border-b border-zinc-300 bg-white px-5 py-4">
        <h1 className="text-lg font-semibold text-zinc-900">
          Vitrine de design — Quartel-General
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-zinc-600">
          Dados falsos, sem login. A régua é{" "}
          <strong className="font-semibold">{LARGURA_ALVO}px</strong>. As regras estão em{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">DESIGN.md</code>. A
          direção <strong className="font-semibold">A — Continuidade</strong> foi escolhida;
          B e C ficam como registro do que foi comparado.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Aba ativa={vista === "contato"} onClick={() => setVista("contato")}>
            Folha de contato
          </Aba>
          {DIRECOES.map((d) => (
            <Aba key={d.id} ativa={vista === d.id} onClick={() => setVista(d.id)}>
              {d.nome}
            </Aba>
          ))}

          {(vista === "c" || vista === "contato") && (
            <label className="ml-auto flex items-center gap-2 text-xs text-zinc-600">
              <span>Patente (direção C):</span>
              <select
                value={patenteNome}
                onChange={(e) => setPatenteNome(e.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900"
              >
                {PATENTES.map((p) => (
                  <option key={p.nome} value={p.nome}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </header>

      <main className="p-5">
        {vista === "contato" ? (
          <div className="overflow-x-auto pb-4">
            <div className="flex w-max items-start gap-6">
              {DIRECOES.map((d) => (
                <figure key={d.id} className="w-[375px] shrink-0">
                  <figcaption className="mb-2">
                    <p className="text-sm font-semibold text-zinc-900">{d.nome}</p>
                    <p className="text-xs text-zinc-600">{d.resumo}</p>
                  </figcaption>
                  <Moldura>
                    <Direcao id={d.id} patenteNome={patenteNome} />
                  </Moldura>
                </figure>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <figure className="w-[375px]">
              <figcaption className="mb-2 text-sm font-semibold text-zinc-900">
                {DIRECOES.find((d) => d.id === vista)?.nome}
                {vista === "c" && (
                  <span className="ml-2 font-normal text-zinc-600">· {patente.nome}</span>
                )}
              </figcaption>
              <Moldura>
                <Direcao id={vista} patenteNome={patenteNome} />
              </Moldura>
            </figure>
          </div>
        )}
      </main>
    </div>
  );
}

function Direcao({ id, patenteNome }: { id: "a" | "b" | "c"; patenteNome: string }) {
  if (id === "a") return <VariantA />;
  if (id === "b") return <VariantB />;
  return <VariantC patente={patentePorNome(patenteNome)} />;
}

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-300 bg-white shadow-sm">
      {children}
    </div>
  );
}

function Aba({
  ativa,
  onClick,
  children,
}: {
  ativa: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativa}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        ativa
          ? "bg-zinc-900 text-white"
          : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
      }`}
    >
      {children}
    </button>
  );
}
