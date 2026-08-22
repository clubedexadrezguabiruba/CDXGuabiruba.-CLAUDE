/**
 * A FOLHA DE CONTATO DO SLOT `rosto` — a arte original contra o boneco montado.
 *
 * É o passo 10–11 da esteira do doc 19 lido para uma peça que **recolore**: a folha
 * do traje (`arte:folha-traje`) mede colagem de raster, e esta tem outra pergunta.
 * A barba sai em `formas[]` com token de cor, então o que precisa ser julgado é
 * duplo:
 *
 *  1. **o traçado é fiel à arte?** — coluna `traçado`, as duas formas desenhadas
 *     nas cores que o gerador pintou, sobre a mesma base, no mesmo recorte da
 *     coluna `arte`. Lado a lado, a diferença é de desenho, não de cor;
 *  2. **a peça montada lê?** — as colunas do compositor, que é o que o produto
 *     emite: careca com cabelo LOIRO (a peça recolore mesmo sem modelo de cabelo)
 *     e duas cores de cabelo sobre o `chanel`.
 *
 * O recorte das duas primeiras colunas é **px 212→812 × 92→932** da base de edição,
 * que é exatamente o `viewBox` de 500 × 700 do compositor. Não é enquadramento
 * escolhido: é a mesma janela, então as cinco colunas caem no mesmo lugar e a
 * comparação é conta e não ajuste.
 *
 * **Todo número sai no terminal, nunca na imagem** (doc 19 §11): número em imagem
 * não é copiável nem buscável.
 *
 * Uso: npm run arte:folha-rosto [slug]
 */
import { readFileSync, writeFileSync } from "fs";

import { chromium } from "@playwright/test";
import sharp from "sharp";

import { ROSTOS } from "../../../src/lib/avatar/catalogo";
import { compor } from "../../../src/lib/avatar/estilo/compositor";
import { CABELO } from "../../../src/lib/avatar/palette";
import { ESCALA, FUNDO, ORIGEM, PASTA, PNG_BASE } from "./base";
import { construirRosto } from "./barba-para-formas";

/** O recorte: o `viewBox` inteiro em pixels da base de edição. 600 × 840, 5:7. */
const RECORTE = {
  left: ORIGEM.x,
  top: ORIGEM.y,
  width: Math.round(500 * ESCALA),
  height: Math.round(700 * ESCALA),
};

/** A largura da célula grande, e a do boneco no tamanho do produto. */
const GRANDE = 300;

/**
 * OS DOIS TAMANHOS DE JULGAMENTO, e o 32 é o que manda aqui.
 *
 * Doc 23 §6: peça de **cabeça** — chapéu, rosto, óculos — julga-se a **32 px**,
 * porque a cabeça ocupa ~metade da altura do boneco; os 56 px são o tamanho do
 * BONECO no ranking, e servem para o traje. Esta folha nasceu só com 56, o que
 * julgava a barba com o dobro da resolução que ela tem na tela. Os dois ficam
 * lado a lado: o 56 continua útil para ver a peça no contexto do boneco inteiro.
 */
const P32 = 32;
const P56 = 56;

/**
 * A AMPLIAÇÃO — 224 px, e ela agora estica o BITMAP em vez de redesenhar o SVG.
 *
 * ⚠️ Estava mentindo, e mentia para o lado mais caro: `transform: scale(4)` sobre
 * um SVG faz o navegador **re-rasterizar o vetor no tamanho grande**, então a
 * célula mostrava detalhe que o tamanho real não tem — quem aprovasse por ela
 * estaria aprovando uma peça que a 32 px vira mancha. Achado em 2026-08-22.
 *
 * O conserto: os bitmaps de 32 e 56 px são capturados ANTES, em DPR 1 (que é o
 * pior caso real), e ampliados por vizinho mais próximo no `sharp`. O que aparece
 * na folha é o quadradão que o aluno vê, esticado — não um desenho novo.
 *
 * 224 é múltiplo dos dois — 32 × 7 e 56 × 4 —, então as duas colunas de ampliação
 * saem com a MESMA largura e o olho compara área por área.
 */
const AMPLIADO = 224;

/** A cor que o gerador pintou na massa da `cheia`, medida por `reparo-cheia-um-tom.ts`. */
const COR_DA_ARTE = "#2AA8A9";

