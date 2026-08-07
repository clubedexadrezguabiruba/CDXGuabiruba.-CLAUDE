/**
 * A FOLHA, EM FORMA DE DECISÃO — e não em forma de relatório.
 *
 * ---------------------------------------------------------------------------
 * A FOLHA ANTERIOR PROVAVA QUE O TRABALHO FOI FEITO; ELA NÃO AJUDAVA A DECIDIR
 * ---------------------------------------------------------------------------
 *
 * Ela tinha **5 911 px de altura** e precisou ser fatiada em três para ser lida —
 * e uma folha que não cabe numa tela não é uma folha, é um documento. Pior: ela
 * era organizada pelas ETAPAS DO PROGRAMA (gate, extração, contorno, conversão,
 * defeitos), que é a ordem em que o código roda e não a ordem em que alguém
 * decide. O controle aprovado ficava a três seções de distância da peça nova, o
 * que obriga a memória a fazer a comparação que a folha deveria fazer.
 *
 * Esta cabe em **uma tela** e é organizada pelas três perguntas abertas:
 *
 *  1. **o veredito** — as três artes a 56 px, com o `[curto]` aprovado AO LADO;
 *  2. **o close da coroa** — os estados no mesmo recorte medido, sem quebra;
 *  3. **o que ainda não está resolvido**, nomeado.
 *
 * ---------------------------------------------------------------------------
 * OS NÚMEROS VÃO PARA O TERMINAL, QUE É ONDE SE LÊ NÚMERO
 * ---------------------------------------------------------------------------
 *
 * A folha antiga carregava tabelas de dezenas de valores em HTML. Número em
 * imagem não é copiável, não é buscável e ocupa a área que o desenho precisa —
 * e a decisão que esta folha serve é **visual**. Todo número medido continua
 * sendo impresso, no terminal, ao gerar.
 *
 * O que sobrevive no HTML é só o rótulo que diz o que se está olhando.
 *
 * ---------------------------------------------------------------------------
 * OS DOIS BUGS QUE ESTA FOLHA JÁ TEVE, E QUE CONTINUAM VALENDO COMO REGRA
 * ---------------------------------------------------------------------------
 *
 * **1. Rasterizar boneco com `sharp`.** A leitura pegou: o rosto saía preto em
 * todos os painéis, inclusive no controle careca. O `sharp` usa librsvg, e o
 * compositor pinta tudo por custom property — propriedade que não resolve faz o
 * `fill` virar inválido e o elemento renderiza preto. O `sharp` continua certo
 * para MEDIR máscara binária; para desenhar o boneco, o rasterizador é o
 * Chromium, porque o destino é o navegador.
 *
 * **2. Número escrito à mão no HTML.** A versão anterior tinha doze valores da
 * `entrada.png` literais e um título fixo. Rodada em outra arte, ela mentia com
 * cara de evidência. Aqui não há constante literal: o que aparece é medido na
 * hora.
 *
 * ---------------------------------------------------------------------------
 * OS 56 px SÃO RASTERIZADOS NO TAMANHO REAL E AMPLIADOS COMO IMAGEM
 * ---------------------------------------------------------------------------
 *
 * Nunca por `transform: scale()`, que reamostra a partir do vetor e entrega uma
 * imagem mais nítida do que o produto mostra — ou seja, mente a favor. O boneco é
 * rasterizado a 56 px de altura, que é o tamanho do ranking, e a ampliação é
 * `image-rendering: pixelated` sobre esse bitmap. O que se vê é o que o aluno vê.
 *
 * Os quatro fundos são os do doc 16 §8 — claro, magenta, escuro e quadriculado —
 * porque cada um revela um defeito diferente: o magenta acusa halo de
 * antialiasing, o escuro acusa borda clara vazando, o quadriculado acusa buraco.
 */

import { mkdirSync, readFileSync, writeFileSync } from "fs";

import sharp from "sharp";

import type { Cabelo } from "../../../src/lib/avatar/estilo/cabelo";
import { CABELOS } from "../../../src/lib/avatar/estilo/cabelo";
import { compor, ESCALA_PADRAO, naTela } from "../../../src/lib/avatar/estilo/compositor";
import { CAIXA_CABECA, TRACO, VIEWBOX } from "../../../src/lib/avatar/estilo/geometria";
import { CABELO, PELE } from "../../../src/lib/avatar/palette";
import { abrirNavegador, renderizarHtml, renderizarSvg } from "../render-svg";
import { FUNDO, PASTA, saidaDaArte } from "./base";
import { luz } from "./pixels";
import { converter, type Convertido } from "./converter";
import { medirCoroa } from "./coroa";
import { gateMenosUm, type Laudo } from "./gate-menos-um";
import { sondar, type Sonda } from "./silhueta";

