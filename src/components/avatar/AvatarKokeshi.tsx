/**
 * O BONECO DO ALUNO — o único jeito de o produto desenhar um avatar.
 *
 * ---------------------------------------------------------------------------
 * ELE FALA A LÍNGUA DO BANCO, E NÃO A DO COMPOSITOR
 * ---------------------------------------------------------------------------
 *
 * `compor()` pensa em cor: `pele: "#E9B183"`. O banco pensa em **índice e slug**:
 * `users.avatar_skin = 2`, `users.avatar_hair = 'coque'`, `users.avatar_hair_color = 0`
 * (migration do Bloco C, `20260810160000_...sql:131-136`, e o motivo de não ser hex
 * está escrito lá: hex no banco seria uma segunda cópia da paleta de `palette.ts`,
 * e duas descrições da mesma coisa divergem sempre).
 *
 * A tradução entre os dois tem de morar em UM lugar. São oito consumidores até o
 * fim do Bloco 6 — `/criar-personagem`, `/perfil`, `/perfil/[userId]`, navbar, os
 * dois rankings, mural e Companhia —, e uma API em hex faria os oito reescreverem
 * índice→cor, `null`→careca, texto→slug. Aqui é uma vez, e é aqui.
 *
 * ---------------------------------------------------------------------------
 * NÃO EXISTE ALUNO SEM IDENTIDADE, E ISSO É DO BANCO
 * ---------------------------------------------------------------------------
 *
 * As três colunas têm `DEFAULT` total (skin 2, hair `NULL`, hairColor 0), então
 * **todo usuário é renderizável desde o instante em que a linha existe**. Nenhuma
 * tela precisa de estado "ainda não escolheu": careca com o tom 2 é um boneco
 * legítimo, não um placeholder. É por isso que não há prop opcional de fallback.
 *
 * ---------------------------------------------------------------------------
 * A FOLHA SAI UMA VEZ, E QUEM GARANTE ISSO É O REACT
 * ---------------------------------------------------------------------------
 *
 * O `<style href precedence>` é deduplicado pelo React 19 e hoisteado para o
 * `<head>`: N avatares na página, um bloco só (doc 15, 5.7). Medido no gate
 * `folha-unica.test.ts`.
 *
 * É mecanismo e não disciplina — ninguém precisa lembrar de pôr a folha na página,
 * porque ela vem grudada em quem a usa. A alternativa (a folha na tela, o boneco no
 * componente) põe as duas metades a uma distração de divergirem, e o modo de falha
 * é **boneco preto sem mensagem nenhuma** (`svgContrato.ts`, defeito nº 2).
 *
 * **Sem `"use client"` de propósito:** o componente é string + `dangerouslySetInnerHTML`,
 * sem estado e sem evento. Assim ele serve Server Component (um ranking de 30 sai do
 * servidor sem mandar JS nenhum ao celular do aluno) e Client Component (o seletor de
 * cabelo do perfil, que troca a peça na mão do aluno) pelo mesmo caminho.
 */

import { compor, folhaAvatar } from "@/lib/avatar/estilo/compositor";
import { MODELOS_CABELO, type ModeloCabelo } from "@/lib/avatar/estilo/cabelo";
import { VIEWBOX } from "@/lib/avatar/estilo/geometria";
import { CABELO, PELE } from "@/lib/avatar/palette";

/** A folha é constante: gerada uma vez no módulo, não a cada render. */
export const FOLHA = folhaAvatar();

/**
 * O `href` é a chave de deduplicação do React. **Mudá-lo é emitir uma folha nova**,
 * então ele é constante e não deriva de nada.
 *
 * Exportado porque `<AvatarCabeca>` desenha o MESMO SVG por outra janela e tem de
 * usar a MESMA chave: uma navbar com o recorte e um `/perfil` com o corpo inteiro
 * na mesma página emitiriam duas folhas idênticas se as chaves diferissem — e a
 * segunda folha é exatamente o que o `folha-unica.test.ts` existe para impedir.
 */
export const HREF_DA_FOLHA = "avatar-kokeshi";

