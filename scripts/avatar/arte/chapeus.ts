/**
 * P5-C — O LITERAL DAS PEÇAS DE CHAPÉU: `src/lib/avatar/estilo/chapeus-da-arte.ts`.
 *
 * É o análogo exato de `arte:trajes`, e existe pelo mesmo motivo: **o arquivo de
 * saída é GERADO**. Corrigir o que está nele é corrigir este programa, nunca o
 * arquivo (amarra §9.5 do doc 19).
 *
 * ---------------------------------------------------------------------------
 * `--check` — O MESMO GERADOR, SEM ESCREVER
 * ---------------------------------------------------------------------------
 *
 * Ele gera em memória e compara com o disco, caractere a caractere. Entra na
 * cadeia `verify:arte` ao lado de `arte:trajes --check`, e fecha a mesma porta: um
 * literal que defase da esteira faz o produto desenhar uma peça e a folha julgar
 * outra.
 *
 * ---------------------------------------------------------------------------
 * ELE ACEITA CATÁLOGO VAZIO, E ISSO NÃO É DESCUIDO
 * ---------------------------------------------------------------------------
 *
 * `trajes.ts` reprova quando não acha arte, e está certo: quando ele nasceu já
 * havia duas peças, e zero significaria que alguém apagou o disco. Aqui zero é o
 * estado inicial legítimo — o slot existe, a esteira existe, e a primeira arte
 * ainda não foi desenhada. Reprovar aqui deixaria `verify:arte` vermelho até o
 * Doug desenhar, e gate vermelho por ausência de trabalho é gate que se aprende a
 * ignorar.
 *
 * Com zero artes o literal sai com o objeto vazio, `CHAPEUS_DA_ARTE` é `{}`, e o
 * compositor não emite camada nenhuma — o SVG sai byte a byte o de hoje, que é o
 * que mantém os selos parados.
 *
 * ---------------------------------------------------------------------------
 * AS ARTES SÃO DESCOBERTAS, OS NOMES SÃO ESCRITOS
 * ---------------------------------------------------------------------------
 *
 * A lista sai de `scripts/avatar/arte/chapeu-*.png` — arte nova entra na esteira
 * só de existir. O **nome que a criança lê** não se deriva: `chapeu-toca-de-cozinha`
 * viraria "Toca De Cozinha". Ele mora em `NOMES`, e uma arte sem nome **reprova em
 * vez de inventar**.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";

import { PASTA } from "./base";
import { CHAPEU, PASTA_CHAPEU, tintaDoChapeu } from "./chapeu";
import { primeiraDivergencia, semCR } from "./gerado";
import { construirPeca } from "./peca-de-arte";
import { oclusaoDoSvg } from "./oclusao-do-chapeu";

const SAIDA = "src/lib/avatar/estilo/chapeus-da-arte.ts";

/**
 * O nome de catálogo de cada peça. Uma linha por arte, e sem default.
 *
 * Os slugs saem do menu do doc 22 (linhas 316–326). Só entram aqui os que **têm
 * arte desenhada**, que é a trava nº 1 do doc 21 §1.3 — arte por demanda, nunca
 * estoque.
 */
const NOMES: Record<string, string> = {
  // As duas primeiras tocas foram REPROVADAS pelo Doug em 2026-08-24, no render:
  // "sem borda, descolada, cor vazando". `arte:perimetro` nasceu dessa reprovação e
  // mede o defeito — 65,2% e 77,5% de perímetro com linha, contra 99,7% das peças
  // que ele aprovou. Os `-crua.jpg` ficam no disco como registro.
  "chapeu-toca-alta": "Toca Alta",
  "chapeu-toca-curta": "Toca Curta",
  // O ELENCO DE CHAPÉU, batizado pelo Doug em 2026-08-25 — os nomes chegaram nos
  // próprios arquivos de entrega (`nome(raridade).jpg`) e cada arte foi casada com o
  // seu por MD5, não por horário. A raridade fica no comentário porque `NOMES` só
  // guarda o nome que a criança lê; ela vira coluna na seed de `avatar_catalogo`.
  "chapeu-toca-de-cozinha": "Toca de Cozinheiro", // common · doc 22 nº 46
  "chapeu-touca-de-la": "Touca de Lã", // common
  "chapeu-chapeu-de-palha": "Chapéu de Palha", // common · doc 22 nº 47 (lá é `rare`)
  "chapeu-boina": "Boina", // rare · doc 22 nº 42 (lá é `common`)
  "chapeu-cartola": "Cartola", // rare
  "chapeu-cowboy": "Chapéu de Cowboy", // rare
  "chapeu-bone": "Boné", // epic · doc 22 nº 44 (lá é `common`)
  "chapeu-pirata": "Chapéu de Pirata", // epic
  "chapeu-mago": "Chapéu de Mago", // legendary
};

