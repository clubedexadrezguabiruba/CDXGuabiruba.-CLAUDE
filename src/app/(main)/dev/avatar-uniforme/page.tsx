/**
 * Página de CONFERÊNCIA do uniforme vestido, no app de verdade.
 *
 * Existe porque a folha de contato (`npm run avatar:folha`) é um PNG assado por
 * Playwright: ela prova a geometria, mas não prova que o navegador do aluno monta
 * a pilha do mesmo jeito. Aqui a composição acontece no runtime real — `<use>` da
 * base mais um `<image>` do uniforme —, com as custom properties de pele herdando
 * para dentro da árvore do `<use>`.
 *
 * O QUE ELA NÃO É: o fluxo do aluno. Não há item no banco, não há concessão por
 * patente e o `AvatarDisplay` de produção continua montando a pilha do jeito
 * antigo. Isso é o Bloco 5 do doc 15 mais o 7b. O que se aprova aqui é a PEÇA.
 *
 * Os PNGs vêm de `public/dev/uniformes/`, que é ignorado pelo git e regerado por
 * `npm run avatar:preview`. Não vão em `public/items/` porque
 * `verify:avatar-assets` reprova arquivo órfão lá dentro, e a linha do uniforme
 * em `items` só nasce no Bloco 7b.
 */

import AvatarUniformeClient from "./AvatarUniformeClient";

export const metadata = { title: "Uniforme vestido — conferência" };

export default function Page() {
  return <AvatarUniformeClient />;
}
