/**
 * A COR DO TRAÇO — a metade da lei que ninguém media.
 *
 * `TRACO` responde por **quão grosso** (12 u), e `arte:espessura` publica os
 * percentis de largura. `LINHA` responde por **de que cor** — `#000000`, preto puro
 * (`src/lib/avatar/palette.ts`) —, e até 2026-08-21 **nenhuma régua olhava para
 * isso**. `arte:traco` mede apagamento de propósito: ele pergunta se o traço SUMIU,
 * não de que cor ele ficou.
 *
 * A lacuna não é teórica, e o defeito está no ar. Do topo de `traco-intacto.ts`,
 * diagnosticado pixel a pixel na `entrada.png` — a arte do cabelo `espetado`, em
 * produção:
 *
 *   *"ali a base tem lum 0 e a arte tem lum **70** — o gerador redesenhou o traço em
 *   cinza escuro em vez de preto, e só a borda de antialiasing (38 → 97) cruzou o
 *   limiar. Não é apagamento, é re-renderização."*
 *
 * Aquele diagnóstico foi usado para AFROUXAR o limiar de `arte:traco` (de 90 para
 * 180), porque aquela régua julga outra coisa. O cinza ficou sem dono. Esta régua é
 * o dono.
 *
 * ---------------------------------------------------------------------------
 * A JANELA: ENTRE "AINDA PRETO" E "SUMIU"
 * ---------------------------------------------------------------------------
 *
 * | luminância na arte | o que é | quem julga |
 * |---|---|---|
 * | `< LIMIAR_CINZA` (40) | preto, dentro do ruído de reencode | ninguém precisa |
 * | **40 a 180** | **repintado em CINZA** — nem preto, nem apagado | **esta régua** |
 * | `>= LUM_APAGADO` (180) | material claro: o traço SUMIU | `arte:traco` |
 *
 * O teto é o mesmo `LUM_APAGADO` do `arte:traco`, de propósito: as duas réguas
 * partem o mesmo eixo, e um teto próprio abriria vão ou sobreposição sem ninguém
 * notar.
 *
 * **O piso de 40 é MEDIDO, não herdado** (`.scratch/estilo/quao-preto-e-o-traco.ts`,
 * 2026-08-21). A primeira versão desta régua herdou o `LUM_TRACO` = 90 do
 * `arte:traco` e **o controle não se comportou** — porque o defeito real da
 * `entrada.png` está em lum **70**, que fica ABAIXO de 90 e que aquela régua ainda
 * chama de preto. Herdar o número da régua vizinha pôs a janela inteira do lado
 * errado do defeito que ela existe para pegar.
 *
 * O que a medição mostra, nos pixels de núcleo da base, fora da máscara da peça:
 *
 * | arte | p50 | p75 | p95 | p99 | **px acima de 40** |
 * |---|---|---|---|---|---|
 * | `barba-trancada` | 0 | 0 | 0 | 8 | **38** |
 * | `chanel` | 0 | 1 | 3 | 12 | **1** |
 * | `entrada-2` | 0 | 1 | 5 | 12 | **12** |
 * | **`entrada`** | 2 | **68** | **71** | 75 | **9 296** |
 *
 * 40 fica **3,3× acima** do pior p99 de arte boa (12) e bem abaixo do p75 da
 * `entrada` (68). A separação é de 300×, e não é um número escolhido para caber: é o
 * vão entre duas populações que não se tocam.
 *
 * ---------------------------------------------------------------------------
 * O LADO DA BASE É O **NÚCLEO**, E ISSO TAMBÉM É MEDIDO
 * ---------------------------------------------------------------------------
 *
 * Só contam os pixels em que a base é preto de núcleo — `lum < 20`, e não o
 * `LUM_TRACO` = 90 que o `arte:traco` usa. A razão é que **a franja da base é um
 * gradiente por construção**, e uma arte que re-renderiza o mesmo traço cai em outro
 * ponto do mesmo gradiente sem que nada esteja errado. Só no núcleo a base
 * *compromete* `#000000`, e só ali a lei tem o que cobrar.
 *
 * Medido com o critério frouxo (base `lum < 90`), a arte boa sobe de 38 para **999
 * px** acima de 40 e a separação cai de 300× para 10× — a régua passaria a medir
 * antialias, que é exatamente o modo de falha que `coroa.ts` já pagou uma vez.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELA MEDE O TRAÇO DO BONECO, E NÃO A BORDA DA PEÇA
 * ---------------------------------------------------------------------------
 *
 * Porque hoje só o do boneco tem **referência**: a base oficial diz, pixel a pixel,
 * onde o preto deveria estar e de que cor. A borda que a PEÇA traz de fora não tem
 * contra o que ser comparada — e é essa a lacuna que `compositor.ts` nomeia:
 *
 *   *"O traço de uma peça de `arte` fica sem rede, e por isso ele é medido. […]
 *   Chapéu, óculos e pet **não têm silhueta do compositor por baixo**."*
 *
 * Onde a peça é desenhada POR CIMA do contorno do boneco — que é a maior parte de
 * toda arte desta rota, porque a rota inteira consiste em desenhar sobre um render
 * do boneco —, as duas bordas são a mesma borda, e medir uma é medir a outra. É por
 * isso que esta régua já vale para o que existe hoje. No dia em que chegar a
 * primeira arte de **chapéu** ou de **pet**, ela cobre o trecho que encosta no
 * boneco, e a §3 do doc 23 diz o resto.
 *
 * ---------------------------------------------------------------------------
 * O QUE DECIDE É A CORRIDA, NÃO O PIXEL — a mesma lição do `arte:traco`
 * ---------------------------------------------------------------------------
 *
 * Todo rasterizador mistura tinta na fronteira, e todo reencode mexe num pixel aqui
 * e outro ali. Um pixel cinza é antialias; **cinquenta pixels cinza em fila são um
 * trecho de traço redesenhado**. Então o veredito sai do MAIOR COMPONENTE CONEXO,
 * com o mesmo piso do `arte:traco`: `PISO_COMPONENTE` = `TRACO` × `ESCALA` ÷ 2.
 *
 * E, como lá, **o que a peça cobre sai do julgamento**: onde a arte pintou por cima
 * do contorno, o preto que se vê é o da peça, não o do boneco. A máscara da peça é o
 * maior componente conexo das diferenças, dilatado — a mesma definição, importada de
 * `traco-intacto.ts` em vez de reescrita, porque duas réguas que discordassem sobre
 * onde a peça está concordariam ou discordariam por acidente.
 *
 * ---------------------------------------------------------------------------
 * O CONTROLE, E ELE É FIEL AO DEFEITO REAL
 * ---------------------------------------------------------------------------
 *
 * Uma arte APROVADA com uma faixa do queixo **repintada em lum 70** — o número
 * medido na `entrada.png`, não um número escolhido. É o irmão de `comQueixoApagado`,
 * e existe pela mesma razão: uma régua que nunca reprovou nada não provou que olha.
 *
 * Mais um **contra-controle**, na mesma faixa e no mesmo lugar, em lum **20**: ele
 * tem de PASSAR. Sem ele, uma janela larga demais reprovaria toda arte que passasse
 * por um codificador, e ninguém saberia dizer se a régua está medindo repintura ou
 * ruído.
 *
 * ⚠️ E os dois partem da ARTE, nunca da base nua: sem peça, a repintura vira o maior
 * componente das diferenças, a máscara a adota e a régua se aprova sozinha. Foi
 * exatamente assim que a segunda formulação do `arte:traco` passou no próprio
 * controle.
 *
 * Uso:  npm run arte:borda  [arte.png …]
 */
