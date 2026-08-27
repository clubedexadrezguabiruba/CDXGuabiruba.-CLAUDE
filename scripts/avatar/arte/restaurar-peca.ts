/**
 * A QUARTA SAÍDA DA ROTA, generalizada — restaurar, não desenhar.
 *
 * Substitui `restaurar-barba5.ts`, que reconhecia a peça pela COR e por isso
 * precisava saber de antemão que o gerador tinha pintado de verde. Ele pintou de
 * castanho na rodada seguinte, e a lição é que **a cor do gerador não é previsível**
 * — mas a estrutura é: a peça é UMA MANCHA GRANDE E CONEXA, e tudo o mais que
 * difere da base é ruído de reencode ou sombra projetada.
 *
 * Faz duas coisas, e só duas, as duas descritíveis em régua:
 *
 *  1. COR — o matiz da peça vai para 180° (o ciano instrumental), preservando
 *     saturação e luminância. Nenhum pixel muda de lugar, nenhuma forma muda. O
 *     preto do contorno continua preto: com max = min, a fórmula é identidade.
 *  2. RESTAURAR — fora da peça, o pixel volta a ser o da base. Isso apaga a sombra
 *     que o gerador projeta na túnica e o ruído de reencode, e é o gesto que o G20
 *     aprovou: restaurar o que a base já tem não é desenhar.
 *
 * O QUE NÃO SE TOCA: a silhueta. Se o gerador desenhou a forma errada, isso é caso
 * de gerador ou de achado — nunca de programa.
 *
 * A FRANJA é o risco conhecido (a primeira tentativa do G20 errou nisso): a máscara
 * é DILATADA antes de restaurar, para o antialias da borda sobreviver.
 *
 *
 * ⚠️ O QUE ELE NÃO SEPARA, e está medido: SOMBRA CONTÍGUA À PEÇA.
 *
 * A sombra que o gerador projeta na túnica encosta na barba, então cai no mesmo
 * componente conexo e sobrevive à restauração. Foi o caso da `barba-cheia`: a
 * versão dela no repositório saiu de uma variante anterior deste script, que
 * reconhecia a peça pela COR (o ciano instrumental) e por isso descartava a sombra.
 * Ele NÃO reproduz aquela arte — a `barba-cavanhaque`, sim, byte a byte.
 *
 * Trocar o critério para MATIZ foi tentado e é pior, também medido: aprova no
 * Gate −1 mas apaga parte da peça (a `cheia` cai de 38 505 px para 16 022).
 * Fica como achado, não como conserto.
 *
 * ⚠️ ELE RODA **ANTES** DO GATE −1, e é o contrário das rotas de cabelo e de traje.
 *
 * O Gate −1 reconhece a peça pelo **ciano** (passo 2 da ordem em três tempos,
 * `gate-menos-um.ts`), e quem cria o ciano é este programa. Na arte crua a máscara
 * sai parcial e o que sobra é contado como boneco redesenhado: medido na `rala` em
 * 2026-08-20, 84,3% da peça reconhecida, 660 px não explicados e 27 ladrilhos de
 * forma em "rosto" — **REPROVADA**. A mesma arte depois daqui: 100,0% da peça,
 * 0 px não explicados, APROVADA. A reprovação engana porque sai com a mensagem de
 * gerador que redesenhou o boneco. Ver doc 19 §13.
 *
 * Uso: npx tsx scripts/avatar/arte/restaurar-peca.ts <entrada.png> <saida.png> [franja_u]
 */
import sharp from "sharp";
import { PNG_BASE, FUNDO, ESCALA } from "./base";
import { marcar, mascaraDaLinha } from "./linha-instrumental";

/** O bege do fundo da base, em canais — `FUNDO` é o hex que o `sharp` recebe. */
const FUNDO_RGB = [
  parseInt(FUNDO.slice(1, 3), 16),
  parseInt(FUNDO.slice(3, 5), 16),
  parseInt(FUNDO.slice(5, 7), 16),
];
import { mapaDeRegioes, REGIOES } from "./gate-menos-um";

