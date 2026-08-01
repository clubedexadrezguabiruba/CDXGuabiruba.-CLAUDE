import { ALUNO, ATALHOS, HONRA, INSIGNIAS, ORDENS, patentePorNome } from "./data";

/**
 * Direção B — Kokeshi.
 *
 * Puxa o traço do avatar para dentro da interface: contorno #000000, cor
 * chapada, cantos generosos, sombra dura deslocada. Zero gradiente e zero
 * sombra difusa — contorno preto e sombra difusa não convivem (DESIGN.md,
 * seção Shapes).
 */

const BORDA = "border-[2.5px] border-black";
const SOMBRA = "shadow-[3px_3px_0_0_#000]";

export default function VariantB() {
  const patente = patentePorNome(ALUNO.patente);

  return (
    <div className="min-h-full bg-warm-stone pb-10 font-sans text-black">
      <header className="px-4 pt-5">
        <div className={`rounded-3xl ${BORDA} ${SOMBRA} bg-warm-ivory p-4`}>
          <div className="flex items-center gap-3">
            {/* Marca de patente — cor chapada, contorno preto, como o boneco */}
            <span
              aria-hidden
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${BORDA}`}
              style={{ background: patente.pano }}
            >
              <span
                className="h-4 w-4 rounded-[3px] border-2 border-black"
                style={{ background: patente.detalhe }}
              />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold leading-none">Quartel-General</h1>
              <p className="mt-1 text-sm font-medium">
                {ALUNO.nome} &middot;{" "}
                <span className="font-bold">{ALUNO.patente}</span>
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <div className={`h-4 flex-1 overflow-hidden rounded-full ${BORDA} bg-white`}>
              <div
                className="h-full border-r-[2.5px] border-black"
                style={{
                  width: `${(ALUNO.xpAtual / ALUNO.xpProximo) * 100}%`,
                  background: patente.pano,
                }}
              />
            </div>
            <span className="text-xs font-bold tabular-nums">
              {ALUNO.xpAtual}/{ALUNO.xpProximo}
            </span>
          </div>
        </div>
      </header>

      <div className="space-y-4 px-4 pt-4">
        {/* Atalhos */}
        <nav className="space-y-3">
          {ATALHOS.map((a) => (
            <button
              key={a.titulo}
              type="button"
              className={`flex w-full min-h-[60px] items-center gap-3 rounded-2xl ${BORDA} ${SOMBRA} bg-white px-4 py-3 text-left transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none`}
            >
              <span className="flex-1">
                <span className="block text-base font-extrabold leading-tight">{a.titulo}</span>
                <span className="block text-xs font-medium text-black/60">{a.legenda}</span>
              </span>
              <span
                aria-hidden
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${BORDA} bg-gold text-sm font-black`}
              >
                &rarr;
              </span>
            </button>
          ))}
        </nav>

        {/* Ordens do Dia */}
        <Bloco titulo="Ordens do Dia">
          <ul className="space-y-2.5">
            {ORDENS.map((o) => {
              const feita = o.feito >= o.total;
              return (
                <li key={o.texto} className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg ${BORDA} text-xs font-black ${
                      feita ? "bg-gold" : "bg-white text-transparent"
                    }`}
                  >
                    &#10003;
                  </span>
                  <span className="flex-1 text-sm font-medium">
                    {o.texto}
                    <span className="sr-only">{feita ? " — concluída" : " — em andamento"}</span>
                  </span>
                  <span className="text-xs font-bold tabular-nums">
                    {o.feito}/{o.total}
                  </span>
                </li>
              );
            })}
          </ul>
        </Bloco>

        <div className="grid grid-cols-2 gap-3">
          <Bloco titulo="Sequência">
            <p className="text-4xl font-black leading-none tabular-nums">{ALUNO.streak}</p>
            <p className="mt-1 text-xs font-medium text-black/60">dias seguidos</p>
          </Bloco>
          <Bloco titulo="Insígnias">
            <div className="flex flex-wrap gap-2">
              {INSIGNIAS.map((ins) => (
                <span
                  key={ins.nome}
                  title={ins.nome}
                  className={`h-8 w-8 rounded-xl ${
                    ins.ganha
                      ? `${BORDA} bg-gold`
                      : "border-[2.5px] border-dashed border-black/30 bg-transparent"
                  }`}
                />
              ))}
            </div>
          </Bloco>
        </div>

        {/* Quadro de Honra */}
        <Bloco titulo="Quadro de Honra">
          <ol className="space-y-2">
            {HONRA.map((h) => {
              const cor = patentePorNome(h.patente);
              const eu = "eu" in h && h.eu;
              return (
                <li
                  key={h.pos}
                  className={`flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm ${
                    eu ? `${BORDA} bg-gold/25` : ""
                  }`}
                >
                  <span className="w-4 text-xs font-black tabular-nums">{h.pos}</span>
                  <span
                    aria-hidden
                    className="h-4 w-4 shrink-0 rounded-[5px] border-2 border-black"
                    style={{ background: cor.pano }}
                  />
                  <span className="flex-1 truncate font-semibold">{h.nome}</span>
                  {/* A patente vai por escrito, não só pela cor do quadrado —
                      regra "Colorblind" do DESIGN.md. */}
                  <span className="text-[11px] font-medium text-black/65">{h.patente}</span>
                  <span className="w-11 text-right text-xs font-bold tabular-nums">
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

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className={`rounded-2xl ${BORDA} ${SOMBRA} bg-white p-4`}>
      <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide">{titulo}</h2>
      {children}
    </section>
  );
}
