/**
 * O SELETOR DE VARIANTES — onde o Doug escolhe, e só ele.
 *
 * A folha de contato (`npm run avatar:variantes`) prova que as candidatas passam
 * nas amarras e que se distinguem entre si. **Escolher qual é a certa não é coisa
 * que um gate faça**, e é a única parte do desenho que nenhuma régua substitui.
 *
 * ELA NÃO COMPÕE NADA. Lê `public/dev/variantes.json`, que o script publica com o
 * SVG já composto. Se ela compusesse por conta própria, existiriam duas
 * composições — uma medida pelo gate, outra mostrada na tela, livres para divergir
 * — que é exatamente a família de defeito que o `compositor.ts` inteiro existe para
 * não ter.
 *
 * O arquivo é de rascunho e o `.gitignore` cobre `public/dev/`. Quando ele não
 * existe, a tela diz o que rodar em vez de quebrar.
 */

import AvatarVariantesClient from "./AvatarVariantesClient";

export const metadata = { title: "Variantes — escolher" };

export default function Page() {
  return <AvatarVariantesClient />;
}
