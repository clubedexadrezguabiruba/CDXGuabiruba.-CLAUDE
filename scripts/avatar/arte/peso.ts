/**
 * O TETO DE PESO DA ARTE — o gate que o G24 morreu sem ganhar.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELE NASCE AGORA, E NÃO ANTES NEM DEPOIS
 * ---------------------------------------------------------------------------
 *
 * O **G24** ("nenhum gate mede peso de asset, e o gambesão pesa 24× a farda") foi
 * fechado em 2026-08-17 **sem conserto**: a decisão do vetor derrubou o gambesão de
 * 248,2 KB para 60,6 KB no fio, e o achado morreu porque o número caiu de patamar —
 * **não porque ganhou régua**. `trajes.ts` continua só *imprimindo* o KB.
 *
 * Enquanto a rota fazia traje, o buraco tinha um dono e duas peças. Ao generalizar
 * o passo 4 para chapéu, óculos e pet (`peca-de-arte.ts`), ele passa a valer para
 * quatro slots e ~40 peças de catálogo, e o custo de instalar a régua depois seria
 * retrabalho de 40 arquivos — que é exatamente o argumento que o plano do traje já
 * tinha escrito para o `PEDIDO-TRAJE.md`.
 *
 * ---------------------------------------------------------------------------
 * A RÉGUA É O GZIP, E ISSO NÃO É DETALHE
 * ---------------------------------------------------------------------------
 *
 * SVG é texto e todo servidor o entrega comprimido; PNG já vem comprimido. Medir o
 * SVG cru ao lado de um PNG seria comparar maçã com laranja — e a conta sai **ao
 * contrário** na peça chapada, onde o cru é 3× MAIOR e o comprimido é menor (a
 * `traje-farda`: 28,7 KB crus contra 7,9 KB no fio). O que chega na internet da
 * criança é o gzip, então é ele que tem teto.
 *
 * ---------------------------------------------------------------------------
 * RATCHET, NO IDIOMA QUE O PROJETO JÁ USA
 * ---------------------------------------------------------------------------
 *
 * O baseline é gerado das peças que existem, **nunca escolhido**: um teto inventado
 * ou reprova arte legítima ou não reprova nada. Cada peça carrega o próprio número,
 * porque uma média entre a farda chapada (7,9 KB) e o gambesão aerografado (60,6 KB)
 * não descreveria nenhuma das duas.
 *
 * Ele **só encolhe sozinho**: peça que emagrece rebaixa o próprio teto na rodada
 * seguinte com `--update`, e peça que engorda reprova. É o mesmo mecanismo do
 * `rpc-baseline.json` e do ratchet de cores cruas.
 *
 * **Peça NOVA não reprova** — ela não tem teto ainda, e inventar um a partir dela
 * mesma seria aprovar qualquer coisa. Ela sai listada como *nova*, com o número, e
 * entra no baseline no `--update` que o Doug roda quando aprovar a peça. O gate
 * reprovar arte recém-chegada seria régua atrapalhando desenho, que é o contrário
 * do que este projeto quer.
 *
 * ---------------------------------------------------------------------------
 * A NEGAÇÃO MEDIDA
 * ---------------------------------------------------------------------------
 *
 * `--provar` infla um asset em memória e mostra o gate reprovando. Régua nova entra
 * com controle negativo ao lado — é a lição das cinco réguas que devolveram o mesmo
 * número para coisas diferentes (doc 19 §5), e um teto que nunca foi visto reprovar
 * é um teto que ninguém sabe se aperta.
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { gzipSync } from "zlib";

/**
 * A prateleira do produto. É de lá que o navegador da criança pede a peça.
 *
 * ⚠️ **Ela contém dois arquivos que NÃO são peça de catálogo**, e eles entram no
 * ratchet de propósito: `items/base/avatar-base-neutro.svg` (174,0 KB no fio) e
 * `items/base/avatar-base-sem-traje.svg` (86,5 KB) são sobra da pilha v2/v3 que
 * nenhum componente do produto referencia — só `scripts/` e um spec de e2e. Estão
 * registrados como *"lastro que sobra"* dentro do **G24** em `docs/achados.md`, e
 * apagá-los é decisão do Doug, não deste gate.
 *
 * **Por que não excluí-los da conta:** eles estão em `public/`, portanto no deploy,
 * portanto pesam. Um gate que os filtrasse em silêncio diria "a prateleira está sob
 * o teto" enquanto 260 KB moram nela — e descarte em silêncio é o modo de falha que
 * esta rota inteira existe para fechar. Sob o ratchet, eles ficam visíveis a cada
 * rodada; no dia em que forem apagados, o gate diz *"no baseline e NÃO na
 * prateleira"* e pede um `--update`, que é o comportamento certo.
 */
