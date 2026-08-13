/**
 * P5-T — O LITERAL DAS PEÇAS DE TRAJE: `src/lib/avatar/estilo/trajes-da-arte.ts`.
 *
 * É o passo 5 da esteira do traje e o análogo de `arte:pecas`. Ele existe pelo
 * mesmo motivo, que é o que faz a esteira escalar de 1 para 9 peças sem ninguém
 * colar `Traje` à mão: **o arquivo de saída é GERADO**. Corrigir o que está nele é
 * corrigir este programa, nunca o arquivo (amarra §9.5 do doc 19).
 *
 * ---------------------------------------------------------------------------
 * `--check` — O MESMO GERADOR, SEM ESCREVER
 * ---------------------------------------------------------------------------
 *
 * Ele gera em memória e compara com o disco, caractere a caractere. Entra na
 * cadeia `verify:arte` ao lado de `arte:pecas --check`, e fecha a mesma porta: um
 * literal que defase da esteira faz o produto desenhar uma peça e a folha julgar
 * outra. É o defeito nº 1 desta rota — a franja torta do chanel atravessou três
 * blocos porque ninguém comparava as duas coisas.
 *
 * ---------------------------------------------------------------------------
 * AS ARTES SÃO DESCOBERTAS, OS NOMES SÃO ESCRITOS
 * ---------------------------------------------------------------------------
 *
 * A lista de artes sai de `scripts/avatar/arte/traje-*.png` — arte nova entra na
 * esteira só de existir, e é o que faz este programa servir às 8 peças seguintes
 * sem edição.
 *
 * O **nome que a criança lê** não se deriva: `traje-aprendiz-macacao` viraria
 * "Macacao" sem acento, e `traje-soldado-duas-pecas` viraria "Duas Pecas". Ele mora
 * na tabela `NOMES` abaixo, e uma arte sem nome **reprova em vez de inventar**.
 * Custa uma linha por peça, e essa linha é a única coisa deste arquivo que uma
 * pessoa precisa escrever.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";

import { PASTA } from "./base";
import { primeiraDivergencia, semCR } from "./gerado";
import { PASTA_TRAJE, construir } from "./traje";

const SAIDA = "src/lib/avatar/estilo/trajes-da-arte.ts";

/**
 * O nome de catálogo de cada peça. Uma linha por arte, e sem default.
 *
 * Os slugs saem do doc 21 §7 e da migration `20260812120000`; só entram aqui os
 * que **têm arte desenhada**, que é a trava nº 1 do doc 21 §1.3 — arte por
 * demanda, nunca estoque.
 */
// A convenção é `traje-<nome>`, sem patente — desde 2026-08-13, quando a patente
// saiu da roupa e virou moldura (doc 21 §0.7). `traje-soldado-farda` virou
// `traje-farda` no mesmo commit em que a recolorização por patente morreu.
const NOMES: Record<string, string> = {
  "traje-farda": "Farda da Academia",
  "traje-gambesao": "Gambesão Acolchoado",
};

/** `public/items/traje/x.png` → `/items/traje/x.png`, que é a URL que o browser pede. */
const urlDoPng = (caminho: string) => caminho.replace(/^public/, "");

const CABECALHO = `/**
 * ARQUIVO GERADO — não edite à mão.
 *
 * Escrito por \`npm run arte:trajes\` (\`scripts/avatar/arte/trajes.ts\`), o passo 5
 * da esteira de traje do doc 19. Cada peça nasce de um PNG desenhado pelo Doug
 * sobre a base oficial, aprovado no Gate −1 e recolorido por \`npm run arte:traje\`.
 *
 * Corrigir algo aqui é corrigir o gerador. \`npm run arte:trajes -- --check\` está
 * em \`verify:arte\` e reprova quando este arquivo defasa da esteira.
 *
 * O QUE CADA CAMPO É, E O QUE ELE NÃO É:
 *
 *  - \`tinta.png\` — o INTERIOR da peça, clipado no \`pathTronco()\`. Nunca a
 *    fronteira: o que excede a silhueta é \`extensoes\`, e extensão é vetor
 *    (doc 21 §6.1, e \`tipos.ts:51\`);
 *  - \`tinta.cor\` — a cor dominante MEDIDA na arte (moda em baldes de 8 níveis por
 *    canal, com a média dentro do balde vencedor). É o fallback chapado se o PNG
 *    faltar, e é o que o compositor escurece para a sombra do queixo e o plano
 *    lateral quando não há arte. **Ela não vem mais de \`patentes.ts\`**: a patente
 *    deixou de vestir o boneco em 2026-08-13, e a cor do traje passou a ser final e
 *    livre (doc 21 §0);
 *  - **\`escalaMedida\` é ausente de propósito.** Com ela ausente o compositor usa
 *    \`k = 1\` (\`compositor.ts:373\`), e o \`<image>\` ocupa o \`viewBox\` inteiro — que
 *    é exatamente o retângulo em que o PNG foi recortado (px 212→812 × 92→932,
 *    600 × 840, 5:7). A colagem é conta, não ajuste.
 */`;

