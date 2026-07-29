"use client";

import { useMemo, useState } from "react";
import { boneco, PELE, CABELO } from "@/lib/avatar/prototipo/boneco";
import { peaozinho } from "@/lib/avatar/prototipo/pet";
import { getFrameStyle } from "@/lib/avatar/frameStyles";

/**
 * Tamanhos do avatar v4 — canvas 4:5, não o 5:7 que constants.ts ainda usa.
 * Divergem de propósito: constants.ts descreve o render de PRODUÇÃO, que só
 * muda na F2. Esta página existe justamente para olhar o 4:5 antes disso.
 */
const TAMANHOS = [
  { nome: "sm", w: 56, h: 70, pet: 24, rotulo: "ranking, mural" },
  { nome: "md", w: 100, h: 125, pet: 40, rotulo: "listas" },
  { nome: "lg", w: 200, h: 250, pet: 80, rotulo: "perfil mobile" },
  { nome: "xl", w: 340, h: 425, pet: 110, rotulo: "perfil desktop" },
] as const;

const FUNDOS = [
  { valor: "", rotulo: "nenhum" },
  { valor: "/items/bg/sala-aula.png", rotulo: "Sala de Aula" },
  { valor: "/items/bg/parque.png", rotulo: "Parque" },
  { valor: "/items/bg/biblioteca.png", rotulo: "Biblioteca" },
  { valor: "/items/bg/torneio.png", rotulo: "Torneio" },
  { valor: "/items/bg/castelo.png", rotulo: "Castelo" },
  { valor: "/items/bg/tabuleiro-gigante.png", rotulo: "Tabuleiro Gigante" },
  { valor: "/items/bg/ceu-estrelado.png", rotulo: "Céu Estrelado" },
  { valor: "/items/bg/dimensao-xadrez.png", rotulo: "Dimensão Xadrez" },
];

const MOLDURAS = [
  { valor: "", rotulo: "nenhuma" },
  { valor: "common", rotulo: "comum" },
  { valor: "rare", rotulo: "rara" },
  { valor: "epic", rotulo: "épica" },
  { valor: "legendary", rotulo: "lendária" },
];

const NOME_PELE = ["1 mais clara", "2", "3", "4", "5", "6", "7", "8 mais escura"];
const NOME_CABELO = ["preto", "castanho", "loiro", "ruivo", "prata"];

