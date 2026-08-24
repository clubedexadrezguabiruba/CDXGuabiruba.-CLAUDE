/**
 * O LITERAL DOS CABELOS TONAIS: `src/lib/avatar/estilo/cabelos-da-arte.ts`.
 *
 * É o gêmeo de `arte:rostos` para o slot `cabelo`, e a semelhança é literal: a
 * esteira é **a mesma** (`construirPecaTonal`, em `barba-para-formas.ts`), com dois
 * parâmetros trocados. O que este arquivo faz de próprio é escrever o literal e
 * gravar o PNG de tom na prateleira do slot.
 *
 * `--check` gera em memória, compara caractere a caractere com o disco e entra em
 * `verify:arte` ao lado de `arte:pecas --check`, `arte:trajes --check` e
 * `arte:rostos --check` — a porta que ele fecha é a de o produto desenhar uma peça e
 * a folha julgar outra, que é o defeito nº 1 desta rota.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELE NASCE VAZIO, E POR QUE ISSO NÃO É UM ARQUIVO INÚTIL
 * ---------------------------------------------------------------------------
 *
 * O Doug decidiu em 2026-08-22 refazer os **cinco** modelos de cabelo no padrão
 * tonal da `rosto-barba-trancada`, e decidiu junto o ritmo: **arte a arte**. Cada
 * peça atravessa a esteira, vai à folha, ele vê local e aprova antes da próxima.
 *
 * Então `NOMES` começa vazio de propósito. O que existe hoje é a **espinha** — o
 * tipo, o ramo do compositor, a esteira parametrizada, este gerador e a folha —
 * medida sobre as artes que já estão no disco, sem promover nenhuma. A primeira
 * linha entra quando a primeira peça for aprovada.
 *
 * ⚠️ **Um gerador vazio confere o vazio, e isso é honesto, não vácuo:** o `--check`
 * continua reprovando se o arquivo no disco deixar de bater com o que a esteira
 * produz — inclusive se alguém escrever uma peça à mão nele.
 *
 * ---------------------------------------------------------------------------
 * A LISTA SAI DOS NOMES, COMO NO ROSTO — e no traje sai dos arquivos
 * ---------------------------------------------------------------------------
 *
 * `trajes.ts` descobre as artes por `readdir` e reprova a que não tem nome, porque
 * lá as duas peças foram promovidas juntas. Aqui a pasta guarda de propósito arte
 * que ainda **não** foi promovida — `entrada.png`, `chanel.png` e `entrada-2.png`
 * são as três peças do elenco VELHO, que continuam em produção pela família
 * traçada até cada substituta ser aprovada. Descobrir por arquivo promoveria as
 * três de uma vez, que é o contrário da instrução.
 *
 * A trava fica do outro lado: um nome **sem** arte no disco reprova. Catálogo
 * prometendo peça que não existe é o erro que matou a v2 — 8 uniformes semeados, 0
 * renderáveis.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

import { PASTA } from "./base";
import { construirPecaTonal } from "./barba-para-formas";
import { primeiraDivergencia, semCR } from "./gerado";

const SAIDA = "src/lib/avatar/estilo/cabelos-da-arte.ts";

/**
 * ONDE O PNG DE TOM MORA — e ele é peça de deploy, não intermediário.
 *
 * `public/items/` é a prateleira do produto: é de lá que o navegador da criança pede
 * a peça, e é a única pasta de `public/` que viaja como catálogo (`public/dev/` é
 * oficina, e `arteDaPecaNoDeploy.test.ts` reprova quem nasce lá).
 *
 * O arquivo **precisa ser rastreado pelo git** — a Vercel builda a árvore do git, e
 * arquivo ignorado não chega ao ar por mais que exista nesta máquina. O modo de
 * falha é o mesmo do rosto e do traje: o compositor decide pelo campo declarado,
 * nunca pelo arquivo existindo, então a máscara sumiria em silêncio e o cabelo
 * sairia chapado em produção com todos os gates verdes.
 */
const PRATELEIRA_TOM = "public/items/cabelo";
const urlDoTom = (slug: string) => `/items/cabelo/${slug}-tom.png`;