const ent = process.argv[2], sai = process.argv[3];
const FRANJA_U = Number(process.argv[4] ?? 3);
const NIVEL = 24;              // o mesmo do Gate −1
const PISO_SOLTA = 0.05;       // componente < 5% da maior é ruído, não peça

/**
 * QUANTO DE UM COMPONENTE PRECISA ESTAR ONDE PEÇA PODE EXISTIR: **metade**.
 *
 * O piso de tamanho sozinho deixou passar o defeito de 2026-08-22: a v3 do `chanel`
 * veio com o **rodapé do boneco redesenhado** — 11 832 px em u y 599→653, um pedaço
 * solto lá embaixo, longe de qualquer cabelo (a peça acaba em u y 385). Ele tem
 * **9,9% da maior**, passou pelos 5%, foi tratado como peça e sobreviveu à
 * restauração. O Gate −1 então reprovou por forma no corpo, que é o certo — mas a
 * limpeza é trabalho DAQUI, e este programa existe justamente para apagar o que o
 * gerador mexeu fora da peça.
 *
 * A régua que separa é a região: o componente do cabelo mede **97,7%** em
 * `permitida`; o do rodapé, **0,75%**. Metade fica no meio de um vão enorme, e vão
 * grande é o que faz um limiar ser honesto em vez de arbitrário.
 *
 * ⚠️ **O maior componente NUNCA é julgado por aqui** — ele é a peça por definição, e
 * peça pode cobrir o tronco (decisão do Doug de 2026-08-22 sobre a barba). A régua
 * vale só para os SOLTOS, e a limitação declarada é esta: um fragmento genuíno da
 * peça que caia inteiro sobre a roupa, sem encostar no resto dela, volta a ser base.
 * O erro é para o lado seguro — é exatamente a forma do defeito que o Gate −1 pega —,
 * e o conserto, quando acontecer, é a artista prender o fragmento ao resto.
 */
const PISO_PERMITIDA = 0.5;

/**
 * A LINHA INSTRUMENTAL — o azul que o gerador usa para dizer *"esta linha é minha"*.
 *
 * ---------------------------------------------------------------------------
 * A CAUSA, nas palavras do Doug (2026-08-22)
 * ---------------------------------------------------------------------------
 *
 * *"a linha do contorno do cabelo é igual ao contorno do boneco e, quando a linha do
 * contorno do cabelo se conflita com o do avatar, a esteira erra."*
 *
 * O passo 1 da esteira é *peça = o que difere da base*, e **preto sobre preto difere
 * ~0**. Um mecanismo, dois sintomas já pagos: o furo do maxilar da `trancada` v10 (o
 * fio some da máscara e vira buraco) e a mancha no ombro do `chanel` (a esteira não
 * decide de quem é a linha e a figurinha fecha torto).
 *
 * O conserto é do lado do DESENHO: o gerador entrega as linhas da peça em azul, e
 * então elas diferem da base **inclusive por cima do traço preto**.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELA VIRA `#000030` AQUI, E NÃO FICA COMO CHEGOU
 * ---------------------------------------------------------------------------
 *
 * Duas exigências que brigam, e o canônico é o ponto em que as duas cabem:
 *
 *  - **a máscara** precisa que a linha DIFIRA do preto da base por mais que `NIVEL`
 *    (24 por canal). Azul escuro demais não passa: o Gemini entregou p50 de 47 no
 *    canal azul, e com o antialias a diferença média caiu a 23,2 — meio pixel abaixo
 *    do limiar, e metade da linha se perdeu;
 *  - **o tom** precisa que a linha seja ESCURA. O claro-escuro do render é a
 *    luminância desta arte, então uma linha clara sai clara no boneco. E o passo 3
 *    daqui (matiz → 180°) faz exatamente isso com azul: `#000080` viraria `#008080`,
 *    de luminância 37, e um `#0000FF` viraria ciano puro de luminância **200** — o
 *    contorno da peça sairia BRILHANTE no avatar da criança.
 *
 * A saída é **cinza da própria luminância, com 48 de azul por cima**: `(L, L, L+48)`.
 * Ela guarda as duas exigências e não paga por nenhuma — o canal azul fica a 48 do
 * preto da base (o dobro do limiar, com folga para o antialias) e a luminância sobe
 * só 3,5 níveis, que é o peso do azul na fórmula.
 *
 * ⚠️ **A primeira versão desta linha era um `#000030` CHAPADO, e ela reprovou a olho
 * em 2026-08-22.** Medida depois: 52,0% da peça caiu num balde de tom só, e 68,1%
 * dela abaixo de luminância 16 (contra 48,3% e 56,3% na arte de linha preta). Marcar
 * a linha é dizer *"esta linha é da peça"* — não é dizer *"esta linha é toda igual"*.
 * A variação que a artista pintou dentro do traço é claro-escuro, e claro-escuro é o
 * produto inteiro desta família.
 *
 * Ela é escrita ANTES do passo 3 e fica de fora dele: a linha instrumental não é cor
 * de peça, é marcação.
 *
 * A janela de reconhecimento é generosa de propósito — o gerador não acerta hex. O
 * que ela exige é o que separa a marcação de tudo o mais na imagem: **azul dominante
 * e escuro**. Nada na base de edição mora aqui (ela é monocromática entre 26,9° e
 * 43,2° de matiz, mais preto e branco — ver `cor-proibida.ts`).
 */
