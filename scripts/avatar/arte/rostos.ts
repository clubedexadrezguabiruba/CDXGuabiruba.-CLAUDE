/**
 * O LITERAL DAS PEÇAS DE ROSTO: `src/lib/avatar/estilo/rostos-da-arte.ts`.
 *
 * É o análogo de `arte:trajes` para o slot `rosto`, e existe pelo mesmo motivo:
 * **o arquivo de saída é GERADO**. Corrigir o que está nele é corrigir este
 * programa, nunca o arquivo (amarra §9.5 do doc 19). `--check` gera em memória,
 * compara caractere a caractere com o disco e entra em `verify:arte` ao lado de
 * `arte:pecas --check` e `arte:trajes --check` — a porta que ele fecha é a de o
 * produto desenhar uma peça e a folha julgar outra, que é o defeito nº 1 desta
 * rota.
 *
 * ---------------------------------------------------------------------------
 * AQUI A LISTA SAI DOS NOMES, E NO TRAJE SAI DOS ARQUIVOS — a assimetria é decisão
 * ---------------------------------------------------------------------------
 *
 * `trajes.ts` descobre as artes por `readdir` e **reprova** a que não tem nome:
 * lá as duas peças foram promovidas juntas, e um PNG sem nome só podia ser
 * esquecimento.
 *
 * O elenco do slot `rosto` são **6 barbas** decididas em 2026-08-19, desenhadas uma
 * a uma, e a pasta guarda de propósito arte aprovada que ainda **não** foi promovida
 * — mais a saída crua do gerador (`-crua.png`) e a versão anterior de uma peça
 * reparada (`barba-cheia-dois-tons.png`), que são procedência e não catálogo.
 * Descobrir por arquivo promoveria as três de uma vez, que é exatamente o contrário
 * da instrução ("converter SÓ a `barba-cheia`; não siga para as outras peças sem a
 * folha").
 *
 * Então a lista é `NOMES`, e a trava fica do outro lado: um nome **sem** arte no
 * disco reprova. Catálogo prometendo peça que não existe é o erro que matou a v2 —
 * 8 uniformes semeados, 0 renderáveis.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

import { PASTA } from "./base";
import { construirRosto } from "./barba-para-formas";
import { primeiraDivergencia, semCR } from "./gerado";
import { NOMES_ROSTO } from "./promovidas";

const SAIDA = "src/lib/avatar/estilo/rostos-da-arte.ts";

/**
 * ONDE O PNG DE TOM MORA — e ele é peça de deploy, não intermediário.
 *
 * `public/items/` é a prateleira do produto: é de lá que o navegador da criança pede
 * a peça, e é a única pasta de `public/` que viaja como catálogo (`public/dev/` é
 * oficina, e `arteDaPecaNoDeploy.test.ts` reprova quem nasce lá).
 *
 * O arquivo **precisa ser rastreado pelo git** — a Vercel builda a árvore do git, e
 * arquivo ignorado não chega ao ar por mais que exista nesta máquina. É o mesmo gate
 * do `.svg` do traje, pelo mesmo motivo, e o modo de falha é o mesmo: o compositor
 * decide pelo campo declarado, nunca pelo arquivo existindo, então a máscara sumiria
 * em silêncio e a barba sairia chapada em produção com todos os gates verdes.
 */
const PRATELEIRA_TOM = "public/items/rosto";
const urlDoTom = (slug: string) => `/items/rosto/${slug}-tom.png`;

/**
 * O nome que a criança lê, por arte promovida — a lista mora em `promovidas.ts`,
 * junto com a de cabelo, e pelo motivo escrito lá: as réguas de traço percorriam uma
 * cópia escrita à mão que envelhecia em silêncio a cada promoção.
 */
const NOMES = NOMES_ROSTO;

