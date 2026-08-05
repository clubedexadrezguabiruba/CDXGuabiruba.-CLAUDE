/**
 * ROTA A — o line-art do conversor da Adobe.
 *
 * ---------------------------------------------------------------------------
 * O QUE ESTA ROTA ESPERA RECEBER, E POR QUE ELA NÃO ACEITA O `origem.svg`
 * ---------------------------------------------------------------------------
 *
 * O conversor devolve **dois** arquivos do mesmo PNG, e `16-uniformes-runbook.md`
 * §2.2 item 5 já mediu a diferença:
 *
 * | saída | o que é | serve para |
 * |---|---|---|
 * | **line-art** | o traço virado região preenchida, `fill="#000000"`, 3 a 6 paths | **medir forma — sim** |
 * | **colorido** | auto-trace de tudo, centenas de paths e de tons | nada — nem forma, nem cor |
 *
 * O `origem.svg` que está no repositório é o **colorido**: 437 paths, 520 subpaths,
 * 36 tons, e 81,5% deles viram `descarte` na curadoria. Esta rota recusa esse
 * arquivo por medição, e não por nome — se o que chegar tiver mais tons do que preto,
 * ela diz quantos e para.
 *
 * ---------------------------------------------------------------------------
 * O LADO DO TRAÇO: A ESCOLHA É POR NÚMERO, E OS DOIS SAEM MEDIDOS
 * ---------------------------------------------------------------------------
 *
 * O line-art é um **anel**: o traço virou região, então cada forma fechada tem uma
 * fronteira externa e uma interna, e o cabelo é o que está dentro. A máscara
 * congelada termina onde o **teal** termina, que é a borda INTERNA do anel — logo
 * `interno` é a leitura que compara duas descrições da mesma fronteira.
 *
 * `externo` fica disponível e é medido junto, porque a hipótese é testável: se o
 * conversor engordar o traço, `interno` encolhe a peça e `externo` a engorda, e o
 * IoU dos dois diz qual das duas hipóteses a arte confirma. **A escolha sai do
 * número, nunca desta prosa.**
 *
 * O anel mede 8 px de mediana nesta arte (3,76 unidades) — medido em `mascara.ts`,
 * e é a distância que separa as duas leituras.
 */

import { existsSync } from "fs";
import { lerSvg } from "../fonte-svg";
import type { MascaraCongelada } from "../mascara";
import { type Contorno, type OpcoesRota, type Rota, type Tracado } from "./rota";

/**
 * ONDE O LINE-ART MORA — ao lado da arte que o originou, versionado.
 *
 * A mesma pasta de `origem.svg` e `referencia.png`, pelo mesmo motivo: o insumo de
 * medição fica com a arte, e não em `.scratch/`, que o git ignora.
 */
export const LINE_ART_PADRAO =
  "scripts/avatar/fonte/estilo-kokeshi/cabelo/curto-espetada/line-art.svg";

/** Quantos tons diferentes de `fill` ainda deixam o arquivo ser line-art. */
const TONS_DE_LINE_ART = 2;