/**
 * O nome que a criança lê, por arte promovida. Uma linha por peça, sem default.
 *
 * A chave é o nome do ARQUIVO sem extensão, como em `PECAS_DA_ARTE` — e não o slug
 * com prefixo. É por essa chave que `CABELOS.<modelo>` espalha o objeto daqui, e é
 * ela que o `id` gravado carrega, motivo pelo qual o catálogo **sobrescreve a
 * identidade** na promoção (ver `CABELOS` em `cabelo.ts`).
 *
 * ⚠️ **Uma linha por arte que ATRAVESSOU A ESTEIRA — não por peça aprovada.**
 * A regra mudou em 2026-08-22, quando o Doug pediu para julgar a peça no runtime e
 * não só na folha: o passo 9 da esteira é o parecer dele em `/dev/avatar-kokeshi`, e
 * uma peça que não existe em lugar nenhum do código não chega àquela página. É o
 * mesmo contrato de `PECAS_DA_ARTE` na família traçada, que sempre listou arte não
 * promovida.
 *
 * **A aprovação continua morando em `CABELOS`** (`cabelo.ts`), que é o que a criança
 * vê — estar aqui não promove nada, e o seletor "da arte · tonal" da página de dev é
 * separado do seletor do catálogo justamente para não parecer que promove. A trava do
 * outro lado não mudou: um nome **sem** arte no disco reprova.
 */
const NOMES: Record<string, string> = {
  // A primeira peça tonal do slot, aprovada pelo Doug em 2026-08-22 sobre a folha.
  // O arquivo `chanel.png` foi SOBRESCRITO pela arte nova, por decisão dele ("ele
  // substitui o velho, pode manter o mesmo nome") — e é por isso que `chanel` saiu
  // de `ARTES` em `pecas.ts` no mesmo commit: um nome de arquivo, uma arte, uma
  // esteira.
  chanel: "Chanel",
  // Atravessou a esteira em 2026-08-22, sem parecer ainda: Gate −1 aprovada com 0 px
  // nas protegidas, traço do boneco inteiro, contorno preto, figurinha de 562 px e
  // nenhuma janela de feição aberta. Está aqui para ser JULGADA em `/dev/avatar-kokeshi`
  // — o `moicano` continua paramétrico em `CABELOS` até o Doug dizer.
  moicano: "Moicano",
  // Atravessou a esteira em 2026-08-22, sem parecer ainda. Substitui `entrada-2.png`,
  // que é a arte traçada do mesmo modelo e continua em produção até o Doug dizer — na
  // promoção ela sai de `ARTES` em `pecas.ts`, como o `chanel` saiu.
  assimetrico: "Assimétrico",
  // O primeiro cabelo tonal que NÃO substitui ninguém — modelo novo, fora dos cinco
  // do elenco antigo, e por isso ele não sai de família nenhuma na promoção: entra
  // direto em `CABELOS` e em `MODELOS_TONAIS`. Atravessou a esteira em 2026-08-22,
  // com a folha aprovada pelo Doug a olho. Está aqui para ser JULGADA em
  // `/dev/avatar-kokeshi` antes da promoção.
  "burst-fade": "Burst Fade",
};

