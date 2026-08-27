/**
 * O LITERAL DAS PEÇAS DE ÓCULOS: `src/lib/avatar/estilo/oculos-da-arte.ts`.
 *
 * É o análogo exato de `arte:chapeus` — mesma esteira (`peca-de-arte.ts`, braço
 * raster), mesmo formato de saída, mesmo `--check` em `verify:arte`. **O arquivo de
 * saída é GERADO**: corrigir o que está nele é corrigir este programa, nunca o
 * arquivo (amarra §9.5 do doc 19).
 *
 * ---------------------------------------------------------------------------
 * POR QUE O ARQUIVO NÃO SE CHAMA `oculoss.ts`
 * ---------------------------------------------------------------------------
 *
 * A convenção da rota é *singular = o slot, plural = o gerador*: `chapeu.ts` declara
 * o `SlotDeArte` e `chapeus.ts` escreve o literal. **Em "óculos" o plural é a mesma
 * palavra**, então o par não se escreve. `oculos.ts` ficou com o slot, que é quem
 * outros módulos importam, e o gerador leva o sufixo do que ele produz. É a única
 * quebra de convenção do arquivo, e ela é da língua.
 *
 * ---------------------------------------------------------------------------
 * O ÓCULOS TEM SLOT PRÓPRIO DESDE 2026-08-27
 * ---------------------------------------------------------------------------
 *
 * Ele nasceu dentro de `rostos.ts`, como segunda família do slot `rosto` — a barba
 * recolorindo em `formas`, o óculos em `<image>` de cor assada, os dois no mesmo
 * literal. Durou um dia. O Doug: *"óculos e barba não podem ser a mesma coisa. Eu
 * preciso que dê para vestir a barba e o óculos, ao mesmo tempo."*
 *
 * **Slot é exclusivo por construção** — `users` guarda UMA coluna por slot e
 * `equipar_peca` escreve UM slug nela —, então enquanto as duas famílias dividissem
 * o slot, vestir uma tirava a outra. Ver `PecaDeOculos` em `tipos.ts` para a
 * alternativa que foi considerada e recusada (duas peças num slot só).
 *
 * ---------------------------------------------------------------------------
 * A ARTE LIDA AQUI É A CRUA — e é o contrário da barba
 * ---------------------------------------------------------------------------
 *
 * `restaurar-peca.ts` gira o matiz da peça para 180°. Para a barba isso é inócuo: a
 * cor final vem de `var(--av-cabelo)` e o que a esteira aproveita é o claro-escuro.
 * **Para o óculos seria fatal** — a armação chegaria CIANO ao produto.
 *
 * Então `oculos-<nome>.png` é a arte como a artista pintou, e é dela que a peça é
 * feita; `oculos-<nome>-limpa.png` é a versão ciano, que existe para o Gate −1 e o
 * `arte:traco` terem o que reconhecer. Na barba os papéis e os sufixos são o inverso.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

import { PASTA } from "./base";
import { primeiraDivergencia, semCR } from "./gerado";
import { OCULOS, PASTA_OCULOS, tintaDoOculos } from "./oculos";
import { construirPeca } from "./peca-de-arte";
import { NOMES_OCULOS } from "./promovidas";

const SAIDA = "src/lib/avatar/estilo/oculos-da-arte.ts";

/** `public/items/oculos/x.svg` → `/items/oculos/x.svg`, a URL que o browser pede. */
const urlDaArte = (caminho: string) => caminho.replace(/^public/, "");

