/**
 * GATE: a paleta das patentes — a cor do uniforme como dado, não como texto
 *
 * O QUE ESTE GATE EXISTE PARA IMPEDIR
 * -----------------------------------
 * Pela emenda à D27, só pele e cabelo recolorem. A cor do uniforme é assada na
 * arte de origem, e **nada a harmoniza depois**. Duas consequências, as duas já
 * pagas nesta fase:
 *
 *   1. Uma cor fora da lei do pipeline **some** do asset. `ehPano` é um corte só
 *      (`matiz >= 45`), e forma descartada não muda de cor: ela desaparece. Um
 *      galão branco neutro (matiz 0°) ou um cinto dourado `#C9B37E` (42,4°)
 *      simplesmente não entram na peça, e ninguém antevê isso.
 *   2. Duas patentes em cores próximas ficam indistinguíveis a 56 px, onde o
 *      uniforme é só massa de cor. O conserto é redesenhar a peça inteira.
 *
 * O runbook §10.2 já pedia que a cor de cada peça fosse registrada antes da
 * próxima. Em texto. Texto não reprova nada — e a regra do §10.1 é justamente
 * "escreva o gate antes da correção, e confira que ele reprova".
 *
 * POR QUE ELE RODA OFFLINE
 * ------------------------
 * Nenhuma consulta ao banco: a régua é a tabela em `scripts/avatar/patentes.ts`
 * mais os SVGs commitados. Assim ele roda no CI sem credencial, junto dos outros.
 *
 * Uso: npm run verify:paleta-patentes
 */

import { existsSync, readFileSync } from "fs";
import { LINHA, MIN_CONTORNO } from "../../../src/lib/avatar/palette";
import { MATIZ_PANO, corBota, corDominante, hsl, lerUniforme } from "../../avatar/uniforme";
import {
  MIN_DELTA_CANAL,
  MIN_ENTRE_PATENTES,
  MIN_ENTRE_VIZINHAS,
  PATENTES,
  TOLERANCIA_MEDIDA,
  caminhoSvg,
  coresDe,
  deltaCanal,
  distancia,
  pares,
  vizinhas,
} from "../../avatar/patentes";

const REFERENCIA = "scripts/avatar/fonte/referencia-base.png";

const violacoes: string[] = [];
const linhas: string[] = [];

function checar(ok: boolean, rotulo: string, detalhe: string) {
  linhas.push(`  [${ok ? "PASS" : "FAIL"}] ${rotulo} — ${detalhe}`);
  if (!ok) violacoes.push(`${rotulo} — ${detalhe}`);
}

