/**
 * A LINHA INSTRUMENTAL — o azul com que o gerador diz *"esta linha é minha"*.
 *
 * ---------------------------------------------------------------------------
 * A CAUSA, e ela é a mesma nos dois slots
 * ---------------------------------------------------------------------------
 *
 * O passo 1 de toda esteira de peça é *peça = o que difere da base*, e **preto
 * sobre preto difere ~0**. Onde o contorno da peça cai por cima do contorno do
 * boneco, a diferença some e a linha é **comida**.
 *
 * O Doug nomeou o defeito duas vezes, com um slot de distância:
 *
 *  - **cabelo, 2026-08-22:** *"a linha do contorno do cabelo é igual ao contorno do
 *    boneco e, quando a linha do contorno do cabelo se conflita com o do avatar, a
 *    esteira erra."* Dois sintomas pagos: o furo do maxilar da `trancada` v10 e a
 *    mancha no ombro do `chanel`;
 *  - **chapéu, 2026-08-24:** *"a borda da arte se misturou com a borda da cabeça e a
 *    esteira se confundiu e eliminou a borda."* Mesmo mecanismo, primeira peça do
 *    slot — e era previsível: o chapéu **senta** na cabeça, então a fronteira dele
 *    corre por cima da fronteira dela por construção.
 *
 * O conserto é do lado do DESENHO: o gerador entrega as linhas da peça em azul, e
 * então elas diferem da base **inclusive por cima do traço preto**.
 *
 * ---------------------------------------------------------------------------
 * ESTE MÓDULO EXISTE PARA HAVER **UMA** DEFINIÇÃO
 * ---------------------------------------------------------------------------
 *
 * O predicado, o halo e a conversão moravam dentro de `restaurar-peca.ts`, que é um
 * script de linha de comando da esteira do CABELO. O chapéu precisa exatamente do
 * mesmo teste, e copiá-lo seria a segunda cópia que diverge da primeira no dia em
 * que uma for ajustada — o defeito que `extrair.ts` já enuncia ao exportar `ehTeal`:
 * *"exportar o teste em vez de exportar os três números é o que impede a quarta
 * cópia da mesma condição"*.
 *
 * **O que os dois slots NÃO compartilham é o destino da linha**, e por isso há duas
 * conversões aqui em vez de uma — ver `marcar` e `neutralizar`.
 */

/** O mesmo limiar do Gate −1: 24 níveis por canal. */
const NIVEL = 24;

/**
 * Quantos pixels de antialias contam como linha: **2**.
 *
 * A linha não termina em degrau — ela some num antialias que mistura o azul com o
 * que estiver do outro lado. Onde esse outro lado é claro (o fundo, a pele), o pixel
 * do meio fica azul E claro: passa do teto de luminância e escapa da marcação.
 *
 * O crescimento **parte do núcleo já reconhecido** e só atravessa pixel
 * azul-dominante, então um cabelo pintado de azul continua protegido pelo teto: a
 * semente é sempre um pixel escuro, e 2 px é a largura do antialias, não um raio
 * livre. Medido no `coque` em 2026-08-22: sem ele, **1 393 px** escapavam, o maior
 * trecho com 215 px, saindo com luminância 186 — ciano brilhante por fora do cabelo.
 */
export const HALO_LINHA = 2;

/**
 * O NÚCLEO DA LINHA: azul dominante **e escuro**.
 *
 * A janela é generosa de propósito — o gerador não acerta hex. O que ela exige é o
 * que separa a marcação de tudo o mais na imagem, e nada na base de edição mora
 * aqui: ela é monocromática entre 26,9° e 43,2° de matiz, mais preto e branco (ver
 * `cor-proibida.ts`).
 *
 * O teto de luminância (< 60) é o que impede uma peça **pintada** de azul de ser
 * lida como marcação.
 */
export const ehLinhaInstrumental = (r: number, g: number, b: number): boolean =>
  b - r >= NIVEL && b - g >= NIVEL && 0.2126 * r + 0.7152 * g + 0.0722 * b < 60;