const CABECALHO = `/**
 * ARQUIVO GERADO — não edite à mão.
 *
 * Escrito por \`npm run arte:oculos\` (\`scripts/avatar/arte/oculos-literal.ts\`). Cada
 * peça nasce de um PNG desenhado pelo Doug sobre a base oficial, aprovado no Gate −1
 * e recortado por \`peca-de-arte.ts\` no braço RASTER.
 *
 * Corrigir algo aqui é corrigir o gerador. \`npm run arte:oculos -- --check\` está em
 * \`verify:arte\` e reprova quando este arquivo defasa da esteira.
 *
 * POR QUE ELAS SÃO \`arte\` E NÃO \`formas\`, que é o outro braço de \`PecaSobreposta\`:
 * o óculos **não recolore**. A Regra Inviolável nº 4 do CLAUDE.md dá ao aluno duas
 * cores — pele e cabelo — e nomeia o óculos entre os de cor assada. Peça de cor
 * assada sai como \`<image>\` WEBP dentro de um \`.svg\`, servido à parte, e o
 * compositor a cola por \`colarArte()\` — a mesma colagem do traje e do chapéu.
 *
 * ---------------------------------------------------------------------------
 * OS DOIS VÃOS DAS LENTES FICAM ABERTOS, E ISSO É A PEÇA
 * ---------------------------------------------------------------------------
 *
 * A esteira raster tapa todo furo cercado, porque *peça é figurinha, opaca por
 * dentro*. Para o óculos isso é o contrário: a peça É definida pelos dois vãos que
 * ela cerca, e o que aparece por eles tem de ser a pele que o ALUNO escolheu.
 *
 * Sem a regra, medido em 2026-08-27: **23 038 px de furo tapado** e cor dominante
 * \`#E6AB7A\` — a PELE da base de edição, assada dentro dos aros. Quem responde por
 * isso é \`SlotDeArte.janela\` (\`peca-de-arte.ts\`), com \`noVaoDaLente\` no slot.
 *
 * ---------------------------------------------------------------------------
 * SLOT PRÓPRIO, E NÃO O \`rosto\` COM OUTRO NOME
 * ---------------------------------------------------------------------------
 *
 * O óculos morou no slot \`rosto\` por um dia, junto com a barba. O Doug separou os
 * dois em 2026-08-27: *"óculos e barba não podem ser a mesma coisa. Eu preciso que
 * dê para vestir a barba e o óculos, ao mesmo tempo."* Slot é exclusivo — uma coluna
 * em \`users\`, um slug —, então dividir o slot era proibir a combinação.
 *
 * A peça vem DEPOIS do cabelo e ANTES do chapéu na pilha (linha \`oculos\` de
 * \`camadas.ts\`): sem haste não há o que apoiar (doc 21 §2c), e aba de chapéu por
 * cima de óculos é o que aba faz.
 *
 * \`PecaDeOculos\` carrega \`cabeloPorCima?: never\` — o óculos não tem lado a escolher,
 * e a trava é do \`typecheck\`, não de teste.
 */`;

const RODAPE = `
/** Quantos óculos a arte já produziu. Contagem derivada, nunca escrita. */
export const TOTAL_OCULOS_DA_ARTE = Object.keys(OCULOS_DA_ARTE).length;
`;

function corpoDaPeca(slug: string, nome: string, arte: string): string {
  return (
    `  ${JSON.stringify(slug)}: {\n` +
    `    id: ${JSON.stringify(slug)},\n` +
    `    nome: ${JSON.stringify(nome)},\n` +
    `    arte: ${JSON.stringify(arte)},\n` +
    `  },`
  );
}

/**
 * `escrever: false` é o modo `--check`: nada é gravado no literal.
 *
 * ⚠️ **Ele reescreve os `.svg`, e isso é herdado de `construirPeca`** — o mesmo
 * defeito que `arte:trajes --check` tem e que obrigou a trava `CONGELADAS_NO_VETOR` a
 * ser mecânica. Aqui ainda não custa nada (nenhum óculos está congelado), e fica
 * escrito para não ser descoberto na primeira peça que estiver.
 */
