/**
 * A RARIDADE EM COR E EM PALAVRA — e as duas moram aqui, num lugar só.
 *
 * Este arquivo nasceu em 2026-08-23 recolhendo duas tabelas que já eram **iguais
 * byte a byte** e viviam em componentes diferentes: a vitrine do
 * `<EditorDeAparencia>` e o `<ChestOpeningModal>`. Não é helper preventivo — os
 * dois docstrings originais já diziam, cada um do seu lado, que a segunda tabela
 * não podia divergir da primeira:
 *
 *   > *"Uma segunda tabela aqui divergiria da primeira no dia em que alguém
 *   > acertasse o roxo do épico num lugar só — e o aluno veria a peça sair do baú
 *   > numa cor e aparecer no guarda-roupa em outra."*
 *
 * Dois consumidores reais e uma invariante escrita: é o caso que a regra nº 3 do
 * CLAUDE.md admite, não o que ela proíbe.
 *
 * A COR DA RARIDADE É A SEGUNDA LINGUAGEM DE COR DO PRODUTO
 * ---------------------------------------------------------
 * Ela vive na vitrine, nos cards e no modal do baú — **nunca em volta de um
 * avatar**, onde quem manda é a cor de PATENTE, pela `<MolduraPatente>`. As duas
 * no mesmo elemento ensinam o aluno que cor não significa nada (DESIGN.md, "The
 * Two Color Languages Rule").
 *
 * Os hexadecimais são os do `EggHatchingModal`, que já desenhava moldura de
 * raridade desde a v2 — reusar em vez de escolher de novo evita a segunda paleta
 * que diverge da primeira.
 */

/** As quatro raridades, na ordem da pirâmide. Iguais ao CHECK do banco. */
export type Raridade = "common" | "rare" | "epic" | "legendary";

export const COR_DA_RARIDADE: Record<Raridade, string> = {
  common: "#94A3B8",
  rare: "#3A55B5",
  epic: "#7A3168",
  legendary: "#C9A84C",
};

export const NOME_DA_RARIDADE: Record<Raridade, string> = {
  common: "Comum",
  rare: "Rara",
  epic: "Épica",
  legendary: "Lendária",
};

/**
 * As duas leituras tolerantes, para quem recebe `string` do servidor.
 *
 * O `<ChestOpeningModal>` recebe a raridade como `string` crua do JSON da RPC, e
 * caía em `?? COR_DA_RARIDADE.common` em três lugares. O degradar continua sendo
 * o mesmo — o que muda é que ele passou a ter um nome.
 */
export const corDaRaridade = (r: string | null | undefined): string =>
  COR_DA_RARIDADE[r as Raridade] ?? COR_DA_RARIDADE.common;

export const nomeDaRaridade = (r: string | null | undefined): string =>
  NOME_DA_RARIDADE[r as Raridade] ?? NOME_DA_RARIDADE.common;
