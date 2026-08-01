import { ALUNO, ATALHOS, HONRA, INSIGNIAS, ORDENS } from "./data";

/**
 * Direção A — Continuidade.
 *
 * Estende o que a landing (src/app/page.tsx) já provou: navy, ouro, Cinzel,
 * marfim. Premium e sóbrio. O ouro aparece UMA vez por bloco — a regra do
 * "One Gold" no DESIGN.md.
 */
export default function VariantA() {
  return (
    <div className="min-h-full bg-warm-ivory pb-10 font-sans text-[#1B2432]">
      {/* Faixa de comando */}
      <header className="bg-deep-navy px-5 pb-7 pt-6 text-warm-ivory">
        <p className="font-heading text-[11px] uppercase tracking-[0.22em] text-gold">
          Reino das 64 Casas
        </p>
        <h1 className="mt-1.5 font-heading text-[26px] font-bold leading-tight">
          Quartel-General
        </h1>
        <p className="mt-1 text-sm text-warm-ivory/65">
          Bom te ver de volta, {ALUNO.nome}.
        </p>

        <div className="mt-5 flex items-baseline justify-between">
          <span className="font-heading text-sm tracking-wide text-gold">
            {ALUNO.patente}
          </span>
          <span className="text-xs tabular-nums text-warm-ivory/55">
            {ALUNO.xpAtual} / {ALUNO.xpProximo} XP
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-warm-ivory/15">
          <div
            className="h-full rounded-full bg-gold"
            style={{ width: `${(ALUNO.xpAtual / ALUNO.xpProximo) * 100}%` }}
          />
        </div>
      </header>

      <div className="space-y-5 px-5 pt-5">
        {/* Atalhos */}
        <nav className="space-y-2.5">
          {ATALHOS.map((a, i) => (
            <button
              key={a.titulo}
              type="button"
              className="flex w-full min-h-14 items-center gap-3 rounded-lg border border-[#1B2432]/10 bg-white px-4 py-3 text-left transition-colors hover:border-gold/60"
            >
              <span
                aria-hidden
                className={`h-8 w-0.75 rounded-full ${i === 0 ? "bg-gold" : "bg-deep-navy/25"}`}
              />
              <span className="flex-1">
                <span className="block text-sm font-semibold">{a.titulo}</span>
                <span className="block text-xs text-[#1B2432]/55">{a.legenda}</span>
              </span>
              <span aria-hidden className="text-[#1B2432]/30">
                &rarr;
              </span>
            </button>
          ))}
        </nav>

        {/* Ordens do Dia */}
        <Section titulo="Ordens do Dia">
          <ul className="space-y-3">
            {ORDENS.map((o) => {
              const feita = o.feito >= o.total;
              return (
                <li key={o.texto} className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px] font-bold ${
                      feita
                        ? "border-gold bg-gold text-deep-navy"
                        : "border-[#1B2432]/20 text-transparent"
                    }`}
                  >
                    &#10003;
                  </span>
                  <span className="flex-1 text-sm">
                    {o.texto}
                    <span className="sr-only">{feita ? " — concluída" : " — em andamento"}</span>
                  </span>
                  <span className="text-xs tabular-nums text-[#1B2432]/45">
                    {o.feito}/{o.total}
                  </span>
                </li>
              );
            })}
          </ul>
        </Section>

        {/* Sequência + Insígnias */}
        <div className="grid grid-cols-2 gap-3">
          <Section titulo="Sequência">
            <p className="font-heading text-3xl font-bold tabular-nums">{ALUNO.streak}</p>
            <p className="mt-0.5 text-xs text-[#1B2432]/55">dias de campanha</p>
          </Section>
          <Section titulo="Insígnias">
            {/* Fila única em 375px: 4 × 24px + 3 × 4px cabe nos ~113px úteis do
                card. Com 28px e gap 6 quebrava linha e desalinhava do bloco ao
                lado. */}
            <div className="flex gap-1">
              {INSIGNIAS.map((ins) => (
                <span
                  key={ins.nome}
                  title={ins.nome}
                  className={`h-6 w-6 shrink-0 rounded-sm border ${
                    ins.ganha
                      ? "border-gold/50 bg-gold/25"
                      : "border-dashed border-[#1B2432]/25 bg-transparent"
                  }`}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-[#1B2432]/55">3 de 4</p>
          </Section>
        </div>

        {/* Quadro de Honra */}
        <Section titulo="Quadro de Honra">
          <ol className="space-y-2">
            {HONRA.map((h) => (
              <li
                key={h.pos}
                className={`flex items-center gap-3 rounded-md px-2 py-1.5 text-sm ${
                  "eu" in h && h.eu ? "bg-gold/12 ring-1 ring-gold/40" : ""
                }`}
              >
                {/* Número em Inter, não em Cinzel: a regra "Cinzel Scarcity" do
                    DESIGN.md — a capitalis some em corpo pequeno no celular. */}
                <span className="w-4 text-xs font-semibold tabular-nums text-[#1B2432]/70">
                  {h.pos}
                </span>
                <span className="flex-1 truncate">{h.nome}</span>
                <span className="text-xs text-[#1B2432]/70">{h.patente}</span>
                <span className="w-11 text-right text-xs font-semibold tabular-nums">
                  {h.rating}
                </span>
              </li>
            ))}
          </ol>
        </Section>
      </div>
    </div>
  );
}

function Section({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[#1B2432]/10 bg-white p-4">
      <h2 className="mb-3 font-heading text-[13px] font-semibold uppercase tracking-[0.14em] text-[#1B2432]/70">
        {titulo}
      </h2>
      {children}
    </section>
  );
}