const b64 = (p: string) => `data:image/png;base64,${readFileSync(p).toString("base64")}`;

/** O tamanho que manda: o boneco no ranking (doc 15 §7, regra 8). */
const P = 56;
/** Quantas vezes o bitmap de 56 px é ampliado para o olho. */
const ZOOM = 2;
/** A altura do render do close. A 1400 px, 1 unidade do `viewBox` vale 2 px. */
const ALT_CLOSE = 1400;

/**
 * A LARGURA DA FOLHA E O QUE ELA DEIXA PARA CADA CLOSE.
 *
 * As três são constantes de layout, e estão aqui em vez de dentro do CSS porque o
 * programa PRECISA delas: é dividindo esta largura pelos painéis que ele calcula
 * quanto do ar do recorte sobra na tela. Escritas duas vezes, uma no CSS e outra
 * na conta, elas divergiriam no primeiro ajuste — e a conta passaria a descrever
 * uma folha que não existe mais.
 */
const LARGURA_FOLHA = 1560;
const PAD_FOLHA = 16;
const GAP_CLOSES = 8;

const est = { pele: PELE[2], cabelo: CABELO[1] };

/**
 * OS QUATRO FUNDOS DO DOC 16 §8, e cada um existe para um defeito.
 *
 * O quadriculado é um `linear-gradient` em vez de imagem: um PNG de xadrez seria
 * mais um artefato para gerar, versionar e manter alinhado com o zoom.
 */
const FUNDOS: [string, string][] = [
  ["claro", "#FBF8F5"],
  ["magenta", "#FF00AA"],
  ["escuro", "#1B1B1F"],
  [
    "xadrez",
    "repeating-conic-gradient(#DDD 0% 25%, #FFF 0% 50%) 50% / 12px 12px",
  ],
];

interface Medida {
  nome: string;
  laudo: Laudo;
  c: Convertido;
  coroa: { escurosA56: number; faixaU: number };
  sonda: Sonda;
}

