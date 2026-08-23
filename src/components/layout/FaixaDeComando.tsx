import ProgressBar from "@/components/ui/ProgressBar";
import { cn } from "@/lib/cn";

/**
 * O cabeçalho de tela da direção A — o componente-assinatura.
 *
 * É o que faz o app parecer o mesmo produto que a landing: a faixa navy, o
 * supertítulo em Cinzel versalete ouro, o título grande em Cinzel. Ver o comp
 * em `src/app/design-lab/VariantA.tsx`.
 *
 * Sem estado e sem dados próprios — só props. Assim serve tanto a Server
 * Component quanto a Client, e a tela decide de onde vêm os números.
 */
export default function FaixaDeComando({
  supertitulo,
  titulo,
  saudacao,
  patente,
  xp,
  xpTotal,
  proximoTitulo,
  className,
}: {
  /** Versalete pequeno em ouro. Ex.: "Academia 64", "Título Analista". */
  supertitulo?: string;
  titulo: string;
  saudacao?: string;
  /** Título/patente do aluno, à esquerda da linha de XP. */
  patente?: string;
  xp?: number;
  xpTotal?: number;
  /**
   * A frase do próximo degrau da escada — pronta, vinda de
   * `fraseDoProximoTitulo`. A faixa não decide o texto: a lei do ritmo mora em
   * `lib/gamification/proximoTitulo.ts`, e este componente continua sem dados
   * próprios.
   */
  proximoTitulo?: string | null;
  className?: string;
}) {
  const temXp = typeof xp === "number" && typeof xpTotal === "number" && xpTotal > 0;

  return (
    <header className={cn("bg-deep-navy text-warm-ivory", className)}>
      {/* A faixa sangra de ponta a ponta, mas o conteúdo dela acompanha o
          container da página — senão, em tela larga, o título fica colado na
          borda esquerda e o XP na direita. Visto no primeiro screenshot. */}
      <div className="mx-auto max-w-2xl px-5 pb-7 pt-6">
      {supertitulo && (
        <p className="font-heading text-[11px] uppercase tracking-[0.22em] text-gold">
          {supertitulo}
        </p>
      )}
      <h1 className="mt-1.5 font-heading text-[26px] font-bold leading-tight">
        {titulo}
      </h1>
      {saudacao && (
        <p className="mt-1 text-sm text-warm-ivory/65">{saudacao}</p>
      )}

      {temXp && (
        <>
          <div className="mt-5 flex items-baseline justify-between">
            <span className="font-heading text-sm tracking-wide text-gold">
              {patente}
            </span>
            <span className="text-xs tabular-nums text-warm-ivory/55">
              {xp} / {xpTotal} XP
            </span>
          </div>
          <ProgressBar
            className="mt-2"
            tone="gold"
            valor={xp}
            total={xpTotal}
            rotulo={`Experiência: ${xp} de ${xpTotal}`}
          />

          {/*
            O DESTINO, logo abaixo da barra de XP — e a posição é o argumento.
            São duas progressões diferentes e o produto nunca disse qual era
            qual: o NÍVEL mede presença (aparecer rende XP) e o TÍTULO mede
            formação (concluir trilha). Pôr a frase do título encostada na barra
            de XP é o que deixa a diferença legível sem uma linha de explicação.
          */}
          {proximoTitulo && (
            <p className="mt-2.5 text-xs text-warm-ivory/60">{proximoTitulo}</p>
          )}
        </>
      )}
      </div>
    </header>
  );
}