export default function AvatarTesteClient() {
  const [cabecas, setCabecas] = useState(3);
  const [pele, setPele] = useState(3);
  const [cabelo, setCabelo] = useState(1);
  const [chapeu, setChapeu] = useState<"" | "bone" | "elmo" | "coroa">("");
  const [uniforme, setUniforme] = useState<"" | "soldado" | "general">("");
  const [pet, setPet] = useState(false);
  const [fundo, setFundo] = useState("");
  const [moldura, setMoldura] = useState("");
  const [lupa, setLupa] = useState(false);

  const svg = useMemo(
    () =>
      boneco({
        cabecas,
        pele,
        cabelo,
        chapeu: chapeu || undefined,
        uniforme: uniforme || undefined,
      }),
    [cabecas, pele, cabelo, chapeu, uniforme],
  );

  const svgPet = useMemo(() => peaozinho(), []);
  const estiloMoldura = moldura ? getFrameStyle(moldura) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-6 rounded-xl border bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold">Teste de tamanhos — avatar v4</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Protótipo da T0.11, montado ao vivo. O tamanho que manda é o{" "}
          <b className="text-zinc-700">sm, 56 px</b>: se ler ali, lê em todos.
          O render de produção só passa a usar isto na F2.
        </p>
      </header>

      <section className="mb-6 grid gap-4 rounded-xl border bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
        <Campo rotulo="Proporção">
          <div className="flex gap-1">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setCabecas(n)}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-sm font-medium ${
                  cabecas === n ? "border-zinc-800 bg-zinc-800 text-white" : "bg-white hover:bg-zinc-50"
                }`}
              >
                1:{n}
                {n === 3 && <span className="ml-1 text-[10px] opacity-70">escolhida</span>}
              </button>
            ))}
          </div>
        </Campo>

        <Campo rotulo={`Tom de pele — ${NOME_PELE[pele]}`}>
          <div className="flex gap-1">
            {PELE.map((cor, i) => (
              <button
                key={cor}
                onClick={() => setPele(i)}
                aria-label={`Tom de pele ${NOME_PELE[i]}`}
                style={{ background: cor }}
                className={`h-8 flex-1 rounded-md border-2 ${
                  pele === i ? "border-zinc-800" : "border-transparent"
                }`}
              />
            ))}
          </div>
        </Campo>

        <Campo rotulo={`Cabelo — ${NOME_CABELO[cabelo]}`}>
          <div className="flex gap-1">
            {CABELO.map((cor, i) => (
              <button
                key={cor}
                onClick={() => setCabelo(i)}
                aria-label={`Cabelo ${NOME_CABELO[i]}`}
                style={{ background: cor }}
                className={`h-8 flex-1 rounded-md border-2 ${
                  cabelo === i ? "border-zinc-800" : "border-transparent"
                }`}
              />
            ))}
          </div>
        </Campo>

        <Campo rotulo="Chapéu">
          <Seletor
            valor={chapeu}
            aoMudar={(v) => setChapeu(v as typeof chapeu)}
            opcoes={[
              { valor: "", rotulo: "nenhum" },
              { valor: "bone", rotulo: "Boné" },
              { valor: "elmo", rotulo: "Elmo de Cavaleiro" },
              { valor: "coroa", rotulo: "Coroa" },
            ]}
          />
        </Campo>

        <Campo rotulo="Uniforme">
          <Seletor
            valor={uniforme}
            aoMudar={(v) => setUniforme(v as typeof uniforme)}
            opcoes={[
              { valor: "", rotulo: "traje de treino (a base)" },
              { valor: "soldado", rotulo: "Soldado" },
              { valor: "general", rotulo: "General" },
            ]}
          />
        </Campo>

        <Campo rotulo="Fundo">
          <Seletor valor={fundo} aoMudar={setFundo} opcoes={FUNDOS} />
        </Campo>

        <Campo rotulo="Moldura">
          <Seletor valor={moldura} aoMudar={setMoldura} opcoes={MOLDURAS} />
        </Campo>

        <Campo rotulo="Extras">
          <div className="flex gap-4 pt-1.5 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={pet} onChange={(e) => setPet(e.target.checked)} />
              Pet
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={lupa} onChange={(e) => setLupa(e.target.checked)} />
              Lupa no 56 px
            </label>
          </div>
        </Campo>
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-8">
          {TAMANHOS.map((t) => (
            <figure key={t.nome} className="m-0">
              <Palco
                svg={svg}
                svgPet={pet ? svgPet : null}
                w={t.w}
                h={t.h}
                petSize={t.pet}
                fundo={fundo}
                moldura={estiloMoldura}
                larguraBorda={t.w <= 100 ? 2 : t.w <= 200 ? 3 : 4}
              />
              <figcaption className="mt-2 text-xs text-zinc-500">
                <b className="text-zinc-700">{t.nome}</b> · {t.w}px
                <span className="block">{t.rotulo}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        {lupa && (
          <div className="mt-8 border-t pt-6">
            <p className="mb-3 text-sm text-zinc-500">
              O mesmo desenho a 56 px, ampliado 6× sem suavização — é assim que dá
              para ver o que sobrevive e o que vira mancha.
            </p>
            <div
              className="inline-block origin-top-left"
              style={{ transform: "scale(6)", imageRendering: "pixelated", width: 56, height: 70 }}
            >
              <Palco
                svg={svg}
                svgPet={pet ? svgPet : null}
                w={56}
                h={70}
                petSize={24}
                fundo={fundo}
                moldura={estiloMoldura}
                larguraBorda={2}
              />
            </div>
            <div style={{ height: 70 * 6 - 70 }} />
          </div>
        )}
      </section>
    </div>
  );
}

function Palco({
  svg,
  svgPet,
  w,
  h,
  petSize,
  fundo,
  moldura,
  larguraBorda,
}: {
  svg: string;
  svgPet: string | null;
  w: number;
  h: number;
  petSize: number;
  fundo: string;
  moldura: { borderClass: string; glowClass: string } | null;
  larguraBorda: number;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl shadow-sm ${fundo ? "" : "bg-linear-to-b from-zinc-100 to-zinc-200"}`}
      style={{ width: w, height: h }}
    >
      {fundo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fundo} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}

      <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: svg }} />

      {svgPet && (
        <div
          className="absolute"
          style={{ width: petSize, height: petSize, right: -petSize * 0.1, bottom: h * 0.04 }}
          dangerouslySetInnerHTML={{ __html: svgPet }}
        />
      )}

      {moldura && (
        <div
          className={`pointer-events-none absolute inset-0 rounded-xl border-solid ${moldura.borderClass} ${moldura.glowClass}`}
          style={{ borderWidth: larguraBorda }}
        />
      )}
    </div>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-zinc-500">{rotulo}</span>
      {children}
    </div>
  );
}

function Seletor({
  valor,
  aoMudar,
  opcoes,
}: {
  valor: string;
  aoMudar: (v: string) => void;
  opcoes: { valor: string; rotulo: string }[];
}) {
  return (
    <select
      value={valor}
      onChange={(e) => aoMudar(e.target.value)}
      className="w-full rounded-lg border bg-white px-2 py-1.5 text-sm"
    >
      {opcoes.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.rotulo}
        </option>
      ))}
    </select>
  );
}