const PRATELEIRA = "public/items";
const BASELINE = "scripts/avatar/arte/peso-baseline.json";

/**
 * Quanto uma peça pode engordar sem reprovar: **2%**.
 *
 * Não é zero porque o traçador não é bit-a-bit estável entre versões da biblioteca,
 * e um gate que reprova na atualização do `@neplex/vectorizer` vira gate que se
 * desliga. 2% é menor que qualquer mudança de desenho perceptível e maior que ruído
 * de compressão — a diferença entre duas rodadas da esteira hoje é **0 bytes**.
 */
const FOLGA = 0.02;

interface Medida {
  caminho: string;
  gzip: number;
}

/** Todo `.svg` da prateleira, em ordem estável. */
function medir(dir: string, acc: Medida[] = []): Medida[] {
  let entradas: string[];
  try {
    entradas = readdirSync(dir).sort();
  } catch {
    return acc;
  }
  for (const nome of entradas) {
    const caminho = join(dir, nome).replace(/\\/g, "/");
    if (statSync(caminho).isDirectory()) medir(caminho, acc);
    else if (nome.endsWith(".svg")) {
      acc.push({ caminho, gzip: gzipSync(readFileSync(caminho)).length });
    }
  }
  return acc;
}

const kb = (b: number) => `${(b / 1024).toFixed(1)} KB`;

/**
 * O TETO DE UMA PEÇA, e **a decisão de reprovar** — as duas em um lugar só.
 *
 * Elas moram aqui, e não inline no laço, porque o controle negativo precisa chamar
 * **exatamente esta função**. A primeira versão do controle comparava dois números
 * que ele mesmo calculava (`inflado = teto * 2`, depois `inflado > teto`) e
 * "passava" provando que 2× é maior que 1× — aritmética, não régua. Era o modo de
 * falha nº 1 desta base de código escrito dentro do próprio mecanismo que existe
 * para pegá-lo.
 */
const tetoDe = (baseline: number) => Math.ceil(baseline * (1 + FOLGA));
const acimaDoTeto = (gzip: number, baseline: number) => gzip > tetoDe(baseline);