/**
 * Quais chapéus têm ABA PARA A FRENTE, que ganha do óculos.
 *
 * Escrito à mão, como `NOMES` acima, e pelo mesmo motivo: não se deriva do alfa.
 * "A aba cruza o óculos" a máquina mede — e mediu, nos 45 pares. O que ela não sabe
 * é se aquela aba é a da FRENTE (pala de boné, sobre os olhos) ou a de TRÁS (o outro
 * lado do crânio). Isso é profundidade, e a arte é chapada: só o olho de quem
 * desenhou responde.
 *
 * O Doug olhou os 45 renderizados em 2026-08-28 e reprovou **um**: *"O boné, por ter
 * uma aba que desce abaixo da testa. O óculos por cima dessa aba não faz sentido,
 * pois na vida real a aba deve estar acima dos óculos."* Os outros 8 aprovaram com o
 * óculos por cima.
 *
 * Chapéu novo entra FORA desta lista — o óculos por cima é o padrão. Entra aqui só
 * quando a aba desce sobre os olhos, e a régua é o render, não o palpite.
 */
const ABA_SOBRE_OCULOS = new Set<string>(["chapeu-bone"]);

/** `public/items/chapeu/x.svg` → `/items/chapeu/x.svg`, a URL que o browser pede. */
const urlDaArte = (caminho: string) => caminho.replace(/^public/, "");

const CABECALHO = `/**
 * ARQUIVO GERADO — não edite à mão.
 *
 * Escrito por \`npm run arte:chapeus\` (\`scripts/avatar/arte/chapeus.ts\`), o passo 5
 * da esteira do slot \`chapeu\`. Cada peça nasce de um PNG desenhado pelo Doug sobre
 * a base oficial e aprovado no Gate −1.
 *
 * Corrigir algo aqui é corrigir o gerador. \`npm run arte:chapeus -- --check\` está
 * em \`verify:arte\` e reprova quando este arquivo defasa da esteira.
 *
 * O QUE CADA CAMPO É:
 *
 *  - \`arte\` — o \`.svg\` da peça, colado por \`<image>\` na \`CAIXA_DA_ARTE\`. O chapéu
 *    **não recolore** (Regra Inviolável nº 4): a cor sai final da arte, e não há
 *    \`tinta\` nem fábrica de cor neste slot;
 *  - \`abaSobreOculos\` — este chapéu tem ABA PARA A FRENTE, que desce sobre os
 *    olhos e ganha do óculos. Ausente ≡ o óculos passa por CIMA, o caso de 8 dos 9.
 *    É fato de desenho, escrito à mão no gerador: a máquina mede que a aba cruza o
 *    óculos, mas não sabe se é a da frente ou a de trás — isso é profundidade, e a
 *    arte é chapada;
 *  - \`escondeCabelo\` — a LINHA que esta peça contém, extraída do alfa do próprio
 *    \`.svg\` por \`oclusao-do-chapeu.ts\`: acima dela o cabelo não sai, abaixo dela
 *    sai inteiro. Não é escolha de arte e ninguém a escreve; mudou o desenho, mudou
 *    a linha, na mesma passada. Ausente = o chapéu não contém nada.
 */`;

const RODAPE = `
/** Quantas peças de chapéu a arte já produziu. Contagem derivada, nunca escrita. */
export const TOTAL_CHAPEUS_DA_ARTE = Object.keys(CHAPEUS_DA_ARTE).length;
`;

function corpoDaPeca(slug: string, nome: string, arte: string, escondeCabelo?: string): string {
  return (
    `  ${JSON.stringify(slug)}: {\n` +
    `    id: ${JSON.stringify(slug)},\n` +
    `    nome: ${JSON.stringify(nome)},\n` +
    `    arte: ${JSON.stringify(arte)},\n` +
    // Ausente ≡ óculos por cima, que é o caso de 8 dos 9. Só quem está na lista
    // escreve a linha — o arquivo gerado não carrega `false` por 8 peças.
    (ABA_SOBRE_OCULOS.has(slug) ? `    abaSobreOculos: true,
` : "") +
    (escondeCabelo ? `    escondeCabelo:\n      ${JSON.stringify(escondeCabelo)},\n` : "") +
    `  },`
  );
}

