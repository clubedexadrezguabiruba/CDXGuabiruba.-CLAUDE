/**
 * GATE: a paleta das patentes — agora a régua da MOLDURA
 *
 * O QUE MUDOU EM 2026-08-13, E POR QUE O GATE ENCOLHEU
 * ----------------------------------------------------
 * Este gate nasceu para o pipeline de recoloração de SVG: as seis cores pintavam o
 * UNIFORME do boneco, e três das suas conferências existiam por causa do pipeline,
 * não por causa da cor.
 *
 * A patente deixou de vestir. Ela passa a dar uma **moldura** — um anel em CSS,
 * fora do SVG, em volta do avatar (doc 21 §0). O suporte mudou, e com ele o que
 * ainda é lei:
 *
 * **CAÍRAM, e as três pelo mesmo motivo — eram leis do pipeline, não da cor:**
 *
 *   1. **Matiz ≥ 45°.** `ehPano` (uniforme.ts) é um corte só, e forma descartada
 *      não muda de cor: ela SOME do asset. Um dourado `#C9B37E` (42,4°) não entrava
 *      na peça. Em CSS não há corte e não há o que sumir — **a moldura pode usar
 *      dourado**, e essa é uma liberdade nova, não um relaxamento.
 *   2. **Delta de canal ≥ 20.** Cinza neutro tem matiz 0° e sumia junto. Um anel
 *      cinza em CSS desenha perfeitamente.
 *   3. **Tabela × SVG commitado.** Ela prendia a tabela à arte de
 *      `fonte/uniformes/`, que a moldura não usa. E prendia junto `bota` e
 *      `detalhe`, que eram partes do uniforme e não têm equivalente num anel.
 *
 * **FICARAM as distâncias, e elas ficaram MAIS importantes.** Duas patentes em
 * cores próximas continuam indistinguíveis — e agora num elemento bem menor do que
 * o uniforme era: um anel de 2 px em volta de um recorte de 32 px. Se havia motivo
 * para 40/60 no pano, há mais aqui.
 *
 * **ENTRARAM duas, e as duas nasceram do suporte novo:**
 *
 *   4. **A moldura contra o fundo em que ela vive.** O anel é desenhado sobre
 *      `warm-ivory`, o fundo de card do produto inteiro. A moldura de um Mestre é
 *      prata `#AEBCCE` — clara —, e anel claro sobre marfim é a mesma família de
 *      defeito que a lei nº 4 da arte de traje descreve. Aqui ela vira número.
 *   5. **`corDaMoldura()` é total sobre os tiers do banco.** O banco tem **8 tiers**
 *      contra as 6 cores desta tabela (achado **D11**, aberto). A função satura na
 *      última, e a saturação é medida — para que o dia em que o D11 for decidido
 *      não passe em branco.
 *
 * POR QUE ELE RODA OFFLINE
 * ------------------------
 * Nenhuma consulta ao banco: a régua é a tabela em `scripts/avatar/patentes.ts`.
 * Assim ele roda no CI sem credencial, junto dos outros.
 *
 * Uso: npm run verify:paleta-patentes
 */

import { existsSync } from "fs";
import {
  FUNDO_DA_MOLDURA,
  MIN_CONTRA_FUNDO,
  MIN_ENTRE_PATENTES,
  MIN_ENTRE_VIZINHAS,
  PATENTES,
  corDaMoldura,
  distancia,
  pares,
  vizinhas,
} from "../../avatar/patentes";

const REFERENCIA = "scripts/avatar/fonte/referencia-base.png";

/**
 * Os tiers que `title_tiers` tem hoje. Escrito à mão de propósito: o gate roda
 * OFFLINE, e a graça da conferência 3 é justamente que ela reprova quando a escada
 * do banco crescer sem a paleta acompanhar.
 */
const TIERS_DO_BANCO = [0, 1, 2, 3, 4, 5, 6, 7] as const;

const violacoes: string[] = [];
const linhas: string[] = [];

function checar(ok: boolean, rotulo: string, detalhe: string) {
  linhas.push(`  [${ok ? "PASS" : "FAIL"}] ${rotulo} — ${detalhe}`);
  if (!ok) violacoes.push(`${rotulo} — ${detalhe}`);
}

function despejar() {
  console.log(linhas.join("\n"));
  linhas.length = 0;
}