import { readFileSync } from "fs";

import sharp from "sharp";

import { ESCALA, LADO, ORIGEM, PNG_BASE, paraUnidade } from "./base";
import { NIVEL, PISO_COMPONENTE, componentes, cru, dilatar, lum } from "./traco-intacto";

/**
 * O teto da janela do cinza — o mesmo `LUM_APAGADO` do `arte:traco`.
 *
 * Ele não é importado de lá porque lá é `const` privada por escolha daquele módulo;
 * o número é o mesmo de propósito, e as duas linhas dizem por quê. Acima disto o
 * traço não está cinza: ele SUMIU, e o dono do caso é a outra régua.
 */
const LUM_APAGADO = 180;

/**
 * O PISO da janela do cinza: acima disto a tinta não é mais preto. **40**, medido.
 *
 * Ver a tabela no topo. Não é `LUM_TRACO` (90), e a primeira versão desta régua
 * provou por que não pode ser: com 90 o controle não reprova, porque o defeito real
 * mora em 70.
 */
const LIMIAR_CINZA = 40;

/**
 * Onde a base COMPROMETE `#000000` — `lum < 20`.
 *
 * Fora do núcleo a base é gradiente de antialias, e re-renderizar um gradiente em
 * outro ponto dele não é defeito. Ver o topo para os 999 px que o critério frouxo
 * produz em arte boa.
 */
