import { PATENTES } from "../../../scripts/avatar/patentes";
import { cn } from "@/lib/cn";

/**
 * A pílula de rótulo — e, no caso de patente, o único sinal de progressão que
 * o produto tem.
 *
 * A cor de patente vem de `scripts/avatar/patentes.ts`, a régua medida por
 * `verify:paleta-patentes`. **Importada, nunca copiada**: quando o design-lab
 * copiou essa tabela à mão, a cópia divergiu da fonte em silêncio (o Soldado
 * ganhou um `detalhe` que na fonte é `null`). É o incidente que o gate de
 * tokens nomeia.
 *
 * O nome da patente vai SEMPRE escrito junto da cor. Não é preferência: é a
 * "Colorblind Rule" do DESIGN.md — produto de xadrez, para crianças, e
 * daltonismo é comum. Um quadradinho colorido sozinho não informa nada.
 */

export type BadgeTone = "neutro" | "ouro";

const TONES: Record<BadgeTone, string> = {
  neutro: "bg-ink/[0.06] text-ink/75",
  ouro: "bg-gold/15 text-ink",
};

const BASE =
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold";

export default function Badge({
  children,
  tone = "neutro",
  patente,
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  /**
   * Nome EXIBIDO do título. Quando bate com a escada, a pílula ganha o ponto de
   * cor daquele degrau. Quando não bate — "Calouro" e "Lenda", que não têm cor —
   * cai no tone normal, sem inventar cor.
   *
   * ⚠️ **A busca é por STRING, e é acoplamento com o banco.** Quem chama de tela
   * real passa `user_titles.current_title`. A escada foi renomeada em 2026-08-20
   * (Soldado→Aprendiz, …, Mestre→Grão-Mestre); enquanto a migration que renomeia
   * `title_tiers.title` não descer, o nome do banco não bate com o daqui e a
   * pílula sai **sem o ponto de cor**, em silêncio. Os dois lados sobem juntos.
   */
  patente?: string;
  className?: string;
}) {
  const degrau = patente
    ? PATENTES.find((p) => p.patente === patente)
    : undefined;

  return (
    <span className={cn(BASE, TONES[tone], className)}>
      {degrau && (
        <span
          aria-hidden
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: degrau.pano }}
        />
      )}
      {children}
    </span>
  );
}