export interface AvatarKokeshiProps {
  /** `users.avatar_skin` — índice em `PELE`. Fora da faixa cai no default do banco. */
  skin: number;
  /** `users.avatar_hair` — slug do catálogo. `null` é careca, que é ausência de peça. */
  hair: string | null;
  /** `users.avatar_hair_color` — índice em `CABELO`. */
  hairColor: number;
  /** Altura em px. A largura sai do `viewBox`, nunca de um segundo número. */
  altura: number;
  /**
   * Piscar e respirar. **Desligado por padrão**, que é o caso do ranking: 30 bonecos
   * animados numa lista pagam 30 animações por nada (doc 15, §6, regra 2).
   */
  animado?: boolean;
  /**
   * Prefixo de todo `id` do SVG, e **obrigatório** pela mesma razão que em `compor()`.
   *
   * ⚠️ **É por INSTÂNCIA, não por aluno.** A tentação é `ns={userId}`, e ela quebra no
   * primeiro lugar que desenha o mesmo aluno duas vezes — o seletor de cabelo do
   * perfil, que mostra ~7 prévias da mesma criança. Os `id` `${ns}-fe`/`-fd` são os
   * gradientes das facetas e carregam o tom de pele: repetidos, todas as prévias
   * resolvem para a primeira e a troca de cor não aparece.
   */
  ns: string;
  /**
   * O nome que o leitor de tela anuncia. **Ausente, o boneco é decorativo**
   * (`aria-hidden`), que é o certo numa lista onde o nome do aluno já está escrito
   * ao lado — anunciar "avatar" 30 vezes é ruído, não acessibilidade.
   */
  rotulo?: string;
}

/**
 * Índice → cor, com o fora-da-faixa caindo no default do banco em vez de em
 * `undefined`. A coluna tem `CHECK BETWEEN 0 AND 7`, então isto só age se a paleta
 * encolher — e aí é melhor um boneco com a cor errada do que um `fill` vazio, que
 * renderiza preto sem avisar.
 */
const corDe = (paleta: readonly string[], i: number, padrao: number) =>
  paleta[i] ?? paleta[padrao];

/**
 * Slug → modelo, com o desconhecido virando careca.
 *
 * A FK do banco já impede slug inválido; isto cobre o intervalo em que uma peça sai
 * do catálogo do CÓDIGO antes de sair do banco — foi o que a poda de sete para cinco
 * modelos criou uma vez. Careca é um estado válido do produto, então degradar para
 * ela não inventa nada.
 */
function modeloDe(hair: string | null): ModeloCabelo | undefined {
  if (!hair) return undefined;
  return (MODELOS_CABELO as string[]).includes(hair) ? (hair as ModeloCabelo) : undefined;
}

/**
 * A LÍNGUA DO BANCO VIRANDO SVG — a tradução que o topo deste arquivo promete que
 * mora em UM lugar.
 *
 * Exportada no Bloco 6 porque nasceu o segundo consumidor: `<AvatarCabeca>`
 * desenha o **mesmo** boneco por outra janela. Se ele refizesse índice→cor,
 * `null`→careca e texto→slug, passariam a existir duas traduções do mesmo dado —
 * e a que divergisse mostraria a criança errada na navbar.
 */
export function svgDoAluno({
  skin,
  hair,
  hairColor,
  animado = false,
  ns,
}: Pick<AvatarKokeshiProps, "skin" | "hair" | "hairColor" | "ns"> & {
  animado?: boolean;
}): string {
  return compor({
    pele: corDe(PELE, skin, 2),
    cabelo: corDe(CABELO, hairColor, 0),
    modeloCabelo: modeloDe(hair),
    animado,
    ns,
    folhaExterna: true,
  });
}

export function AvatarKokeshi({
  skin,
  hair,
  hairColor,
  altura,
  animado = false,
  ns,
  rotulo,
}: AvatarKokeshiProps) {
  // A largura DERIVA da altura pelo `viewBox`. Um segundo número aqui seria a
  // segunda descrição da mesma proporção, e é assim que boneco esticado nasce.
  const largura = Math.round((altura * VIEWBOX.w) / VIEWBOX.h);

  const svg = svgDoAluno({ skin, hair, hairColor, animado, ns }).replace(
    "<svg ",
    `<svg width="${largura}" height="${altura}" `,
  );

  return (
    <>
      <style href={HREF_DA_FOLHA} precedence="default">
        {FOLHA}
      </style>
      {/*
        A caixa leva as dimensões explícitas, e `line-height: 0` mata o vão de
        baseline que todo SVG inline arrasta embaixo de si. Sem os dois, a lista do
        ranking mede uma altura antes de pintar e outra depois — o salto de layout
        que o gate do Bloco 6 vai cobrar (doc 15, §6).
      */}
      <span
        style={{ display: "inline-block", width: largura, height: altura, lineHeight: 0 }}
        {...(rotulo ? { role: "img", "aria-label": rotulo } : { "aria-hidden": true })}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </>
  );
}