const NUCLEO_DA_LINHA = 20;

/** A cor que a lei manda. `LINHA = "#000000"` → luminância 0. */
const LUM_DA_LINHA = 0;

/**
 * Quanto a máscara da peça se dilata antes de julgar: **4 px**, e NÃO os 2 do
 * `arte:traco`. A diferença é medida e tem causa.
 *
 * A fronteira da peça é onde o rasterizador mistura a tinta dela com o contorno de
 * baixo, e a mistura de preto com uma cor clara passa **exatamente pela janela desta
 * régua** (40 a 180). O `arte:traco` não sofre disso: a janela dele começa em 180,
 * acima de quase toda mistura. Herdar o raio de lá deixaria a régua chamando franja
 * de repintura.
 *
 * A varredura (`.scratch/estilo/varrer-dilatacao-borda.ts`, 2026-08-21) separa as
 * duas coisas sem deixar dúvida — o maior componente conexo por raio:
 *
 * | arte | 2 | 3 | **4** | 5 | 8 |
 * |---|---|---|---|---|---|
 * | `barba-trancada` | 20 | 4 | **0** | 0 | 0 |
 * | `entrada` | 3 945 | 3 945 | **3 945** | 3 945 | 3 945 |
 *
 * Franja **some** quando a máscara cresce; repintura no meio do traço **não se
 * mexe**. A `trancada` zera em 4 e fica zerada; a `entrada` é indiferente ao raio em
 * toda a varredura, porque o cinza dela está a dezenas de unidades da peça. 4 é o
 * começo do platô, não o número que fez a conta fechar.
 */
const RAIO_DA_MASCARA = 4;

export interface CorDaBorda {
  /** Núcleo preto da base coberto pela peça — sai do julgamento. */
  cobertoPelaPeca: number;
  /** Núcleo preto da base que virou CINZA (40 ≤ lum < 180) fora da peça. */
  cinza: number;
  /** Em quantas ilhas ele se parte. */
  ilhas: number;
  /** O maior componente conexo — é ele que decide. */
  maior: number;
  /** A luminância do que está cinza: mediana e o pior decil. `null` sem cinza. */
  p50: number | null;
  p95: number | null;
  /** Onde o maior componente está, em unidades do `viewBox`. */
  onde: { x0: number; x1: number; y0: number; y1: number } | null;
  /** `maior >= PISO_COMPONENTE`. */
  reprova: boolean;
}

const percentil = (ord: readonly number[], p: number): number =>
  ord[Math.max(0, Math.min(ord.length - 1, Math.round(p * (ord.length - 1))))];

