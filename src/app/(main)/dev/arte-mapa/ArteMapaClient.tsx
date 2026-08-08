"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * O painel é buscado, não embutido: `npm run arte:mapa -- <arte> --watch`
 * reescreve o PNG e o JSON no mesmo instante, e a página só relê.
 *
 * Por isso a página não importa nada de `scripts/`. Medir a arte exige decodificar
 * o PNG e varrer pixel — Node, `sharp`, e o `tsconfig` dos scripts. Trazer isso
 * para dentro do bundle do produto acoplaria o pipeline de diagnóstico ao build
 * que serve o aluno, e o ganho seria nenhum: o script já sabe medir.
 */
const PNG = "/dev/arte-mapa.png";
const JSON_PAINEL = "/dev/arte-mapa.json";

type Faixa = "sem" | "fina" | "fronteira" | "alvo";

interface Painel {
  arte: string;
  alvo: number;
  fina: number;
  fronteira: number;
  p50: number;
  p05: number;
  p95: number;
  fracaoFina: number;
  contagens: { faixa: Faixa; pontos: number; fracao: number }[];
}

const COR: Record<Faixa, string> = {
  fina: "#dc2626",
  fronteira: "#d97706",
  alvo: "#16a34a",
  sem: "#b0b0b0",
};

const ROTULO: Record<Faixa, string> = {
  fina: "some a 56 px — engrossar",
  fronteira: "passa sem folga",
  alvo: "na espessura do boneco",
  sem: "o contorno ali é do BONECO — não engrossar",
};

export default function ArteMapaClient() {
  const [painel, setPainel] = useState<Painel | null>(null);
  const [selo, setSelo] = useState(() => 0);
  const [erro, setErro] = useState<string | null>(null);

  const reler = useCallback(async () => {
    try {
      const r = await fetch(`${JSON_PAINEL}?t=${Date.now()}`, { cache: "no-store" });
      if (!r.ok) throw new Error(`o painel não está lá (${r.status})`);
      const p: Painel = await r.json();
      setPainel((antigo) => {
        // O SELO SÓ MUDA QUANDO O DADO MUDA. Trocar a query do `<img>` a cada
        // volta faria o navegador rebaixar a imagem inteira uma vez por segundo,
        // e a tela piscaria enquanto o Doug tenta comparar duas versões.
        if (antigo && JSON.stringify(antigo) === JSON.stringify(p)) return antigo;
        setSelo(Date.now());
        return p;
      });
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void reler();
    const id = setInterval(() => void reler(), 1000);
    return () => clearInterval(id);
  }, [reler]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-xl font-semibold">Mapa da espessura</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Onde engrossar a arte, e não quanto. Rode{" "}
        <code className="rounded bg-neutral-100 px-1">
          npm run arte:mapa -- {painel?.arte ?? "<arte>"} --watch
        </code>{" "}
        e salve a arte: esta página se refaz sozinha.
      </p>

      {erro && (
        <p className="mt-4 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {erro} — rode o script pelo menos uma vez.
        </p>
      )}

      {painel && (
        <>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["arte", painel.arte],
              ["p50 da banda", `${painel.p50.toFixed(1)} u`],
              ["alvo", `${painel.alvo} u`],
              ["abaixo de 8 u", `${(100 * painel.fracaoFina).toFixed(1)}%`],
            ].map(([k, v]) => (
              <div key={k} className="rounded border border-neutral-200 px-3 py-2">
                <dt className="text-xs text-neutral-500">{k}</dt>
                <dd className="text-lg font-semibold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>

          <ul className="mt-4 space-y-1 text-sm">
            {painel.contagens.map((c) => (
              <li key={c.faixa} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block size-3 shrink-0 rounded-full"
                  style={{ background: COR[c.faixa] }}
                />
                <span className="w-24 font-medium">{c.faixa}</span>
                <span className="w-28 tabular-nums text-neutral-700">
                  {c.pontos} pts · {(100 * c.fracao).toFixed(1)}%
                </span>
                <span className="text-neutral-600">{ROTULO[c.faixa]}</span>
              </li>
            ))}
          </ul>

          {/* eslint-disable-next-line @next/next/no-img-element -- arquivo local
              regenerado a cada salvamento; o otimizador cachearia a versão velha */}
          <img
            src={`${PNG}?t=${selo}`}
            alt={`Contorno de ${painel.arte} pintado por faixa de espessura`}
            className="mt-6 w-full rounded border border-neutral-200"
          />
        </>
      )}
    </main>
  );
}