const CABECALHO = `/**
 * OS CABELOS TONAIS DA ARTE — silhueta em vetor, claro-escuro em máscara.
 *
 * ARQUIVO GERADO — não edite à mão. Escrito por \`npm run arte:cabelos\`
 * (\`scripts/avatar/arte/cabelos.ts\`). Cada peça nasce de um PNG desenhado pelo Doug
 * sobre a base oficial, aprovado no Gate −1, limpo pela quarta saída da rota
 * (\`restaurar-peca.ts\`) e traçado por \`scripts/avatar/arte/barba-para-formas.ts\`,
 * que é a esteira de quem RECOLORE — a mesma da barba, com dois parâmetros de slot
 * trocados.
 *
 * Corrigir algo aqui é corrigir o gerador. \`npm run arte:cabelos -- --check\` está em
 * \`verify:arte\` e reprova quando este arquivo defasa da esteira.
 *
 * ---------------------------------------------------------------------------
 * POR QUE \`tonal\` E NÃO \`massa\`, QUE É O QUE OS TRÊS CABELOS DE HOJE USAM
 * ---------------------------------------------------------------------------
 *
 * A família traçada (\`massa\`) posteriza: \`potrace\` traça CONTORNO, contorno é
 * binário, e uma arte de centenas de tons chegava ao boneco com dois ou três. A
 * \`rosto-barba-trancada\` provou a saída em 2026-08-22 — a mesma silhueta vetorial,
 * vestida por uma **máscara de luminosidade** servida como PNG cinza, entrega ~250
 * tons no render. O Doug aprovou olhando e decidiu o elenco inteiro neste padrão.
 *
 *  1. a silhueta INTEIRA, em \`var(--av-linha)\`. O preto de baixo;
 *  2. **o MESMO \`d\`**, em \`var(--av-cabelo, #262626)\`, vestido pela máscara.
 *
 *     A reserva é a rede para quando a propriedade não existir — sem ela o \`fill\`
 *     cai em preto e o cabelo vira mancha sólida. \`#262626\` é a que o Doug julgou
 *     na folha recolorida de 2026-08-19.
 *
 * **A máscara não tem cor** — é um canal de cinza —, então a peça recolore INTEIRA
 * e a Regra Inviolável nº 4 continua de pé: o aluno escolhe pele e cabelo, e o
 * cabelo é um dos dois. O argumento completo está em \`TomDaPeca\` (\`tipos.ts\`).
 *
 * **O que entra aqui é o CAMINHO do PNG, não os bytes.** O arquivo mora em
 * \`public/items/cabelo/\` e é servido à parte, como o \`.svg\` do traje. Embutir os
 * bytes em base64 quebrava o ranking: 30 bonecos fechavam em **753,0 KB** de gzip
 * contra **17,6 KB** com arquivo externo, porque o boneco composto passa da janela
 * de 32.768 B do DEFLATE e a dedução do blob morre.
 *
 * \`semTraco: true\` nas duas formas, pela decisão **G29**: peça de arte usa o
 * contorno que o gerador pintou (5,2 u), não o \`kk-traco\` de 12 u do compositor.
 *
 * ---------------------------------------------------------------------------
 * A IDENTIDADE É SOBRESCRITA NA PROMOÇÃO, E ISSO NÃO É DETALHE
 * ---------------------------------------------------------------------------
 *
 * A chave e o \`id\` daqui saem do NOME DO ARQUIVO. \`CABELOS.<modelo>\` espalha o
 * objeto e sobrescreve \`id\` e \`nome\` — sem isso, \`CABELOS.espetado.id\` seria
 * \`"entrada"\` em runtime, mascarado pelo cast deste arquivo. É o mesmo contrato de
 * \`PECAS_DA_ARTE\`, e \`linhas-cabelo.test.ts\` o cobra.
 */`;

const RODAPE = `
/** Quantos cabelos tonais a arte já produziu. Contagem derivada, nunca escrita. */
export const TOTAL_CABELOS_DA_ARTE = Object.keys(CABELOS_DA_ARTE).length;
`;

function corpoDaPeca(
  chave: string,
  nome: string,
  formas: { d: string; cor: string; semTraco: true }[],
  tom: { arte: string; x: number; y: number; w: number; h: number },
): string {
  return (
    `  ${JSON.stringify(chave)}: {\n` +
    // O `as Cabelo["id"]` é o mesmo cast de `PECAS_DA_ARTE`, pelo mesmo motivo: a
    // chave é nome de arquivo e `ModeloCabelo` é união fechada. Quem repara isso é a
    // promoção, sobrescrevendo a identidade.
    `    id: ${JSON.stringify(chave)} as Cabelo["id"],\n` +
    `    nome: ${JSON.stringify(nome)},\n` +
    `    tonal: {\n` +
    `      formas: [\n` +
    formas
      .map(
        (f) =>
          `        {\n` +
          `          d: ${JSON.stringify(f.d)},\n` +
          `          cor: ${JSON.stringify(f.cor)},\n` +
          `          semTraco: true,\n` +
          `        },`,
      )
      .join("\n") +
    `\n      ],\n` +
    // O TOM. O que entra no literal é o CAMINHO do PNG, não os bytes dele.
    `      tom: {\n` +
    `        arte: ${JSON.stringify(tom.arte)},\n` +
    `        x: ${tom.x},\n` +
    `        y: ${tom.y},\n` +
    `        w: ${tom.w},\n` +
    `        h: ${tom.h},\n` +
    `      },\n` +
    `    },\n` +
    `  },`
  );
}

/**
 * `escrever: false` é o modo `--check`: nada é gravado, e o PNG no disco é COMPARADO
 * byte a byte com o que a esteira produziu agora.
 *
 * A assimetria com `arte:trajes` é de propósito e é conserto: aquele **reescreve** os
 * `.svg` mesmo em `--check`. Um `--check` que escreve não é conferência, é regeração
 * com relatório.
 */
