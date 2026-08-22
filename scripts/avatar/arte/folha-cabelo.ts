/**
 * A FOLHA DE CONTATO DO SLOT `cabelo` — a arte original contra o boneco montado.
 *
 * É a gêmea de `arte:folha-rosto`, e a diferença entre as duas é UMA coluna: o
 * cabelo divide o crânio com a **barba**, e é esse par que precisa ser julgado. A
 * `rosto-barba-trancada` foi aprovada em 2026-08-22 (*"ficou perfeito, a melhor
 * arte"*) e come 22,4% da silhueta sob o `chanel` — refazer o cabelo muda a leitura
 * dela, e quem decide isso é o olho do Doug, não uma régua. Então toda folha de
 * cabelo mostra o par.
 *
 * As cinco colunas:
 *
 *  1. **arte** — o PNG aprovado, recortado no `viewBox`;
 *  2. **traçado** — as duas formas nas cores que o gerador pintou, com a máscara de
 *     tom, sobre a mesma base e no mesmo recorte. Lado a lado com a 1, a diferença
 *     é de desenho, não de cor;
 *  3. **compositor · só o cabelo** — o que o produto emite, sem barba;
 *  4. **compositor · cabelo + trancada** — o par crítico, na mesma cor;
 *  5. **compositor · cabelo + trancada, outra cor** — a peça recolore, e as duas
 *     cores mais distantes da escada mostram se o tom continua lendo.
 *
 * O recorte das duas primeiras colunas é **px 212→812 × 92→932** da base de edição,
 * que é exatamente o `viewBox` de 500 × 700 do compositor. Não é enquadramento
 * escolhido: é a mesma janela, então as cinco colunas caem no mesmo lugar e a
 * comparação é conta e não ajuste.
 *
 * ---------------------------------------------------------------------------
 * A PEÇA VEM DA ESTEIRA, E O LITERAL É CONFERIDO CONTRA ELA
 * ---------------------------------------------------------------------------
 *
 * `folha-rosto.ts` lê a peça do catálogo e embute o PNG de tom lendo o arquivo de
 * `public/`. Aqui a peça é construída pela esteira (`construirPecaTonal`) e o PNG sai do
 * BUFFER que ela devolveu — o que apaga por construção o primeiro dos dois defeitos
 * daquela folha (o `href="/items/…"` que não resolve num HTML sem servidor).
 *
 * E quando a peça JÁ está em `CABELOS_DA_ARTE`, o `d` das duas é comparado e a
 * folha **se recusa a desenhar** se divergirem. É o controle 6 de `arte:revisao`,
 * pelo mesmo motivo: o defeito nº 1 desta rota é o produto desenhar uma peça e a
 * folha julgar outra.
 *
 * Isto é o que permite a folha rodar **antes** de qualquer promoção — que é o
 * estado do Bloco A, com `CABELOS_DA_ARTE` vazio de propósito.
 *
 * **Todo número sai no terminal, nunca na imagem** (doc 19 §11): número em imagem
 * não é copiável nem buscável.
 *
 * Uso: npm run arte:folha-cabelo [chave]     (chave = nome do PNG sem extensão)
 */
import { readFileSync, writeFileSync } from "fs";

import { chromium } from "@playwright/test";
import sharp from "sharp";

import { ROSTOS } from "../../../src/lib/avatar/catalogo";
import type { Cabelo } from "../../../src/lib/avatar/estilo/cabelo";
import { CABELOS_DA_ARTE } from "../../../src/lib/avatar/estilo/cabelos-da-arte";
import { compor } from "../../../src/lib/avatar/estilo/compositor";
import { CABELO } from "../../../src/lib/avatar/palette";
import { ESCALA, ORIGEM, PASTA, PNG_BASE } from "./base";
import { construirPecaTonal } from "./barba-para-formas";

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
 * Doc 23 §6: peça de **cabeça** — chapéu, rosto, cabelo, óculos — julga-se a
 * **32 px**, porque a cabeça ocupa ~metade da altura do boneco; os 56 px são o
 * tamanho do BONECO no ranking, e servem para o traje. Os dois ficam lado a lado: o
 * 56 continua útil para ver a peça no contexto do boneco inteiro.
 */
