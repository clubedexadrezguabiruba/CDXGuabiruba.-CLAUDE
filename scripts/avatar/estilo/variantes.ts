/**
 * A FOLHA DE VARIANTES — `npm run avatar:variantes`
 *
 * O forçador da skill `avatar-desenho`, e ele existe por causa de um defeito
 * concreto e recente: no Bloco 2a.1 os cinco cabelos foram desenhados em **uma**
 * versão cada, e depois consertados. O resultado é correto e é *o primeiro
 * resultado plausível, refinado* — que não é a mesma coisa que uma escolha.
 *
 * Três defeitos daquele bloco só apareceram quando alguém renderizou e olhou: o
 * moicano lia como pluma de capacete, o coque como boina, a trança como borrão.
 * Gate nenhum pegou, e gate nenhum poderia — nenhum deles é erro de número.
 *
 * Então este script não mede se a peça está bonita. Ele torna caro **não olhar** e
 * impossível **não divergir**.
 *
 * ---------------------------------------------------------------------------
 * AS QUATRO REPROVAÇÕES, E O QUE CADA UMA IMPEDE
 * ---------------------------------------------------------------------------
 *
 * 1. **Menos de três variantes.** Sem `MOTIVO_DE_DUAS` escrito no rascunho, sai
 *    com código 1. Entregar uma peça só é o comportamento que este script existe
 *    para tornar impossível.
 * 2. **Dois eixos iguais.** O eixo é a frase que diz em QUE a variante diverge.
 *    Duas iguais são uma variante escrita duas vezes.
 * 3. **Duas variantes que não se distinguem a 56 px.** Esta é a que vale: o eixo é
 *    prosa e prosa se escreve bonito, mas se dois desenhos diferem em menos de 5%
 *    dos pixels na miniatura, eles **são** a mesma direção — não importa o que a
 *    frase prometeu. É a mesma régua do gate (a) da `folha-base`, aplicada aqui
 *    contra o autoengano em vez de contra o catálogo.
 * 4. **Qualquer amarra estourada.** Divergência não desculpa variante mal-feita:
 *    uma que reprova não alarga a exploração, ela perde por execução e não ensina
 *    nada sobre a direção que representava. As três passam pelos mesmos gates.
 *
 * ---------------------------------------------------------------------------
 * O SELO, E O QUE ELE HONESTAMENTE PROVA
 * ---------------------------------------------------------------------------
 *
 * A folha carrega seis caracteres desenhados num canto, e eles **não são impressos
 * no terminal**. A skill exige que o relatório da crítica comece citando o selo.
 *
 * Ele prova que a imagem foi **aberta**. Não prova que foi bem julgada, e fingir o
 * contrário seria o mesmo autoengano que ele combate. O que justifica o mecanismo é
 * que o custo de abrir a imagem é praticamente o custo de olhar para ela — e o
 * defeito real do bloco passado não foi julgar mal, foi que os defeitos **só
 * aparecem renderizando**.
 */

import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import sharp from "sharp";
import { chromium } from "@playwright/test";
import { compor } from "../../../src/lib/avatar/estilo/compositor";
import {
  FOLGA_ROSTO,
  ORCAMENTO_COMPOSTO,
  ancoragemDasExtensoes,
  folgaDoRosto,
  type Cabelo,
} from "../../../src/lib/avatar/estilo/cabelo";
import { SANGRIA, VIEWBOX, bordasEm } from "../../../src/lib/avatar/estilo/geometria";
import { conferirSvg } from "../../../src/lib/avatar/svgContrato";
import { CABELO, PELE } from "../../../src/lib/avatar/palette";
import type { Traje } from "../../../src/lib/avatar/estilo/tipos";

/**
 * Uma direção candidata.
 *
 * `eixo` não é enfeite: é a frase que diz **em que** esta variante diverge das
 * outras, e é contra ela que a reprovação 2 mede. "Mais bonito" não é eixo;
 * "franja curta e volume atrás" é.
 */
export interface Variante {
  /** Nome que descreve a DIREÇÃO — "Domada", "Selvagem". Nunca "A", "B", "C". */
  nome: string;
  /** Em que ela diverge, numa frase. */
  eixo: string;
  cabelo?: Cabelo;
  traje?: Traje;
}

const DIAG = ".scratch/estilo";
const FOLHA = `${DIAG}/folha-variantes.png`;

/** Onde mora o rascunho. Efêmero de propósito — variante não vira catálogo sozinha. */
const RASCUNHO = process.env.VARIANTES ?? ".scratch/variantes.ts";

/** Os quatro tamanhos. 56 é o do ranking e é o que manda (regra 8 da §7). */
const TAMANHOS = [56, 100, 200, 425] as const;