/** As artes de chapéu que existem no disco, em ordem estável. */
export function artesDeChapeu(): string[] {
  return readdirSync(PASTA)
    .filter((f) => /^chapeu-.+\.png$/i.test(f))
    .sort()
    .map((f) => `${PASTA}/${f}`);
}

async function gerar(): Promise<string> {
  const artes = artesDeChapeu();
  const blocos: string[] = [];
  let faltou = false;

  for (const arte of artes) {
    const p = await construirPeca(arte, CHAPEU, tintaDoChapeu, "raster");
    const nome = NOMES[p.slug];
    if (!nome) {
      console.error(
        `  ✗ ${p.slug} não tem nome em NOMES (chapeus.ts). ` +
          `O nome é o que a criança lê e não se deriva do slug — escreva a linha.`,
      );
      faltou = true;
      continue;
    }
    if (!existsSync(p.arte)) {
      console.error(`  ✗ ${p.arte} não foi escrito.`);
      faltou = true;
      continue;
    }
    console.log(
      `  ${p.slug.padEnd(24)} ${nome.padEnd(22)} cor ${p.cor} · ` +
        `${p.pixels.toLocaleString("pt-BR")} px · ` +
        `${(p.bytesGzip / 1024).toFixed(1)} KB no fio` +
        `   controle na base ${p.controleNaBase} px`,
    );
    // A LINHA DE OCLUSÃO sai do `.svg` que acabou de ser escrito — nunca do `.png` de
    // entrada. O que oclui é a peça publicada, com o recorte e a linha instrumental já
    // resolvidos; medir a entrada seria medir um desenho que o produto não mostra.
    const { d: escondeCabelo, divergencia, correcao } = await oclusaoDoSvg(p.slug, p.arte);
    if (correcao.escondeu || correcao.mostrou) {
      console.log(
        `     mao do Doug: +${correcao.escondeu.toLocaleString("pt-BR")} px escondidos, ` +
          `-${correcao.mostrou.toLocaleString("pt-BR")} px mostrados  (oclusao/${p.slug}.png)`,
      );
    }
    if (!escondeCabelo) {
      console.log(`     · não oclui coluna nenhuma — sai sem o campo, e o cabelo passa inteiro.`);
    } else if (divergencia.colunas > 0) {
      console.log(
        `     ! alcance x ingênua divergem em ${divergencia.colunas} coluna(s), até ` +
          `${divergencia.maiorEmU.toFixed(1)} u — a peça tem vão acima de enfeite pendurado.`,
      );
    }
    blocos.push(corpoDaPeca(p.slug, nome, urlDaArte(p.arte), escondeCabelo));
  }
  if (faltou) process.exit(1);

  if (!artes.length) {
    console.log(`  · nenhuma arte \`chapeu-*.png\` em ${PASTA}/ — o slot sai vazio, e é o`);
    console.log(`    estado inicial legítimo. Ver o docstring do topo.`);
  }

  return (
    `${CABECALHO}\n\n` +
    `import type { PecaDeChapeu } from "./tipos";\n\n` +
    `export const CHAPEUS_DA_ARTE: Record<string, PecaDeChapeu> = {\n` +
    (blocos.length ? `${blocos.join("\n")}\n` : "") +
    `};\n` +
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
      console.error(`\n  ✗ ${SAIDA} NÃO EXISTE. Rode \`npm run arte:chapeus\`.`);
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
        `    Conserto: \`npm run arte:chapeus\` e conferir o \`git diff\` — se ele mudar\n` +
        `    uma peça que ninguém redesenhou, a mudança veio da esteira e é achado.`,
    );
    process.exit(1);
  }

  console.log(`GERANDO ${SAIDA}\n`);
  const texto = await gerar();
  mkdirSync("src/lib/avatar/estilo", { recursive: true });
  writeFileSync(SAIDA, texto, "utf-8");
  console.log(
    `\n  escrito. O que falta, quando a peça é NOVA, é a linha dela em \`avatar_catalogo\`:\n` +
      `  \`verify:catalogo-slots\` compara os dois conjuntos NOS DOIS SENTIDOS, e código\n` +
      `  sem linha no banco reprova tanto quanto linha no banco sem código.`,
  );
  if (existsSync(PASTA_CHAPEU)) {
    console.log(
      `  os SVGs estão em ${PASTA_CHAPEU}/ — versionados de propósito: é o que os leva\n` +
        `  ao deploy (\`arteDaPecaNoDeploy.test.ts\`). Não esqueça o \`git add\` deles.`,
    );
  }
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