function main() {
  console.log("========================================");
  console.log("GATE: paleta das patentes");
  console.log("========================================\n");

  // -------------------------------------------------------------------------
  // 1. Toda cor precisa ser PANO para o pipeline. Abaixo do corte, ela some.
  // -------------------------------------------------------------------------
  console.log("1. Matiz — abaixo de", MATIZ_PANO, "a forma SOME do asset\n");
  let piorMatiz = { cor: "", h: 999, onde: "" };
  for (const p of PATENTES) {
    for (const { papel, cor } of coresDe(p)) {
      const { h } = hsl(cor);
      if (h < piorMatiz.h) piorMatiz = { cor, h, onde: `${p.patente}/${papel}` };
      checar(
        h >= MATIZ_PANO,
        `${p.patente} · ${papel}`,
        `${cor} matiz ${h.toFixed(1)}° (mínimo ${MATIZ_PANO}°)`,
      );
    }
  }
  console.log(linhas.join("\n"));
  console.log(
    `\n  menor matiz: ${piorMatiz.h.toFixed(1)}° em ${piorMatiz.onde} (${piorMatiz.cor})`,
  );
  linhas.length = 0;

  // -------------------------------------------------------------------------
  // 2. Cinza neutro tem matiz 0° e some junto. Todo claro precisa ser tingido.
  // -------------------------------------------------------------------------
  console.log(`\n2. Delta de canal — 0 é cinza neutro, e cinza neutro SOME\n`);
  let piorDelta = { cor: "", d: 999, onde: "" };
  for (const p of PATENTES) {
    for (const { papel, cor } of coresDe(p)) {
      const d = deltaCanal(cor);
      if (d < piorDelta.d) piorDelta = { cor, d, onde: `${p.patente}/${papel}` };
      checar(d >= MIN_DELTA_CANAL, `${p.patente} · ${papel}`, `${cor} delta ${d} (mínimo ${MIN_DELTA_CANAL})`);
    }
  }
  console.log(linhas.join("\n"));
  console.log(`\n  menor delta: ${piorDelta.d} em ${piorDelta.onde} (${piorDelta.cor})`);
  linhas.length = 0;

  // -------------------------------------------------------------------------
  // 3. A 56 px o uniforme é só cor. Patentes vizinhas exigem mais folga porque
  //    são as que o aluno compara quando é promovido.
  // -------------------------------------------------------------------------
  console.log(`\n3. Distância entre patentes — ${MIN_ENTRE_PATENTES} geral, ${MIN_ENTRE_VIZINHAS} entre vizinhas\n`);
  const ehVizinha = new Set(vizinhas().map(([a, b]) => `${a.tier}-${b.tier}`));
  let piorPar = { par: "", d: 999, piso: 0 };
  for (const [a, b] of pares()) {
    const viz = ehVizinha.has(`${a.tier}-${b.tier}`);
    const piso = viz ? MIN_ENTRE_VIZINHAS : MIN_ENTRE_PATENTES;
    const d = distancia(a.pano, b.pano);
    if (d - piso < piorPar.d - piorPar.piso) piorPar = { par: `${a.patente} × ${b.patente}`, d, piso };
    checar(
      d >= piso,
      `${a.patente} × ${b.patente}${viz ? " (vizinhas)" : ""}`,
      `distância ${d.toFixed(1)} (mínimo ${piso})`,
    );
  }
  console.log(linhas.join("\n"));
  console.log(
    `\n  par mais apertado: ${piorPar.par} — ${piorPar.d.toFixed(1)} contra piso ${piorPar.piso}` +
      ` (folga ${(piorPar.d - piorPar.piso).toFixed(1)})`,
  );
  linhas.length = 0;

  // -------------------------------------------------------------------------
  // 4. Dentro da peça: bota e detalhe precisam ler contra o pano, e o pano
  //    contra o contorno — perto do contorno a silhueta some antes da cor.
  // -------------------------------------------------------------------------
  console.log(`\n4. Dentro da peça — bota, detalhe e contorno\n`);
  for (const p of PATENTES) {
    const dBota = distancia(p.pano, p.bota);
    checar(dBota >= MIN_ENTRE_PATENTES, `${p.patente} · pano × bota`, `${dBota.toFixed(1)} (mínimo ${MIN_ENTRE_PATENTES})`);
    if (p.detalhe) {
      const dDet = distancia(p.pano, p.detalhe);
      checar(
        dDet >= MIN_ENTRE_PATENTES,
        `${p.patente} · pano × detalhe`,
        `${dDet.toFixed(1)} (mínimo ${MIN_ENTRE_PATENTES})`,
      );
    }
    const dLinha = distancia(p.pano, LINHA);
    checar(dLinha >= MIN_CONTORNO, `${p.patente} · pano × contorno`, `${dLinha.toFixed(1)} (mínimo ${MIN_CONTORNO})`);
  }
  console.log(linhas.join("\n"));
  linhas.length = 0;

  // -------------------------------------------------------------------------
  // 5. O que prende a tabela à arte real.
  //
  //    Sem isto a tabela volta a ser opinião no instante em que a primeira peça
  //    for gerada: alguém desenha em outra cor, e nada acusa.
  // -------------------------------------------------------------------------
  console.log(`\n5. A tabela contra a arte commitada\n`);
  for (const p of PATENTES) {
    const svg = caminhoSvg(p);
    if (p.estado === "medido") {
      if (!existsSync(svg)) {
        checar(false, `${p.patente} · fonte`, `marcada "medido" mas o SVG não existe: ${svg}`);
        continue;
      }
      const u = lerUniforme(readFileSync(svg, "utf-8"));
      const dPano = distancia(p.pano, corDominante(u.pano));
      checar(
        dPano <= TOLERANCIA_MEDIDA,
        `${p.patente} · pano medido`,
        `tabela ${p.pano} · SVG ${corDominante(u.pano)} · distância ${dPano.toFixed(1)} (máximo ${TOLERANCIA_MEDIDA})`,
      );
      const dBota = distancia(p.bota, corBota(u));
      checar(
        dBota <= TOLERANCIA_MEDIDA,
        `${p.patente} · bota medida`,
        `tabela ${p.bota} · SVG ${corBota(u)} · distância ${dBota.toFixed(1)} (máximo ${TOLERANCIA_MEDIDA})`,
      );
    } else {
      // O esquecimento que este ramo pega: a peça foi gerada e commitada, e
      // ninguém voltou para registrar a cor MEDIDA na tabela.
      checar(
        !existsSync(svg),
        `${p.patente} · alvo sem arte`,
        existsSync(svg)
          ? `${svg} existe, mas a tabela ainda diz "alvo" — registre a cor medida`
          : "sem arte ainda, como esperado",
      );
    }
  }
  console.log(linhas.join("\n"));
  linhas.length = 0;

  // -------------------------------------------------------------------------
  // 6. A referência que vai anexada em todo pedido de arte nova (doc 18).
  //
  //    Ela já viveu fora do repositório e sumiu duas vezes nesta fase. Sem ela o
  //    gerador desenha outro personagem em vez de editar o nosso.
  // -------------------------------------------------------------------------
  console.log(`\n6. A imagem de referência\n`);
  checar(existsSync(REFERENCIA), "referência da base", `${REFERENCIA}`);
  console.log(linhas.join("\n"));

  console.log("\n========================================");
  if (violacoes.length > 0) {
    console.log(`RESULTADO: ${violacoes.length} violações`);
    console.log("========================================\n");
    for (const v of violacoes) console.log(`  [FAIL] ${v}`);
    console.log("\nCor abaixo de 45° de matiz, ou cinza neutro, NÃO fica feia:");
    console.log("ela some do asset. E duas patentes perto demais só aparecem");
    console.log("como problema no ranking, quando a arte já está pronta.");
    process.exit(1);
  }
  console.log("RESULTADO: 0 violações");
  console.log("========================================");
  console.log("\nGate paleta das patentes: OK");
}

main();