/** O mesmo piso do gate (a): 5% dos pixels de 40×56, ou ~112 px. */
const PISO_DISTINCAO = 0.05;

const contarFormas = (svg: string) =>
  (svg.match(/<(path|ellipse|rect|circle|use)\b/g) ?? []).length;

/** O mesmo teto de `folha-base.ts` e do teste — um valor só, em `cabelo.ts`. */
const TETO_FORMAS = ORCAMENTO_COMPOSTO.formas;
const TETO_BYTES = ORCAMENTO_COMPOSTO.bytes;

interface Reprovacao {
  variante: string;
  detalhe: string;
}

/**
 * As amarras computáveis de uma variante.
 *
 * Para CABELO elas são completas, porque `Cabelo.extensoes` guarda pontos e não
 * path emitido — foi a troca feita no Bloco 2a.1 justamente para o gate enxergar a
 * peça. Para TRAJE elas são parciais, e o script diz isso em voz alta em vez de
 * ficar verde por vacuidade: `Traje.extensoes` ainda guarda `d: string`, então a
 * sobreposição ≥ SANGRIA que o `tipos.ts:65` promete não é medível daqui.
 */
function amarras(v: Variante, svg: string): string[] {
  const problemas: string[] = [];

  for (const p of conferirSvg(svg)) problemas.push(`contrato: ${p.detalhe}`);

  const formas = contarFormas(svg);
  const bytes = Buffer.byteLength(svg, "utf-8");
  if (formas > TETO_FORMAS) problemas.push(`${formas} formas contra o teto de ${TETO_FORMAS}`);
  if (bytes > TETO_BYTES) problemas.push(`${bytes} bytes contra o teto de ${TETO_BYTES}`);

  if (v.cabelo) {
    const f = folgaDoRosto(v.cabelo);
    const pior = Math.min(f.esq, f.dir);
    if (pior < FOLGA_ROSTO) {
      problemas.push(
        `folga do rosto ${pior.toFixed(1)} contra o piso de ${FOLGA_ROSTO} ` +
          `(esq ${f.esq === Infinity ? "—" : f.esq.toFixed(1)}, ` +
          `dir ${f.dir === Infinity ? "—" : f.dir.toFixed(1)})`,
      );
    }

    for (const [i, fundo] of ancoragemDasExtensoes(v.cabelo).entries()) {
      if (fundo < SANGRIA) {
        problemas.push(
          `extensão ${i + 1} ancora só ${fundo.toFixed(1)} dentro da cabeça ` +
            `(mínimo ${SANGRIA}) — ela lê como adesivo colado ao lado`,
        );
      }
    }

    const pontos = v.cabelo.pontos;
    if (pontos?.length) {
      for (const p of [pontos[0], pontos[pontos.length - 1]]) {
        const { esq, dir } = bordasEm(p.y);
        const x = esq + p.t * (dir - esq);
        if (x >= esq && x <= dir) {
          problemas.push(
            `ponta da franja em t=${p.t} cai DENTRO da silhueta — ` +
              `quem corta a lateral é o clipPath, não o cabelo`,
          );
        }
      }
    }
  }

  return problemas;
}

/** Seis caracteres que só existem dentro do PNG. Ver o docstring do topo. */
function gerarSelo(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    alfabeto[Math.floor(Math.random() * alfabeto.length)],
  ).join("");
}