/**
 * A MESMA REGRA DE PREENCHIMENTO DO COMPOSITOR (`compositor.ts:749`).
 *
 * A silhueta é um `d` com vários subcaminhos — o contorno externo mais uma janela
 * por feição. `evenodd` é o que faz a janela ser buraco; sem ela o navegador
 * preenche, e a coluna do traçado desenha a boca PRETA. É a única coisa que faz
 * esta coluna divergir do produto, e ela já divergiu.
 */
const REGRA = ` fill-rule="evenodd"`;

const uri = (b: Buffer) => `data:image/png;base64,${b.toString("base64")}`;

async function principal(): Promise<void> {
  const slug = process.argv[2] ?? "rosto-barba-trancada";
  const peca = ROSTOS[slug];
  if (!peca?.formas) {
    console.error(`  ✗ ${slug} não está em ROSTOS, ou não é peça de \`formas\`.`);
    console.error(`    o catálogo de rosto tem: ${Object.keys(ROSTOS).join(", ") || "(vazio)"}`);
    process.exit(1);
  }
  const arte = `${PASTA}/${slug.replace(/^rosto-/, "")}.png`;

  // ------------------------------------------------------------------ as células
  const recorteDe = (p: string) => sharp(p).extract(RECORTE).png().toBuffer();
  const arteUri = uri(await recorteDe(arte));
  const baseUri = uri(await recorteDe(PNG_BASE));

  /**
   * As duas formas, nas cores da própria arte — a coluna da fidelidade.
   *
   * **Ela aplica a MÁSCARA DE TOM**, e sem isso a coluna mentiria: desde o tom
   * contínuo as duas formas têm o mesmo `d`, então desenhá-las cruas pinta uma
   * mancha chapada da cor de cima e some com o claro-escuro inteiro. O painel
   * existe para o Doug comparar traçado com arte — comparar contra uma mancha não
   * responde nada.
   *
   * Sem `tom` (peça antiga, ou paramétrica) o `<mask>` não sai e a coluna volta a
   * ser o que era: duas formas cruas, uma sobre a outra.
   */
  const tom = peca.tom;
  const tracadoNaCorDaArte =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 700" ` +
    `style="position:absolute;inset:0;width:100%;height:100%">` +
    (tom
      ? `<defs><mask id="fr-tom" maskUnits="userSpaceOnUse" ` +
        `x="${tom.x}" y="${tom.y}" width="${tom.w}" height="${tom.h}">` +
        // O PNG entra aqui EMBUTIDO, e é a única coisa nesta folha que difere do
        // produto: a folha é um HTML montado por `setContent`, sem servidor, e um
        // `href="/items/…"` não resolveria. O produto serve o mesmo arquivo por url.
        `<image href="data:image/png;base64,${readFileSync(`public${tom.arte}`).toString("base64")}" ` +
        `x="${tom.x}" y="${tom.y}" width="${tom.w}" height="${tom.h}" ` +
        `preserveAspectRatio="none"/></mask></defs>`
      : "") +
    // ⚠️ `fill-rule="evenodd"` NÃO É DETALHE — sem ele a JANELA DA BOCA some.
    //
    // O `d` da silhueta tem subcaminhos: o contorno externo mais uma janela por
    // feição (doc 23 §4.5, a figurinha). Com a regra padrão `nonzero` o navegador
    // PREENCHE a janela, e a coluna desenha a boca preta — medido em 2026-08-22,
    // 100% da espinha da boca preta sem a regra, 0% com ela. O compositor sempre
    // emitiu `evenodd` (`compositor.ts:749`); esta coluna é que estava sem, e por
    // isso mostrava um defeito que o produto não tem.
    `<path d="${peca.formas[0].d}"${REGRA} fill="#000"/>` +
    `<path d="${peca.formas[1].d}"${REGRA} fill="${COR_DA_ARTE}"` +
    (tom ? ` mask="url(#fr-tom)"` : "") +
    `/></svg>`;

  const sobreABase = (largura: number) =>
    `<div style="position:relative;width:${largura}px;height:${(largura * 7) / 5}px">` +
    `<img src="${baseUri}" style="width:100%;height:100%;display:block">` +
    tracadoNaCorDaArte +
    `</div>`;

  const soAImagem = (u: string, largura: number) =>
    `<img src="${u}" style="width:${largura}px;height:${(largura * 7) / 5}px;display:block">`;

  /** O boneco do compositor, num tamanho. `ns` único por célula — a colisão de `id`. */
  /**
   * A PEÇA COM O TOM EM `data:` — e sem isto a folha desenha a barba PRETA.
   *
   * O compositor emite `<image href="/items/rosto/<slug>-tom.png">` dentro do
   * `<mask>` (`compositor.ts`, `pecaSobreposta`), que é o certo no produto: o
   * arquivo é servido, e embuti-lo no SVG custou 753 KB de gzip num ranking de 30
   * bonecos (ver `TomDaPeca`). Mas esta folha é um HTML montado por `setContent`,
   * **sem servidor**: uma URL de raiz não resolve, a máscara sai vazia, a forma de
   * cima cede por inteiro e sobra `var(--av-linha)` — a barba preta.
   *
   * A troca vale SÓ para a folha, e é por isso que ela mora aqui e não no
   * compositor. Medido em 2026-08-22, antes de o conserto entrar: 770.125 px
   * pretos na folha contra 598.851 com ele.
   *
   * ⚠️ Ela é a razão de a folha ser a única aprovação que existe (doc 23 §6). Com
   * a máscara vazia o instrumento de aprovação MENTE, e mente para o lado de
   * reprovar peça boa.
   */
  const pecaServida = peca.tom
    ? {
        ...peca,
        tom: {
          ...peca.tom,
          arte: `data:image/png;base64,${readFileSync(`public${peca.tom.arte}`).toString("base64")}`,
        },
      }
    : peca;

  const boneco = (ns: string, largura: number, cabelo?: string, careca = false) =>
    compor({
      pele: "#F0C9A5",
      cabelo: cabelo ?? CABELO[1],
      modeloCabelo: cabelo && !careca ? "chanel" : undefined,
      rosto: pecaServida,
      ns,
      escala: 1,
    }).replace("<svg ", `<svg width="${largura}" height="${Math.round((largura * 7) / 5)}" `);

  const COLUNAS: { rotulo: string; celula: (l: number, ns: string) => string }[] = [
    {
      rotulo: "arte — o PNG aprovado, recortado no viewBox",
      celula: (l) => soAImagem(arteUri, l),
    },
    {
      rotulo: "traçado — as 2 formas nas cores da arte, sobre a base",
      celula: (l) => sobreABase(l),
    },
    {
      // O CARECA COM UMA COR CLARA, e a escolha do loiro é deliberada.
      //
      // Este painel mostrava a barba na reserva `#262626` — e mostrava isso com
      // QUALQUER cor escolhida, porque `--av-cabelo` só era emitido quando havia
      // `modeloCabelo`. A barba do careca saía preta mesmo com loiro selecionado, os
      // dois SVGs eram byte a byte iguais, e a folha exibia o defeito como se fosse o
      // comportamento. Consertado em 2026-08-20 (`compositor.ts`, `recoloreComOCabelo`).
      //
      // O loiro fica aqui porque é a cor mais distante da reserva preta: se a
      // propriedade voltar a não ser emitida, este painel escurece de uma vez e
      // ninguém precisa comparar bytes para ver.
      rotulo: `compositor · CARECA · loiro ${CABELO[3]} (recolore SEM cabelo)`,
      celula: (l, ns) => boneco(ns, l, CABELO[3], true),
    },
    {
      rotulo: `compositor · chanel preto ${CABELO[0]}`,
      celula: (l, ns) => boneco(ns, l, CABELO[0]),
    },
    {
      rotulo: `compositor · chanel castanho ${CABELO[1]}`,
      celula: (l, ns) => boneco(ns, l, CABELO[1]),
    },
  ];

  const nav = await chromium.launch();

  // ------------------------------------------------- passo 1: os bitmaps REAIS
  //
  // Em DPR **1**, que é o pior caso: 32 CSS px viram 32 pixels de verdade. É este
  // bitmap que é ampliado depois — e é por isso que a ampliação parou de mentir.
  const pgReal = await nav.newPage({ deviceScaleFactor: 1 });
  const ampliar = async (b: Buffer) => {
    const m = await sharp(b).metadata();
    return uri(
      await sharp(b)
        .resize(AMPLIADO, Math.round((AMPLIADO * m.height!) / m.width!), { kernel: "nearest" })
        .png()
        .toBuffer(),
    );
  };
  const mini: { p32: string; p56: string; z32: string; z56: string }[] = [];
  for (let i = 0; i < COLUNAS.length; i++) {
    const capturar = async (l: number, ns: string) => {
      await pgReal.setContent(
        `<body style="margin:0;background:#FFF">` +
          `<div id="c" style="width:${l}px;line-height:0">${COLUNAS[i].celula(l, ns)}</div>`,
      );
      return (await pgReal.locator("#c").screenshot({ type: "png" })) as Buffer;
    };
    const b32 = await capturar(P32, `r32${i}`);
    const b56 = await capturar(P56, `r56${i}`);
    mini.push({ p32: uri(b32), p56: uri(b56), z32: await ampliar(b32), z56: await ampliar(b56) });
  }
  await pgReal.close();

  // ------------------------------------------------------- passo 2: a folha
  const par = (rot: string, src: string, larg: number) =>
    `<div><img src="${src}" style="width:${larg}px;display:block;image-rendering:pixelated">` +
    `<div style="font:11px system-ui;color:#777;margin-top:4px">${rot}</div></div>`;

  const coluna = (c: (typeof COLUNAS)[number], i: number) =>
    `<td style="vertical-align:top;padding:0 10px">` +
    `<div style="font:600 12px/1.35 system-ui;color:#333;height:32px">${c.rotulo}</div>` +
    c.celula(GRANDE, `g${i}`) +
    `<div style="display:flex;align-items:flex-end;gap:14px;margin-top:14px">` +
    par("32 px — o tamanho de julgamento", mini[i].p32, P32) +
    par("56 px", mini[i].p56, P56) +
    `</div>` +
    `<div style="display:flex;align-items:flex-end;gap:14px;margin-top:14px">` +
    par(`32 px · bitmap ampliado ${AMPLIADO / P32}×`, mini[i].z32, AMPLIADO) +
    par(`56 px · bitmap ampliado ${AMPLIADO / P56}×`, mini[i].z56, AMPLIADO) +
    `</div></td>`;

  const html =
    `<body style="margin:0;background:#FFF;padding:22px;width:max-content">` +
    `<div style="font:700 17px system-ui;color:#111;margin-bottom:4px">` +
    `${slug} — a arte contra o boneco montado</div>` +
    `<div style="font:13px/1.5 system-ui;color:#555;margin-bottom:16px">` +
    `as duas primeiras colunas são o mesmo recorte (px ${RECORTE.left}→${RECORTE.left + RECORTE.width} × ` +
    `${RECORTE.top}→${RECORTE.top + RECORTE.height}, que é o viewBox de 500×700). ` +
    `<b>o 32 px é o tamanho de julgamento de peça de cabeça</b> (doc 23 §6); ` +
    `as duas células de baixo são o BITMAP de 32 e 56 esticado por vizinho mais ` +
    `próximo — não é o vetor redesenhado grande. ` +
    `os números estão no terminal, não aqui.</div>` +
    `<table style="border-collapse:collapse"><tr>` +
    COLUNAS.map(coluna).join("") +
    `</tr></table></body>`;

  const pg = await nav.newPage({ deviceScaleFactor: 2 });
  await pg.setContent(html);
  const png = await pg.screenshot({ fullPage: true, type: "png" });
  await nav.close();

  const saida = `${PASTA}/folha-${slug}.png`;
  writeFileSync(saida, png);

  // ------------------------------------------------------------------- os números
  const p = await construirRosto(arte);
  const total = p.pxPeca;
  const bytes = peca.formas.reduce((a, f) => a + f.d.length, 0);

  console.log(`\nFOLHA DO ROSTO — ${slug}\n`);
  console.log(`  arte de origem       ${arte}`);
  console.log(`  peça                 ${total} px  ·  ${p.componentes} componente(s)`);
  console.log(
    `  esticão do tom       lum ${p.esticao.lo} → ${p.esticao.hi}  ` +
      `(p2/p98 desta arte; fora disso, grampeado)`,
  );
  console.log(
    `  máscara              ${p.tomPx.w}×${p.tomPx.h} px · ${p.tomPx.bytes} B de PNG` +
      `${peca.tom ? `  ·  servida em ${peca.tom.arte}` : ""}`,
  );
  console.log(`  descartado em ROSTO  ${p.pxNoRosto} px  (${((100 * p.pxNoRosto) / (total + p.pxNoRosto)).toFixed(2)}% da peça)`);
  console.log(
    `  \`d\` das 2 formas     ${bytes.toLocaleString("pt-BR")} bytes  ·  ` +
      `${peca.formas.map((f) => (f.d.match(/M/g) ?? []).length).join(" + ")} subcaminhos` +
      `${peca.formas[0].d === peca.formas[1].d ? "  (o mesmo `d` nas duas)" : "  <- os `d` DIVERGIRAM"}`,
  );
  console.log(`\n  escrito              ${saida}`);
  console.log(
    `\n  ⚠️  a leitura da folha vai por SUBAGENTE (doc 19 §11): a imagem fica no\n` +
      `      contexto dele, o thread principal recebe a descrição medida em texto.`,
  );
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
