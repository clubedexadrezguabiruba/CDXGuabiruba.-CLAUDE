/**
 * Folha de contato do Bloco 2 (versão mínima da T0.9).
 *
 * Existe antes do primeiro desenho, não depois: é o instrumento com que eu me
 * critico. Cada rodada gera as cinco vistas que a lista de defeitos exige, e
 * eu LEIO os PNG — o ciclo fechado que o doc 15 §7 descreve.
 *
 * O Bloco 3.1 estende para os 53 itens sobre a base. Aqui só a base.
 *
 * Uso: npm run avatar:contato
 * Saída: .scratch/bloco2/ (ignorada pelo git — material de decisão)
 */

import { readFileSync, existsSync } from "fs";
import { base, ANCORAS, type Acabamento } from "../../src/lib/avatar/arte/base";
import { PELE } from "../../src/lib/avatar/palette";
import { exigirSvgValido } from "../../src/lib/avatar/svgContrato";
import { abrirNavegador, renderizarSvg, renderizarHtml, salvar, TAMANHOS } from "./render-svg";
import { otimizar } from "./otimizar-svg";

const DIR = ".scratch/bloco2";
const FUNDO = "#EFEAE2";

/** A referência que o usuário mandou, se estiver no disco. */
const REFERENCIA = ".scratch/referencia/base.png";

const ACABAMENTOS: Acabamento[] = ["chapado", "cel"];

function b64(caminho: string): string {
  return "data:image/png;base64," + readFileSync(caminho).toString("base64");
}

function figura(src: string, w: number, h: number, rotulo: string, pixelado = false): string {
  return `<figure style="margin:0;text-align:center">
    <div style="background:${FUNDO};display:inline-block;border:1px solid #d5d0c8">
      <img src="${src}" width="${w}" height="${h}"${pixelado ? ' style="image-rendering:pixelated"' : ""}>
    </div>
    <figcaption style="font:12px system-ui;color:#666;margin-top:5px">${rotulo}</figcaption>
  </figure>`;
}