/**
 * O ANTIALIAS DA LINHA TAMBEM E LINHA - o teto de luminancia deixava a borda escapar.
 *
 * `ehLinhaInstrumental` exige luminancia < 60, e o motivo esta no docstring acima: a
 * janela precisa ser "azul dominante **e escuro**" para que cabelo pintado de azul nao
 * seja confundido com marcacao. Mas a linha nao termina em degrau - ela some num
 * antialias que mistura o `#000080` com o que estiver do outro lado. Onde esse outro
 * lado e claro (o fundo, a pele), o pixel do meio fica azul E claro: **passa do teto,
 * escapa da marcacao, e cai no passo 3**. Matiz -> 180 manda azul para ciano puro, e
 * ele sai com luminancia alta - o defeito que o Doug pegou a olho em 2026-08-22,
 * *"vazou um pouco de azul do topo direito da cabeca, exterior"*.
 *
 * Medido no `coque`: **1 393 px** escaparam, o maior trecho com 215 px em x 560->758 .
 * y 109->276, saindo com luminancia **186** - ciano brilhante por fora do cabelo.
 *
 * O conserto nao mexe no teto, que existe por um motivo valido: ele **cresce a partir
 * do nucleo ja reconhecido**, e so atravessa pixel azul-dominante. Um cabelo pintado
 * de azul continua protegido pelo teto, porque a semente do crescimento e sempre um
 * pixel escuro - e 2 px e a largura do antialias, nao um raio livre.
 */
// `HALO_LINHA` mora em `linha-instrumental.ts` desde 2026-08-24, junto com o
// predicado e o crescimento que a usam. O docstring acima explica o porquê dela.