const CABECALHO = `/**
 * ARQUIVO GERADO — não edite à mão.
 *
 * Escrito por \`npm run arte:rostos\` (\`scripts/avatar/arte/rostos.ts\`). Cada peça
 * nasce de um PNG desenhado pelo Doug sobre a base oficial, aprovado no Gate −1,
 * limpo pela quarta saída da rota (\`restaurar-peca.ts\`) e traçado por
 * \`scripts/avatar/arte/barba-para-formas.ts\`.
 *
 * Corrigir algo aqui é corrigir o gerador. \`npm run arte:rostos -- --check\` está em
 * \`verify:arte\` e reprova quando este arquivo defasa da esteira.
 *
 * POR QUE ELAS SÃO \`formas\` E NÃO \`arte\`, que é o outro braço de \`PecaSobreposta\`:
 * a barba **recolore junto com o cabelo** (D17, e a Regra Inviolável nº 4 do
 * CLAUDE.md diz que ela não é exceção — barba é cabelo). Um \`.svg\` de cor assada,
 * que é o que traje e chapéu usam, seria preto fixo. Ver o docstring de
 * \`PecaSobreposta\` em \`tipos.ts\`, a tabela "a peça recolore?".
 *
 * ---------------------------------------------------------------------------
 * AS DUAS FORMAS TÊM O MESMO \`d\`, E O CLARO-ESCURO VEM DO \`tom\`
 * ---------------------------------------------------------------------------
 *
 * Isto mudou em 2026-08-20 e a mudança é de espinha. Até ali a esteira partia a
 * peça em silhueta preta e miolo colorido, e traçava as duas — o que fazia uma arte
 * de **917 tons** chegar ao boneco com **dois**. A causa não era a D17: era o
 * \`potrace\`, que traça CONTORNO, e contorno é binário. Hoje:
 *
 *  1. a silhueta INTEIRA, em \`var(--av-linha)\`. O preto de baixo;
 *  2. **o MESMO \`d\`**, em \`var(--av-cabelo, #262626)\`, vestido pela máscara.
 *
 *     A reserva é a rede de segurança para quando a propriedade não existir — sem
 *     ela o \`fill\` cai em preto e a barba vira mancha sólida. \`#262626\` é a que o
 *     Doug julgou na folha recolorida de 2026-08-19.
 *
 * E o campo \`tom\`: um PNG **cinza** da luminância da arte, esticado entre os
 * percentis p2 e p98 DESTA peça e servido a 50% da caixa. O compositor o monta como
 * \`<mask>\` e veste a forma 2. Onde a arte é clara a cor do cabelo aparece cheia;
 * onde escurece ela cede e o preto de baixo aparece.
 *
 * **O que entra aqui é o CAMINHO do PNG, não os bytes.** O arquivo mora em
 * \`public/items/rosto/\` e é servido à parte, como o \`.svg\` do traje. Embutir os
 * bytes em base64 foi a primeira versão, e ela quebrava o ranking: 30 bonecos com a
 * \`trancada-v4\` fechavam em **753,0 KB** de gzip contra **17,6 KB** com o arquivo
 * externo, porque o boneco composto passa da janela de 32.768 B do DEFLATE e a
 * dedução do blob morre. E o base64 viajava no bundle do cliente, onde compressão
 * nenhuma o alcança. Ver \`TomDaPeca\` em \`tipos.ts\`.
 *
 * **A máscara não tem cor** — é um canal de cinza —, então a peça continua
 * recolorindo INTEIRA e a Regra Inviolável nº 4 continua de pé. O argumento
 * completo está no docstring de \`TomDaPeca\` em \`tipos.ts\`.
 *
 *     ⚠️ **Ela deixou de ser o caminho do boneco CARECA em 2026-08-20.** Até ali,
 *     \`--av-cabelo\` só era emitido quando havia \`modeloCabelo\`, e a barba do careca
 *     saía PRETA **com qualquer cor escolhida** — os dois SVGs eram byte a byte
 *     iguais, e a escolha do aluno não chegava ao desenho. Hoje o compositor emite a
 *     propriedade quando há QUEM A LEIA (\`recoloreComOCabelo\`), e a reserva só age se
 *     alguém quebrar isso. \`rosto-cor.test.ts\` mede.
 *
 * \`semTraco: true\` nas duas, e isso é a decisão que fechou o achado **G29**: peça de
 * arte usa o contorno pintado pelo gerador (5,2 u), não o \`kk-traco\` de 12 u do
 * compositor. Medido em \`.scratch/perfil-boca.ts\`: com o \`kk-traco\` o bigode e a
 * boca fundem a 56 e a 32 px.
 *
 * **\`cabeloPorCima: true\` — A BARBA VESTE, E O CABELO CAI SOBRE ELA.** Não é uma
 * escolha sobre esta peça: é a **diretriz do empilhamento** do slot \`rosto\`,
 * decidida pelo Doug em 2026-08-20 e escrita na linha \`rosto-sob-cabelo\` de
 * \`camadas.ts\`. A pergunta que decide é *a peça nasce da cabeça, ou é posta nela?*
 * — pelo nasce e veste por baixo; acessório é posto e vai por cima.
 *
 * **Como ela foi decidida:** olhando os quatro casos lado a lado
 * (\`.scratch/estilo/quatro-casos.png\`). Com a barba POR CIMA, ela e o cabelo têm a
 * mesma cor e formam uma massa contínua em volta do rosto — lê como cabeça peluda,
 * não como bob com barba. Com ela SOB, o bob mantém a silhueta e a barba que sobra
 * fica contra a PELE, que é onde ela lê.
 *
 * **O custo, medido e aceito** (\`.scratch/estilo/quanto-da-barba-sobra.ts\`):
 * sobrevivem 56,8% da peça sob o \`chanel\`, 75,3% sob o \`assimetrico\`, 98,8% sob o
 * \`espetado\` e 100% sob os dois paramétricos. O que some é a parte que ficaria
 * encostada no cabelo — mesma cor, sem contraste, ilegível de qualquer jeito.
 *
 * A colisão que resta é a **mecha da bochecha do \`chanel\`** (lóbulo 2 do
 * \`nucleo\`, 85,0% dentro da silhueta desta peça): UMA peça, UMA região, medida e
 * nomeada em vez de difusa.
 *
 * ⚠️ **Encurtar essa mecha NÃO a resolve, e isso está medido**
 * (\`.scratch/estilo/ate-onde-encurtar.ts\`): ela vive em u y 339,3→382,9 e o topo da
 * \`barba-cheia\` naquela faixa está em **y 268,2** — ela não entra na barba, **nasce
 * lá dentro**, 71 u abaixo do topo. Cortar em y = 340 deixa 0,7% da mecha, e esses
 * 0,7% seguem 100% dentro. Quem for mexer nisso mexe na ARTE de uma das duas peças,
 * nunca na ordem.
 *
 * ⚠️ **Inerte para 2 dos 5 cabelos.** \`coque\` e \`moicano\` são paramétricos e moram
 * dentro do clip do crânio, emitidos muito antes das feições: a barba fica por cima
 * deles com bandeira ou sem. Limitação declarada, não garantia.
 */`;

