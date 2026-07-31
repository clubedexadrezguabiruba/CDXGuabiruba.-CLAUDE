/**
 * GATE DE PROVENIÊNCIA — de que camada veio cada pixel.
 *
 * `npm run avatar:proveniencia`
 *
 * O DEFEITO que ele existe para pegar: pixels claros no vão entre braço e tronco,
 * na altura do cinto. Fundo claro esconde (o macacão da base é bege e o painel
 * também), magenta revela. Nenhum gate anterior via: o de halo mede a faixa de
 * transição do ASSET isolado, e o macacão não está no asset — está na base, por
 * baixo dele. Contagem global também não veria: são poucos milhares de pixels
 * num quadro de 9,8 milhões.
 *
 * COMO ELE PROVA: renderiza a composição REAL — a mesma função que o gerador usa —
 * com cada camada repintada numa cor impossível de confundir. A cor que aparecer
 * na região É a proveniência. Não há inferência no meio.
 *
 * O QUE É PROIBIDO, com tolerância ZERO, inclusive em alfa parcial:
 *  - `av-roupa` visível     — o macacão da base sob um avatar vestido
 *  - `av-forro-roupa` visível
 *  - `av-forro-pele` dentro de `corpoVestido` — forro de pele em região vestida
 *
 * E o VÃO LEGÍTIMO entre braço e tronco tem de mostrar **só o fundo da página**:
 * nem uniforme, nem roupa da base, nem forro. Sem esse segundo gate, "consertar"
 * o resíduo preenchendo o vão inteiro passaria.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { chromium, type Browser, type Page } from "@playwright/test";
import {
  BASE_H,
  BASE_W,
  area,
  derivarMascaras,
  dilatar,
  erodir,
  recortesFundoNaMao,
  recortesLegado,
  subtrair,
  type Mascara,
} from "./mascara-base";
import { larguraDe, lerUniforme } from "./uniforme";
import { SENTINELA, composicao } from "./composicao";
import { SENTINELA_BASE, baseSentinela } from "./sentinela";
import { ID_SEM_TRAJE, SAIDA } from "./gerar-base-sem-traje";

const DIAG = ".scratch/proveniencia";
const BASE_SVG = "public/items/base/avatar-base-neutro.svg";

/** Altura de análise. 1920 é a variante grande — o defeito precisa sumir lá. */
const ALTURA = 1920;

/** Todas as sentinelas, com o veredito de cada uma. */
export const CAMADAS = [
  { nome: "av-roupa (macacão da base)", cor: SENTINELA_BASE["av-roupa"], proibida: true },
  { nome: "av-forro-roupa (forro de pano)", cor: SENTINELA_BASE["av-forro-roupa"], proibida: true },
  { nome: "av-forro-pele (forro de pele)", cor: SENTINELA_BASE["av-forro-pele"], proibida: "corpoVestido" as const },
  { nome: "av-pele (pele da base)", cor: SENTINELA_BASE["av-pele"], proibida: false },
  // AS DUAS CAMADAS DO ASSET SOBRE A PELE PRÓPRIA — a outra direção do gate.
  // Tudo acima é camada da BASE, e pergunta "a base vazou para cima?". Estas duas
  // perguntam "o asset cobriu o que não devia?", e por não existirem o fundo de
  // segurança pintou chapado sobre as mãos e o pescoço por uma fase inteira.
  { nome: "fundo de segurança do uniforme", cor: SENTINELA.fundo, proibida: "peleExposta" as const },
  { nome: "oclusão do pé", cor: SENTINELA.oclusao, proibida: false },
  { nome: "arte do uniforme", cor: SENTINELA.arte, proibida: "peleExposta" as const },
] as const;

export interface Componente {
  camada: string;
  px: number;
  bb: [number, number, number, number];
  centro: [number, number];
}

export interface Achados {
  porCamada: Record<string, number>;
  proibidos: Record<string, number>;
  componentes: Componente[];
  vaoSujo: number;
  vaoArea: number;
}

/**
 * A PILHA DE RUNTIME, exatamente como a página monta: `<use>` da base mais UM
 * `<image>`. É de propósito que o `<style>` que tentava esconder o macacão venha
 * junto — o gate tem de medir o que o navegador faz, não o que o código pretende.
 */