/**
 * O GERADOR APAGOU O SOMBREADO DO BONECO - e apagamento nao e peca.
 *
 * ---------------------------------------------------------------------------
 * A CAUSA, medida em 2026-08-22 no `coque`
 * ---------------------------------------------------------------------------
 *
 * O Doug reprovou dizendo *"a sombra natural da lateral direita do rosto ficou pintada
 * de azul"*, e ele estava literalmente certo. A base tem sombreado proprio na lateral
 * do rosto - a luminancia dela varia de 102 a 186 em x 560->730 . y 300->470. O
 * gerador pintou pele LISA por cima:
 *
 *     x=710 y=340    base 200,152,112  ->  crua 229,167,118      dif 29
 *
 * Diferenca 29 > `NIVEL`, entao a esteira chamou aquilo de peca, o passo 3 levou o
 * matiz a 180 e o apagamento saiu **118,229,229** - ciano brilhante no rosto. Foram
 * 4 063 px num bloco so, em x 668->730 . y 292->479.
 *
 * ---------------------------------------------------------------------------
 * POR QUE A REGUA E "CLAREOU", E POR QUE ELA E SEGURA
 * ---------------------------------------------------------------------------
 *
 * Tinta de peca **escurece** o que esta embaixo: o cabelo e escuro e cobre. Apagar
 * sombreado **clareia** - o gerador troca um tom da base por outro tom, mais claro, da
 * mesma base. As duas coisas apontam para lados opostos da luminancia, e e isso que
 * separa sem depender de matiz (tentado e descartado: crista de cabelo castanho tem a
 * MESMA cromaticidade da pele, entao nenhuma regua de cor as separa).
 *
 * Tres amarras seguram o alcance:
 *
 *  - **so onde a base e clara** (lum >= 100). O traco preto do boneco fica de fora, e
 *    com ele o caso "cabelo claro por cima do contorno", que e grande e legitimo;
 *  - **so clareamento** - escurecer e tinta, sombra projetada ou blush, e cada um
 *    desses tem o seu proprio tratamento;
 *  - **so diferenca pequena** (<= `CLAREOU_TETO`). Trocar tom da base por tom da base
 *    e um degrau curto: as amostras medidas ficaram entre 26 e 33. Peca de verdade que
 *    seja mais clara que a base salta muito mais que isso.
 *
 * (!) **O que ela NAO cobre, declarado:** peca genuinamente clara pintada por cima do
 * sombreado da base, com salto menor que o teto, volta a ser base. Nenhuma arte do
 * repositorio tem isso - o controle no `chanel` aprovado esta no ESTADO-DA-ROTA -, e o
 * erro e para o lado seguro: some um veu, nunca some contorno.
 */
const CLAREOU_TETO = 40;

/**
 * O GERADOR APAGOU O BONECO ATE O FUNDO - a outra cara do apagamento.
 *
 * `clareouABase` cobre o caso da PELE: trocar um tom da base por outro tom, mais
 * claro, da mesma base. Ela exige `luz(B) >= 100` de proposito, para que o traco
 * preto do boneco fique de fora - cabelo claro por cima do contorno e legitimo e
 * grande.
 *
 * Mas em 2026-08-22 o `coque` mostrou a mesma doenca no traco: o gerador **apagou
 * 146 px do contorno preto** no alto da cabeca (x 702->741 . y 168->219) e pintou o
 * FUNDO por cima. Diferenca de 255 contra o preto da base, entao virou peca, e o
 * passo 3 devolveu um aro ciano quase branco. Na arte ele e quase invisivel (delta 24
 * contra o fundo); no tracado vira **10 px de teal cheio**, porque a silhueta e
 * binaria - foi o pior dos tres defeitos que o Doug apontou.
 *
 * A regua e exata e nao tem zona cinzenta: **a arte pintou a cor do FUNDO onde a base
 * nao era fundo**. Nenhuma peca e da cor do fundo - uma peca assim seria invisivel -,
 * entao isto so pode ser apagamento.
 */
const APAGOU_ATE_O_FUNDO = true;