const P32 = 32;
const P56 = 56;

/**
 * A AMPLIAÇÃO — 224 px, e ela estica o BITMAP em vez de redesenhar o SVG.
 *
 * ⚠️ `transform: scale(4)` sobre um SVG faz o navegador **re-rasterizar o vetor no
 * tamanho grande**, então a célula mostraria detalhe que o tamanho real não tem —
 * quem aprovasse por ela estaria aprovando uma peça que a 32 px vira mancha. Achado
 * na folha do rosto em 2026-08-22, e esta folha já nasce com o conserto.
 *
 * Os bitmaps de 32 e 56 px são capturados ANTES, em DPR 1 (que é o pior caso real),
 * e ampliados por vizinho mais próximo no `sharp`. 224 é múltiplo dos dois — 32 × 7
 * e 56 × 4 —, então as duas colunas de ampliação saem com a MESMA largura.
 */
const AMPLIADO = 224;

/** A cor instrumental que a quarta saída da rota (`restaurar-peca.ts`) deixa na arte. */
const COR_DA_ARTE = "#2AA8A9";

/** A peça de rosto do par crítico — a única barba aprovada, 2026-08-22. */
const BARBA_DO_PAR = "rosto-barba-trancada";

/**
 * A MESMA REGRA DE PREENCHIMENTO DO COMPOSITOR (`compositor.ts`, `sobrepor()`).
 *
 * A silhueta é um `d` com vários subcaminhos — o contorno externo mais uma janela
 * por feição. `evenodd` é o que faz a janela ser buraco; sem ela o navegador
 * preenche, e a coluna do traçado desenha a boca PRETA. Foi exatamente o que faltou
 * na folha do rosto em 2026-08-22, e o Doug pegou a olho.
 */
const REGRA = ` fill-rule="evenodd"`;

const uri = (b: Buffer) => `data:image/png;base64,${b.toString("base64")}`;