function main() {
  console.log("========================================");
  console.log("GATE: paleta das patentes (a régua da moldura)");
  console.log("========================================\n");

  // -------------------------------------------------------------------------
  // 1. A 32 px o anel é só cor. Patentes vizinhas exigem mais folga porque são
  //    as que o aluno compara quando é promovido.
  // -------------------------------------------------------------------------
  console.log(
    `1. Distância entre patentes — ${MIN_ENTRE_PATENTES} geral, ${MIN_ENTRE_VIZINHAS} entre vizinhas\n`,
  );
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
  despejar();
  console.log(
    `\n  par mais apertado: ${piorPar.par} — ${piorPar.d.toFixed(1)} contra piso ${piorPar.piso}` +
      ` (folga ${(piorPar.d - piorPar.piso).toFixed(1)})`,
  );

  // -------------------------------------------------------------------------
  // 2. O anel tem de ler contra o cartão em que é desenhado.
  //
  //    É a conferência que NASCEU com a moldura. Um anel que se confunde com o
  //    fundo não reprova em lugar nenhum e não aparece na tela — o defeito mais
  //    barato de cometer e o mais caro de perceber.
  // -------------------------------------------------------------------------
  console.log(`\n2. A moldura contra o fundo ${FUNDO_DA_MOLDURA} — mínimo ${MIN_CONTRA_FUNDO}\n`);
  let piorFundo = { patente: "", d: 999 };
  for (const p of PATENTES) {
    const d = distancia(p.pano, FUNDO_DA_MOLDURA);
    if (d < piorFundo.d) piorFundo = { patente: p.patente, d };
    checar(
      d >= MIN_CONTRA_FUNDO,
      `${p.patente} · anel × fundo`,
      `${p.pano} contra ${FUNDO_DA_MOLDURA} · distância ${d.toFixed(1)} (mínimo ${MIN_CONTRA_FUNDO})`,
    );
  }
  despejar();
  console.log(
    `\n  anel mais apagado: ${piorFundo.patente} — ${piorFundo.d.toFixed(1)} contra o marfim`,
  );

  // -------------------------------------------------------------------------
  // 3. `corDaMoldura` responde para TODO tier que o banco pode devolver.
  //
  //    Sem isto, o dia em que a escada crescer produz um avatar sem moldura em
  //    silêncio — e ele seria justamente o do aluno mais avançado do produto.
  // -------------------------------------------------------------------------
  console.log(`\n3. corDaMoldura() cobre os ${TIERS_DO_BANCO.length} tiers de title_tiers\n`);
  const ultima = PATENTES[PATENTES.length - 1]!;

  for (const tier of TIERS_DO_BANCO) {
    const cor = corDaMoldura(tier);
    if (tier === 0) {
      // O Aprendiz não está na escada de cores e nunca esteve. O `null` aqui é o
      // contrato com a <MolduraPatente>, que desenha o fio neutro.
      checar(
        cor === null,
        "tier 0 (Aprendiz) · sem cor de patente",
        cor === null
          ? "null, como esperado — o componente desenha o fio neutro"
          : `devolveu ${cor}; inventar cor para o Aprendiz é dizer que ele é uma patente`,
      );
      continue;
    }
    const naEscada = PATENTES.find((p) => p.tier === tier);
    if (naEscada) {
      checar(
        cor === naEscada.pano,
        `tier ${tier} (${naEscada.patente}) · cor exata`,
        `${cor} === ${naEscada.pano}`,
      );
    } else {
      checar(
        cor === ultima.pano,
        `tier ${tier} · acima da escada, satura em ${ultima.patente}`,
        cor === ultima.pano
          ? `${cor} — a saída conservadora do D11 (8 tiers no banco, ${PATENTES.length} cores aqui)`
          : `devolveu ${cor}; sem saturação o aluno mais avançado perderia a moldura ao subir`,
      );
    }
  }

  // Os dois extremos que não vêm do banco, mas chegam pelo tipo: `null` e negativo.
  checar(corDaMoldura(null) === null, "tier null · sem cor", "dado ausente não inventa degrau");
  checar(
    corDaMoldura(-1) === null,
    "tier negativo · sem cor",
    "fora da escada para baixo não é degrau nenhum",
  );
  despejar();

  // -------------------------------------------------------------------------
  // 4. A referência que vai anexada em todo pedido de arte nova (doc 18).
  //
  //    Ela já viveu fora do repositório e sumiu duas vezes nesta fase. Sem ela o
  //    gerador desenha outro personagem em vez de editar o nosso. Não é sobre
  //    moldura — é sobre a esteira de arte, que continua de pé.
  // -------------------------------------------------------------------------
  console.log(`\n4. A imagem de referência\n`);
  checar(existsSync(REFERENCIA), "referência da base", `${REFERENCIA}`);
  despejar();

  console.log("\n========================================");
  if (violacoes.length > 0) {
    console.log(`RESULTADO: ${violacoes.length} violações`);
    console.log("========================================\n");
    for (const v of violacoes) console.log(`  [FAIL] ${v}`);
    console.log("\nDuas patentes perto demais, ou um anel perto demais do marfim,");
    console.log("só aparecem como problema no ranking — e ali o aluno vê a turma");
    console.log("inteira com a mesma moldura sem saber por quê.");
    process.exit(1);
  }
  console.log("RESULTADO: 0 violações");
  console.log("========================================");
  console.log("\nGate paleta das patentes: OK");
}

main();