/** Mede uma arte contra a base oficial. `arte` é caminho ou buffer já em memória. */
export async function corDaBorda(arte: string | Buffer): Promise<CorDaBorda> {
  const { data: B } = await cru(PNG_BASE);
  const { data: A } = await cru(arte);
  const W = LADO;
  const H = LADO;
  const n = W * H;
  if (A.length !== n * 3) throw new Error(`a arte não tem ${LADO}² — esta rota pressupõe isso`);

  // 1. A MÁSCARA DA PEÇA — a mesma definição do `arte:traco`, importada de lá.
  const dif = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const d = Math.max(
      Math.abs(A[i * 3] - B[i * 3]),
      Math.abs(A[i * 3 + 1] - B[i * 3 + 1]),
      Math.abs(A[i * 3 + 2] - B[i * 3 + 2]),
    );
    if (d > NIVEL) dif[i] = 1;
  }
  const bruta = new Uint8Array(n);
  for (const i of componentes(dif, W, H)[0] ?? []) bruta[i] = 1;
  const peca = dilatar(bruta, W, H, RAIO_DA_MASCARA);

  // 2. O TRAÇO QUE FICOU CINZA: era NÚCLEO preto na base, está na janela 40–180 na
  //    arte, e a peça não está por cima.
  const cinzaM = new Uint8Array(n);
  const lums: number[] = [];
  let cinza = 0;
  let cobertoPelaPeca = 0;
  for (let i = 0; i < n; i++) {
    if (lum(B, i) >= NUCLEO_DA_LINHA) continue;
    if (peca[i]) {
      cobertoPelaPeca++;
      continue;
    }
    const l = lum(A, i);
    if (l < LIMIAR_CINZA || l >= LUM_APAGADO) continue;
    cinzaM[i] = 1;
    lums.push(l);
    cinza++;
  }

  // 3. A CONTIGUIDADE decide: poeira é antialias, corrida é traço redesenhado.
  const ilhas = componentes(cinzaM, W, H);
  const maior = ilhas[0]?.length ?? 0;
  let onde: CorDaBorda["onde"] = null;
  if (ilhas[0]) {
    const xs = ilhas[0].map((i) => i % W);
    const ys = ilhas[0].map((i) => (i / W) | 0);
    const a = paraUnidade(Math.min(...xs), Math.min(...ys));
    const b = paraUnidade(Math.max(...xs), Math.max(...ys));
    onde = { x0: a.x, x1: b.x, y0: a.y, y1: b.y };
  }

  const ord = lums.sort((a, b) => a - b);
  return {
    cobertoPelaPeca,
    cinza,
    ilhas: ilhas.length,
    maior,
    p50: ord.length ? percentil(ord, 0.5) : null,
    p95: ord.length ? percentil(ord, 0.95) : null,
    onde,
    reprova: maior >= PISO_COMPONENTE,
  };
}

/**
 * O CONTROLE — uma arte APROVADA com uma faixa do queixo repintada em cinza.
 *
 * Irmão de `comQueixoApagado` (`traco-intacto.ts`), na mesma faixa do queixo
 * (u x 215→355 · y 343→…) e pela mesma razão. A diferença é a cor: lá vai a cor do
 * FUNDO, que é apagar; aqui vai o cinza que o gerador de fato produziu na
 * `entrada.png`, que é repintar.
 */
export async function comQueixoEmCinza(arteBase: string, alturaU = 2, alvo = 70): Promise<Buffer> {
  const { data, info } = await cru(readFileSync(arteBase));
  const emPx = (u: number, eixo: "x" | "y") => Math.round(u * ESCALA + ORIGEM[eixo]);
  const y0 = emPx(343, "y");
  const y1 = emPx(343 + alturaU, "y");
  const x0 = emPx(215, "x");
  const x1 = emPx(355, "x");
  // Cinza neutro: com R = G = B, a luminância é o próprio valor.
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const i = (y * info.width + x) * 3;
      data[i] = alvo;
      data[i + 1] = alvo;
      data[i + 2] = alvo;
    }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } })
    .png()
    .toBuffer();
}

// ---------------------------------------------------------------------------
// A LINHA DE COMANDO
// ---------------------------------------------------------------------------