async function gerar(escrever: boolean): Promise<string> {
  const blocos: string[] = [];
  let faltou = false;
  if (escrever) mkdirSync(PASTA_OCULOS, { recursive: true });

  for (const [arquivo, nome] of Object.entries(NOMES_OCULOS)) {
    const caminho = `${PASTA}/${arquivo}.png`;
    if (!existsSync(caminho)) {
      console.error(
        `  ✗ ${arquivo} tem nome em NOMES_OCULOS mas não tem arte em ${caminho}.\n` +
          `    Catálogo prometendo peça que não existe é o erro que matou a v2.`,
      );
      faltou = true;
      continue;
    }
    const p = await construirPeca(caminho, OCULOS, tintaDoOculos, "raster");

    // AS DUAS JANELAS. Zero aqui é peça CEGA — a armação chegaria ao produto com um
    // retrato da base de edição dentro de cada aro, e o aluno veria a pele errada.
    // É a única régua desta esteira que REPROVA, e ela reprova porque o defeito é
    // invisível em cima do fundo bege da página. Ver `SlotDeArte.janela`.
    if (p.janelasAbertas === 0) {
      console.error(
        `  ✗ ${p.slug} saiu com ZERO janela aberta — a peça é CEGA.\n` +
          `    Os vãos dos aros foram tapados com a pele e os olhos da base de edição.\n` +
          `    Conserto: \`SlotDeArte.janela\` do slot, não a arte.`,
      );
      faltou = true;
      continue;
    }
    console.log(
      `  ${p.slug.padEnd(14)} ${nome.padEnd(12)} ` +
        `${p.pixels.toLocaleString("pt-BR")} px · ` +
        `${p.janelasAbertas} janela(s) · ` +
        `${p.furosTapados} px de furo tapado · ` +
        `cor ${p.cor} · ` +
        `${(p.bytes / 1024).toFixed(1)} KB no fio (gzip ${(p.bytesGzip / 1024).toFixed(1)}) · ` +
        `${p.foraDoCampo} px fora do campo · controle na base ${p.controleNaBase} px`,
    );
    blocos.push(corpoDaPeca(p.slug, nome, urlDaArte(p.arte)));
  }
  if (faltou) process.exit(1);

  return (
    `${CABECALHO}\n\n` +
    `import type { PecaDeOculos } from "./tipos";\n\n` +
    `export const OCULOS_DA_ARTE: Record<string, PecaDeOculos> = {\n` +
    `${blocos.join("\n")}\n};\n` +
    RODAPE
  );
}

async function principal(): Promise<void> {
  const check = process.argv.includes("--check");

  if (check) {
    console.log(`CONFERINDO ${SAIDA} (--check: gera em memória, não escreve o literal)\n`);
    const esperado = await gerar(false);
    let emDisco: string;
    try {
      emDisco = readFileSync(SAIDA, "utf-8");
    } catch {
      console.error(`\n  ✗ ${SAIDA} NÃO EXISTE. Rode \`npm run arte:oculos\`.`);
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
        `    Conserto: \`npm run arte:oculos\` e conferir o \`git diff\` — se ele mudar\n` +
        `    uma peça que ninguém redesenhou, a mudança veio da esteira e é achado.`,
    );
    process.exit(1);
  }

  console.log(`GERANDO ${SAIDA}\n`);
  const texto = await gerar(true);
  mkdirSync("src/lib/avatar/estilo", { recursive: true });
  writeFileSync(SAIDA, texto, "utf-8");
  console.log(
    `\n  escrito. os SVGs estão em ${PASTA_OCULOS}/ — versionados de propósito: é o que\n` +
      `  os leva ao deploy (\`arteDaPecaNoDeploy.test.ts\` cobra \`git ls-files\`).\n` +
      `  \`CATALOGO.oculos\` deriva de \`OCULOS\` (catalogo.ts), e \`verify:catalogo-slots\`\n` +
      `  compara o conjunto com \`avatar_catalogo\` nos dois sentidos. Sem a migration,\n` +
      `  o gate reprova.`,
  );
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
