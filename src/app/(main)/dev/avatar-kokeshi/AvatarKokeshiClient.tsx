"use client";

/**
 * O render vivo da base kokeshi. Tudo aqui é o que a folha de contato NÃO pode
 * mostrar, porque não existe num PNG estático.
 *
 * O SVG entra por `dangerouslySetInnerHTML` de propósito, e não como componente
 * JSX: é exatamente assim que o `AvatarDisplay` vai montá-lo no Bloco 8 —
 * concatenando camadas numa string. Renderizar aqui por um caminho diferente
 * provaria o caminho errado.
 */

import { useState } from "react";
import { compor } from "@/lib/avatar/estilo/compositor";
import { CABELO, PELE } from "@/lib/avatar/palette";
import { CABELOS, MODELOS_CABELO, type ModeloCabelo } from "@/lib/avatar/estilo/cabelo";
import { SANGRIA, TRACO, VIEWBOX } from "@/lib/avatar/estilo/geometria";

/** Os quatro tamanhos do `SIZE_CONFIG`. 56 é o do ranking e é o que manda. */
const TAMANHOS = [
  { rot: "sm · ranking", h: 78 },
  { rot: "md", h: 140 },
  { rot: "lg", h: 280 },
  { rot: "xl", h: 476 },
] as const;

function Boneco({
  pele,
  cabelo,
  modelo,
  h,
  animado,
  ns,
}: {
  pele: string;
  cabelo: string;
  modelo: ModeloCabelo | undefined;
  h: number;
  animado: boolean;
  ns: string;
}) {
  const svg = compor({ pele, cabelo, modeloCabelo: modelo, animado, ns })
    .replace("<svg ", `<svg width="${Math.round((h * VIEWBOX.w) / VIEWBOX.h)}" height="${h}" `);
  return <span dangerouslySetInnerHTML={{ __html: svg }} />;
}