/**
 * A COBERTURA - quanto DESTE pixel e peca, e quanto ainda e base.
 *
 * ---------------------------------------------------------------------------
 * A CAUSA: a silhueta e BINARIA, e o antialias da arte nao e
 * ---------------------------------------------------------------------------
 *
 * A familia tonal desenha DUAS formas com o mesmo `d`, e `d` sai do potrace sobre a
 * mascara "difere da base". Nao existe alpha: ou o pixel esta dentro da silhueta e
 * recebe `var(--av-cabelo)` inteiro, ou esta fora. Entao um pixel de borda que e 30%
 * cabelo e 70% pele entra na peca **como se fosse 100% cabelo**.
 *
 * Medido no `coque` em 2026-08-22, pela leitura da folha:
 *
 *     arte (714,180)  248,255,255   ->  tracado  35,138,139
 *     arte (730,360)  169,219,219   ->  tracado  30,122,123
 *
 * Quase branco virando teal cheio. Era um artefato so, e ele aparecia em tres lugares
 * diferentes - a mecha lateral esquerda, o alto da cabeca e a lateral do rosto -, que
 * o Doug reportou como tres defeitos. A franja corre a linha do cabelo inteira; nos
 * tres pontos citados ela tem 6 a 10 px, na testa tem 1 a 2, e por isso o olho so
 * pegou os tres.
 *
 * ---------------------------------------------------------------------------
 * A REGUA: metade, e ela nao usa limiar absoluto nenhum
 * ---------------------------------------------------------------------------
 *
 * Um pixel de borda e uma mistura: `A = a*C + (1-a)*B`, com `C` a cor da peca ali e
 * `B` a base. Estimamos `C` pelo vizinho mais coberto num raio curto (aquele com a
 * maior distancia a base, cujo `a` e ~1) e projetamos:
 *
 *     a = (A - B) . (C - B) / |C - B|^2
 *
 * Fica na peca quem tem `a >= 1/2` - quem e mais peca que base. Nao ha numero
 * arbitrario: metade e a definicao de "predominantemente".
 *
 * (!) **O que ela custa, declarado:** toda peca encolhe da ordem de 1 px na borda, e
 * o `chanel` promovido, se passasse por aqui de novo, sairia diferente - ele esta
 * congelado no `.png` do repositorio e nenhum gate o refaz, entao nao ha risco
 * mecanico, mas o elenco fica com uma peca da regra velha. O numero do impacto no
 * chanel esta no ESTADO-DA-ROTA.
 */
/**
 * (!) A COBERTURA SO VALE NA BORDA - e o miolo ensinou isso caro.
 *
 * A primeira versao testava TODO pixel da peca, e a figurinha (passo 2c do laudo)
 * saltou de 186 para **6 229 px de furo**. A causa e a propria familia tonal: dentro
 * da peca a luz varia muito, entao a crista clara de um fio, projetada contra o
 * vizinho mais escuro, sai com `a < 1/2` e era reprovada - sendo 100% peca.
 *
 * O modelo da mistura so descreve a BORDA: e la que o pixel e parte peca e parte base.
 * No miolo nao ha base nenhuma embaixo, e a conta perde o sentido. Entao a regua so
 * olha os pixels a ate `ANEIS_DE_BORDA` da parte de fora, medidos na mascara ORIGINAL
 * - nao iterativamente, senao a erosao anda para dentro sem fim.
 */
const ANEIS_DE_BORDA = 3;
const RAIO_LOCAL = 3;
const PISO_COBERTURA = 0.5;

const AZUL_DA_MARCA = 0x30;