const RODAPE = `
/** Quantas peças de rosto a arte já produziu. Contagem derivada, nunca escrita. */
export const TOTAL_ROSTOS_DA_ARTE = Object.keys(ROSTOS_DA_ARTE).length;
`;

function corpoDaPeca(
  slug: string,
  nome: string,
  formas: { d: string; cor: string; semTraco: true }[],
  tom: { arte: string; x: number; y: number; w: number; h: number },
): string {
  return (
    `  ${JSON.stringify(slug)}: {\n` +
    `    id: ${JSON.stringify(slug)},\n` +
    `    nome: ${JSON.stringify(nome)},\n` +
    // A BANDEIRA SAI EM TODA PEÇA QUE ESTA ESTEIRA PRODUZ, e é constante porque a
    // esteira só produz PELO.
    //
    // A diretriz do empilhamento (linha `rosto-sob-cabelo` de `camadas.ts`) pergunta:
    // a peça NASCE da cabeça, ou é POSTA nela? Barba nasce — o cabelo cai sobre ela,
    // como na vida.
    //
    // ⚠️ **Ela chegou a ser dado, por um dia.** Em 2026-08-27 o óculos entrou neste
    // literal como segunda família do slot, e o campo passou a ter dois valores. No
    // mesmo dia o Doug separou os slots — *"óculos e barba não podem ser a mesma
    // coisa"* — e o campo voltou a ter um valor só. Fica constante enquanto for
    // constante: uma coluna com o mesmo valor em todas as linhas é uma decisão
    // fingindo ser um dado.
    `    cabeloPorCima: true,\n` +
    `    formas: [\n` +
    formas
      .map(
        (f) =>
          `      {\n` +
          `        d: ${JSON.stringify(f.d)},\n` +
          `        cor: ${JSON.stringify(f.cor)},\n` +
          `        semTraco: true,\n` +
          `      },`,
      )
      .join("\n") +
    `\n    ],\n` +
    // O TOM. O que entra no literal é o CAMINHO do PNG, não os bytes dele — os bytes
    // moram em `public/items/rosto/` e são servidos à parte, como o `.svg` do traje.
    // Ver `TomDaPeca` (`tipos.ts`) para os 753 KB de gzip que o base64 embutido
    // custava numa lista de 30 bonecos, e para o que ele pesava no bundle.
    `    tom: {\n` +
    `      arte: ${JSON.stringify(tom.arte)},\n` +
    `      x: ${tom.x},\n` +
    `      y: ${tom.y},\n` +
    `      w: ${tom.w},\n` +
    `      h: ${tom.h},\n` +
    `    },\n` +
    `  },`
  );
}