export default function AvatarKokeshiClient() {
  const [pele, setPele] = useState<string>(PELE[2]);
  const [cabelo, setCabelo] = useState<string>(CABELO[0]);
  // `curto` é o padrão porque é o padrão do `criar-personagem` (D5): ninguém
  // aparece careca. A opção "careca" fica no seletor como controle — é a base do
  // Bloco 1d, e é contra ela que se vê o que o cabelo acrescenta.
  const [modelo, setModelo] = useState<ModeloCabelo | undefined>("curto");
  const [animado, setAnimado] = useState(true);
  const [fundo, setFundo] = useState<string>("#EFEAE2");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 text-sm text-zinc-700">
      <h1 className="text-lg font-semibold text-zinc-900">Base kokeshi — conferência no runtime</h1>
      <p className="mt-1 text-zinc-500">
        O que a folha de contato não mostra: o piscar, o respiro, o DPR do seu monitor e o{" "}
        <code>prefers-reduced-motion</code>. Traço {TRACO} · sangria {SANGRIA} · viewBox{" "}
        {VIEWBOX.w}×{VIEWBOX.h}.
      </p>

      {/* controles */}
      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-lg border border-zinc-200 p-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={animado}
            onChange={(e) => setAnimado(e.target.checked)}
          />
          animação (respiro + piscar)
        </label>
        <div className="flex items-center gap-1">
          <span className="text-zinc-500">pele:</span>
          {PELE.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPele(p)}
              aria-label={p}
              className={`h-6 w-6 rounded-full border-2 ${
                p === pele ? "border-zinc-900" : "border-transparent"
              }`}
              style={{ background: p }}
            />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-zinc-500">cabelo:</span>
          {CABELO.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCabelo(c)}
              aria-label={c}
              className={`h-6 w-6 rounded-full border-2 ${
                c === cabelo ? "border-zinc-900" : "border-transparent"
              }`}
              style={{ background: c }}
            />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-zinc-500">modelo:</span>
          {[undefined, ...MODELOS_CABELO].map((m) => (
            <button
              key={m ?? "careca"}
              type="button"
              onClick={() => setModelo(m)}
              className={`rounded border px-2 py-1 text-xs ${
                m === modelo
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300 text-zinc-600"
              }`}
            >
              {m ? CABELOS[m].nome : "careca"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-zinc-500">fundo:</span>
          {["#EFEAE2", "#FF00FF", "#1B1B1F", "#FFFFFF"].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFundo(f)}
              aria-label={f}
              className={`h-6 w-6 rounded border-2 ${
                f === fundo ? "border-zinc-900" : "border-zinc-300"
              }`}
              style={{ background: f }}
            />
          ))}
        </div>
      </div>

      {/*
        Os quatro tamanhos lado a lado. Magenta e preto no seletor de fundo não
        são decoração: fundo claro ESCONDE furo e halo, e foi assim que "não
        mudou nada" virou "está consertado" na fase anterior.
      */}
      <h2 className="mt-8 font-semibold text-zinc-900">Os quatro tamanhos do SIZE_CONFIG</h2>
      <div
        className="mt-2 flex flex-wrap items-end gap-6 rounded-lg p-4"
        style={{ background: fundo }}
      >
        {TAMANHOS.map((t) => (
          <figure key={t.rot} className="m-0 text-center">
            <Boneco
              pele={pele}
              cabelo={cabelo}
              modelo={modelo}
              h={t.h}
              animado={animado}
              ns={`kk-${t.h}`}
            />
            <figcaption className="mt-1 text-[10px] text-zinc-500">{t.rot}</figcaption>
          </figure>
        ))}
      </div>

      {/*
        Trinta bonecos: o caso do ranking. É onde a decisão "anima só em lg/xl"
        (doc 15, §6, regra 2) se paga — com o interruptor ligado aqui, dá para
        sentir na hora o custo de 30 animações numa lista.
      */}
      <h2 className="mt-8 font-semibold text-zinc-900">
        Trinta a 56 px — o caso do ranking
      </h2>
      <p className="text-zinc-500">
        Em produção esta lista roda com a animação DESLIGADA. O interruptor acima existe para
        você sentir a diferença, não para ligá-la aqui.
      </p>
      <div className="mt-2 flex flex-wrap gap-1 rounded-lg p-3" style={{ background: fundo }}>
        {Array.from({ length: 30 }, (_, i) => (
          <Boneco
            key={i}
            pele={PELE[i % PELE.length]}
            // A lista varia pele, cor E modelo: 30 bonecos iguais medem o cache do
            // navegador, não o caso de uso. É a lição 19 da §7c, uma camada acima.
            cabelo={CABELO[i % CABELO.length]}
            modelo={MODELOS_CABELO[i % MODELOS_CABELO.length]}
            h={78}
            animado={animado}
            ns={`kkr-${i}`}
          />
        ))}
      </div>

      <h2 className="mt-8 font-semibold text-zinc-900">O que conferir aqui</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-600">
        <li>
          <b>o piscar</b> — a cada ~5 s, ~145 ms. O olho tem de nascer <b>aberto</b>: desligue a
          animação e confira que ele continua aberto.
        </li>
        <li>
          <b>a sobrancelha NÃO pisca</b> — ela e a boca ficam fora da classe do olho de
          propósito. Uma sobrancelha que achatasse junto com o olho leria como careta, não
          como piscada. Olhe uma piscada de perto no tamanho <code>xl</code>.
        </li>
        <li>
          <b>o respiro</b> — sobe ~4 unidades em 3,5 s, e a <b>sombra do chão encolhe junto</b>. Se
          a sombra subisse com o boneco, ele pareceria um adesivo.
        </li>
        <li>
          <b>DPR</b> — em tela retina o traço não pode ganhar franja. É o halo de antialiasing do
          clip (doc 15, §8 item 6).
        </li>
        <li>
          <b>prefers-reduced-motion</b> — ligue no sistema operacional: tudo tem de parar, e o
          estado parado tem de ser o correto.
        </li>
        <li>
          <b>fundo magenta e preto</b> — revelam furo e halo que o fundo claro esconde.
        </li>
        <li>
          <b>o cabelo não vaza pela lateral do crânio</b> — troque de modelo com o fundo em
          magenta. A franja é a única borda que o cabelo desenha; os lados são o{" "}
          <code>clipPath</code> da cabeça. Um pixel de magenta entre o cabelo e o contorno
          significa que alguém passou a declarar silhueta em dois lugares.
        </li>
        <li>
          <b>o degrau de sombra sob a franja</b> — visível no <code>xl</code>, e é onde{" "}
          <code>--av-cabelo-s</code> aparece. No preto <code>#3A2F2A</code> ele quase some
          contra o contorno, e isso é esperado: cabelo preto não tem sombra para mostrar.
        </li>
      </ul>
    </main>
  );
}