const cru = (p: string) => sharp(p).flatten({ background: FUNDO }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { data: A, info } = await cru(ent);
const { data: B } = await cru(PNG_BASE);
const W = info.width, H = info.height, n = W * H;

const luz = (d: Uint8Array | Buffer, i: number) => 0.2126*d[i*3] + 0.7152*d[i*3+1] + 0.0722*d[i*3+2];

/** O gerador trocou um tom da base por outro tom, mais claro? Ver `CLAREOU_TETO`. */
const clareouABase = (i: number, d: number): boolean =>
  d <= CLAREOU_TETO && luz(B, i) >= 100 && luz(A, i) > luz(B, i);

/** A arte pintou a cor do FUNDO onde a base nao era fundo? Ver `APAGOU_ATE_O_FUNDO`. */
const fundo = [FUNDO_RGB[0], FUNDO_RGB[1], FUNDO_RGB[2]];
const longeDo = (d: Uint8Array | Buffer, i: number, c: number[]) =>
  Math.max(Math.abs(d[i*3]-c[0]), Math.abs(d[i*3+1]-c[1]), Math.abs(d[i*3+2]-c[2]));
const apagouAteOFundo = (i: number): boolean =>
  APAGOU_ATE_O_FUNDO && longeDo(A, i, fundo) <= NIVEL && longeDo(B, i, fundo) > NIVEL;

/**
 * QUEM SAI DA PECA TEM DE VOLTAR A SER BASE - e nao basta sair.
 *
 * As tres reguas abaixo (`clareouABase`, `apagouAteOFundo`, `PISO_COBERTURA`) tiram
 * pixel da peca. Se ele so sair, a franja do passo 4 o preserva com a cor que o
 * GERADOR pintou - e o resultado e o pior dos dois mundos: nao e peca, e tambem nao e
 * o boneco.
 *
 * Foi medido em 2026-08-22: `arte:traco` reprovou o `coque` com 87 px em 22 ilhas, a
 * maior em u x 413->420 . y 68->76 - exatamente onde o gerador apagou o contorno. Como
 * os pixels tinham saido da peca, deixaram de contar como "coberto pela peca" e
 * passaram a contar como traco apagado, corretamente. Enquanto eles eram peca o gate
 * passava, porque peca pode cobrir o boneco.
 *
 * Entao a conclusao das tres reguas e a mesma frase: **a base volta**.
 */
const voltaABase = new Uint8Array(n);

// --- 1. o que difere da base (menos o que o gerador APAGOU) ---
const dif = new Uint8Array(n);
let apagou = 0, aoFundo = 0;
for (let i = 0; i < n; i++) {
  const d = Math.max(Math.abs(A[i*3]-B[i*3]), Math.abs(A[i*3+1]-B[i*3+1]), Math.abs(A[i*3+2]-B[i*3+2]));
  if (d <= NIVEL) continue;
  if (clareouABase(i, d)) { apagou++; voltaABase[i] = 1; continue; }
  if (apagouAteOFundo(i)) { aoFundo++; voltaABase[i] = 1; continue; }
  dif[i] = 1;
}

// --- 1b. a COBERTURA: quem e mais base que peca sai da silhueta (ver `PISO_COBERTURA`) ---
let rasos = 0;
const raso = new Uint8Array(n);
{
  const forte = new Float64Array(n);          // |A - B|^2, a "cobertura bruta" de cada pixel
  for (let i = 0; i < n; i++) {
    if (!dif[i]) continue;
    let t = 0;
    for (let c = 0; c < 3; c++) { const v = A[i*3+c] - B[i*3+c]; t += v*v; }
    forte[i] = t;
  }
  // a que distancia da parte de FORA cada pixel esta, medido na mascara original
  const anel = new Int32Array(n).fill(-1);
  {
    let atual = Uint8Array.from(dif);
    for (let k = 0; k < ANEIS_DE_BORDA; k++) {
      const prox = new Uint8Array(n);
      for (let y = 1; y < H-1; y++) for (let x = 1; x < W-1; x++) {
        const i = y*W + x;
        if (!atual[i]) continue;
        if (!atual[i-1] || !atual[i+1] || !atual[i-W] || !atual[i+W]) { if (anel[i] < 0) anel[i] = k; }
        else prox[i] = 1;
      }
      atual = prox;
    }
  }

  const sai = new Uint8Array(n);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y*W + x;
    if (!dif[i] || anel[i] < 0) continue;      // miolo nao se julga: ver `ANEIS_DE_BORDA`
    // C = o vizinho MAIS coberto num raio curto; o `a` dele e ~1, entao A[j] ~ C
    let melhor = i, forteMax = forte[i];
    for (let dy = -RAIO_LOCAL; dy <= RAIO_LOCAL; dy++) for (let dx = -RAIO_LOCAL; dx <= RAIO_LOCAL; dx++) {
      const nx = x+dx, ny = y+dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const j = ny*W + nx;
      if (dif[j] && forte[j] > forteMax) { forteMax = forte[j]; melhor = j; }
    }
    if (melhor === i) continue;               // ele proprio e o mais coberto: fica
    let num = 0, den = 0;
    for (let c = 0; c < 3; c++) {
      const ab = A[i*3+c] - B[i*3+c];
      const cb = A[melhor*3+c] - B[i*3+c];
      num += ab*cb; den += cb*cb;
    }
    if (den > 0 && num/den < PISO_COBERTURA) { sai[i] = 1; rasos++; }
  }
  for (let i = 0; i < n; i++) if (sai[i]) { dif[i] = 0; raso[i] = 1; voltaABase[i] = 1; }
}