async function principal(): Promise<void> {
  const chave = process.argv[2];
  if (!chave) {
    console.error("uso: npm run arte:folha-cabelo <chave>   (o nome do PNG sem extensão)");
    console.error(`  promovidas: ${Object.keys(CABELOS_DA_ARTE).join(", ") || "(nenhuma ainda)"}`);
    process.exit(2);
  }
  const arte = `${PASTA}/${chave}.png`;

  // A PEÇA SAI DA ESTEIRA — a mesma função que `arte:cabelos` chama.
  const p = await construirPecaTonal(arte, "cabelo");
  const peca: Cabelo = {
    id: chave as Cabelo["id"],
    nome: chave,
    tonal: {
      formas: p.formas,
      // O PNG entra EMBUTIDO, e é a única coisa nesta folha que difere do produto: a
      // folha é um HTML montado por `setContent`, sem servidor, e um
      // `href="/items/…"` não resolveria — a máscara sairia vazia, a forma de cima
      // cederia por inteiro e sobraria `var(--av-linha)`: o cabelo PRETO. O produto
      // serve o mesmo arquivo por url.
      tom: { ...p.tom, arte: uri(p.tom.png) },
    },
  };

  // O LITERAL, QUANDO EXISTE, É CONFERIDO — e a folha se recusa a desenhar se divergir.
  const promovida = CABELOS_DA_ARTE[chave];
  if (promovida?.tonal) {
    const divergiu = promovida.tonal.formas.some((f, i) => f.d !== p.formas[i]?.d);
    if (divergiu || promovida.tonal.formas.length !== p.formas.length) {
      console.error(
        `  ✗ ${chave} está em CABELOS_DA_ARTE e o \`d\` dela NÃO bate com o que a esteira\n` +
          `    produz agora. A folha julgaria uma peça e o produto desenharia outra —\n` +
          `    o defeito nº 1 desta rota. Rode \`npm run arte:cabelos\` e confira o diff.`,
      );
      process.exit(1);
    }
  }

  /** A peça do par: a barba aprovada, com o tom embutido pelo mesmo motivo. */
  const barba = ROSTOS[BARBA_DO_PAR];
  if (!barba?.tom) {
    console.error(`  ✗ ${BARBA_DO_PAR} não está em ROSTOS com tom — o par não pode ser montado.`);
    process.exit(1);
  }
  const barbaServida = { ...barba, tom: { ...barba.tom, arte: uri(readFileSync(`public${barba.tom.arte}`)) } };

  // ------------------------------------------------------------------ as células
  const recorteDe = (caminho: string) => sharp(caminho).extract(RECORTE).png().toBuffer();
  const arteUri = uri(await recorteDe(arte));
  const baseUri = uri(await recorteDe(PNG_BASE));

  /**
   * As duas formas, nas cores da própria arte — a coluna da fidelidade.
   *
   * **Ela aplica a MÁSCARA DE TOM**, e sem isso a coluna mentiria: as duas formas
   * têm o mesmo `d`, então desenhá-las cruas pinta uma mancha chapada da cor de cima
   * e some com o claro-escuro inteiro. O painel existe para comparar traçado com
   * arte — comparar contra uma mancha não responde nada.
   */
  const tom = peca.tonal!.tom;
  const tracadoNaCorDaArte =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 700" ` +
    `style="position:absolute;inset:0;width:100%;height:100%">` +
    `<defs><mask id="fc-tom" maskUnits="userSpaceOnUse" ` +
    `x="${tom.x}" y="${tom.y}" width="${tom.w}" height="${tom.h}">` +
    `<image href="${tom.arte}" ` +
    `x="${tom.x}" y="${tom.y}" width="${tom.w}" height="${tom.h}" ` +
    `preserveAspectRatio="none"/></mask></defs>` +
    // ⚠️ `fill-rule="evenodd"` NÃO É DETALHE — sem ele as JANELAS DE FEIÇÃO somem.
    // Ver `REGRA` acima: é o defeito de 2026-08-22 da folha do rosto, e o compositor
    // sempre emitiu a regra. Quem esquece é a cópia à mão.
    `<path d="${peca.tonal!.formas[0].d}"${REGRA} fill="#000"/>` +
    `<path d="${peca.tonal!.formas[1].d}"${REGRA} fill="${COR_DA_ARTE}" mask="url(#fc-tom)"/>` +
    `</svg>`;

  const sobreABase = (largura: number) =>
    `<div style="position:relative;width:${largura}px;height:${(largura * 7) / 5}px">` +
    `<img src="${baseUri}" style="width:100%;height:100%;display:block">` +
    tracadoNaCorDaArte +
    `</div>`;

  const soAImagem = (u: string, largura: number) =>
    `<img src="${u}" style="width:${largura}px;height:${(largura * 7) / 5}px;display:block">`;

  /** O boneco do compositor, num tamanho. `ns` único por célula — a colisão de `id`. */
  const boneco = (ns: string, largura: number, cor: string, comBarba: boolean) =>
    compor({
      pele: "#F0C9A5",
      cabelo: cor,
      modeloCabelo: peca,
      rosto: comBarba ? barbaServida : undefined,
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
      rotulo: `compositor · SÓ O CABELO · castanho ${CABELO[1]}`,
      celula: (l, ns) => boneco(ns, l, CABELO[1], false),
    },
    {
      // O PAR CRÍTICO, e ele é a razão desta folha ter cinco colunas e não quatro.
      // A `rosto-barba-trancada` já está aprovada; o cabelo novo pode estragá-la.
      rotulo: `compositor · + trancada · castanho ${CABELO[1]}`,
      celula: (l, ns) => boneco(ns, l, CABELO[1], true),
    },
    {
      // A segunda cor é o LOIRO por ser a mais distante da reserva preta `#262626`:
      // se `--av-cabelo` deixar de ser emitida, este painel escurece de uma vez e
      // ninguém precisa comparar bytes para ver.
      rotulo: `compositor · + trancada · loiro ${CABELO[3]}`,
      celula: (l, ns) => boneco(ns, l, CABELO[3], true),
    },
  ];

  const nav = await chromium.launch();

  // ------------------------------------------------- passo 1: os bitmaps REAIS
  //
  // Em DPR **1**, que é o pior caso: 32 CSS px viram 32 pixels de verdade. É este
  // bitmap que é ampliado depois — e é por isso que a ampliação não mente.
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
    const b32 = await capturar(P32, `c32${i}`);
    const b56 = await capturar(P56, `c56${i}`);
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
    `cabelo-${chave} — a arte contra o boneco montado` +
    `${promovida ? "" : "  ·  NÃO PROMOVIDA (ainda fora de CABELOS_DA_ARTE)"}</div>` +
    `<div style="font:13px/1.5 system-ui;color:#555;margin-bottom:16px">` +
    `as duas primeiras colunas são o mesmo recorte (px ${RECORTE.left}→${RECORTE.left + RECORTE.width} × ` +
    `${RECORTE.top}→${RECORTE.top + RECORTE.height}, que é o viewBox de 500×700). ` +
    `<b>o 32 px é o tamanho de julgamento de peça de cabeça</b> (doc 23 §6); ` +
    `as duas células de baixo são o BITMAP de 32 e 56 esticado por vizinho mais ` +
    `próximo — não é o vetor redesenhado grande. ` +
    `as colunas 4 e 5 trazem a <b>${BARBA_DO_PAR}</b>, que já está aprovada. ` +
    `os números estão no terminal, não aqui.</div>` +
    `<table style="border-collapse:collapse"><tr>` +
    COLUNAS.map(coluna).join("") +
    `</tr></table></body>`;

  const pg = await nav.newPage({ deviceScaleFactor: 2 });
  await pg.setContent(html);
  const png = await pg.screenshot({ fullPage: true, type: "png" });
  await nav.close();

  const saida = `${PASTA}/folha-cabelo-${chave}.png`;
  writeFileSync(saida, png);

  // ------------------------------------------------------------------- os números
  const bytes = p.formas.reduce((a, f) => a + f.d.length, 0);

  console.log(`\nFOLHA DO CABELO — ${p.slug}\n`);
  console.log(`  arte de origem       ${arte}`);
  console.log(`  no literal           ${promovida ? "sim — `d` confere com a esteira" : "NÃO — ainda não promovida"}`);
  console.log(`  peça                 ${p.pxPeca} px  ·  ${p.componentes} componente(s)`);
  console.log(
    `  esticão do tom       lum ${p.esticao.lo} → ${p.esticao.hi}  ` +
      `(p2/p98 desta arte; fora disso, grampeado)`,
  );
  console.log(`  máscara              ${p.tomPx.w}×${p.tomPx.h} px · ${p.tomPx.bytes} B de PNG`);
  console.log(
    `  descartado nas FEIÇÕES ${p.pxNoRosto} px  ` +
      `(${((100 * p.pxNoRosto) / (p.pxPeca + p.pxNoRosto)).toFixed(2)}% da peça)`,
  );
  console.log(`  figurinha (2c)       ${p.pxPreenchidos} px de furo preenchido · ${p.janelasDeFeicao} janela(s) de feição`);
  console.log(
    `  \`d\` das 2 formas     ${bytes.toLocaleString("pt-BR")} bytes  ·  ` +
      `${p.formas.map((f) => (f.d.match(/M/g) ?? []).length).join(" + ")} subcaminhos` +
      `${p.formas[0].d === p.formas[1].d ? "  (o mesmo `d` nas duas)" : "  <- os `d` DIVERGIRAM"}`,
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
