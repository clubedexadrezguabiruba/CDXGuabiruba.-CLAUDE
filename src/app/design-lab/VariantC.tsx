import { ALUNO, ATALHOS, HONRA, INSIGNIAS, ORDENS, PATENTES, patentePorNome } from "./data";
import type { Patente } from "./data";

/**
 * Direção C — Patentes.
 *
 * A interface muda de temperatura conforme a patente do aluno. O progresso
 * deixa de ser um badge e vira ambientação — é a direção que melhor executa a
 * curva tonal da Bíblia Tonal §14 (acolhedor → firme → nobre), e a mais cara
 * de manter: são seis temas em vez de um.
 *
 * A cor da escada continua significando só patente (regra "Patente Ladder" do
 * DESIGN.md): aqui ela ambienta a tela DO aluno naquele degrau.
 */
export default function VariantC({ patente = patentePorNome(ALUNO.patente) }: { patente?: Patente }) {
  const tinta = (pct: number) => `color-mix(in oklab, ${patente.pano} ${pct}%, #FAF8F3)`;

  return (
    <div
      className="min-h-full pb-10 font-sans text-[#141A22]"
      style={{ background: tinta(7) }}
    >
      <header
        className="px-5 pb-6 pt-6 text-white"
        style={{ background: `linear-gradient(180deg, ${patente.bota} 0%, ${patente.pano} 100%)` }}
      >
        <p
          className="font-heading text-[11px] uppercase tracking-[0.22em]"
          style={{ color: patente.detalhe }}
        >
          Patente {patente.nome}
        </p>
        <h1 className="mt-1.5 font-heading text-[26px] font-bold leading-tight">
          Quartel-General
        </h1>

        <div className="mt-5 flex items-baseline justify-between text-xs">
          <span style={{ color: patente.detalhe }}>Nível {ALUNO.nivel}</span>
          <span className="tabular-nums text-white/65">
            {ALUNO.xpAtual} / {ALUNO.xpProximo} XP
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/25">
          <div
            className="h-full rounded-full"
            style={{
              width: `${(ALUNO.xpAtual / ALUNO.xpProximo) * 100}%`,
              background: patente.detalhe,
            }}
          />
        </div>

        {/* A escada inteira, para o degrau atual se ler contra os outros */}
        <ol className="mt-4 flex items-end gap-1" aria-label="Escada de patentes">
          {PATENTES.map((p, i) => {
            const atual = p.nome === patente.nome;
            const passada = i < PATENTES.findIndex((x) => x.nome === patente.nome);
            return (
              <li
                key={p.nome}
                className="flex-1 rounded-sm"
                style={{
                  height: atual ? 14 : 8,
                  background: atual ? patente.detalhe : passada ? "rgba(255,255,255,.45)" : "rgba(255,255,255,.15)",
                }}
                title={p.nome}
              >
                <span className="sr-only">
                  {p.nome}
                  {atual ? " (atual)" : passada ? " (alcançada)" : " (a alcançar)"}
                </span>
              </li>
            );
          })}
        </ol>
      </header>

      <div className="space-y-4 px-5 pt-5">
        <nav className="space-y-2.5">
          {ATALHOS.map((a, i) => (
            <button
              key={a.titulo}
              type="button"
              className="flex w-full min-h-14 items-center gap-3 rounded-xl bg-white px-4 py-3 text-left"
              style={{ boxShadow: `inset 0 0 0 1px ${tinta(28)}` }}
            >
              <span
                aria-hidden
                className="h-9 w-1 rounded-full"
                style={{ background: i === 0 ? "#C9A84C" : tinta(45) }}
              />
              <span className="flex-1">
                <span className="block text-sm font-semibold">{a.titulo}</span>
                <span className="block text-xs text-[#141A22]/55">{a.legenda}</span>
              </span>
              <span aria-hidden className="text-[#141A22]/30">
                &rarr;
              </span>
            </button>
          ))}
        </nav>

        <Bloco titulo="Ordens do Dia" tinta={tinta}>
          <ul className="space-y-3">
            {ORDENS.map((o) => {
              const feita = o.feito >= o.total;
              return (
                <li key={o.texto}>
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                      style={{
                        background: feita ? patente.pano : "transparent",
                        boxShadow: feita ? "none" : `inset 0 0 0 1.5px ${tinta(35)}`,
                      }}
                    >
                      {feita ? "✓" : ""}
                    </span>
                    <span className="flex-1 text-sm">
                      {o.texto}
                      <span className="sr-only">{feita ? " — concluída" : " — em andamento"}</span>
                    </span>
                    <span className="text-xs tabular-nums text-[#141A22]/45">
                      {o.feito}/{o.total}
                    </span>
                  </div>
                  <div className="ml-8 mt-1.5 h-1 overflow-hidden rounded-full" style={{ background: tinta(18) }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(o.feito / o.total) * 100}%`, background: patente.pano }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Bloco>

        <div className="grid grid-cols-2 gap-3">
          <Bloco titulo="Sequência" tinta={tinta}>
            <p className="font-heading text-3xl font-bold tabular-nums" style={{ color: patente.bota }}>
              {ALUNO.streak}
            </p>
            <p className="mt-0.5 text-xs text-[#141A22]/55">dias de campanha</p>
          </Bloco>
          <Bloco titulo="Insígnias" tinta={tinta}>
            <div className="flex flex-wrap gap-1.5">
              {INSIGNIAS.map((ins) => (
                <span
                  key={ins.nome}
                  title={ins.nome}
                  className="h-7 w-7 rounded-md"
                  style={
                    ins.ganha
                      ? { background: patente.pano }
                      : { boxShadow: `inset 0 0 0 1.5px ${tinta(30)}` }
                  }
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-[#141A22]/55">3 de 4 conquistadas</p>
          </Bloco>
        </div>

        <Bloco titulo="Quadro de Honra" tinta={tinta}>
          <ol className="space-y-2">
            {HONRA.map((h) => {
              const cor = patentePorNome(h.patente);
              const eu = "eu" in h && h.eu;
              return (
                <li
                  key={h.pos}
                  className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm"
                  style={eu ? { background: tinta(14) } : undefined}
                >
                  <span className="w-5 font-heading text-xs font-semibold tabular-nums text-[#141A22]/75">
                    {h.pos}
                  </span>
                  <span
                    aria-hidden
                    className="h-3.5 w-3.5 shrink-0 rounded-full"
                    style={{ background: cor.pano }}
                  />
                  <span className="flex-1 truncate">{h.nome}</span>
                  <span className="text-xs text-[#141A22]/50">{h.patente}</span>
                  <span className="w-11 text-right text-xs font-semibold tabular-nums">
                    {h.rating}
                  </span>
                </li>
              );
            })}
          </ol>
        </Bloco>
      </div>
    </div>
  );
}

function Bloco({
  titulo,
  tinta,
  children,
}: {
  titulo: string;
  tinta: (pct: number) => string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-xl bg-white p-4"
      style={{ boxShadow: `inset 0 0 0 1px ${tinta(24)}` }}
    >
      <h2 className="mb-3 font-heading text-[13px] font-semibold uppercase tracking-[0.14em] text-[#141A22]/70">
        {titulo}
      </h2>
      {children}
    </section>
  );
}