// --- 2. a peça é a mancha grande e conexa (mesmo critério do extrair.ts) ---
const rotulo = new Int32Array(n).fill(-1);
const tam: number[] = [];
for (let i = 0; i < n; i++) {
  if (rotulo[i] >= 0 || !dif[i]) continue;
  const r = tam.length; let t = 0;
  const fila = [i]; rotulo[i] = r;
  while (fila.length) {
    const p = fila.pop()!; t++;
    const x = p % W, y = (p / W) | 0;
    for (const q of [x>0?p-1:-1, x<W-1?p+1:-1, y>0?p-W:-1, y<H-1?p+W:-1])
      if (q >= 0 && rotulo[q] < 0 && dif[q]) { rotulo[q] = r; fila.push(q); }
  }
  tam.push(t);
}
const maior = Math.max(...tam);
const oMaior = tam.indexOf(maior);

// QUANTO DE CADA COMPONENTE CAI ONDE PEÇA PODE EXISTIR — ver `PISO_PERMITIDA`.
const mapa = mapaDeRegioes(W, H);
const PERMITIDA = REGIOES.indexOf("permitida");
const naPermitida = new Array(tam.length).fill(0);
for (let i = 0; i < n; i++)
  if (rotulo[i] >= 0 && mapa[i] === PERMITIDA) naPermitida[rotulo[i]]++;

/** O componente é peça? O maior sempre é; os soltos precisam das duas provas. */
const ehPeca = (r: number): boolean =>
  r === oMaior || (tam[r] >= maior * PISO_SOLTA && naPermitida[r] / tam[r] >= PISO_PERMITIDA);

const peca = new Uint8Array(n);
let daPeca = 0, ruido = 0, forasteiro = 0;
for (let i = 0; i < n; i++) {
  if (rotulo[i] < 0) continue;
  if (ehPeca(rotulo[i])) { peca[i] = 1; daPeca++; }
  else if (tam[rotulo[i]] >= maior * PISO_SOLTA) forasteiro++;
  else ruido++;
}
const quantos = tam.filter((_, r) => ehPeca(r)).length;

/** Os soltos grandes que a REGIÃO reprovou — o gerador mexendo no boneco. */
const rejeitados = tam
  .map((t, r) => ({ r, t, frac: naPermitida[r] / t }))
  .filter(({ r, t }) => r !== oMaior && t >= maior * PISO_SOLTA && !ehPeca(r));

// --- 2b. a LINHA: o núcleo escuro, mais o antialias azul colado nele ---
//
// ⚠️ O predicado, o halo e a conversão SAÍRAM DAQUI em 2026-08-24 e viraram
// `linha-instrumental.ts`. O chapéu precisa exatamente do mesmo teste — o defeito
// que o azul conserta é o mesmo nos dois slots, e a fronteira do chapéu corre por
// cima da fronteira da cabeça por construção. Copiar o teste seria a segunda cópia
// que diverge da primeira. Ver o docstring de lá.
//
// Provado sem respingo: a `cachos-anjo` sai byte a byte igual antes e depois.
const { linha, nucleo, halo } = mascaraDaLinha(A, W, H, (i) => peca[i] === 1);

// --- 3. matiz 180°, só na peça (e a linha instrumental fica de fora) ---
let recolorido = 0, instrumental = 0;
for (let i = 0; i < n; i++) {
  if (!peca[i]) continue;
  const r = A[i*3], g = A[i*3+1], b = A[i*3+2];
  // A LINHA DA PEÇA ANTES DO MATIZ, senão o passo abaixo a acende — ver o docstring
  // de `LINHA_CANONICA`. Ela sai daqui preta para o olho e para o tom, e ainda a 48
  // níveis do preto da base para a máscara.
  if (linha[i]) {
    const [mr, mg, mb] = marcar(r, g, b);
    A[i*3] = mr; A[i*3+1] = mg; A[i*3+2] = mb;
    instrumental++;
    continue;
  }
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) continue;                 // cinza e preto ficam como estão
  A[i*3] = min; A[i*3+1] = max; A[i*3+2] = max;
  recolorido++;
}