/**
 * As artes que a rota já promoveu SOBRE A BASE OFICIAL — a mesma lista do
 * `arte:traco`, e ela é a mesma de propósito: as duas réguas julgam o mesmo traço em
 * faixas vizinhas do mesmo eixo, e listas que divergissem deixariam arte com um dono
 * e sem o outro.
 */
const APROVADAS = [
  "scripts/avatar/arte/barba-trancada.png",
  "scripts/avatar/arte/chanel.png",
  "scripts/avatar/arte/entrada.png",
  "scripts/avatar/arte/entrada-2.png",
];

const ARTE_DO_CONTROLE = "scripts/avatar/arte/chanel.png";

/**
 * O DEFEITO QUE JÁ ESTÁ NO AR, congelado no tamanho em que foi encontrado.
 *
 * ⚠️ **Isto NÃO é tolerância afrouxada, e a diferença é a que importa.** O piso
 * (`LIMIAR_CINZA` 40, `PISO_COMPONENTE` 8) não se moveu um número: quem entra aqui é
 * uma ARTE nomeada, com a medida dela escrita, e o gate reprova no instante em que
 * essa medida **piorar**. Afrouxar o piso teria escondido este defeito e mais todos
 * os futuros; isto o deixa visível a cada rodada e proíbe que ele cresça.
 *
 * É o mesmo desenho de `CONGELADAS_NO_VETOR` (`traje.ts`) e do ratchet de
 * `rpc-baseline.json`: uma decisão sobre UMA coisa, mecânica, com nome e número.
 *
 * `entrada.png` é a arte do cabelo **`espetado`**, e ele está em produção assim. O
 * gerador redesenhou um trecho do contorno do boneco em cinza lum ~70 no lado
 * esquerdo da cabeça (u x 349→385, y 189→271) — **9 296 px, o maior componente com
 * 3 945** —, indiferente ao raio da máscara de 2 a 8, o que prova que não é franja de
 * borda: está no meio do traço.
 *
 * **Consertar tem duas saídas defensáveis, e escolher é do Doug:**
 *
 *  1. **repintar por programa** — os pixels são descritíveis em régua (núcleo preto
 *     na base, 40–180 na arte, fora da peça), então cabe no critério do G20, que
 *     separa restaurar de desenhar; é o mesmo gesto do passo 2 do `restaurar-peca`.
 *     Mas mexe numa peça JÁ PROMOVIDA: `pecas-da-arte.ts` seria regerado e o
 *     `espetado` mudaria em produção;
 *  2. **redesenhar** — o Doug repinta o trecho em preto puro sobre a arte, e a peça
 *     reentra pela rota.
 *
 * Enquanto ele não decidir, o número fica aqui, visível, e não cresce.
 */
const DEFEITO_REGISTRADO: Record<string, { maior: number; porque: string }> = {
  "scripts/avatar/arte/entrada.png": {
    maior: 3945,
    porque: "o `espetado` em produção — traço em cinza lum ~70, achado em 2026-08-21",
  },
};

const n1 = (v: number) => v.toFixed(0).padStart(5);
const n2 = (v: number | null) => (v === null ? "   —" : v.toFixed(0).padStart(4));

function linha(nome: string, r: CorDaBorda): string {
  const onde = r.onde
    ? `x ${r.onde.x0.toFixed(0)}→${r.onde.x1.toFixed(0)} · y ${r.onde.y0.toFixed(0)}→${r.onde.y1.toFixed(0)}`
    : "—";
  return (
    `  ${nome.padEnd(30)} coberto ${n1(r.cobertoPelaPeca)} px   ` +
    `cinza ${n1(r.cinza)} px em ${String(r.ilhas).padStart(3)} ilha(s)   ` +
    `maior ${n1(r.maior)} px   ` +
    `lum p50 ${n2(r.p50)} p95 ${n2(r.p95)}   ${r.reprova ? "✗ REPROVA" : "·        "}   ${onde}`
  );
}