export const rotaLineArt: Rota = {
  nome: "line-art",
  origem: "line-art do conversor da Adobe (o traço virado região preenchida)",

  async tracar(mc: MascaraCongelada, opcoes: OpcoesRota = {}): Promise<Tracado> {
    const arquivo = String(opcoes.arquivo ?? LINE_ART_PADRAO);
    if (!existsSync(arquivo)) {
      throw new Error(
        `a rota line-art precisa do arquivo e ele não existe: ${arquivo}\n` +
          `\n` +
          `O que exportar, no conversor da Adobe, a partir da MESMA arte\n` +
          `(.scratch/estilo/gerado/curto-espetada.png):\n` +
          `  · a saída LINE-ART, não a colorida — a colorida é o \`origem.svg\` que já está\n` +
          `    no repositório, com 437 paths e 36 tons, e a documentação deste projeto já a\n` +
          `    declarava inútil ("nem forma, nem cor");\n` +
          `  · o line-art tem \`fill="#000000"\` e de 3 a 6 paths;\n` +
          `  · salvar exatamente em ${arquivo}.\n` +
          `\n` +
          `Enquanto ele não chega, a rota potrace corre sozinha — é de propósito (plano §10).`,
      );
    }

    const svg = lerSvg(arquivo);
    const tons = new Set(svg.paths.map((p) => p.fill.toLowerCase()));
    if (tons.size > TONS_DE_LINE_ART) {
      throw new Error(
        `${arquivo}: ${svg.paths.length} paths em ${tons.size} tons — isto é a saída COLORIDA, ` +
          `não o line-art.\nTons: ${[...tons].slice(0, 8).join(" ")}${tons.size > 8 ? " …" : ""}\n` +
          `O line-art tem um tom só (\`#000000\`) e de 3 a 6 paths. Ver o topo de rotas/line-art.ts.`,
      );
    }

    // Do `viewBox` do conversor para o pixel do raster da máscara. Exata: as duas
    // alturas são conhecidas, e é a mesma conversão que `--ancoras` faz.
    const k = mc.h / svg.vb.h;
    const kx = mc.w / svg.vb.w;
    if (Math.abs(kx / k - 1) > 0.001) {
      throw new Error(
        `${arquivo}: viewBox ${svg.vb.w}×${svg.vb.h} não tem a proporção da máscara ` +
          `${mc.w}×${mc.h} (kx/ky = ${(kx / k).toFixed(4)}). Reexportar sem recortar.`,
      );
    }

    const todos: Contorno[] = svg.paths
      .flatMap((p) => p.subpaths)
      .filter((s) => !s.eMoldura)
      .map((s) => ({ pts: s.pts.map((q) => ({ x: q.x * k, y: q.y * k })), area: s.area * k * k }))
      .sort((a, b) => Math.abs(b.area) - Math.abs(a.area));

    if (!todos.length) throw new Error(`${arquivo}: nenhum subpath útil depois de tirar a moldura.`);

    /**
     * `interno` = os subpaths com orientação OPOSTA à do maior.
     *
     * Num anel preenchido por `nonzero`/`evenodd`, o contorno externo e o buraco têm
     * sinais de área opostos — é a mesma propriedade que `fonte-svg.ts` usa para
     * separar moldura de peça, lida pelo sinal em vez do tamanho.
     */
    const lado = String(opcoes.lado ?? "interno");
    const sinalDoMaior = Math.sign(todos[0].area);
    const internos = todos.filter((c) => Math.sign(c.area) !== sinalDoMaior);
    const externos = todos.filter((c) => Math.sign(c.area) === sinalDoMaior);
    const contornos = lado === "externo" ? externos : internos.length ? internos : externos;

    const pontos = contornos.reduce((a, c) => a + c.pts.length, 0);

    return {
      rota: `line-art:${lado}`,
      hashDaMascara: mc.hash,
      contornos,
      pontos,
      laudo: [
        `line-art · ${arquivo} · ${svg.mtime}`,
        `  viewBox ${svg.vb.w}×${svg.vb.h} · ${svg.paths.length} paths · ` +
          `${todos.length} subpaths úteis · ${tons.size} tom(ns) · escala ${k.toFixed(4)}`,
        `  lado ${lado} — ${externos.length} contorno(s) externo(s) · ${internos.length} interno(s)`,
        `  entregues ${contornos.length} contorno(s) · ${pontos} pontos`,
        internos.length
          ? `  o anel: o traço mede ${mc.traco.medianaPx} px de mediana (${mc.traco.medianaU.toFixed(2)} u), ` +
            `que é a distância entre as duas leituras`
          : `  ⚠ nenhum subpath com orientação oposta: este line-art não veio como anel. ` +
            `\`interno\` caiu para \`externo\`, e o viés de meio traço fica declarado.`,
      ],
    };
  },
};
