/**
 * Página de CONFERÊNCIA da base kokeshi, no navegador de verdade.
 *
 * O segundo dos dois artefatos que o Bloco 1 exige para a aprovação da base. Ela
 * existe porque a folha de contato (`npm run avatar:folha-base`) é um PNG assado
 * por Playwright: prova a geometria, e não prova nada do que só existe em
 * runtime — **o piscar**, o respiro do `character-root`, o comportamento em
 * DPR 2 e o `prefers-reduced-motion`.
 *
 * O QUE ELA NÃO É: o fluxo do aluno. Não há item no banco, não há escolha
 * persistida e o `AvatarDisplay` de produção continua montando a pilha antiga.
 * Isso é o Bloco 8. O que se aprova aqui é a BASE.
 */

import AvatarKokeshiClient from "./AvatarKokeshiClient";

export const metadata = { title: "Base kokeshi — conferência" };

export default function Page() {
  return <AvatarKokeshiClient />;
}