async function principal(): Promise<void> {
  const alvos = process.argv.slice(2).filter((a) => !a.startsWith("--"));

  console.log(
    `COR DA BORDA — LINHA = #000000, luminância ${LUM_DA_LINHA}\n` +
      `               a janela do CINZA é ${LIMIAR_CINZA} ≤ lum < ${LUM_APAGADO}: nem preto, nem apagado\n` +
      `               e só onde a base é NÚCLEO (lum < ${NUCLEO_DA_LINHA}) — onde ela compromete #000000\n` +
      `               piso ${PISO_COMPONENTE} px por componente (TRACO 12 u × ESCALA ${ESCALA} px/u ÷ 2)\n`,
  );

  // O CONTROLE vem primeiro, sempre. Se ele não se comportar, o resto da rodada não
  // quer dizer nada — é a régua que não está olhando.
  let controleOk = true;
  for (const altura of [1, 2]) {
    const c = await corDaBorda(await comQueixoEmCinza(ARTE_DO_CONTROLE, altura));
    console.log(linha(`CONTROLE chanel + cinza 70, ${altura}u`, c));
    if (!c.reprova) controleOk = false;
  }

  const preto = await corDaBorda(await comQueixoEmCinza(ARTE_DO_CONTROLE, 2, 20));
  console.log(
    linha("contra-controle: preto 20", preto) + "   ← esperado PASSAR: 20 é ruído, não repintura",
  );
  if (preto.reprova) controleOk = false;

  console.log("");

  if (!controleOk) {
    console.error(
      `\n  ✗ O CONTROLE não se comportou. A régua não está olhando, e nenhuma linha\n` +
        `    abaixo dele quer dizer coisa alguma. Conserte a régua antes da arte.\n`,
    );
    process.exit(1);
  }

  let reprovou = 0;
  let piorou = 0;
  for (const a of alvos.length ? alvos : APROVADAS) {
    const r = await corDaBorda(a);
    const nome = a.split(/[\\/]/).pop() ?? a;
    const reg = DEFEITO_REGISTRADO[a];
    if (!reg) {
      console.log(linha(nome, r));
      if (r.reprova) reprovou++;
      continue;
    }
    // Arte com defeito REGISTRADO: quem julga é a catraca, não o piso.
    const cresceu = r.maior > reg.maior;
    console.log(
      linha(nome, r) +
        `\n${" ".repeat(34)}↑ REGISTRADO em ${reg.maior} px — ` +
        `${cresceu ? "✗ CRESCEU" : "não cresceu"}. ${reg.porque}`,
    );
    if (cresceu) piorou++;
  }

  if (piorou) {
    console.error(
      `\n  ✗ ${piorou} defeito(s) REGISTRADO(s) cresceram desde que foram medidos.\n\n` +
        `    A catraca existe para isto: o número congelado não é permissão para\n` +
        `    piorar. Ou a arte voltou atrás, ou alguém mexeu na esteira.\n`,
    );
    process.exit(1);
  }

  if (reprovou) {
    console.error(
      `\n  ✗ ${reprovou} arte(s) com um TRECHO do traço do boneco redesenhado em cinza.\n\n` +
        `    Não é apagamento — \`arte:traco\` passa nelas de propósito. É a COR: a lei\n` +
        `    diz \`LINHA = #000000\` e ali o traço não é preto. Um traço cinza parece mais\n` +
        `    FINO que um preto da mesma largura, e a tentação é compensar engrossando —\n` +
        `    foi assim que \`TRACO\` virou 17 uma vez.\n\n` +
        `    O conserto é na ARTE, nunca no limiar: repintar o trecho em preto puro.\n` +
        `    Ver \`docs/avatar/23-linha-de-arte.md\` §3.\n`,
    );
    process.exit(1);
  }

  const lista = alvos.length ? alvos : APROVADAS;
  const registradas = lista.filter((a) => DEFEITO_REGISTRADO[a]).length;
  console.log(
    `\n  · ${lista.length - registradas} arte(s) com o traço do boneco em preto, ` +
      `${registradas} com defeito registrado e congelado, ` +
      `e o controle se comportou nas três medições.\n`,
  );
}

await principal();
