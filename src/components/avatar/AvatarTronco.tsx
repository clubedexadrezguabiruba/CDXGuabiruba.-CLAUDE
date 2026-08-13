/**
 * O RECORTE DE TRONCO — o card de roupa mostra a PEÇA, não o boneco vestido.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELE EXISTE
 * ---------------------------------------------------------------------------
 *
 * É a decisão §5.2 do doc 21. Um card de roupa que desenha o boneco inteiro faz a
 * criança comparar seis cabeças idênticas para escolher uma roupa: **57% do desenho
 * é o mesmo em todas as fichas**, e o que muda fica pequeno no que sobra.
 *
 * O palco grande continua mostrando o conjunto montado — é ali que ela vê o
 * resultado. Os cards servem para escolher a peça, e peça se escolhe vendo a peça.
 *
 * ---------------------------------------------------------------------------
 * IRMÃO DE `<AvatarCabeca>`, E PELO MESMO MOTIVO
 * ---------------------------------------------------------------------------
 *
 * O SVG é o **mesmo**: mesmo `compor()`, mesma folha, mesma tradução banco→cor. O
 * que muda é o `viewBox`, e a conta de onde a janela cai mora em `estilo/recorte.ts`,
 * derivada de `geometria.ts`. No dia em que a Frente B mexer no canvas, os dois
 * recortes acompanham sozinhos porque nenhum deles tem número próprio.
 *
 * A diferença entre os dois: **este é retangular**. A cabeça é quadrada porque os
 * cinco lugares que a consomem são cápsulas redondas; o tronco é mais alto que
 * largo, e forçá-lo em quadrado cortaria a barra — o evento que mais separa uma
 * peça da outra.
 *
 * **Sem `"use client"`**, pelo mesmo motivo dos irmãos: string +
 * `dangerouslySetInnerHTML`, sem estado e sem evento.
 */

import { FOLHA, HREF_DA_FOLHA, svgDoAluno, type AvatarKokeshiProps } from "./AvatarKokeshi";
import { RECORTE_TRONCO, recortarNoTronco } from "@/lib/avatar/estilo/recorte";

export interface AvatarTroncoProps
  extends Omit<AvatarKokeshiProps, "altura" | "animado" | "chapeu" | "rosto"> {
  /** Altura em px. A largura sai do recorte, nunca de um segundo número. */
  altura: number;
}

export function AvatarTronco({ skin, hair, hairColor, traje, altura, ns, rotulo }: AvatarTroncoProps) {
  // A largura DERIVA da altura pela proporção do recorte. Um segundo número aqui
  // seria a segunda descrição da mesma proporção, e é assim que tronco esticado
  // nasce.
  const largura = Math.round((altura * RECORTE_TRONCO.w) / RECORTE_TRONCO.h);

  // Chapéu e rosto NÃO vêm: eles são peças de cabeça, e a cabeça está fora desta
  // janela. Passá-los custaria camadas de SVG que nenhum pixel deste card mostra.
  // O cabelo vem, e é de propósito: mecha comprida cai sobre o tronco (é a decisão
  // do Bloco 12), então tirá-lo mostraria um tronco que o produto não desenha.
  const svg = recortarNoTronco(
    svgDoAluno({ skin, hair, hairColor, traje, animado: false, ns }),
  ).replace("<svg ", `<svg width="${largura}" height="${altura}" `);

  return (
    <>
      <style href={HREF_DA_FOLHA} precedence="default">
        {FOLHA}
      </style>
      <span
        style={{ display: "inline-block", width: largura, height: altura, lineHeight: 0 }}
        {...(rotulo ? { role: "img", "aria-label": rotulo } : { "aria-hidden": true })}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </>
  );
}
