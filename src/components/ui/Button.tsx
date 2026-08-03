import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * O botão do Recruta 64 — direção A (Continuidade).
 *
 * Antes deste arquivo havia 117 elementos clicáveis com **13 cores diferentes
 * de "primário"**, 5 raios, 7 escalas de padding, e foco visível em apenas 7
 * dos 40 arquivos. Aqui os três papéis reais viram três variantes.
 *
 * Decisões que parecem faltas e são deliberadas:
 *
 *  - **Um tamanho só.** `min-h-11` são os 44px de alvo de toque do DESIGN.md.
 *    Um `size="sm"` violaria o piso — a mão é de criança e a tela é de 375px.
 *  - **Sem variante destrutiva** por enquanto: nenhuma das telas desta fase usa
 *    uma. Ela nasce quando a primeira tela pedir.
 *  - **O hover mexe no fio, não no fundo.** É o sistema tonal do DESIGN.md:
 *    a separação é por contorno, e sombra difusa some em celular barato.
 */

export type ButtonVariant = "primary" | "secondary" | "ghost";

const BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 " +
  "text-sm font-semibold transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-warm-ivory " +
  "disabled:pointer-events-none disabled:opacity-50";

const VARIANTES: Record<ButtonVariant, string> = {
  // O One Gold: um por tela, na ação principal. Ver DESIGN.md.
  primary: "bg-gold text-deep-navy hover:bg-gold-light",
  // O botão padrão do app — a maioria das ações mora aqui.
  secondary: "border border-ink/10 bg-white text-ink hover:border-gold/60",
  ghost: "text-ink/70 hover:bg-ink/5 hover:text-ink",
};

/**
 * As classes soltas, para um `<Link>` do Next parecer botão sem virar botão.
 * É o caminho sem dependência nova — o projeto não tem Radix nem `cva`.
 */
export function buttonVariants(
  variant: ButtonVariant = "secondary",
  className?: string
): string {
  return cn(BASE, VARIANTES[variant], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export default function Button({
  variant = "secondary",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={buttonVariants(variant, className)} {...props} />
  );
}