async function principal(): Promise<void> {
  const artes =
    process.argv.length > 2
      ? process.argv.slice(2)
      : [`${PASTA}/entrada.png`, `${PASTA}/entrada-2.png`, `${PASTA}/entrada-3.png`];

  // --------------------------------------------------------------- as medidas
  const medidas: Medida[] = [];
  for (const arte of artes) {
    const nome = (arte.split(/[\\/]/).pop() ?? arte).replace(/\.png$/i, "");
    process.stdout.write(`  medindo ${nome}…\n`);
    const laudo = await gateMenosUm(arte);
    const c = await converter(arte);
    const destino = saidaDaArte(arte);
    mkdirSync(destino, { recursive: true });
    medidas.push({
      nome,
      laudo,
      c,
      coroa: await medirCoroa(c.peca, `f-${nome}`, destino),
      sonda: await sondar(c.peca, `f-${nome}`, destino),
    });
  }

  // O CONTROLE: uma peça do catálogo que nunca passou por arte nenhuma, e que o
  // Doug já aprovou. Ele vai AO LADO das três, não a três seções de distância.
  const controleCoroa = await medirCoroa(CABELOS.curto, "f-controle", `${PASTA}/reguas`);
  const controleSonda = await sondar(CABELOS.curto, "f-controle", `${PASTA}/reguas`);
  const carecaCoroa = await medirCoroa(undefined, "f-careca", `${PASTA}/reguas`);

  // --------------------------------------------------------------- os renders
  const nav = await abrirNavegador();
  const larg56 = Math.round((P * VIEWBOX.w) / VIEWBOX.h);

  /** O boneco a 56 px, no tamanho REAL. A ampliação é do CSS, sobre o bitmap. */
  const em56 = async (chave: string, peca: Cabelo | undefined) => {
    const arq = `${PASTA}/.f-${chave}.png`;
    await renderizarSvg(
      nav,
      compor({ ...est, ...(peca ? { modeloCabelo: peca } : {}), ns: `f${chave.replace(/\W/g, "")}` }),
      larg56,
      P,
      arq,
      // Fundo TRANSPARENTE: é o que deixa os quatro fundos do doc 16 aparecerem
      // por baixo. Rasterizar contra um fundo e depois pôr outro atrás esconderia
      // exatamente o halo que o magenta existe para revelar.
      "transparent",
    );
    return b64(arq);
  };

  /**
   * O CLOSE DA COROA, de coordenada MEDIDA — nunca escolhido a olho.
   *
   * O recorte sai de `CAIXA_CABECA` convertida para pixel do render, com meio
   * traço de folga acima da linha de centro (a silhueta externa) e um terço da
   * altura da cabeça abaixo. É a mesma `CALOTA` que `coroa.ts` conta.
   */
  const closeDaCoroa = async (chave: string, peca: Cabelo | undefined) => {
    const largC = Math.round((ALT_CLOSE * VIEWBOX.w) / VIEWBOX.h);
    const porU = ALT_CLOSE / VIEWBOX.h;
    const arq = `${PASTA}/.fc-${chave}.png`;
    // NO PADRÃO — 92%, o que o produto mostra. A primeira versão usava
    // `escala: 1` e a leitura pegou: o ápice saía CORTADO em todos os painéis,
    // porque a 100% a peça sobe a −38,9 u e o `viewBox` a guilhotina. O close
    // existe para mostrar a coroa; mostrar a coroa decapitada pelo viewport é
    // mostrar um defeito que os 92% já consertaram.
    await renderizarSvg(
      nav,
      compor({ ...est, ...(peca ? { modeloCabelo: peca } : {}), ns: `c${chave.replace(/\W/g, "")}` }),
      largC,
      ALT_CLOSE,
      arq,
      FUNDO,
    );
    return { arq, porU, largC };
  };

  /**
   * A CAIXA DA TINTA de um PNG, contra o fundo da base — UMA régua para as duas
   * perguntas que o enquadramento faz:
   *
   *  - **onde o ápice começa**, no render inteiro, para o recorte sair de medição;
   *  - **quanto ar sobrou em volta dele**, no bitmap já recortado, para o
   *    enquadramento ser CONFERIDO em vez de olhado.
   *
   * A segunda nasceu porque "o topo aperta o ápice" foi três vezes uma impressão
   * de leitura e nenhuma vez um número — e impressão não diz se o conserto
   * consertou.
   */
  const caixaDaTinta = async (arq: string, w: number, h: number) => {
    const { data } = await sharp(arq).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let x0 = w, x1 = -1, y0 = h, y1 = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const j = (y * w + x) * 3;
        if (Math.abs(luz(data[j], data[j + 1], data[j + 2]) - luz(251, 248, 245)) > 6) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    return { x0, x1, y0, y1 };
  };

  const tela: Record<string, string> = {};
  for (const m of medidas) tela[m.nome] = await em56(m.nome, m.c.peca);
  tela["controle"] = await em56("controle", CABELOS.curto);

  /**
   * O RECORTE É FEITO COM `sharp.extract`, e não com `clip-path` no HTML.
   *
   * A primeira versão usava `clip-path: inset()` com margem negativa, e a leitura
   * por subagente pegou o resultado: o **ápice da coroa ficava fora** e sobrava
   * ~40% de branco embaixo de cada painel. A causa é que o `clip-path` opera no
   * tamanho RENDERIZADO do elemento enquanto o `inset` estava escrito em pixels do
   * bitmap original — duas unidades diferentes na mesma conta.
   *
   * Recortando o bitmap de verdade não há duas unidades: o que entra no HTML já é
   * o pedaço certo, e a largura do `<img>` é só apresentação.
   */
  //
  // O RECORTE SAI DE MEDIÇÃO, e é UM SÓ para todos os painéis.
  //
  // A largura e o fundo vêm de `CAIXA_CABECA` — geometria declarada. O TOPO, não:
  // ele é o menor "primeiro pixel com tinta" entre todas as peças. Uma fórmula
  // sobre `CAIXA_CABECA.y0` descreveria onde o CRÂNIO começa, e o que precisa
  // caber no quadro é o ápice da PEÇA, que sobe acima dele — foi assim que a
  // primeira versão cortou o ápice em todos os cinco painéis.
  //
  // Ser um só é exigência do plano: dois recortes diferentes lado a lado fazem o
  // olho comparar enquadramentos em vez de comparar coroas.
  //
  // ---------------------------------------------------------------------------
  // O CORTE LATERAL É DELIBERADO, e está escrito porque parece defeito
  // ---------------------------------------------------------------------------
  //
  // As três peças passam MUITO da largura do crânio nesta faixa — medido no render
  // de 1400 px: a `entrada` vai de x 72 a 947 e a `entrada-2` de 42 a 947, contra
  // um crânio que ocupa 178 a 848. Enquadrar a peça inteira exigiria 953 px dos
  // 1000 do render, ou seja, deixaria de haver close: seria a figura inteira em
  // faixa, com a coroa reduzida de 0,83 para 0,63 px por unidade na tela — 24% de
  // ampliação perdida justamente no lugar que este painel existe para julgar.
  //
  // Quem mostra a peça inteira é a seção 1, nos quatro fundos. Aqui é close de
  // coroa, e close corta — o que não pode ser cortado é o ÁPICE, e é ele que o
  // topo medido protege.
  const alvos: [string, Cabelo | undefined][] = [
    ...medidas.map((m) => [m.nome, m.c.peca] as [string, Cabelo]),
    ["controle", CABELOS.curto],
    ["careca", undefined],
  ];
  const largC = Math.round((ALT_CLOSE * VIEWBOX.w) / VIEWBOX.h);
  const brutos: [string, string, number][] = [];
  for (const [chave, peca] of alvos) {
    const { arq } = await closeDaCoroa(chave, peca);
    brutos.push([chave, arq, (await caixaDaTinta(arq, largC, ALT_CLOSE)).y0]);
  }

  const porU = ALT_CLOSE / VIEWBOX.h;
  const emX = largC / VIEWBOX.w;
  const topoMedido = Math.min(...brutos.map((b) => b[2]));

  // ---------------------------------------------------------------------------
  // A FOLGA SÃO DOIS TRAÇOS, e o segundo é escolha de enquadramento — não medida
  // ---------------------------------------------------------------------------
  //
  // **Um** traço já prova que o ápice está dentro do quadro: é uma espessura
  // inteira de contorno visível entre a tinta mais alta e a borda, e nenhuma régua
  // pede mais. Era o que estava aqui.
  //
  // Só que o painel não é lido a 718 px: são cinco lado a lado em 1560, ou seja
  // ~299 px cada, e um traço vira **10 px de ar** num painel de 159. Três leituras
  // seguidas disseram "o topo toca ou é cortado" olhando para um ápice que estava
  // inteiro, com folga medida — porque a essa altura a pergunta deixou de ser
  // geometria e passou a ser o tamanho em que a folha é olhada.
  //
  // O segundo traço compra o ar que falta nesse tamanho. Está escrito como escolha
  // porque é escolha: o que é medida é a linha impressa abaixo, que diz painel a
  // painel quanto ar sobrou de fato.
  const FOLGA = 2 * TRACO * porU;

  // As LATERAIS e o FUNDO vêm de `naTela`, que aplica a mesma transformação que o
  // compositor emitiu. Sem ela o recorte usaria a largura da cabeça a 100% sobre um
  // render a 92%, e a arte sangrava 8% para fora do quadro nos dois lados.
  const esq = naTela({ x: CAIXA_CABECA.x0 });
  const dir = naTela({ x: CAIXA_CABECA.x1 });
  // O fundo do recorte é a metade da cabeça: mostra o domo inteiro com contexto
  // suficiente para o olho saber onde está, e para antes da sobrancelha.
  const meio = naTela({ y: CAIXA_CABECA.y0 + CAIXA_CABECA.alt / 2 });
  const rec = {
    left: Math.max(0, Math.round((esq.x - TRACO) * emX)),
    top: Math.max(0, Math.round(topoMedido - FOLGA)),
    width: 0,
    height: 0,
  };
  rec.width = Math.min(largC - rec.left, Math.round((dir.x - esq.x + 2 * TRACO) * emX));
  rec.height = Math.min(ALT_CLOSE - rec.top, Math.round(meio.y * porU) - rec.top);
  console.log(
    `\n  recorte do close, UM só para os ${brutos.length} painéis: ` +
      `x ${rec.left} y ${rec.top} ${rec.width}×${rec.height} px` +
      `   (topo da tinta mais alta ${topoMedido} px, menos ${FOLGA.toFixed(0)} de folga;` +
      ` laterais e fundo por \`naTela\` a ${(100 * ESCALA_PADRAO).toFixed(0)}%)`,
  );

  const rotulos: Record<string, string> = { controle: "[curto] — aprovado", careca: "careca — o piso" };
  const closes: [string, string][] = [];
  /** O enquadramento CONFERIDO no bitmap recortado: chave, ar acima, sobra lateral. */
  const enquadre: [string, number, number, number][] = [];
  for (const [chave, arq] of brutos) {
    const alvo = `${PASTA}/.fx-${chave}.png`;
    await sharp(arq).extract(rec).png().toFile(alvo);
    closes.push([rotulos[chave] ?? chave, b64(alvo)]);
    const cx = await caixaDaTinta(alvo, rec.width, rec.height);
    enquadre.push([chave, cx.y0, cx.x0, rec.width - 1 - cx.x1]);
  }

  // O ENQUADRAMENTO, CONFERIDO — a resposta a "o topo aperta o ápice?" deixa de ser
  // impressão de leitura e passa a ser número. O `em tela` é o que o olho vê de
  // fato: os cinco painéis dividem a largura da folha, então o ar encolhe junto.
  const LARGURA_PAINEL =
    (LARGURA_FOLHA - 2 * PAD_FOLHA - (brutos.length - 1) * GAP_CLOSES) / brutos.length;
  const emTela = LARGURA_PAINEL / rec.width;
  console.log(
    `\n  o enquadramento, conferido no bitmap recortado ` +
      `(cada painel sai a ${LARGURA_PAINEL.toFixed(0)} px, ${(100 * emTela).toFixed(0)}% do recorte)\n`,
  );
  console.log(`  painel        ar acima do ápice        laterais`);
  for (const [chave, acima, sEsq, sDir] of enquadre) {
    const lat = (s: number) => (s === 0 ? "corta" : `${s} px`);
    console.log(
      `  ${chave.padEnd(13)} ${String(acima).padStart(4)} px = ` +
        `${(acima / porU).toFixed(1).padStart(5)} u = ${(acima * emTela).toFixed(0).padStart(3)} px em tela` +
        `${acima === 0 ? "   ✗ TOCA O TOPO" : "   ·"}   ${lat(sEsq)} / ${lat(sDir)}`,
    );
  }

  // --------------------------------------------------------------------- HTML
  const cartao = (nome: string, dado: string, nota: string) =>
    `<div class="cartao">` +
    FUNDOS.map(
      ([rot, css]) =>
        `<div class="cel"><div class="fundo" style="background:${css}">` +
        `<img src="${dado}" width="${larg56 * ZOOM}" height="${P * ZOOM}"></div>` +
        `<span class="rot">${rot}</span></div>`,
    ).join("") +
    `<div class="nome">${nome}<span class="nota">${nota}</span></div></div>`;

  const cartoes =
    medidas
      .map((m) =>
        cartao(
          m.nome,
          tela[m.nome],
          `${m.laudo.aprovada ? "Gate −1 aprovada" : "Gate −1 REPROVADA"} · ` +
            `coroa ${m.coroa.escurosA56} px · barra enterrada ${(100 * m.sonda.barra.fracao).toFixed(0)}%`,
        ),
      )
      .join("") +
    cartao(
      "[curto] — o controle aprovado",
      tela["controle"],
      `nunca passou por arte · coroa ${controleCoroa.escurosA56} px · ` +
        `barra ${(100 * controleSonda.barra.fracao).toFixed(0)}%`,
    );

  const faixaCloses = closes
    .map(
      ([rot, dado]) =>
        `<figure><img src="${dado}"><figcaption>${rot}</figcaption></figure>`,
    )
    .join("");

  const html =
    `<style>` +
    `body{margin:0;background:#F7F5F2;font:13px/1.45 system-ui,-apple-system,sans-serif;color:#222}` +
    `h1{font-size:15px;margin:14px ${PAD_FOLHA}px 2px;letter-spacing:.02em}` +
    `h2{font-size:12px;margin:18px ${PAD_FOLHA}px 6px;color:#666;font-weight:600;text-transform:uppercase;letter-spacing:.06em}` +
    `.linha{display:flex;gap:10px;padding:0 ${PAD_FOLHA}px;align-items:flex-start}` +
    `.cartao{background:#fff;border:1px solid #E3DFD9;border-radius:8px;padding:8px;flex:1;min-width:0}` +
    `.cartao{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}` +
    `.cel{display:flex;flex-direction:column;align-items:center;gap:2px}` +
    `.fundo{display:flex;align-items:center;justify-content:center;border-radius:4px;padding:3px}` +
    `.fundo img{image-rendering:pixelated;display:block}` +
    `.rot{font-size:9px;color:#999}` +
    `.nome{grid-column:1/-1;font-weight:600;font-size:11px;border-top:1px solid #EEE;padding-top:5px;margin-top:2px}` +
    `.nota{display:block;font-weight:400;color:#777;font-size:10px}` +
    `.closes{display:flex;gap:${GAP_CLOSES}px;padding:0 ${PAD_FOLHA}px}` +
    `.closes figure{margin:0;background:#fff;border:1px solid #E3DFD9;border-radius:8px;flex:1;min-width:0;overflow:hidden;box-sizing:border-box}` +
    `.closes img{width:100%;display:block}` +
    `.closes figcaption{font-size:10px;color:#666;padding:4px 6px;border-top:1px solid #EEE}` +
    `ul{margin:4px ${PAD_FOLHA}px 14px;padding-left:18px;color:#555;font-size:12px}` +
    `li{margin:2px 0}b{color:#222}` +
    `</style>` +
    `<h1>Rota de arte — o veredito</h1>` +
    `<h2>1 · as três artes a 56 px, com o controle aprovado ao lado</h2>` +
    `<div class="linha">${cartoes}</div>` +
    `<h2>2 · a coroa, no mesmo recorte medido — sem quebra de linha</h2>` +
    `<div class="closes">${faixaCloses}</div>` +
    `<h2>3 · o que ainda NÃO está resolvido</h2>` +
    `<ul>` +
    `<li><b>Barra enterrada não chegou a zero.</b> A peça sobreposta mede ` +
    `${medidas.map((m) => `${(100 * m.sonda.barra.fracao).toFixed(0)}%`).join(" · ")} contra ` +
    `${(100 * controleSonda.barra.fracao).toFixed(0)}% do <code>[curto]</code>. O resíduo é contorno de mecha ` +
    `cruzando a fronteira do crânio, não o traço do crânio — mas a régua ainda não os separa.</li>` +
    `<li><b>O orçamento de bytes estoura</b> em ${medidas.filter((m) => Buffer.byteLength(compor({ ...est, modeloCabelo: m.c.peca, ns: "o" }), "utf-8") > 10240).length} das ${medidas.length} artes. ` +
    `Peça traçada de arte real tem mais pontos que paramétrica; o doc 15:463 já declara que teto de bytes não veta arte aprovada.</li>` +
    `<li><b>Nenhuma peça foi colada em <code>CABELOS</code>.</b> A rota produz o literal; ` +
    `a decisão de catálogo é do Doug.</li>` +
    `<li><b>O papel <code>luz</code> não tem correspondente</b> no render de 2 tons ` +
    `(${medidas.map((m) => `${m.nome} ${(100 * m.laudo.regioes.permitida.tinta.fracao).toFixed(0)}%`).join(" · ")} da região permitida mudou de tinta).</li>` +
    `</ul>`;

  const arqHtml = `${PASTA}/folha.html`;
  writeFileSync(arqHtml, html, "utf-8");
  const arqPng = `${PASTA}/folha.png`;
  await renderizarHtml(nav, html, LARGURA_FOLHA, arqPng);
  await nav.close();

  // ------------------------------------------------------- os números, no TERMINAL
  console.log(`\nA FOLHA — ${arqPng}\n`);
  console.log(`  arte           Gate −1     coroa a 56 px   barra enterrada   arco    formas irmãs`);
  for (const m of medidas) {
    console.log(
      `  ${m.nome.padEnd(13)} ${(m.laudo.aprovada ? "aprovada" : "REPROVADA").padEnd(10)} ` +
        `${String(m.coroa.escurosA56).padStart(9)} px   ` +
        `${(100 * m.sonda.barra.fracao).toFixed(1).padStart(12)}%   ` +
        `${(100 * m.c.traco.fracao).toFixed(0).padStart(4)}%   ${String(m.c.formasIrmas).padStart(11)}`,
    );
  }
  console.log(
    `  ${"[curto]".padEnd(13)} ${"controle".padEnd(10)} ${String(controleCoroa.escurosA56).padStart(9)} px   ` +
      `${(100 * controleSonda.barra.fracao).toFixed(1).padStart(12)}%`,
  );
  console.log(
    `  ${"careca".padEnd(13)} ${"piso".padEnd(10)} ${String(carecaCoroa.escurosA56).padStart(9)} px   ` +
      `${(0).toFixed(1).padStart(12)}%   ← o zero da régua não é 0`,
  );
  console.log(`\n  HTML em ${arqHtml}`);
}


principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
