/**
 * O RECORTE DE CABEÇA — o mesmo boneco, para quem só tem 32 px.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELE É IRMÃO DE `<AvatarKokeshi>` E NÃO UM SEGUNDO BONECO
 * ---------------------------------------------------------------------------
 *
 * O SVG é o **mesmo**: mesmo `compor()`, mesma folha, mesma tradução
 * banco→cor. O que muda é o `viewBox` — a janela por onde se olha. A conta de
 * onde a janela cai mora em `estilo/recorte.ts`, derivada das constantes de
 * `geometria.ts`, e não aqui.
 *
 * Isso importa para o dia em que a decisão do espaço da cabeça mudar o canvas: o
 * recorte acompanha sozinho, porque nunca teve número próprio.
 *
 * ---------------------------------------------------------------------------
 * A FOLHA É A MESMA, E TEM DE SER
 * ---------------------------------------------------------------------------
 *
 * `HREF_DA_FOLHA` vem de `<AvatarKokeshi>`. Uma página com os dois — e o
 * `/dashboard` é uma: navbar recortada em cima, nada de corpo inteiro hoje, mas
 * amanhã sim — emitiria duas folhas idênticas se as chaves diferissem. O React
 * deduplica por `href`, e é isso que faz um ranking de 30 bonecos custar um bloco
 * `<style>` só (`folha-unica.test.ts`).
 *
 * **Sem `"use client"`**, pelo mesmo motivo do irmão: string +
 * `dangerouslySetInnerHTML`, sem estado e sem evento. Um ranking de 30 sai do
 * servidor sem mandar JS nenhum ao celular do aluno.
 */

import { FOLHA, HREF_DA_FOLHA, svgDoAluno, type AvatarKokeshiProps } from "./AvatarKokeshi";
import { RECORTE_CABECA, recortarNaCabeca } from "@/lib/avatar/estilo/recorte";

/**
 * As mesmas props do corpo inteiro, menos o que não faz sentido aqui.
 *
 * `altura` some porque **o recorte é quadrado**: um segundo número seria a chance
 * de alguém pedir 32 × 40 e esticar a criança. Quem consome são cápsulas
 * redondas, e cápsula redonda quer lado, não par.
 */
export interface AvatarCabecaProps
  extends Omit<AvatarKokeshiProps, "altura" | "animado"> {
  /** Lado da caixa, em px. O recorte é quadrado — largura e altura são este número. */
  lado: number;
  /**
   * Piscar e respirar. **Desligado por padrão, e é aqui que isso mais importa**:
   * este componente existe para listas, e 30 bonecos animados numa lista pagam 30
   * animações por nada (doc 15, §6, regra 2).
   */
  animado?: boolean;
}

export function AvatarCabeca({
  skin,
  hair,
  hairColor,
  chapeu,
  rosto,
  lado,
  animado = false,
  ns,
  rotulo,
}: AvatarCabecaProps) {
  // Chapéu e rosto vêm junto porque são exatamente as duas peças que o recorte de
  // cabeça mostra — é por isso que as RPCs de ranking servem essas duas e não as
  // cinco (doc 21 §7, Bloco 1). Traje não aparece aqui, fundo e pet nem existem
  // dentro do SVG.
  const svg = recortarNaCabeca(
    svgDoAluno({ skin, hair, hairColor, chapeu, rosto, animado, ns }),
    RECORTE_CABECA,
  ).replace("<svg ", `<svg width="${lado}" height="${lado}" `);

  return (
    <>
      <style href={HREF_DA_FOLHA} precedence="default">
        {FOLHA}
      </style>
      {/*
        As dimensões explícitas e `line-height: 0` pelo mesmo motivo do corpo
        inteiro: sem os dois, a lista do ranking mede uma altura antes de pintar e
        outra depois — o salto de layout que o gate do Bloco 6 cobra.
      */}
      <span
        style={{ display: "inline-block", width: lado, height: lado, lineHeight: 0 }}
        {...(rotulo ? { role: "img", "aria-label": rotulo } : { "aria-hidden": true })}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </>
  );
}
