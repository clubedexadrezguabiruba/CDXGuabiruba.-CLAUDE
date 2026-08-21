import Card, { CardTitle } from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import { ALUNO, ATALHOS, HONRA, INSIGNIAS, ORDENS } from "./data";

/**
 * O comp do Saguão — direção A (Continuidade).
 *
 * Reconstruído com os primitivos de `src/components/ui/`. É a prova de que a
 * API os expressa: se um primitivo não consegue produzir o comp aprovado, é o
 * primitivo que está errado, e é melhor descobrir aqui do que na tela real.
 *
 * O que NÃO virou primitivo, de propósito: os atalhos. Eles são navegação com
 * duas linhas de texto e barra de ênfase — forçar um variant "tile" no Button
 * para acomodá-los seria inventar API por causa de um consumidor. Ficam como
 * composição local sobre os tokens.
 */
export default function VariantA() {
  return (
    <div className="min-h-full bg-warm-ivory pb-10 font-sans text-ink">
      {/* Faixa de comando — o componente-assinatura da direção A */}
      <header className="bg-deep-navy px-5 pb-7 pt-6 text-warm-ivory">
        <p className="font-heading text-[11px] uppercase tracking-[0.22em] text-gold">
          Academia 64
        </p>
        <h1 className="mt-1.5 font-heading text-[26px] font-bold leading-tight">
          Saguão
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
        <ProgressBar
          className="mt-2"
          tone="gold"
          valor={ALUNO.xpAtual}
          total={ALUNO.xpProximo}
          rotulo={`Experiência: ${ALUNO.xpAtual} de ${ALUNO.xpProximo}`}
        />
      </header>

      <div className="space-y-5 px-5 pt-5">
        {/* Atalhos — composição local, ver docstring */}
        <nav className="space-y-2.5">
          {ATALHOS.map((a, i) => (
            <button
              key={a.titulo}
              type="button"
              className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-ink/10 bg-white px-4 py-3 text-left transition-colors hover:border-gold/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-warm-ivory"
            >
              <span
                aria-hidden
                className={`h-8 w-0.75 rounded-full ${i === 0 ? "bg-gold" : "bg-deep-navy/25"}`}
              />
              <span className="flex-1">
                <span className="block text-sm font-semibold">{a.titulo}</span>
                <span className="block text-xs text-ink/55">{a.legenda}</span>
              </span>
              <span aria-hidden className="text-ink/30">
                &rarr;
              </span>
            </button>
          ))}
        </nav>

        <Card>
          <CardTitle>Missões do Dia</CardTitle>
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
                        : "border-ink/20 text-transparent"
                    }`}
                  >
                    &#10003;
                  </span>
                  <span className="flex-1 text-sm">
                    {o.texto}
                    <span className="sr-only">
                      {feita ? " — concluída" : " — em andamento"}
                    </span>
                  </span>
                  <span className="text-xs tabular-nums text-ink/45">
                    {o.feito}/{o.total}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardTitle>Sequência</CardTitle>
            <p className="font-heading text-3xl font-bold tabular-nums">
              {ALUNO.streak}
            </p>
            <p className="mt-0.5 text-xs text-ink/55">dias de presença</p>
          </Card>
          <Card>
            <CardTitle>Insígnias</CardTitle>
            {/* Fila única em 375px: 4 × 24px + 3 × 4px cabe nos ~113px úteis. */}
            <div className="flex gap-1">
              {INSIGNIAS.map((ins) => (
                <span
                  key={ins.nome}
                  title={ins.nome}
                  className={`h-6 w-6 shrink-0 rounded-sm border ${
                    ins.ganha
                      ? "border-gold/50 bg-gold/25"
                      : "border-dashed border-ink/25 bg-transparent"
                  }`}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-ink/55">3 de 4</p>
          </Card>
        </div>

        <Card>
          <CardTitle>Quadro de Honra</CardTitle>
          <ol className="space-y-2">
            {HONRA.map((h) => (
              <li
                key={h.pos}
                className={`flex items-center gap-3 rounded-md px-2 py-1.5 text-sm ${
                  "eu" in h && h.eu ? "bg-gold/12 ring-1 ring-gold/40" : ""
                }`}
              >
                {/* Número em Inter, não em Cinzel: "Cinzel Scarcity" — a
                    capitalis some em corpo pequeno no celular. */}
                <span className="w-4 text-xs font-semibold tabular-nums text-ink/70">
                  {h.pos}
                </span>
                <span className="flex-1 truncate">{h.nome}</span>
                {/* Texto, não Badge. A "Colorblind Rule" pede cor nunca
                    sozinha — não cor sempre. Cinco pílulas coloridas numa
                    lista de cinco competem com o nome e o rating, que é a
                    informação. O Badge é para onde a patente é protagonista
                    (faixa de comando, perfil), não para linha de lista. */}
                <span className="text-xs text-ink/70">{h.patente}</span>
                <span className="w-11 text-right text-xs font-semibold tabular-nums">
                  {h.rating}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
