/**
 * LINHAS-PIADA VETADAS.
 *
 * A base do Lichess é de NOMENCLATURA, não de lances aprovados: ela nomeia
 * tudo o que aparece em partidas, inclusive o que ninguém deveria jogar. Se o
 * livro entrar cru, `2.g4` do Mate do Louco vira "Livro" e sai da conta da
 * precisão — o oposto do que a revisão existe para ensinar.
 *
 * A PRIMEIRA TRAVA JÁ É O MOTOR: livro nunca vence Erro Grave, e o Stockfish
 * avalia toda posição. O que sobra são as piadas de nível *erro* — perder tempo
 * ou um cavalo por um peão não passa de 0,20 de probabilidade de vitória, então
 * o filtro de blunder deixa passar. É só para essas que esta lista existe.
 *
 * COMO O VETO FUNCIONA, e por que ele é cirúrgico: o gerador simplesmente não
 * percorre estas linhas. Como a indexação é por ARESTA, uma aresta que outra
 * linha legítima também produz sobrevive sozinha. Vetar o Mate do Louco
 * (`1. f3 e5 2. g4 Qh4#`) tira `g2g4` depois de `1.f3 e5` e não encosta em
 * `1.f3`, que é a Barnes Opening de verdade e aparece em cinco outras linhas.
 *
 * O nome tem de bater EXATO com a coluna `name` do TSV. Se o upstream renomear
 * uma delas, `npm run verify:aberturas` reprova por veto órfão em vez de
 * silenciosamente voltar a emitir a linha.
 */
export const LINHAS_VETADAS: { nome: string; motivo: string }[] = [
  {
    nome: "Barnes Opening: Fool's Mate",
    motivo: "2.g4 permite mate em 1; a linha só existe para nomear o mate",
  },
  {
    nome: "Bongcloud Attack",
    motivo: "2.Ke2 tranca o próprio bispo e a torre; piada, não teoria",
  },
  {
    nome: "Barnes Opening: Hammerschlag",
    motivo: "2.Kf2 é o mesmo passeio de rei do Bongcloud, um lance antes",
  },
  {
    nome: "Fried Fox Defense",
    motivo: "2...Kf7 leva o rei para o meio do tabuleiro sem compensação",
  },
  {
    nome: "Irish Gambit",
    motivo: "3.Nxe5 dá um cavalo por um peão — nível erro, não erro grave",
  },
  {
    nome: "Zaire Defense",
    motivo: "recua o cavalo duas vezes à casa de origem; só perde tempo",
  },
];