/**
 * `escrever: false` é o modo `--check`: nada é gravado, e o PNG no disco é COMPARADO
 * byte a byte com o que a esteira produziu agora.
 *
 * A assimetria com `arte:trajes` é de propósito e é conserto: aquele **reescreve** os
 * `.svg` mesmo em `--check`, e foi por causa disso que a trava das peças congeladas
 * precisou ser mecânica (`CONGELADAS_NO_VETOR`, `traje.ts`). Um `--check` que escreve
 * não é conferência, é regeração com relatório.
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
    const p = await construirRosto(caminho);
    const bytes = p.formas.reduce((a, f) => a + f.d.length, 0);

    // O PNG DA MÁSCARA — gravado aqui, e só aqui. `construirRosto` é chamada também
    // pelas réguas de bancada, sobre arte que nunca vai ao catálogo; se ela gravasse,
    // medir alguma coisa sujaria o deploy.
    const arquivoTom = `${PRATELEIRA_TOM}/${p.slug}-tom.png`;
    if (escrever) writeFileSync(arquivoTom, p.tom.png);
    else if (!existsSync(arquivoTom)) {
      console.error(
        `  ✗ ${arquivoTom} NÃO EXISTE, e o catálogo o declara.
` +
          `    O boneco pediria a máscara ao servidor, levaria 404, e a barba sairia
` +
          `    chapada em produção com todos os gates verdes. Rode \`npm run arte:rostos\`.`,
      );
      faltou = true;
    } else if (!readFileSync(arquivoTom).equals(p.tom.png)) {
      console.error(
        `  ✗ ${arquivoTom} DEFASOU da esteira (disco ${readFileSync(arquivoTom).length} B ` +
          `× gerado ${p.tom.png.length} B).
` +
          `    A máscara no ar não é a que esta arte produz. Rode \`npm run arte:rostos\`.`,
      );
      faltou = true;
    }
    console.log(
      `  ${p.slug.padEnd(22)} ${nome.padEnd(16)} ` +
        `${p.pxPeca.toLocaleString("pt-BR")} px · ` +
        `esticão lum ${p.esticao.lo}→${p.esticao.hi} · ` +
        `tom ${p.tomPx.w}×${p.tomPx.h} (${(p.tom.png.length / 1024).toFixed(1)} KB de PNG) · ` +
        `${p.formas.length} formas · ${bytes.toLocaleString("pt-BR")} bytes de \`d\` · ` +
        `${p.pxNoRosto} px descartados em ROSTO`,
    );
    blocos.push(corpoDaPeca(p.slug, nome, p.formas, { ...p.tom, arte: urlDoTom(p.slug) }));
  }
  if (faltou) process.exit(1);

  return (
    `${CABECALHO}\n\n` +
    `import type { PecaDeRosto } from "./tipos";\n\n` +
    `export const ROSTOS_DA_ARTE: Record<string, PecaDeRosto> = {\n` +
    `${blocos.join("\n")}\n};\n` +
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
      console.error(`\n  ✗ ${SAIDA} NÃO EXISTE. Rode \`npm run arte:rostos\`.`);
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
        `    Conserto: \`npm run arte:rostos\` e conferir o \`git diff\` — se ele mudar\n` +
        `    uma peça que ninguém redesenhou, a mudança veio da esteira e é achado.`,
    );
    process.exit(1);
  }

  console.log(`GERANDO ${SAIDA}\n`);
  const texto = await gerar(true);
  mkdirSync("src/lib/avatar/estilo", { recursive: true });
  writeFileSync(SAIDA, texto, "utf-8");
  console.log(
    `\n  escrito. \`CATALOGO.rosto\` deriva de \`ROSTOS\` (catalogo.ts), que espalha este\n` +
      `  registro — e \`verify:catalogo-slots\` compara o conjunto com \`avatar_catalogo\`,\n` +
      `  nos dois sentidos. Sem a migration, o gate reprova.`,
  );
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
