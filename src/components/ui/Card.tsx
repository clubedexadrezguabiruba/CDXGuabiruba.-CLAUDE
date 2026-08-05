import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * O bloco de conteúdo do app.
 *
 * O app tinha 77 cards, e `rounded-xl border bg-white p-4 shadow-sm` aparecia
 * **29 vezes byte-idêntico**. Mesmo assim o padrão daqui NÃO é esse: o comp
 * aprovado (design-lab/VariantA) é `rounded-lg`, fio `ink/10` e **sem sombra**.
 *
 * O comp vence a maioria porque a maioria era copiar-e-colar de uma decisão que
 * ninguém tomou. Sombra difusa sobre marfim, em celular barato sob luz de sala
 * de aula, desaparece — se a hierarquia depende dela, a hierarquia sumiu.
 * Ver DESIGN.md, "The Flat-By-Default Rule".
 */
export default function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-ink/10 bg-white p-4", className)}
      {...props}
    />
  );
}

/**
 * O título do bloco: Cinzel em versalete.
 *
 * É onde a fantasia medieval entra sem nenhum ornamento — a capitalis romana
 * faz o trabalho. Só aqui e no título de tela: Cinzel em corpo pequeno some no
 * celular ("The Cinzel Scarcity Rule").
 */
export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "mb-3 font-heading text-[13px] font-semibold uppercase tracking-[0.14em] text-ink/70",
        className
      )}
      {...props}
    />
  );
}