function principal(): void {
  const args = process.argv.slice(2);
  const medidas = medir(PRATELEIRA);

  console.log(`TETO DE PESO DA ARTE — o gzip de cada peça em ${PRATELEIRA}/\n`);

  if (!medidas.length) {
    console.error(
      `✗ nenhum .svg encontrado em ${PRATELEIRA}/.\n` +
        `  O gate estaria passando por vacuidade — e uma prateleira vazia quer dizer\n` +
        `  que a esteira não rodou ou que as peças não estão versionadas.`,
    );
    process.exit(1);
  }

  if (args.includes("--update")) {
    const novo: Record<string, number> = {};
    for (const m of medidas) novo[m.caminho] = m.gzip;
    writeFileSync(resolve(process.cwd(), BASELINE), JSON.stringify(novo, null, 2) + "\n");
    for (const m of medidas) console.log(`  ${m.caminho.padEnd(44)} ${kb(m.gzip).padStart(9)}`);
    console.log(`\n  · baseline regravado com ${medidas.length} peça(s) em ${BASELINE}`);
    return;
  }

  let baseline: Record<string, number>;
  try {
    baseline = JSON.parse(readFileSync(resolve(process.cwd(), BASELINE), "utf-8"));
  } catch {
    console.error(
      `✗ ${BASELINE} não existe ou não é JSON.\n` +
        `  Rode \`npm run arte:peso -- --update\` para gravá-lo das peças de hoje.`,
    );
    process.exit(1);
    return;
  }

  const violacoes: string[] = [];
  const novas: Medida[] = [];

  for (const m of medidas) {
    const teto = baseline[m.caminho];
    if (teto === undefined) {
      novas.push(m);
      continue;
    }
    const limite = tetoDe(teto);
    const estoura = acimaDoTeto(m.gzip, teto);
    const marca = estoura ? "✗" : m.gzip < teto ? "↓" : "·";
    console.log(
      `  ${marca} ${m.caminho.padEnd(42)} ${kb(m.gzip).padStart(9)}   teto ${kb(limite).padStart(9)}` +
        (m.gzip < teto ? `   (encolheu ${kb(teto - m.gzip)} — \`--update\` baixa o teto)` : ""),
    );
    if (estoura) {
      violacoes.push(`${m.caminho}: ${kb(m.gzip)} contra teto de ${kb(limite)} (+${kb(m.gzip - limite)})`);
    }
  }

  for (const m of novas) {
    console.log(`  + ${m.caminho.padEnd(42)} ${kb(m.gzip).padStart(9)}   NOVA — sem teto ainda`);
  }

  // Peça que saiu da prateleira mas ficou no baseline: não reprova, mas some em
  // silêncio se ninguém disser. Um baseline que descreve arquivo inexistente é a
  // primeira forma de ele parar de descrever a realidade.
  const sumidas = Object.keys(baseline).filter((c) => !medidas.some((m) => m.caminho === c));
  for (const c of sumidas) console.log(`  ? ${c.padEnd(42)}   no baseline e NÃO na prateleira`);

  // ------------------------------------------------ a negação medida
  //
  // Ela chama `acimaDoTeto`, que é **a mesma função** que o laço acima usa para
  // decidir. Um controle que refizesse a conta por fora provaria que a conta do
  // controle funciona, e não que o gate funciona — foi assim que a primeira versão
  // desta seção passou por vacuidade.
  //
  // São TRÊS casos e não um, porque um teto tem duas bordas e uma folga:
  if (args.includes("--provar")) {
    const alvo = medidas[0];
    const base = baseline[alvo.caminho] ?? alvo.gzip;
    const casos: [string, number, boolean][] = [
      ["o peso de hoje", base, false],
      ["no limite da folga de 2%", tetoDe(base), false],
      ["um byte acima do teto", tetoDe(base) + 1, true],
    ];

    console.log(`\n  CONTROLE NEGATIVO — \`acimaDoTeto\` sabe onde reprovar?`);
    console.log(`    alvo: ${alvo.caminho}   teto ${kb(tetoDe(base))}\n`);

    let falhou = false;
    for (const [rotulo, peso, esperado] of casos) {
      const obtido = acimaDoTeto(peso, base);
      const certo = obtido === esperado;
      if (!certo) falhou = true;
      console.log(
        `    ${certo ? "·" : "✗"} ${rotulo.padEnd(28)} ${kb(peso).padStart(9)}  →  ` +
          `${obtido ? "REPROVA" : "passa"}${certo ? "" : `   ✗ esperava ${esperado ? "REPROVA" : "passa"}`}`,
      );
    }

    if (falhou) {
      console.error(
        `\n✗ o controle negativo não fecha. A régua não reprova onde deveria, ou reprova\n` +
          `  onde não deveria — em qualquer dos dois casos o teto não está medindo peso.`,
      );
      process.exit(1);
    }
    console.log(`\n    · a régua aperta exatamente no teto, e não antes`);
  }

  if (violacoes.length) {
    console.error(`\n✗ ${violacoes.length} peça(s) acima do teto:\n`);
    for (const v of violacoes) console.error(`    ${v}`);
    console.error(
      `\n  O que fazer, nesta ordem:\n` +
        `    1. a peça engordou por acidente? Refaça a esteira e compare.\n` +
        `    2. a arte mudou de propósito e o Doug aprovou o resultado?\n` +
        `       \`npm run arte:peso -- --update\` sobe o teto, e o commit registra a decisão.\n` +
        `    3. o Quadro de Honra mostra 30 bonecos juntos — peso de peça é multiplicado\n` +
        `       por 30 na tela que a criança mais vê.`,
    );
    process.exit(1);
  }

  const total = medidas.reduce((a, m) => a + m.gzip, 0);
  console.log(
    `\n  · ${medidas.length} peça(s) sob o teto` +
      (novas.length ? `, ${novas.length} nova(s) sem teto` : "") +
      `   —   ${kb(total)} no fio, somadas`,
  );
}

principal();