async function gerar(escrever: boolean): Promise<string> {
  const blocos: string[] = [];
  let faltou = false;
  if (escrever) mkdirSync(PRATELEIRA_TOM, { recursive: true });

  for (const [arquivo, nome] of Object.entries(NOMES)) {
    const caminho = `${PASTA}/${arquivo}.png`;
    if (!existsSync(caminho)) {
      console.error(
        `  ✗ ${arquivo} tem nome em NOMES mas não tem arte em ${caminho}.\n` +
          `    Catálogo prometendo peça que não existe é o erro que matou a v2.`,
      );
      faltou = true;
      continue;
    }
    const p = await construirPecaTonal(caminho, "cabelo");
    const bytes = p.formas.reduce((a, f) => a + f.d.length, 0);

    // O PNG DA MÁSCARA — gravado aqui, e só aqui. `construirPecaTonal` é chamada também
    // pelas réguas de bancada, sobre arte que nunca vai ao catálogo; se ela gravasse,
    // medir alguma coisa sujaria o deploy.
    const arquivoTom = `${PRATELEIRA_TOM}/${p.slug}-tom.png`;
    if (escrever) writeFileSync(arquivoTom, p.tom.png);
    else if (!existsSync(arquivoTom)) {
      console.error(
        `  ✗ ${arquivoTom} NÃO EXISTE, e o catálogo o declara.\n` +
          `    O boneco pediria a máscara ao servidor, levaria 404, e o cabelo sairia\n` +
          `    chapado em produção com todos os gates verdes. Rode \`npm run arte:cabelos\`.`,
      );
      faltou = true;
    } else if (!readFileSync(arquivoTom).equals(p.tom.png)) {
      console.error(
        `  ✗ ${arquivoTom} DEFASOU da esteira (disco ${readFileSync(arquivoTom).length} B ` +
          `× gerado ${p.tom.png.length} B).\n` +
          `    A máscara no ar não é a que esta arte produz. Rode \`npm run arte:cabelos\`.`,
      );
      faltou = true;
    }
    console.log(
      `  ${p.slug.padEnd(22)} ${nome.padEnd(16)} ` +
        `${p.pxPeca.toLocaleString("pt-BR")} px · ` +
        `esticão lum ${p.esticao.lo}→${p.esticao.hi} · ` +
        `tom ${p.tomPx.w}×${p.tomPx.h} (${(p.tom.png.length / 1024).toFixed(1)} KB de PNG) · ` +
        `${p.formas.length} formas · ${bytes.toLocaleString("pt-BR")} bytes de \`d\` · ` +
        `${p.pxNoRosto} px descartados nas FEIÇÕES`,
    );
    blocos.push(corpoDaPeca(arquivo, nome, p.formas, { ...p.tom, arte: urlDoTom(p.slug) }));
  }
  if (faltou) process.exit(1);

  if (!blocos.length)
    console.log(
      `  (nenhuma peça promovida ainda — \`NOMES\` está vazio de propósito, ver o topo\n` +
        `   de scripts/avatar/arte/cabelos.ts)`,
    );

  return (
    `${CABECALHO}\n\n` +
    `import type { Cabelo } from "./cabelo";\n\n` +
    `export const CABELOS_DA_ARTE: Record<string, Cabelo> = {\n` +
    (blocos.length ? `${blocos.join("\n")}\n` : "") +
    `};\n` +
    RODAPE
  );
}

async function principal(): Promise<void> {
  const check = process.argv.includes("--check");

  if (check) {
    console.log(`CONFERINDO ${SAIDA} (--check: gera em memória, não escreve)\n`);
    const esperado = await gerar(false);
    let emDisco: string;
    try {
      emDisco = readFileSync(SAIDA, "utf-8");
    } catch {
      console.error(`\n  ✗ ${SAIDA} NÃO EXISTE. Rode \`npm run arte:cabelos\`.`);
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
        `    Conserto: \`npm run arte:cabelos\` e conferir o \`git diff\` — se ele mudar\n` +
        `    uma peça que ninguém redesenhou, a mudança veio da esteira e é achado.`,
    );
    process.exit(1);
  }

  console.log(`GERANDO ${SAIDA}\n`);
  const texto = await gerar(true);
  mkdirSync("src/lib/avatar/estilo", { recursive: true });
  writeFileSync(SAIDA, texto, "utf-8");
  console.log(
    `\n  escrito. A promoção é o passo SEGUINTE e é manual: \`CABELOS.<modelo>\` espalha\n` +
      `  \`...CABELOS_DA_ARTE.<chave>\` com a identidade sobrescrita, o id migra para\n` +
      `  \`MODELOS_TONAIS\`, e os selos são regravados por promoção — nunca em lote.`,
  );
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