function pilhaRuntime(folha: string, idBase: string, asset: string, comEstilo: boolean): string {
  return (
    `<body style="margin:0">` +
    `<div aria-hidden style="position:absolute;width:0;height:0">${folha}</div>` +
    (comEstilo ? `<style>.vestido .av-roupa,.vestido .av-forro-roupa{display:none}</style>` : "") +
    `<svg class="vestido" xmlns="http://www.w3.org/2000/svg" width="${larguraDe(ALTURA)}" height="${ALTURA}" ` +
    `viewBox="0 0 ${BASE_W} ${BASE_H}" style="--av-pele:${SENTINELA_BASE["av-pele"]};--av-cabelo:#3A2F2A">` +
    `<use href="#${idBase}" x="0" y="0" width="${BASE_W}" height="${BASE_H}"/>` +
    (asset ? `<image href="${asset}" x="0" y="0" width="${BASE_W}" height="${BASE_H}"/>` : "") +
    `</svg></body>`
  );
}

/**
 * Classifica cada pixel pela sentinela exata e acha os componentes conectados.
 *
 * Tolerância de 10 por canal, não zero: o Chromium interpola a borda de cada
 * forma. Mas o alfa é conferido em separado com tolerância REAL de zero — um
 * pixel de alfa 1 da camada proibida já reprova, e é assim que o vão fica limpo.
 */
async function classificar(
  pg: Page,
  tiro: Buffer,
  camadas: readonly { nome: string; cor: string }[],
  mascaras: { vestido: number[]; vao: number[]; pele: number[]; mw: number; mh: number },
) {
  return pg.evaluate(
    async ([defs, mk, b64]) => {
      const lista = defs as { nome: string; cor: string }[];
      const M = mk as { vestido: number[]; vao: number[]; pele: number[]; mw: number; mh: number };
      const alvo = lista.map((c) => [1, 3, 5].map((i) => parseInt(c.cor.slice(i, i + 2), 16)));

      // O SCREENSHOT DA PÁGINA, não uma re-serialização do <svg>. Serializar o
      // <svg> sozinho quebra o `<use href="#avatar-base-neutro">`, que aponta
      // para um elemento FORA dele — e a base inteira sai do quadro em silêncio,
      // dando "0 px de av-pele" num boneco que tem rosto e mãos à mostra.
      const img = new Image();
      img.src = "data:image/png;base64," + (b64 as string);
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const cx = c.getContext("2d", { willReadFrequently: true })!;
      cx.drawImage(img, 0, 0);
      const d = cx.getImageData(0, 0, c.width, c.height).data;
      const W = c.width, H = c.height;

      // rotulo: -1 = fundo da pagina, senao indice da camada
      const rot = new Int8Array(W * H).fill(-1);
      const conta = new Array(lista.length).fill(0);
      let vaoSujo = 0, vaoArea = 0;
      const noVaoPorCamada = new Array(lista.length).fill(0);
      const dentroVestido = new Uint8Array(W * H);
      // A REGIÃO DA PELE PRÓPRIA. Terceira máscara espacializada, e a primeira que
      // aponta para o outro sentido: `vestido` e `vao` perguntam "a base vazou para
      // cima?"; esta pergunta "o asset cobriu o que não devia?".
      const dentroPele = new Uint8Array(W * H);
      const naPelePorCamada = new Array(lista.length).fill(0);
      let peleArea = 0;
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const p = y * W + x;
          const mx = Math.min(M.mw - 1, Math.floor((x / W) * M.mw));
          const my = Math.min(M.mh - 1, Math.floor((y / H) * M.mh));
          dentroVestido[p] = M.vestido[my * M.mw + mx];
          dentroPele[p] = M.pele[my * M.mw + mx];
          if (dentroPele[p]) peleArea++;
          const noVao = M.vao[my * M.mw + mx];
          if (noVao) vaoArea++;
          const i = p * 4;
          if (d[i + 3] === 0) continue;
          let melhor = -1, dist = 31;
          for (let k = 0; k < alvo.length; k++) {
            const dd = Math.abs(d[i] - alvo[k][0]) + Math.abs(d[i + 1] - alvo[k][1]) + Math.abs(d[i + 2] - alvo[k][2]);
            if (dd < dist) { dist = dd; melhor = k; }
          }
          if (melhor < 0) continue;
          rot[p] = melhor;
          conta[melhor]++;
          if (noVao) { vaoSujo++; noVaoPorCamada[melhor]++; }
          if (dentroPele[p]) naPelePorCamada[melhor]++;
        }

      // componentes conectados por rotulo, 4-vizinhos, fila explicita
      const visto = new Uint8Array(W * H);
      const comps: { camada: number; px: number; naPele: number; bb: number[] }[] = [];
      const fila = new Int32Array(W * H);
      for (let p0 = 0; p0 < W * H; p0++) {
        if (visto[p0] || rot[p0] < 0) continue;
        const lab = rot[p0];
        let ini = 0, fim = 0;
        fila[fim++] = p0;
        visto[p0] = 1;
        let n = 0, naPele = 0, x0 = W, y0 = H, x1 = -1, y1 = -1;
        while (ini < fim) {
          const p = fila[ini++];
          const x = p % W, y = (p / W) | 0;
          n++;
          if (dentroPele[p]) naPele++;
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
          const viz = [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1];
          for (const q of viz) if (q >= 0 && !visto[q] && rot[q] === lab) { visto[q] = 1; fila[fim++] = q; }
        }
        comps.push({ camada: lab, px: n, naPele, bb: [x0, y0, x1, y1] });
      }

      // mapa so dos residuos das camadas proibidas
      const mapa = cx.createImageData(W, H);
      const md = mapa.data;
      for (let p = 0; p < W * H; p++) {
        const k = rot[p];
        const i = p * 4;
        if (k < 0) { md[i] = 24; md[i + 1] = 24; md[i + 2] = 28; md[i + 3] = 255; continue; }
        // Os índices seguem CAMADAS: 0,1 sempre proibidas; 2 (forro de pele) em
        // corpoVestido; 4 (fundo) e 6 (arte) sobre a pele própria. Sem incluir os
        // dois últimos aqui, o PNG de diagnóstico não pinta o defeito novo — e um
        // mapa que não mostra o defeito é pior que mapa nenhum.
        const proibido =
          k <= 1 || (k === 2 && dentroVestido[p]) || ((k === 4 || k === 6) && dentroPele[p]);
        if (proibido) {
          md[i] = alvo[k][0]; md[i + 1] = alvo[k][1]; md[i + 2] = alvo[k][2]; md[i + 3] = 255;
        } else { md[i] = 90; md[i + 1] = 90; md[i + 2] = 96; md[i + 3] = 255; }
      }
      cx.putImageData(mapa, 0, 0);

      // forro de pele DENTRO do corpo vestido
      let forroEmVestido = 0;
      for (let p = 0; p < W * H; p++) if (rot[p] === 2 && dentroVestido[p]) forroEmVestido++;

      return { W, H, conta, comps, vaoSujo, vaoArea, noVaoPorCamada, forroEmVestido, naPelePorCamada, peleArea, mapa: c.toDataURL("image/png").split(",")[1] };
    },
    [camadas.map((c) => ({ nome: c.nome, cor: c.cor })), mascaras, tiro.toString("base64")] as [unknown, unknown, string],
  );
}

