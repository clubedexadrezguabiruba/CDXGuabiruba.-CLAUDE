"use client";

import { useEffect, useState } from "react";
import { PELE, CABELO, FUNDO } from "@/lib/avatar/palette";

/**
 * A BASE SEM TRAJE — a de produção, e a única correta aqui.
 *
 * A base normal tem o macacão de treino desenhado, e escondê-lo por CSS **não
 * funciona**: regra de documento não atravessa a árvore-sombra do `<use>`. Medido
 * — com e sem a regra, o PNG sai byte a byte idêntico. A correção é estrutural:
 * este arquivo não tem as camadas de roupa.
 */
const FOLHA = "/items/base/avatar-base-sem-traje.svg";
const SYMBOL_ID = "avatar-base-sem-traje";

/** Canvas da arte de origem. */
const W = 2556;
const H = 3840;
const RAZAO = W / H;

/** As variantes que o `avatar:garment` assa. */
const VARIANTES = [128, 256, 512, 1024, 1920] as const;

/** `slug` é nome de arquivo e não muda; `nome` é o título exibido (Bíblia §6). */
const PECAS = [
  { slug: "soldado", nome: "Aprendiz", tier: 1, pano: "#78833B" },
  { slug: "aspirante", nome: "Explorador", tier: 2, pano: "#384966" },
] as const;

const TAMANHOS = [
  { nome: "sm", h: 70, rotulo: "ranking, mural" },
  { nome: "md", h: 125, rotulo: "listas" },
  { nome: "lg", h: 250, rotulo: "perfil mobile" },
  { nome: "xl", h: 425, rotulo: "perfil desktop" },
] as const;

const NOME_PELE = ["1 mais clara", "2", "3", "4", "5", "6", "7", "8 mais escura"];

const XADREZ =
  "repeating-conic-gradient(#d4d4d8 0% 25%, #fff 0% 50%) 50% / 16px 16px";

/**
 * A VARIANTE que o runtime escolheria para esta altura.
 *
 * A menor que ainda cobre altura × DPR. É a regra que existe para o ranking não
 * decodificar 9,36 MiB por aluno — um PNG de 1278×1920 pesa 265 KB no disco e
 * quase dez megabytes na memória.
 */
function varianteDe(altura: number, dpr: number): number {
  const alvo = altura * dpr;
  return VARIANTES.find((v) => v >= alvo) ?? VARIANTES[VARIANTES.length - 1];
}

function Boneco({
  pele,
  cabelo,
  altura,
  fundo,
  peca,
  dpr,
}: {
  pele: string;
  cabelo: string;
  altura: number;
  fundo: string;
  peca: string | null;
  dpr: number;
}) {
  const v = varianteDe(altura, dpr);
  return (
    <svg
      width={Math.round(altura * RAZAO)}
      height={altura}
      viewBox={`0 0 ${W} ${H}`}
      style={
        {
          "--av-pele": pele,
          "--av-cabelo": cabelo,
          background: fundo === "xadrez" ? undefined : fundo,
          backgroundImage: fundo === "xadrez" ? XADREZ : undefined,
          borderRadius: 6,
        } as React.CSSProperties
      }
    >
      <use href={`#${SYMBOL_ID}`} x={0} y={0} width={W} height={H} />
      {/* A PILHA DE RUNTIME INTEIRA: a base mais UM `<image>`. Zero máscara e
          zero filtro — máscara é ferramenta de build. O asset já vem com buraco
          onde ficam cabeça e mãos, e a base aparece por ali sozinha. */}
      {peca && (
        <image
          href={`/dev/uniformes/${peca}-${v}.png`}
          x={0}
          y={0}
          width={W}
          height={H}
        />
      )}
    </svg>
  );
}

