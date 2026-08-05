import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Junta classes condicionais e resolve conflitos do Tailwind.
 *
 * `clsx` aceita string, objeto e array; `twMerge` faz a última classe vencer
 * quando duas mexem na mesma propriedade — sem ele, `cn("p-4", "p-6")` deixaria
 * as duas no atributo e o vencedor sairia da ordem do CSS gerado, não da ordem
 * em que você escreveu.
 *
 * Os dois pacotes estavam instalados desde sempre e nunca haviam sido
 * importados. Este é o primeiro uso.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