/** O halo: azul dominante, sem exigir escuro. Só cresce a partir do núcleo. */
export const azulDominante = (r: number, g: number, b: number): boolean =>
  b - r >= NIVEL && b - g >= NIVEL;

const AZUL_DA_MARCA = 0x30;

/**
 * PARA QUEM RECOLORE (o cabelo, a barba): `(L, L, L+48)`.
 *
 * Duas exigências que brigam, e este é o ponto em que as duas cabem:
 *
 *  - **a máscara** precisa que a linha DIFIRA do preto da base por mais que `NIVEL`.
 *    Os 48 níveis no canal azul são o dobro do limiar, com folga para o antialias;
 *  - **o tom** precisa que a linha seja ESCURA, porque o claro-escuro do render é a
 *    luminância desta arte. A luminância sobe só 3,5 níveis, que é o peso do azul na
 *    fórmula.
 *
 * ⚠️ **A primeira versão disto era um `#000030` CHAPADO, e reprovou a olho em
 * 2026-08-22.** Medido depois: 52,0% da peça caiu num balde de tom só. Marcar a
 * linha é dizer *"esta linha é da peça"* — não é dizer *"esta linha é toda igual"*.
 */
export const marcar = (r: number, g: number, b: number): [number, number, number] => {
  const L = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
  return [L, L, Math.min(255, L + AZUL_DA_MARCA)];
};

/**
 * PARA QUEM TEM COR ASSADA (o chapéu, o traje, os óculos, o pet): `(L, L, L)`.
 *
 * **A diferença com `marcar` é o destino, não o método.** Na peça que recolore a
 * linha ainda tem uma etapa pela frente — a máscara de tom precisa distingui-la do
 * preto da base —, e os 48 de azul são o recado para essa etapa. Na peça de cor
 * assada **não há etapa seguinte**: o pixel que sai daqui é o pixel que a criança vê.
 * Os 48 de azul virariam um contorno azulado no avatar dela.
 *
 * O cinza é da **própria luminância**, e não um preto chapado, pela lição de cima: a
 * variação que a artista pintou dentro do traço é claro-escuro, e claro-escuro é o
 * produto inteiro desta linha de arte. Uma linha `#0000C8` pura sai `(14, 14, 14)` —
 * praticamente o `#000000` do boneco —, e o antialias dela sai em degradê.
 */
export const neutralizar = (r: number, g: number, b: number): [number, number, number] => {
  const L = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
  return [L, L, L];
};

/**
 * A MÁSCARA DA LINHA: o núcleo escuro mais o antialias azul colado nele.
 *
 * `dentro` limita o crescimento ao que já é peça — sem ele o halo passearia pela
 * base. Nos dois chamadores ele é a máscara da peça.
 */
export function mascaraDaLinha(
  data: Uint8Array | Buffer,
  w: number,
  h: number,
  dentro: (i: number) => boolean,
): { linha: Uint8Array; nucleo: number; halo: number } {
  const n = w * h;
  const linha = new Uint8Array(n);
  let nucleo = 0;
  for (let i = 0; i < n; i++)
    if (dentro(i) && ehLinhaInstrumental(data[i * 3], data[i * 3 + 1], data[i * 3 + 2])) {
      linha[i] = 1;
      nucleo++;
    }

  let halo = 0;
  for (let p = 0; p < HALO_LINHA; p++) {
    const ant = new Uint8Array(linha);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (ant[i] || !dentro(i)) continue;
        if (!azulDominante(data[i * 3], data[i * 3 + 1], data[i * 3 + 2])) continue;
        if (
          (x > 0 && ant[i - 1]) ||
          (x < w - 1 && ant[i + 1]) ||
          (y > 0 && ant[i - w]) ||
          (y < h - 1 && ant[i + w])
        ) {
          linha[i] = 1;
          halo++;
        }
      }
  }
  return { linha, nucleo, halo };
}
