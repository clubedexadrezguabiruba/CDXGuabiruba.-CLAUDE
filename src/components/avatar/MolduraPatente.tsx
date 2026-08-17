import { FIO_DA_MOLDURA, corDaMoldura } from "../../../scripts/avatar/patentes";
import { cn } from "@/lib/cn";

/**
 * O ANEL DE PATENTE EM VOLTA DO AVATAR — o único lugar onde a patente é cor.
 *
 * POR QUE ELE EXISTE
 * ------------------
 * Até 2026-08-13 a patente vestia o boneco: cada degrau tinha um uniforme, e o
 * slot de traje inteiro era gasto num eixo de 6 valores. A troca (doc 21 §0) foi
 * pôr a patente **em volta** do avatar e libertar a roupa. A moldura ganha três
 * coisas de uma vez:
 *
 *  - **custo de arte zero.** É CSS, fora do SVG. Uma moldura que precisasse de
 *    asset por patente seriam seis assets para manter, e não valeria.
 *  - **ela lê onde o boneco é pequeno.** No ranking o avatar tem 40 px e o traje
 *    não aparece (a lista mostra o recorte de CABEÇA). O anel aparece.
 *  - **a promoção fica visível em toda tela**, e não só no perfil.
 *
 * AUTOMÁTICA, E ISSO É A DECISÃO
 * ------------------------------
 * Ela sai de `achieved_tier` e de nada mais. **Sem slot, sem escolha, sem estado
 * novo, sem coluna nova.** Se a moldura fosse escolhível, ela seria uma sétima peça
 * de guarda-roupa — e deixaria de dizer o que diz, porque o aluno poderia vestir a
 * cor de um degrau que não alcançou.
 *
 * AS DUAS LINGUAGENS DE COR NÃO SE MISTURAM
 * -----------------------------------------
 * Moldura = cor de **patente**, só em volta do avatar. Cores de **raridade** só na
 * vitrine e nos cards do editor. As duas no mesmo elemento ensinam o aluno que cor
 * não significa nada (DESIGN.md, "The Two Color Languages Rule").
 *
 * O APRENDIZ TEM MOLDURA, E ELA NÃO TEM COR DE PATENTE
 * ----------------------------------------------------
 * `corDaMoldura(0)` é `null`: o Aprendiz não está na escada de cores e nunca
 * esteve. Mas o anel é desenhado assim mesmo, num fio neutro de token — porque a
 * alternativa é o avatar do aluno novo ter tamanho diferente do dos outros na mesma
 * lista, e uma lista que pula de altura por causa de patente é pior que um anel
 * discreto. O neutro também é honesto: ele diz "ainda não há degrau", não "erro".
 *
 * O ANEL NÃO OCUPA ESPAÇO
 * -----------------------
 * `box-shadow` nunca entra no layout. Isso é de propósito: as cinco listas do
 * produto já estavam medidas e alinhadas, e um anel que empurrasse o vizinho faria
 * a promoção de um aluno mexer na posição do nome de outro.
 *
 * O FIO POR FORA — e por que ele não é enfeite (G23, 2026-08-17)
 * -------------------------------------------------------------
 * O anel de patente vinha desenhado direto sobre o card marfim, e o do **Mestre**
 * é prata `#AEBCCE`: razão de contraste **1,82** contra o `warm-ivory`, abaixo do
 * piso 3 da WCAG 1.4.11. O anel do aluno mais avançado do produto era o único que
 * não se via. A régua não pegava porque media distância RGB, que dá 103,7 para o
 * mesmo par — dois tons podem estar longe em matiz e colados em valor.
 *
 * **Trocar a cor do Mestre não resolveria**, e isso está medido: contra o navy da
 * landing quem reprova são Aspirante (1,92), General (2,04) e Comandante (2,61), e
 * o Mestre passa em 9,01. A luminância das seis vai de 0,066 a 0,494, e nenhuma
 * superfície única cobre essa faixa nas duas pontas.
 *
 * Então o problema saiu do eixo da cor e foi para o da forma: **1 px de `ink` por
 * fora do anel**, como carta de baralho faz. As seis cores ficam intactas —
 * inclusive a intenção do doc 17 de o Mestre ser a única clara da escada —, e a
 * próxima superfície que aparecer já nasce resolvida. `verify:paleta-patentes`
 * mede as duas metades: o fio contra o fundo (contraste ≥ 3, faz a forma existir)
 * e cada patente contra o fio (RGB ≥ 40, faz a cor ainda ser cor).
 *
 * Ele cabe na mesma `box-shadow` — duas camadas, e a segunda 1 px maior. Continua
 * fora do layout, e continua custando zero asset.
 *
 * A cor vem de `scripts/avatar/patentes.ts`, medida por `verify:paleta-patentes`.
 * **Importada, nunca copiada** — é o incidente que o design-lab pagou uma vez,
 * quando copiou a tabela à mão e a cópia divergiu em silêncio.
 */

/**
 * Fio neutro do Aprendiz. Token, não cor crua: é `ink` a 12%.
 *
 * Ele é o ANEL do Aprendiz, não o fio do G23 — os dois convivem, e é o que faz o
 * avatar do aluno novo ter a mesma espessura de moldura que o dos outros. O que
 * muda entre eles é só que a banda de dentro não tem cor de degrau.
 */
const NEUTRO = "rgb(27 36 50 / 0.12)";

export interface MolduraPatenteProps {
  /**
   * `achieved_tier` do aluno, como o banco o devolve. `0` = Aprendiz, `null` ou
   * `undefined` = a tela ainda não sabe — e os três caem no fio neutro.
   */
  tier: number | null | undefined;
  /** O avatar. `<AvatarCabeca>` nas listas, `<AvatarKokeshi>` nos perfis. */
  children: React.ReactNode;
  /**
   * Espessura do anel, em px.
   *
   * Não é derivada do tamanho do avatar porque o avatar não se declara aqui — e
   * chutar a partir do `children` seria adivinhar. Os dois valores em uso: **2**
   * nas listas (32–40 px) e **3** nos palcos (104–168 px).
   */
  espessura?: number;
  /**
   * O raio do recorte. `lg` é o do produto inteiro, e é **medido**: um círculo
   * inscrito num recorte de cabeça de 32 px tem só 46 unidades de largura na altura
   * em que o moicano começa, contra as 335 que a crista ocupa — `rounded-full`
   * comeria o topo de todo cabelo alto.
   */
  raio?: "lg" | "xl";
  className?: string;
}

export default function MolduraPatente({
  tier,
  children,
  espessura = 2,
  raio = "lg",
  className,
}: MolduraPatenteProps) {
  const cor = corDaMoldura(tier);

  return (
    <span
      // `overflow-hidden` clipa o SVG do avatar no raio; o box-shadow é desenhado
      // FORA desse clip (overflow corta filhos, não a própria sombra), então o anel
      // fica inteiro sem precisar de um segundo elemento.
      className={cn(
        "inline-flex shrink-0 overflow-hidden",
        raio === "lg" ? "rounded-lg" : "rounded-xl",
        className,
      )}
      // Duas camadas na mesma sombra: o anel de patente, e o fio de 1 px por fora
      // dele. A ordem importa — a primeira é a de cima, e a segunda tem de ser
      // `espessura + 1` porque `box-shadow` de spread desenha do elemento para
      // fora, não uma sobre a outra.
      style={{
        boxShadow:
          `0 0 0 ${espessura}px ${cor ?? NEUTRO}, ` +
          `0 0 0 ${espessura + 1}px ${FIO_DA_MOLDURA}`,
      }}
    >
      {children}
    </span>
  );
}
