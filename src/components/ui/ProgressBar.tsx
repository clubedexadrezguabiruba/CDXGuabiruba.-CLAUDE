import { cn } from "@/lib/cn";

/**
 * A barra de progresso do app.
 *
 * Havia 12 delas, com 5 alturas diferentes e **metade sem `overflow-hidden`** —
 * o preenchimento vazava o canto arredondado do trilho. Aqui é sempre com.
 *
 * O `tone` não é enfeite: sem ele, o Saguão teria XP + 3 missões do dia
 * + sequência + tarefas = **seis barras douradas na mesma tela**, e o One Gold
 * do DESIGN.md morreria na primeira tela migrada. Ouro é mérito; navy é
 * progresso comum.
 */
export default function ProgressBar({
  valor,
  total,
  tone = "navy",
  rotulo,
  className,
}: {
  valor: number;
  total: number;
  tone?: "gold" | "navy";
  /** Lido por leitor de tela. A barra sozinha não diz do que ela é. */
  rotulo: string;
  className?: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (valor / total) * 100)) : 0;

  return (
    <div
      role="progressbar"
      aria-label={rotulo}
      aria-valuenow={valor}
      aria-valuemin={0}
      aria-valuemax={total}
      className={cn(
        "h-1.5 overflow-hidden rounded-full",
        tone === "gold" ? "bg-warm-ivory/15" : "bg-ink/10",
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-300",
          tone === "gold" ? "bg-gold" : "bg-deep-navy"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