async function main() {
  const nav = await abrirNavegador();
  const secoes: string[] = [];

  try {
    // --- 1. Os dois acabamentos nos 4 tamanhos -----------------------------
    // O que manda é o 56. Um acabamento que só ganha no 340 perdeu.
    for (const acabamento of ACABAMENTOS) {
      const svg = base({ acabamento });
      exigirSvgValido(svg, `base ${acabamento}`);
      salvar(`${DIR}/base-${acabamento}.svg`, otimizar(svg));
      for (const t of TAMANHOS) {
        await renderizarSvg(nav, svg, t.w, t.h, `${DIR}/${acabamento}-${t.nome}.png`, FUNDO);
      }
    }

    secoes.push(
      `<h2>1. Os dois acabamentos, tamanho real</h2>
       <p class="n">A escolha vale para os 39 desenhos. O que manda é o 56 px.</p>
       <table><tr><th></th>${TAMANHOS.map((t) => `<th>${t.nome} · ${t.w}px</th>`).join("")}</tr>
       ${ACABAMENTOS.map(
         (a) => `<tr><th>${a}</th>${TAMANHOS.map(
           (t) => `<td>${figura(b64(`${DIR}/${a}-${t.nome}.png`), t.w, t.h, "")}</td>`,
         ).join("")}</tr>`,
       ).join("")}
       </table>`,
    );

    // --- 2. Lupa no 56 px --------------------------------------------------
    secoes.push(
      `<h2>2. A 56 px, ampliado 7× sem suavização</h2>
       <p class="n">Olho lê como olho? A boca existe? A silhueta do cabelo se separa da cabeça?</p>
       <div class="linha">${ACABAMENTOS.map(
         (a) => figura(b64(`${DIR}/${a}-sm.png`), 56 * 7, 70 * 7, a, true),
       ).join("")}</div>`,
    );

    // --- 2b. A base sem cabelo ---------------------------------------------
    // Ela nunca é vista assim em produção: todo aluno nasce com um modelo. Mas
    // o crânio precisa aguentar qualquer um dos 5, inclusive os femininos, e é
    // aqui que se vê se ele aguenta.
    await renderizarSvg(nav, base({ modeloCabelo: null }), 200, 250, `${DIR}/careca-lg.png`, FUNDO);
    await renderizarSvg(nav, base({ modeloCabelo: null }), 56, 70, `${DIR}/careca-sm.png`, FUNDO);
    secoes.push(
      `<h2>2b. A base sem cabelo</h2>
       <p class="n">O <code>hair</code> é slot separado — é o que deixa a menina trocar o modelo sem
       precisar esconder cabelo de baixo. Nunca aparece assim: todo aluno nasce com um modelo.</p>
       <div class="linha">
         ${figura(b64(`${DIR}/careca-lg.png`), 200, 250, "200 px")}
         ${figura(b64(`${DIR}/careca-sm.png`), 56 * 5, 70 * 5, "56 px · 5×", true)}
       </div>`,
    );

    // --- 3. Silhueta -------------------------------------------------------
    // Se não der para dizer que é uma pessoa, e separar cabelo de cabeça, a
    // forma está errada antes de a cor importar.
    for (const t of [TAMANHOS[0], TAMANHOS[3]]) {
      await renderizarSvg(nav, base({ silhueta: true }), t.w, t.h, `${DIR}/silhueta-${t.nome}.png`, FUNDO);
    }
    secoes.push(
      `<h2>3. Silhueta</h2>
       <p class="n">Tudo preenchido com a cor do contorno. Lê como pessoa? Dá para separar o cabelo?</p>
       <div class="linha">
         ${figura(b64(`${DIR}/silhueta-sm.png`), 56 * 7, 70 * 7, "56 px · 7×", true)}
         ${figura(b64(`${DIR}/silhueta-xl.png`), 340, 425, "340 px")}
       </div>`,
    );

    // --- 4. Os 8 tons ------------------------------------------------------
    // O tom mais escuro é o teste da esclera: sem a amêndoa branca, o olho some.
    for (let i = 0; i < PELE.length; i++) {
      await renderizarSvg(nav, base({ pele: i }), 56, 70, `${DIR}/pele-${i}-sm.png`, FUNDO);
      await renderizarSvg(nav, base({ pele: i }), 200, 250, `${DIR}/pele-${i}-lg.png`, FUNDO);
    }
    secoes.push(
      `<h2>4. Os 8 tons de pele</h2>
       <p class="n">Um arquivo, oito cores. No mais escuro, o olho ainda aparece?</p>
       <div class="linha">${PELE.map(
         (_, i) => figura(b64(`${DIR}/pele-${i}-sm.png`), 56 * 3, 70 * 3, "", true),
       ).join("")}</div>
       <div class="linha">${PELE.map(
         (_, i) => figura(b64(`${DIR}/pele-${i}-lg.png`), 140, 175, ""),
       ).join("")}</div>`,
    );

    // --- 5. A âncora da mão ------------------------------------------------
    for (const t of [TAMANHOS[0], TAMANHOS[2]]) {
      await renderizarSvg(
        nav, base({ reliquiaTeste: true }), t.w, t.h, `${DIR}/mao-${t.nome}.png`, FUNDO,
      );
    }
    secoes.push(
      `<h2>5. A âncora da mão</h2>
       <p class="n">A relíquia de teste assenta <b>na</b> mão, ou flutua ao lado?
       Âncora declarada: ${ANCORAS.mao[0].toFixed(0)}, ${ANCORAS.mao[1].toFixed(0)}.</p>
       <div class="linha">
         ${figura(b64(`${DIR}/mao-sm.png`), 56 * 7, 70 * 7, "56 px · 7×", true)}
         ${figura(b64(`${DIR}/mao-lg.png`), 200, 250, "200 px")}
       </div>`,
    );

    // --- 6. Contra a referência --------------------------------------------
    // Mede a distância entre o que foi pedido e o que eu fiz. Sem isto, eu
    // convergiria para o meu próprio gosto sem perceber.
    if (existsSync(REFERENCIA)) {
      secoes.push(
        `<h2>6. Lado a lado com a referência</h2>
         <p class="n">Mesma altura. O que está obviamente diferente?</p>
         <div class="linha">
           ${figura(b64(REFERENCIA), 0, 425, "referência").replace('width="0" ', "")}
           ${ACABAMENTOS.map((a) => figura(b64(`${DIR}/${a}-xl.png`), 340, 425, a)).join("")}
         </div>`,
      );
    }

    await renderizarHtml(
      nav,
      `<!doctype html><html><body>
       <style>
         body{margin:0;background:#fff;font:14px/1.5 system-ui;color:#222;padding:18px 24px}
         h2{font-size:16px;margin:28px 0 2px}
         .n{color:#666;margin:0 0 12px;font-size:13px}
         .linha{display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap}
         table{border-collapse:separate;border-spacing:12px 8px}
         th{font-weight:600;color:#555;font-size:13px}
         td{vertical-align:bottom}
       </style>
       <h1 style="font-size:19px;margin:0">Bloco 2 — folha de contato do boneco base</h1>
       ${secoes.join("")}
       </body></html>`,
      1500,
      `${DIR}/folha-contato.png`,
    );
  } finally {
    await nav.close();
  }

  console.log(`\nFolha de contato: ${DIR}/folha-contato.png`);
  if (!existsSync(REFERENCIA)) {
    console.log(`(sem comparação: coloque a referência em ${REFERENCIA})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