async function main() {
  mkdirSync(DIAG, { recursive: true });

  const caminho = resolve(process.cwd(), RASCUNHO);
  let modulo: { VARIANTES?: Variante[]; MOTIVO_DE_DUAS?: string };
  try {
    modulo = await import(`file://${caminho.replace(/\\/g, "/")}`);
  } catch (e) {
    console.error(
      `não consegui ler o rascunho em ${RASCUNHO}\n` +
        `  ${String(e instanceof Error ? e.message : e)}\n\n` +
        `Ele precisa exportar VARIANTES: Variante[]. Exemplo mínimo:\n\n` +
        `  import type { Variante } from "../scripts/avatar/estilo/variantes";\n` +
        `  export const VARIANTES: Variante[] = [\n` +
        `    { nome: "Domada",  eixo: "franja reta, volume nenhum", cabelo: { ... } },\n` +
        `    { nome: "Selvagem", eixo: "recorte em festões, volume acima do crânio", cabelo: { ... } },\n` +
        `    { nome: "Presa",   eixo: "testa à mostra, massa atrás da cabeça", cabelo: { ... } },\n` +
        `  ];\n`,
    );
    process.exit(1);
  }

  const variantes = modulo.VARIANTES ?? [];
  const motivoDeDuas = modulo.MOTIVO_DE_DUAS;
  const reprovacoes: Reprovacao[] = [];

  // --- reprovação 1: quantas direções ---------------------------------------
  if (variantes.length < 2) {
    console.error(
      `${variantes.length} variante(s) declarada(s). O mínimo é 3.\n` +
        `Uma peça só é o primeiro resultado plausível, e refiná-lo não produz escolha.`,
    );
    process.exit(1);
  }
  if (variantes.length === 2 && !motivoDeDuas) {
    console.error(
      `2 variantes e nenhum MOTIVO_DE_DUAS declarado.\n\n` +
        `Duas é permitido quando a peça não comporta três eixos genuínos — um par de\n` +
        `óculos tem uma forma e dois tamanhos, não três direções. Mas o motivo tem de\n` +
        `estar escrito, e tem de dizer qual terceira direção foi descartada e por quê:\n\n` +
        `  export const MOTIVO_DE_DUAS = "...";\n`,
    );
    process.exit(1);
  }

  // --- reprovação 2: eixos repetidos ----------------------------------------
  const vistos = new Map<string, string>();
  for (const v of variantes) {
    const chave = v.eixo.trim().toLowerCase();
    const antes = vistos.get(chave);
    if (antes) {
      reprovacoes.push({
        variante: v.nome,
        detalhe: `eixo idêntico ao de "${antes}" — é uma variante escrita duas vezes`,
      });
    }
    vistos.set(chave, v.nome);
  }

  // --- compor e medir as amarras --------------------------------------------
  const compostos = variantes.map((v, i) => {
    const svg = compor({
      pele: PELE[1],
      cabelo: CABELO[0],
      modeloCabelo: v.cabelo,
      traje: v.traje,
      ns: `v${i}`,
    });
    return { v, svg, formas: contarFormas(svg), bytes: Buffer.byteLength(svg, "utf-8") };
  });

  console.log(`${variantes.length} variantes, de ${RASCUNHO}:\n`);
  for (const c of compostos) {
    const problemas = amarras(c.v, c.svg);
    for (const p of problemas) reprovacoes.push({ variante: c.v.nome, detalhe: p });
    console.log(
      `  ${c.v.nome.padEnd(14)} ${String(c.formas).padStart(2)} formas · ` +
        `${String(c.bytes).padStart(5)} B   ${problemas.length ? "✗" : "ok"}`,
    );
    console.log(`  ${"".padEnd(14)} eixo: ${c.v.eixo}`);
    for (const p of problemas) console.log(`  ${"".padEnd(14)} ✗ ${p}`);
  }

  if (compostos.some((c) => c.v.traje)) {
    console.log(
      `\n  ⚠ variante de TRAJE: a sobreposição ≥ ${SANGRIA} das extensões NÃO é medida aqui.\n` +
        `    \`Traje.extensoes\` guarda \`d: string\`, e path emitido não se mede. É a mesma\n` +
        `    correção que \`Cabelo.extensoes\` já recebeu (guardar pontos). Até lá, essa\n` +
        `    amarra é olho, não gate — e este aviso existe para ninguém achar que é gate.`,
    );
  }

  // --- a folha, e a distinção medida nela ------------------------------------
  const selo = gerarSelo();
  const nav = await chromium.launch();
  try {
    const pg = await nav.newPage();

    const em = (svg: string, h: number) =>
      svg.replace("<svg ", `<svg width="${Math.round((h * VIEWBOX.w) / VIEWBOX.h)}" height="${h}" `);

    // reprovação 3: distinção a 56 px, par a par
    const L = { w: Math.round((56 * VIEWBOX.w) / VIEWBOX.h), h: 56 };
    await pg.setViewportSize({ width: 120, height: 120 });
    const chapas: Buffer[] = [];
    for (const c of compostos) {
      await pg.setContent(`<body style="margin:0;background:#FFF">${em(c.svg, 56)}</body>`);
      const png = await pg.screenshot({ clip: { x: 0, y: 0, width: L.w, height: L.h } });
      chapas.push(await sharp(png).ensureAlpha().raw().toBuffer());
    }

    const dist = (a: Buffer, b: Buffer) => {
      let n = 0;
      for (let i = 0; i < a.length; i += 4) {
        const d = Math.max(
          Math.abs(a[i] - b[i]),
          Math.abs(a[i + 1] - b[i + 1]),
          Math.abs(a[i + 2] - b[i + 2]),
        );
        if (d > 24) n++;
      }
      return n / (a.length / 4);
    };

    console.log(`\ndistinção a 56 px (piso ${(PISO_DISTINCAO * 100).toFixed(0)}%):`);
    for (let i = 0; i < chapas.length; i++) {
      for (let j = i + 1; j < chapas.length; j++) {
        const d = dist(chapas[i], chapas[j]);
        const ruim = d < PISO_DISTINCAO;
        console.log(
          `  ${compostos[i].v.nome.padEnd(14)} × ${compostos[j].v.nome.padEnd(14)} ` +
            `${(d * 100).toFixed(2)}%${ruim ? "   ✗" : ""}`,
        );
        if (ruim) {
          reprovacoes.push({
            variante: `${compostos[i].v.nome} × ${compostos[j].v.nome}`,
            detalhe:
              `só ${(d * 100).toFixed(2)}% de pixels diferentes a 56 px. Os eixos prometem ` +
              `direções distintas e os desenhos são a mesma. Prosa não é divergência.`,
          });
        }
      }
    }

    // a folha
    const fig = (rot: string, dentro: string) =>
      `<figure style="margin:0;text-align:center">${dentro}` +
      `<figcaption style="font:10px system-ui;color:#777;margin-top:4px">${rot}</figcaption></figure>`;

    const colunas = compostos
      .map(
        (c) =>
          `<div style="display:flex;flex-direction:column;gap:10px;align-items:center;` +
          `border:1px solid #eee;border-radius:4px;padding:12px;background:#fff">` +
          `<div style="font:600 13px system-ui;color:#333">${c.v.nome}</div>` +
          `<div style="font:11px system-ui;color:#888;max-width:220px;text-align:center;` +
          `line-height:1.4;min-height:2.8em">${c.v.eixo}</div>` +
          TAMANHOS.map((t) => fig(`${t} px${t === 56 ? " · o ranking" : ""}`, em(c.svg, t))).join("") +
          `<div style="font:10px ui-monospace,monospace;color:#aaa">${c.formas} formas · ${c.bytes} B</div>` +
          `</div>`,
      )
      .join("");

    await pg.setViewportSize({ width: Math.max(900, 300 * compostos.length), height: 900 });
    await pg.setContent(
      `<body style="margin:0;background:#FAF8F3;padding:20px;font:12px system-ui;color:#555">` +
        `<div style="display:flex;justify-content:space-between;align-items:baseline">` +
        `<h1 style="font:600 16px system-ui;margin:0 0 4px">Variantes — o Doug escolhe</h1>` +
        `<div style="font:600 15px ui-monospace,monospace;color:#0F1A2E;letter-spacing:.18em;` +
        `border:1px solid #C9A84C;padding:4px 10px;border-radius:2px">${selo}</div>` +
        `</div>` +
        `<p style="margin:0 0 14px;color:#888">O que manda é a coluna de 56 px. ` +
        `Nenhuma está marcada como favorita de propósito.</p>` +
        `<div style="display:flex;gap:14px;align-items:flex-start">${colunas}</div>` +
        `</body>`,
    );
    await pg.screenshot({ path: FOLHA, fullPage: true });
  } finally {
    await nav.close();
  }

  writeFileSync(`${DIAG}/variantes.svg`, compostos.map((c) => c.svg).join("\n"));

  // O SELETOR VIVO lê ESTE arquivo, e é por isso que ele existe.
  //
  // A rota poderia importar o rascunho e compor por conta própria — e aí existiriam
  // duas composições, uma medida pelo gate e outra mostrada ao Doug, livres para
  // divergir. Publicando o SVG já composto, o que ele julga na tela é byte a byte o
  // que a folha mediu.
  //
  // Vai para `public/dev/`, que o `.gitignore` cobre: é artefato de rascunho, não
  // entra no repositório e não quebra o CI quando não existe — a rota trata a
  // ausência dizendo o que rodar.
  mkdirSync("public/dev", { recursive: true });
  writeFileSync(
    "public/dev/variantes.json",
    JSON.stringify(
      {
        selo,
        variantes: compostos.map((c) => ({
          nome: c.v.nome,
          eixo: c.v.eixo,
          formas: c.formas,
          bytes: c.bytes,
          svg: c.svg,
        })),
      },
      null,
      2,
    ),
  );

  console.log(`\n${FOLHA}`);
  console.log(`/dev/avatar-variantes  (public/dev/variantes.json)`);

  if (motivoDeDuas) {
    console.log(`\nDUAS variantes, e o motivo declarado é:\n  "${motivoDeDuas}"`);
  }

  if (reprovacoes.length) {
    console.error(`\n${reprovacoes.length} reprovação(ões):`);
    for (const r of reprovacoes) console.error(`  ✗ ${r.variante}: ${r.detalhe}`);
    process.exitCode = 1;
  } else {
    console.log(
      `\nAs ${variantes.length} passam nas amarras e se distinguem entre si.\n` +
        `Agora ABRA a folha e critique — o selo está nela, e o relatório começa citando ele.`,
    );
  }
}

main().catch((e) => {
  console.error(String(e instanceof Error ? e.message : e));
  process.exit(1);
});