/**
 * Rasteriza uma composição sentinela e devolve o data URI do PNG.
 *
 * Os dois pontos que precisam disto — a composição canônica e a da fixture —
 * rasterizavam do mesmo jeito. A refatoração que os unificou morreu num erro de
 * escape de shell: a CHAMADA ficou no arquivo, a função não, e
 * `npm run avatar:proveniencia` crashava com `rasterizarSentinela is not
 * defined`. Passou verde porque `npm run typecheck` só cobre `src/**`.
 */
async function rasterizarSentinela(pg: Page, dentro: string): Promise<string> {
  await pg.setViewportSize({ width: larguraDe(ALTURA), height: ALTURA });
  await pg.setContent(
    `<body style="margin:0;background:transparent">` +
      `<svg xmlns="http://www.w3.org/2000/svg" width="${larguraDe(ALTURA)}" height="${ALTURA}" ` +
      `viewBox="0 0 ${BASE_W} ${BASE_H}">${dentro}</svg></body>`,
  );
  return "data:image/png;base64," + (await pg.screenshot({ omitBackground: true })).toString("base64");
}

/** O PNG de um data URI, para escrever em disco ou medir. */
const doDataUri = (uri: string) => Buffer.from(uri.split(",")[1], "base64");

async function main() {
  const FONTE = process.env.UNIFORME ?? "scripts/avatar/fonte/uniformes/soldado.svg";
  const NOME = process.env.UNIFORME_NOME ?? "soldado";
  const SEM_TRAJE = process.env.SEM_TRAJE !== "0";
  mkdirSync(DIAG, { recursive: true });
  if (!existsSync(FONTE)) throw new Error(`arte não encontrada: ${FONTE}`);

  const u = lerUniforme(readFileSync(FONTE, "utf-8"));
  const bruta = readFileSync(BASE_SVG, "utf-8");
  const nav: Browser = await chromium.launch();
  try {
    const m = await derivarMascaras(nav);
    // EROÍDO EM 1 px para TESTAR. Como exclusão do recorte o vão é generoso; como
    // região de teste ele não pode encostar na borda da silhueta, senão mede o
    // antialiasing da própria base. Dois px, e cada um se paga: 1 pela
    // limiarização da silhueta, 1 pela sangria deliberada do fundo. Antes disso,
    // 51 px de  que são a base sendo ela mesma.
    const vao = erodir(m.vaoAnatomico, { w: m.w, h: m.h }, 2);
    const pg = await nav.newPage();

    // O asset SENTINELA: mesma composição, mesmas máscaras, só a tinta muda.
    const assetSent = await rasterizarSentinela(pg, composicao(u, m, { sentinela: true }));
    writeFileSync(`${DIAG}/3-arte-uniforme-sentinela.png`, doDataUri(assetSent));

    // A base sentinela, com ou sem traje conforme o modo.
    const semTrajeArq = readFileSync(SAIDA, "utf-8").replace(new RegExp(ID_SEM_TRAJE, "g"), "avatar-base-neutro");
    const folha = baseSentinela(SEM_TRAJE ? semTrajeArq : bruta);

    // A REGIÃO DA PELE PRÓPRIA, eroída em 1 px pela mesma razão do vão: como
    // região de TESTE ela não pode encostar na borda, senão mede o antialiasing
    // da própria base em vez de defeito de composição.
    const RAIO_PELE = 1;
    const pele = erodir(m.peleExposta, { w: m.w, h: m.h }, RAIO_PELE);

    const mk = {
      vestido: Array.from(m.corpoVestido),
      vao: Array.from(vao),
      pele: Array.from(pele),
      mw: m.w,
      mh: m.h,
    };

    // 1. a base sozinha, sob o uniforme
    await pg.setContent(pilhaRuntime(folha, "avatar-base-neutro", "", true));
    writeFileSync(`${DIAG}/1-base-sob-uniforme.png`, await pg.screenshot({ omitBackground: true }));

    // 4. a composição final, caminho de runtime exato
    await pg.setContent(pilhaRuntime(folha, "avatar-base-neutro", assetSent, true));
    const final = await pg.screenshot({ omitBackground: true });
    writeFileSync(`${DIAG}/4-composicao-final.png`, final);

    const r = await classificar(pg, final, CAMADAS, mk);
    writeFileSync(`${DIAG}/5-mapa-residuos.png`, Buffer.from(r.mapa, "base64"));

    console.log(`\n${NOME} · ${SEM_TRAJE ? "base SEM TRAJE (estrutural)" : "base COM TRAJE (o estado antigo)"}`);
    console.log(`canvas de análise ${r.W}×${r.H}\n`);
    console.log("camada                              pixels visíveis   veredito");
    const porCamada: Record<string, number> = {};
    const proibidos: Record<string, number> = {};
    CAMADAS.forEach((c, k) => {
      const n =
        c.proibida === "corpoVestido"
          ? r.forroEmVestido
          : c.proibida === "peleExposta"
            ? r.naPelePorCamada[k]
            : r.conta[k];
      porCamada[c.nome] = r.conta[k];
      const ver =
        c.proibida === true
          ? "PROIBIDA"
          : c.proibida === "corpoVestido"
            ? "proibida em corpoVestido"
            : c.proibida === "peleExposta"
              ? "proibida sobre a pele"
              : "ok";
      if (c.proibida && n > 0) proibidos[c.nome] = n;
      console.log(`${c.nome.padEnd(35)} ${String(n).padStart(9)}   ${ver}`);
    });

    // ---------------------------------------------------------------------
    // O ASSET SOBRE A PELE PRÓPRIA — a direção que este gate nunca mediu.
    //
    // Todas as camadas proibidas acima são da BASE: a pergunta é "a base vazou
    // para cima?". Nenhuma pergunta "o asset cobriu o que não devia?" — e é por
    // isso que o fundo de segurança chapado sobre a mão passou despercebido.
    //
    // Os TRÊS RAIOS de uma vez: é o número que escolhe a tolerância, não o gosto.
    // ---------------------------------------------------------------------
    console.log(`\nasset sobre a PELE PRÓPRIA (região de teste eroída em ${RAIO_PELE} px, ${r.peleArea} px):`);
    const SOBRE_PELE = [4, 6] as const; // fundo de segurança e arte
    for (const raio of [0, 1, 2]) {
      const reg = erodir(m.peleExposta, { w: m.w, h: m.h }, raio);
      const rr =
        raio === RAIO_PELE
          ? r
          : await classificar(pg, final, CAMADAS, { ...mk, pele: Array.from(reg) });
      console.log(
        `  eroído ${raio} px (${String(area(reg)).padStart(7)} px na região):  ` +
          SOBRE_PELE.map((k) => `${CAMADAS[k].nome.split(" ")[0]} ${String(rr.naPelePorCamada[k]).padStart(5)}`).join("  ·  "),
      );
    }
    const naPele = r.comps
      .filter((c) => SOBRE_PELE.includes(c.camada as 4 | 6) && c.naPele > 0)
      .sort((a, b) => b.naPele - a.naPele)
      .slice(0, 8);
    if (naPele.length) {
      console.log(`  componentes sobre a pele (maior primeiro):`);
      console.log(`    na pele   total   caixa (x0,y0,x1,y1)          camada`);
      for (const c of naPele)
        console.log(
          `    ${String(c.naPele).padStart(7)} ${String(c.px).padStart(7)}   ` +
            `${`(${c.bb.join(",")})`.padEnd(26)} ${CAMADAS[c.camada].nome}`,
        );
    }

    console.log(`\nvão legítimo entre braço e tronco: ${r.vaoSujo} px pintados de ${r.vaoArea} na região`);
    CAMADAS.forEach((c, k) => {
      if (r.noVaoPorCamada[k]) console.log(`  ${String(r.noVaoPorCamada[k]).padStart(6)} px  ${c.nome}`);
    });

    // Os componentes que REPROVAM, para o relatório dizer ONDE e não só quanto.
    // O `&& false` que morava aqui zerava os de `corpoVestido` em silêncio; agora
    // cada família de proibição conta com a sua própria medida de tamanho.
    const comps: Componente[] = r.comps
      .map((c) => {
        const cam = CAMADAS[c.camada];
        if (cam.proibida === true) return { c, px: c.px };
        if (cam.proibida === "peleExposta" && c.naPele > 0) return { c, px: c.naPele };
        return null;
      })
      .filter((x): x is { c: (typeof r.comps)[number]; px: number } => x !== null)
      .sort((a, b) => b.px - a.px)
      .slice(0, 12)
      .map(({ c, px }) => ({
        camada: CAMADAS[c.camada].nome,
        px,
        bb: c.bb as [number, number, number, number],
        centro: [Math.round((c.bb[0] + c.bb[2]) / 2), Math.round((c.bb[1] + c.bb[3]) / 2)],
      }));

    if (comps.length) {
      console.log(`\ncomponentes conectados das camadas proibidas (maior primeiro):`);
      console.log(`  px      caixa (x0,y0,x1,y1)          centro        camada`);
      for (const c of comps)
        console.log(
          `  ${String(c.px).padStart(6)}  ${`(${c.bb.join(",")})`.padEnd(26)} ${`(${c.centro.join(",")})`.padEnd(13)} ${c.camada}`,
        );
    }

    const achados: Achados = {
      porCamada,
      proibidos,
      componentes: comps,
      vaoSujo: r.vaoSujo,
      vaoArea: r.vaoArea,
    };
    writeFileSync(`${DIAG}/achados-${NOME}.json`, JSON.stringify(achados, null, 2));

    // FURO NO ASSET dentro do corpo vestido. É a causa, e os dois gates acima são
    // sintoma: onde o asset é transparente sobre `corpoVestido`, a base aparece
    // crua — e o que ela mostrar ali (macacão, pele, o que for) é sempre errado.
    // Medido antes da correção: 2909 px, na costura da gola, do punho e do vão
    // entre braço e tronco.
    //
    // A PELE PRÓPRIA SAI DA REGIÃO, e não é um relaxamento: ali o furo É o
    // desenho. O asset tem buraco sobre a mão e o rosto de propósito, para a base
    // aparecer por baixo — é o truque que dispensa uma terceira camada. Sem esta
    // subtração o gate reprovaria a correção do fundo-sobre-a-mão, que é o defeito
    // que ele deveria estar do lado de consertar.
    //
    // Dilatada em 1 px pelo mesmo motivo de todo o resto: a máscara é 1278×1920,
    // desenhada em 2556×3840 e rasterizada de volta, e duas reamostragens deixam
    // uma coluna de 1 px na borda.
    const regiaoFuro = subtrair(
      subtrair(m.corpoVestido, m.vaoAnatomico),
      dilatar(m.peleExposta, { w: m.w, h: m.h }, 1),
    );
    const furo = await pg.evaluate(
      async ([b64, vestido, mw, mh]) => {
        const img = new Image();
        img.src = "data:image/png;base64," + (b64 as string);
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        const cx = c.getContext("2d", { willReadFrequently: true })!;
        cx.drawImage(img, 0, 0);
        const d = cx.getImageData(0, 0, c.width, c.height).data;
        const W = c.width, H = c.height, V = vestido as number[];
        let n = 0;
        for (let y = 0; y < H; y++)
          for (let x = 0; x < W; x++) {
            const mx = Math.min((mw as number) - 1, Math.floor((x / W) * (mw as number)));
            const my = Math.min((mh as number) - 1, Math.floor((y / H) * (mh as number)));
            if (!V[my * (mw as number) + mx]) continue;
            if (d[(y * W + x) * 4 + 3] < 128) n++;
          }
        return n;
      },
      [assetSent.split(",")[1], Array.from(regiaoFuro), m.w, m.h] as [string, number[], number, number],
    );
    console.log(
      `\nfuro do asset dentro de corpoVestido: ${furo} px (tolerância 0, região de ${area(regiaoFuro)} px)`,
    );

    // A FIXTURE: o mesmo tudo, com o RECORTE de `6e3feb6` e a base com macacão.
    // Ela reproduz o defeito histórico com a arte real, e o gate tem de reprová-la.
    //
    // A CONTAMINAÇÃO É O RECORTE ANTIGO, não a base antiga. Descoberto rodando:
    // com as máscaras corrigidas, nem a base com macacão vaza — o asset cobre
    // tudo. Quem abria o buraco era `fundo = corpoVestido − peleFrente`, que
    // subtraía do FUNDO a mesma pele que o pano já subtrai, deixando a costura
    // sem ninguém.
    //
    // Rodar isto toda vez, em vez de guardar um PNG de fixture, é o que impede o
    // gate de ficar CEGO em silêncio: se um dia a fixture passar, o gate parou de
    // medir — e é assim que gates morrem sem ninguém notar.
    // A REGIÃO "FORA DA PELE PRÓPRIA", generosa em 1 px. Na base COM macacão, o
    // buraco de desenho sobre a mão e o rosto mostra o macacão da própria base —
    // e isso é LÍCITO: na base de produção aquelas camadas não existem no arquivo.
    // Medir o `av-roupa` da fixture sem esta exclusão contaria o buraco correto
    // como defeito, e a fixture passaria a "vazar" por um motivo errado.
    const mkFora = { ...mk, pele: Array.from(dilatar(m.peleExposta, { w: m.w, h: m.h }, 1)) };

    const assetLegado = await rasterizarSentinela(pg, composicao(u, m, { sentinela: true, recortes: recortesLegado }));
    writeFileSync(`${DIAG}/6-fixture-legada.png`, doDataUri(assetLegado));
    await pg.setContent(pilhaRuntime(baseSentinela(bruta), "avatar-base-neutro", assetLegado, true));
    const legado = await classificar(pg, await pg.screenshot({ omitBackground: true }), CAMADAS, mkFora);
    const macacaoNaFixture = legado.conta[0] - legado.naPelePorCamada[0];
    const macacaoNoBuraco = legado.naPelePorCamada[0];

    console.log(`\nFIXTURE 1 — recorte legado (6e3feb6) + base COM macacão:`);
    console.log(`  av-roupa FORA da pele própria ............ ${macacaoNaFixture} px   ← tem de vazar`);
    console.log(`  av-roupa dentro da pele própria .......... ${macacaoNoBuraco} px   (lícito: é o buraco`);
    console.log(`                                                       de desenho, e a base de produção não tem macacão)`);
    console.log(`  vão legítimo sujo ........................ ${legado.vaoSujo} px`);

    const comps6 = legado.comps
      .filter((c) => c.camada === 0 && c.px - c.naPele > 0)
      .sort((a, b) => b.px - b.naPele - (a.px - a.naPele))
      .slice(0, 8);
    if (comps6.length) {
      console.log(`  componentes de av-roupa fora da pele (maior primeiro):`);
      for (const c of comps6)
        console.log(`    ${String(c.px - c.naPele).padStart(6)} px  (${c.bb.join(",")})`);
    }

    // A SEGUNDA FIXTURE, e o par da primeira: o recorte de `1403143`, que pinta o
    // fundo chapado por cima da mão. Sobre a base SEM TRAJE, que é a de produção —
    // é ali que este defeito vive, e onde não há macacão para confundir a leitura.
    //
    // AS DUAS SÃO O CONTROLE NEGATIVO UMA DA OUTRA. Juntas elas provam que a
    // correção não trocou um defeito pelo outro, que é literalmente o que o
    // `1403143` fez ao consertar a costura.
    const assetFundoNaMao = await rasterizarSentinela(
      pg,
      composicao(u, m, { sentinela: true, recortes: recortesFundoNaMao }),
    );
    writeFileSync(`${DIAG}/7-fixture-fundo-na-mao.png`, doDataUri(assetFundoNaMao));
    await pg.setContent(
      pilhaRuntime(baseSentinela(semTrajeArq), "avatar-base-neutro", assetFundoNaMao, true),
    );
    const naMao = await classificar(pg, await pg.screenshot({ omitBackground: true }), CAMADAS, mk);
    const fundoNaFixture = naMao.naPelePorCamada[4];

    console.log(`\nFIXTURE 2 — recorte de 1403143 + base SEM traje:`);
    console.log(`  fundo de segurança sobre a pele .......... ${fundoNaFixture} px   ← tem de vazar`);
    const comps7 = naMao.comps
      .filter((c) => c.camada === 4 && c.naPele > 0)
      .sort((a, b) => b.naPele - a.naPele)
      .slice(0, 5);
    for (const c of comps7)
      console.log(`    ${String(c.naPele).padStart(6)} px  (${c.bb.join(",")})`);

    console.log(`\nA TABELA 2×2 — cada fixture é o controle negativo da outra:`);
    console.log(`  recorte                     av-roupa fora da pele    fundo sobre a pele`);
    console.log(`  legado (6e3feb6)            ${String(macacaoNaFixture).padStart(10)} ← reprova ${String(0).padStart(12)}`);
    console.log(`  fundo-na-mão (1403143)      ${String(0).padStart(10)}            ${String(fundoNaFixture).padStart(10)} ← reprova`);
    console.log(`  canônico                    ${String(r.conta[0]).padStart(10)}            ${String(r.naPelePorCamada[4]).padStart(10)}`);

    const falhas: string[] = [];
    if (macacaoNaFixture === 0)
      falhas.push(
        `a FIXTURE 1 falhou: com o recorte legado o macacão devia vazar fora da pele e não vazou. ` +
          `O gate parou de enxergar o defeito que existe para pegar.`,
      );
    if (fundoNaFixture === 0)
      falhas.push(
        `a FIXTURE 2 falhou: com o recorte de 1403143 o fundo devia pintar sobre a pele e não pintou. ` +
          `O gate parou de enxergar o fundo chapado sobre as mãos.`,
      );
    if (furo > 0)
      falhas.push(
        `furo no asset dentro de corpoVestido: ${furo} px — nem a arte nem o fundo de ` +
          `segurança pintam ali, então a base aparece crua`,
      );
    for (const [nome, n] of Object.entries(proibidos)) falhas.push(`${nome}: ${n} px visíveis, tolerância 0`);
    if (r.vaoSujo > 0) falhas.push(`vão legítimo: ${r.vaoSujo} px pintados, deveria mostrar só o fundo da página`);

    console.log(`\n${DIAG}/`);
    if (falhas.length) {
      console.error(`\n${falhas.length} REPROVAÇÃO(ÕES) DE PROVENIÊNCIA:`);
      for (const f of falhas) console.error(`  - ${f}`);
      process.exitCode = 1;
    } else console.log(`\nproveniência limpa: nenhuma camada proibida visível, vão legítimo intacto`);
    await pg.close();
  } finally {
    await nav.close();
  }
}

if (process.argv[1]?.includes("proveniencia")) {
  main().catch((e) => {
    console.error(String(e instanceof Error ? e.message : e));
    process.exit(1);
  });
}

export { area, subtrair };