const RODAPE = `
/** Quantas peças de traje a arte já produziu. Contagem derivada, nunca escrita. */
export const TOTAL_TRAJES_DA_ARTE = Object.keys(TRAJES_DA_ARTE).length;
`;

function corpoDaPeca(slug: string, nome: string, png: string, cor: string): string {
  return (
    `  ${JSON.stringify(slug)}: {\n` +
    `    id: ${JSON.stringify(slug)},\n` +
    `    nome: ${JSON.stringify(nome)},\n` +
    `    tinta: { png: ${JSON.stringify(png)}, cor: ${JSON.stringify(cor)} },\n` +
    `  },`
  );
}

/** As artes de traje que existem no disco, em ordem estável. */
export function artesDeTraje(): string[] {
  return readdirSync(PASTA)
    .filter((f) => /^traje-.+\.png$/i.test(f))
    .sort()
    .map((f) => `${PASTA}/${f}`);
}

async function gerar(): Promise<string> {
  const artes = artesDeTraje();
  if (!artes.length) {
    console.error(`  ✗ nenhuma arte \`traje-*.png\` em ${PASTA}/`);
    process.exit(1);
  }

  const blocos: string[] = [];
  let faltou = false;
  for (const arte of artes) {
    const p = await construir(arte);
    const nome = NOMES[p.slug];
    if (!nome) {
      console.error(
        `  ✗ ${p.slug} não tem nome em NOMES (trajes.ts). ` +
          `O nome é o que a criança lê e não se deriva do slug — escreva a linha.`,
      );
      faltou = true;
      continue;
    }
    if (!existsSync(p.png)) {
      console.error(`  ✗ ${p.png} não foi escrito — rode \`npm run arte:traje\` antes.`);
      faltou = true;
      continue;
    }
    console.log(
      `  ${p.slug.padEnd(20)} ${nome.padEnd(22)} cor ${p.cor} · ` +
        `${p.pixels.toLocaleString("pt-BR")} px · ${(p.bytes / 1024).toFixed(1)} KB` +
        `   controle na base ${p.controleNaBase} px`,
    );
    blocos.push(corpoDaPeca(p.slug, nome, urlDoPng(p.png), p.cor));
  }
  if (faltou) process.exit(1);

  return (
    `${CABECALHO}\n\n` +
    `import type { Traje } from "./tipos";\n\n` +
    `export const TRAJES_DA_ARTE: Record<string, Traje> = {\n` +
    `${blocos.join("\n")}\n};\n` +
    RODAPE
  );
}

async function principal(): Promise<void> {
  const check = process.argv.includes("--check");

  if (check) {
    console.log(`CONFERINDO ${SAIDA} (--check: gera em memória, não escreve)\n`);
    const esperado = await gerar();
    let emDisco: string;
    try {
      emDisco = readFileSync(SAIDA, "utf-8");
    } catch {
      console.error(`\n  ✗ ${SAIDA} NÃO EXISTE. Rode \`npm run arte:trajes\`.`);
      process.exit(1);
    }
    if (semCR(emDisco) === semCR(esperado)) {
      console.log(`\n  · ${SAIDA} confere com a esteira de hoje, caractere a caractere.`);
      return;
    }
    const linha = primeiraDivergencia(semCR(emDisco), semCR(esperado));
    console.error(
      `\n  ✗ ${SAIDA} DEFASOU da esteira.\n` +
        `    Primeira divergência na linha ${linha}` +
        ` (disco ${semCR(emDisco).length} × gerado ${semCR(esperado).length} caracteres,` +
        ` quebras normalizadas).\n` +
        `    Conserto: \`npm run arte:trajes\` e conferir o \`git diff\` — se ele mudar\n` +
        `    uma peça que ninguém redesenhou, a mudança veio da esteira e é achado.`,
    );
    process.exit(1);
  }

  console.log(`GERANDO ${SAIDA}\n`);
  const texto = await gerar();
  mkdirSync("src/lib/avatar/estilo", { recursive: true });
  writeFileSync(SAIDA, texto, "utf-8");
  console.log(
    `\n  escrito. A peça ainda NÃO está no catálogo: \`CATALOGO.traje\` continua vazio\n` +
      `  até a seed do banco entrar junto (verify:catalogo-slots compara os dois).`,
  );
  console.log(
    `  os PNGs estão em ${PASTA_TRAJE}/ — versionados de propósito: é o que os leva\n` +
      `  ao deploy (\`pngDaPecaNoDeploy.test.ts\`). Não esqueça o \`git add\` deles.`,
  );
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