// --- 4. dilatar e restaurar ---
const folga = Math.round(FRANJA_U * ESCALA);
const dil = new Uint8Array(peca);
for (let p = 0; p < folga; p++) {
  const ant = new Uint8Array(dil);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y*W + x;
    if (ant[i]) continue;
    if ((x>0 && ant[i-1]) || (x<W-1 && ant[i+1]) || (y>0 && ant[i-W]) || (y<H-1 && ant[i+W])) dil[i] = 1;
  }
}
/**
 * A FRANJA NAO PROTEGE QUEM A COBERTURA REPROVOU.
 *
 * `dil` existe para o antialias da peca sobreviver a restauracao, e por isso ele
 * guarda 4 px alem da peca. Sem esta linha ele guardaria tambem o que as tres reguas
 * de `voltaABase` acabaram de tirar - e como `barba-para-formas` re-deriva a peca do
 * PNG com o mesmo `> NIVEL`, os pixels voltariam pela porta dos fundos. Medido no
 * `coque` em 2026-08-22: `restaurar-peca` dizia 93 223 px e o laudo relia 101 590.
 */
for (let i = 0; i < n; i++) if (voltaABase[i]) dil[i] = 0;

let restaurados = 0; const tons = new Set<string>();
for (let i = 0; i < n; i++) {
  if (dil[i]) continue;
  const d = Math.max(Math.abs(A[i*3]-B[i*3]), Math.abs(A[i*3+1]-B[i*3+1]), Math.abs(A[i*3+2]-B[i*3+2]));
  if (d === 0) continue;
  if (d > 8) restaurados++;
  A[i*3] = B[i*3]; A[i*3+1] = B[i*3+1]; A[i*3+2] = B[i*3+2];
  tons.add(`${A[i*3]},${A[i*3+1]},${A[i*3+2]}`);
}
await sharp(A, { raw: { width: W, height: H, channels: 3 } }).png().toFile(sai);
console.log(`peça:        ${daPeca} px em ${quantos} componente(s) · maior ${maior} px`);
console.log(`ruído:       ${ruido} px descartado (< ${(PISO_SOLTA*100).toFixed(0)}% da maior)`);
for (const { t, frac } of rejeitados)
  console.log(
    `forasteiro:  ${t} px descartado — só ${(frac * 100).toFixed(1)}% dele cai onde peça pode existir
` +
      `             (grande o bastante para o piso de tamanho; é o gerador mexendo no BONECO)`,
  );
if (forasteiro) console.log(`             total de forasteiro: ${forasteiro} px, restaurados à base`);
console.log(`recolorido:  ${recolorido} px → matiz 180°`);
console.log(
  `linha instr.: ${instrumental} px → (L, L, L+${AZUL_DA_MARCA}), luminância preservada` +
    (instrumental ? `  (${nucleo} núcleo + ${halo} antialias)` : "   ← ZERO: a arte veio com as linhas da peça em PRETO"),
);
console.log(`apagamento:  ${apagou} px que o gerador CLAREOU na base — nunca foram peça`);
console.log(`             ${aoFundo} px que ele apagou ATÉ O FUNDO por cima do boneco`);
console.log(`cobertura:   ${rasos} px nos ${ANEIS_DE_BORDA} anéis de borda com menos de ${(PISO_COBERTURA*100).toFixed(0)}% de peça — fora da silhueta`);
console.log(`restaurado:  ${restaurados} px (${tons.size} tons da base) · franja ${FRANJA_U} u = ${folga} px`);
console.log(`saída:       ${sai}`);