export default function AvatarUniformeClient() {
  const [folha, setFolha] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pele, setPele] = useState(2);
  const [cabelo, setCabelo] = useState<string>(CABELO[0]);
  const [fundo, setFundo] = useState("xadrez");
  const [peca, setPeca] = useState<string | null>("soldado");
  const [dpr, setDpr] = useState(1);

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

  // O DPR real da tela, para a linha de variantes dizer a verdade.
  //
  // Dentro de `requestAnimationFrame` porque `setState` síncrono no corpo de um
  // efeito é erro de lint no React 19 — dispara renderização em cascata. E não dá
  // para ler no inicializador do `useState`: `window` não existe no servidor.
  useEffect(() => {
    const id = requestAnimationFrame(() => setDpr(window.devicePixelRatio || 1));
    return () => cancelAnimationFrame(id);
  }, []);

  if (erro) {
    return (
      <div className="p-6 text-sm text-red-700">
        Não consegui carregar {FOLHA}: {erro}
        <br />
        Rode <code className="rounded bg-zinc-100 px-1">npm run avatar:base-sem-traje</code> e
        recarregue.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 pb-24">
      {folha && <div aria-hidden dangerouslySetInnerHTML={{ __html: folha }} />}

      <h1 className="text-xl font-bold text-zinc-900">Uniforme vestido — conferência</h1>
      <p className="mt-1 max-w-3xl text-sm text-zinc-600">
        A composição acontece <b>aqui, no navegador</b>: <code>&lt;use&gt;</code> da base
        sem traje mais um <code>&lt;image&gt;</code> do uniforme. Sem máscara e sem filtro
        — máscara é ferramenta de build. O asset vem com buraco onde ficam cabeça e mãos,
        e a pele aparece por ali sozinha.
      </p>
      <p className="mt-2 max-w-3xl rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
        <b>Isto não é o fluxo do aluno.</b> Não há item no banco nem concessão por patente,
        e o <code>AvatarDisplay</code> de produção ainda monta a pilha do jeito antigo. O que
        se aprova aqui é a <b>peça</b>. Se os uniformes não aparecerem, rode{" "}
        <code className="rounded bg-amber-100 px-1">npm run avatar:preview</code>.
      </p>

      {!folha && <p className="mt-6 text-sm text-zinc-500">carregando o desenho…</p>}

      {folha && (
        <>
          {/* -------- controles -------- */}
          <div className="mt-5 flex flex-wrap gap-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-zinc-700">Peça</span>
              <select
                className="rounded border border-zinc-300 px-2 py-1"
                value={peca ?? ""}
                onChange={(e) => setPeca(e.target.value || null)}
              >
                <option value="">nenhuma (só a base)</option>
                {PECAS.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    tier {p.tier} · {p.nome}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-zinc-500">
                &quot;nenhuma&quot; é o Calouro, tier 0
              </span>
            </label>

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
              <span className="mb-1 block font-medium text-zinc-700">Cor do cabelo</span>
              <select
                className="rounded border border-zinc-300 px-2 py-1"
                value={cabelo}
                onChange={(e) => setCabelo(e.target.value)}
              >
                {CABELO.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-zinc-700">Fundo</span>
              <select
                className="rounded border border-zinc-300 px-2 py-1"
                value={fundo}
                onChange={(e) => setFundo(e.target.value)}
              >
                <option value="xadrez">quadriculado</option>
                <option value="#FF00FF">magenta</option>
                <option value="#1B1B1F">escuro</option>
                <option value="transparent">nenhum</option>
                {FUNDO.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-zinc-500">
                magenta revela buraco; escuro revela halo
              </span>
            </label>
          </div>

          {/* -------- lado a lado, no tamanho de julgar -------- */}
          <h2 className="mt-8 text-sm font-semibold text-zinc-800">
            As peças lado a lado, a 425 px
          </h2>
          <p className="text-xs text-zinc-500">
            Olhe as <b>mãos</b>, a <b>gola</b> e a <b>sola</b>. São as três fronteiras onde
            os defeitos moraram.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-6 rounded-lg border border-zinc-200 p-4">
            <figure className="m-0 text-center">
              <Boneco
                pele={PELE[pele]}
                cabelo={cabelo}
                altura={425}
                fundo={fundo}
                peca={null}
                dpr={dpr}
              />
              <figcaption className="mt-1 text-xs text-zinc-500">
                Calouro
                <br />
                <span className="text-zinc-400">o macacão é da base</span>
              </figcaption>
            </figure>
            {PECAS.map((p) => (
              <figure key={p.slug} className="m-0 text-center">
                <Boneco
                  pele={PELE[pele]}
                  cabelo={cabelo}
                  altura={425}
                  fundo={fundo}
                  peca={p.slug}
                  dpr={dpr}
                />
                <figcaption className="mt-1 text-xs text-zinc-500">
                  {p.nome}
                  <br />
                  <span className="font-mono text-zinc-400">{p.pano}</span>
                </figcaption>
              </figure>
            ))}
          </div>

          {/* -------- os 4 tamanhos -------- */}
          <h2 className="mt-8 text-sm font-semibold text-zinc-800">
            Os 4 tamanhos, em pixels reais
          </h2>
          <p className="text-xs text-zinc-500">
            O que manda é o <b>sm</b>. Se a peça não se distingue do traje de treino ali,
            ela não cumpre a função de sinalizar patente. DPR desta tela: {dpr}×.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-6 rounded-lg border border-zinc-200 p-4">
            {TAMANHOS.map((t) => (
              <figure key={t.nome} className="m-0 text-center">
                <Boneco
                  pele={PELE[pele]}
                  cabelo={cabelo}
                  altura={t.h}
                  fundo={fundo}
                  peca={peca}
                  dpr={dpr}
                />
                <figcaption className="mt-1 text-xs text-zinc-500">
                  {t.nome} · {Math.round(t.h * RAZAO)}×{t.h}
                  <br />
                  <span className="text-zinc-400">
                    {t.rotulo} · usa {varianteDe(t.h, dpr)}px
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>

          {/* -------- os 8 tons, vestidos -------- */}
          <h2 className="mt-8 text-sm font-semibold text-zinc-800">
            Os 8 tons de pele, com a peça vestida
          </h2>
          <p className="text-xs text-zinc-500">
            A cor do uniforme é <b>assada na arte</b> e não recolore — só pele e cabelo
            mudam. Confira se a peça funciona sobre os oito, e se a mão continua limpa no
            mais escuro.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 rounded-lg border border-zinc-200 p-4">
            {PELE.map((c, i) => (
              <figure key={c} className="m-0 text-center">
                <Boneco
                  pele={c}
                  cabelo={cabelo}
                  altura={190}
                  fundo={fundo}
                  peca={peca}
                  dpr={dpr}
                />
                <figcaption className="mt-1 text-xs text-zinc-500">{i + 1}</figcaption>
              </figure>
            ))}
          </div>

          {/* -------- a escada, a 70 px -------- */}
          <h2 className="mt-8 text-sm font-semibold text-zinc-800">
            A escada a 70 px — o tamanho do ranking
          </h2>
          <p className="text-xs text-zinc-500">
            Aqui gola, cinto e galão somem: <b>a patente é só massa de cor</b>. Dá para
            dizer quem é quem?
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-4 rounded-lg border border-zinc-200 p-4">
            <figure className="m-0 text-center">
              <Boneco
                pele={PELE[pele]}
                cabelo={cabelo}
                altura={70}
                fundo={fundo}
                peca={null}
                dpr={dpr}
              />
              <figcaption className="mt-1 text-xs text-zinc-500">Calouro</figcaption>
            </figure>
            {PECAS.map((p) => (
              <figure key={p.slug} className="m-0 text-center">
                <Boneco
                  pele={PELE[pele]}
                  cabelo={cabelo}
                  altura={70}
                  fundo={fundo}
                  peca={p.slug}
                  dpr={dpr}
                />
                <figcaption className="mt-1 text-xs text-zinc-500">{p.nome}</figcaption>
              </figure>
            ))}
          </div>

          <p className="mt-8 max-w-3xl text-xs text-zinc-500">
            Faltam quatro peças — Analista, Estrategista, Mestre e Grão-Mestre. As cores estão
            travadas por gate em <code>scripts/avatar/patentes.ts</code>, e os pedidos
            prontos para o gerador de imagem estão no doc 18.
          </p>
        </>
      )}
    </div>
  );
}
