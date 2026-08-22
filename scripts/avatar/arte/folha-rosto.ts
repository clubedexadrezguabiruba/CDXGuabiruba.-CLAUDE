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
const P56 = 56;
/** O 56 px ampliado, para o olho ver o que a redução fez. Vizinho mais próximo. */
const ZOOM = 4;

/** A cor que o gerador pintou na massa da `cheia`, medida por `reparo-cheia-um-tom.ts`. */
const COR_DA_ARTE = "#2AA8A9";

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
    `<path d="${peca.formas[0].d}" fill="#000"/>` +
    `<path d="${peca.formas[1].d}" fill="${COR_DA_ARTE}"` +
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

  const coluna = (c: (typeof COLUNAS)[number], i: number) =>
    `<td style="vertical-align:top;padding:0 10px">` +
    `<div style="font:600 12px/1.35 system-ui;color:#333;height:32px">${c.rotulo}</div>` +
    c.celula(GRANDE, `g${i}`) +
    `<div style="display:flex;align-items:flex-end;gap:14px;margin-top:14px">` +
    `<div>${c.celula(P56, `p${i}`)}` +
    `<div style="font:11px system-ui;color:#777;margin-top:4px">56 px</div></div>` +
    `<div style="image-rendering:pixelated;transform-origin:top left">` +
    `<div style="width:${P56 * ZOOM}px;height:${Math.round((P56 * 7) / 5) * ZOOM}px;overflow:hidden">` +
    `<div style="transform:scale(${ZOOM});transform-origin:top left;image-rendering:pixelated">` +
    c.celula(P56, `z${i}`) +
    `</div></div>` +
    `<div style="font:11px system-ui;color:#777;margin-top:4px">56 px, ampliado ${ZOOM}×</div>` +
    `</div></div></td>`;

  const html =
    `<body style="margin:0;background:#FFF;padding:22px;width:max-content">` +
    `<div style="font:700 17px system-ui;color:#111;margin-bottom:4px">` +
    `${slug} — a arte contra o boneco montado</div>` +
    `<div style="font:13px/1.5 system-ui;color:#555;margin-bottom:16px">` +
    `as duas primeiras colunas são o mesmo recorte (px ${RECORTE.left}→${RECORTE.left + RECORTE.width} × ` +
    `${RECORTE.top}→${RECORTE.top + RECORTE.height}, que é o viewBox de 500×700). ` +
    `os números estão no terminal, não aqui.</div>` +
    `<table style="border-collapse:collapse"><tr>` +
    COLUNAS.map(coluna).join("") +
    `</tr></table></body>`;

  const nav = await chromium.launch();
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
