"use client";

import { useEffect, useState } from "react";
import { PELE, TRAJE_BASE, FUNDO } from "@/lib/avatar/palette";

/**
 * O `<symbol>` é buscado UMA vez e reusado por `<use>`.
 *
 * O arquivo tem ~345 KB. Inlinar o desenho a cada boneco poria 2,7 MB de
 * markup na página só para mostrar os 8 tons. Com um `<symbol>` no documento e
 * um `<use>` por instância, o desenho existe uma vez — e as custom properties
 * herdam para dentro da árvore do `<use>`, que é o que faz cada cópia sair de
 * uma cor.
 */
const FOLHA = "/items/base/avatar-base-neutro.svg";
const SYMBOL_ID = "avatar-base-neutro";

/** Canvas da arte de origem: 1037×1516. NÃO é o 4:5 do resto do v4. */
const RAZAO = 1037 / 1516;

/** Alturas dos 4 tamanhos do plano. A largura sai da razão da arte. */
const TAMANHOS = [
  { nome: "sm", h: 70, rotulo: "ranking, mural" },
  { nome: "md", h: 125, rotulo: "listas" },
  { nome: "lg", h: 250, rotulo: "perfil mobile" },
  { nome: "xl", h: 425, rotulo: "perfil desktop" },
] as const;

const NOME_PELE = ["1 mais clara", "2", "3", "4", "5", "6", "7", "8 mais escura"];

function Boneco({
  pele,
  roupa,
  altura,
  fundo,
}: {
  pele: string;
  roupa: string;
  altura: number;
  fundo: string;
}) {
  return (
    <svg
      width={Math.round(altura * RAZAO)}
      height={altura}
      viewBox={`0 0 1037 1516`}
      style={
        {
          "--av-pele": pele,
          "--av-roupa": roupa,
          background: fundo,
          borderRadius: 6,
        } as React.CSSProperties
      }
    >
      <use href={`#${SYMBOL_ID}`} />
    </svg>
  );
}

export default function AvatarBaseClient() {
  const [folha, setFolha] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pele, setPele] = useState(2);
  // `TRAJE_BASE` é `as const`, então sem o tipo explícito o estado ficaria
  // preso ao literal "#C9BFA8" e não aceitaria a cor de uniforme.
  const [roupa, setRoupa] = useState<string>(TRAJE_BASE.roupa);
  const [fundo, setFundo] = useState("transparent");

  useEffect(() => {
    let vivo = true;
    fetch(FOLHA)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((t) => vivo && setFolha(t))
      .catch((e) => vivo && setErro(String(e)));
    return () => {
      vivo = false;
    };
  }, []);

  if (erro) {
    return (
      <div className="p-6 text-sm text-red-700">
        Não consegui carregar {FOLHA}: {erro}
        <br />
        Rode <code className="rounded bg-zinc-100 px-1">npm run avatar:base</code> e recarregue.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4 pb-24">
      {/* A folha de <symbol> entra no documento uma vez, invisível. */}
      {folha && <div aria-hidden dangerouslySetInnerHTML={{ __html: folha }} />}

      <h1 className="text-xl font-bold text-zinc-900">Boneco base — aprovação</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Sua arte, reconstruída como SVG recolorível. A pele e o macacão são variáveis; o
        sombreado é camada por cima e não conhece a cor de baixo.
      </p>

      {!folha && <p className="mt-6 text-sm text-zinc-500">carregando o desenho…</p>}

      {folha && (
        <>
          {/* -------- controles -------- */}
          <div className="mt-5 flex flex-wrap gap-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-zinc-700">Tom de pele</span>
              <select
                className="rounded border border-zinc-300 px-2 py-1"
                value={pele}
                onChange={(e) => setPele(Number(e.target.value))}
              >
                {PELE.map((c, i) => (
                  <option key={c} value={i}>
                    {NOME_PELE[i]}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-zinc-700">Macacão</span>
              <select
                className="rounded border border-zinc-300 px-2 py-1"
                value={roupa}
                onChange={(e) => setRoupa(e.target.value)}
              >
                <option value={TRAJE_BASE.roupa}>traje da base</option>
                <option value="#5C6E3F">uniforme Soldado</option>
                <option value="#2B3A5C">uniforme General</option>
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-zinc-700">Fundo</span>
              <select
                className="rounded border border-zinc-300 px-2 py-1"
                value={fundo}
                onChange={(e) => setFundo(e.target.value)}
              >
                <option value="transparent">nenhum</option>
                {FUNDO.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* -------- os 4 tamanhos -------- */}
          <h2 className="mt-8 text-sm font-semibold text-zinc-800">
            Os 4 tamanhos, em pixels reais
          </h2>
          <p className="text-xs text-zinc-500">
            O que manda é o <b>sm</b>. Se o boneco não lê ali, não lê no ranking.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-6 rounded-lg border border-zinc-200 p-4">
            {TAMANHOS.map((t) => (
              <figure key={t.nome} className="m-0 text-center">
                <Boneco pele={PELE[pele]} roupa={roupa} altura={t.h} fundo={fundo} />
                <figcaption className="mt-1 text-xs text-zinc-500">
                  {t.nome} · {Math.round(t.h * RAZAO)}×{t.h}
                  <br />
                  <span className="text-zinc-400">{t.rotulo}</span>
                </figcaption>
              </figure>
            ))}
          </div>

          {/* -------- os 8 tons -------- */}
          <h2 className="mt-8 text-sm font-semibold text-zinc-800">
            Os 8 tons de pele — um arquivo, uma variável
          </h2>
          <p className="text-xs text-zinc-500">
            É a razão de o boneco não excluir ninguém do clube. Confira se o olho ainda
            aparece no mais escuro.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 rounded-lg border border-zinc-200 p-4">
            {PELE.map((c, i) => (
              <figure key={c} className="m-0 text-center">
                <Boneco pele={c} roupa={roupa} altura={190} fundo={fundo} />
                <figcaption className="mt-1 text-xs text-zinc-500">{i + 1}</figcaption>
              </figure>
            ))}
          </div>

          {/* -------- a 56 px -------- */}
          <h2 className="mt-8 text-sm font-semibold text-zinc-800">A 56 px, os 8 tons</h2>
          <p className="text-xs text-zinc-500">
            Tamanho de ranking. Dá para distinguir um aluno do outro?
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 p-4">
            {PELE.map((c) => (
              <Boneco key={c} pele={c} roupa={roupa} altura={70} fundo={fundo} />
            ))}
          </div>

          <p className="mt-8 text-xs text-zinc-500">
            Canvas da arte: 1037×1516 (razão {RAZAO.toFixed(3)}). O resto do v4 usa 4:5
            (0,800) — os dois precisam convergir antes de ligar isto no avatar de produção.
          </p>
        </>
      )}
    </div>
  );
}
