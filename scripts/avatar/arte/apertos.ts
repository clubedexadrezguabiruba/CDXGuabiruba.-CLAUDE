/**
 * O LITERAL DO APERTO: `src/lib/avatar/estilo/apertos-da-arte.ts`.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ESTE NÚMERO NÃO É DERIVADO, E POR QUE ISSO NÃO É PREGUIÇA
 * ---------------------------------------------------------------------------
 *
 * A primeira ideia foi a máquina calcular: *largura do chapéu ÷ largura do cabelo*,
 * as duas medidas do alfa das peças. Ela caiu por medição — **largura não decide
 * sozinha**. O `elvis` fecha em 0,95 debaixo da `touca-de-la` porque o que sobra é
 * UMA mecha na têmpora; o `dreadlocks` precisaria de 0,85 e ali as cordas perdem
 * **57%** do volume e o bob do `chanel` encosta no olho. Mesma largura, aperto
 * diferente: o que decide é ONDE está a massa e o que a peça deixa de ser ao
 * encolher.
 *
 * ⚠️ É o mesmo lugar em que este projeto já apanhou — deixar a régua PROJETAR a
 * forma em vez de julgá-la. A régua mede; quem decide quanto uma peça pode encolher
 * sem deixar de ser ela é o olho do Doug, par a par, no editor `/dev/avatar-oclusao`.
 *
 * ---------------------------------------------------------------------------
 * A CADEIA, E ONDE ELA TRAVA
 * ---------------------------------------------------------------------------
 *
 * `aperto.json` (entrada, a mão do Doug) -> este gerador -> `apertos-da-arte.ts`
 * (saída, o que o produto lê). `--check` gera em memória, compara caractere a
 * caractere com o disco e entra em `verify:arte` ao lado dos outros quatro: a porta
 * que ele fecha é a de o Doug decidir um número no editor e o produto desenhar
 * outro.
 *
 * **Par ausente é `1`, e `1` é o SVG de sempre byte a byte.** Um par que não foi
 * decidido não vira linha aqui, e o boneco dele não ganha um caractere.
 */

import { readFileSync, writeFileSync } from "fs";

import { CABELOS } from "../../../src/lib/avatar/estilo/cabelo";
import { CHAPEUS_DA_ARTE } from "../../../src/lib/avatar/estilo/chapeus-da-arte";
import { APERTO_MAX, CAMINHO_DO_APERTO, chaveDoPar, lerAperto } from "./aperto-do-cabelo";
import { primeiraDivergencia, semCR } from "./gerado";

const SAIDA = "src/lib/avatar/estilo/apertos-da-arte.ts";

function montar(tabela: Record<string, number>): string {
  // ⚠️ **O `1` NÃO ATRAVESSA para o catálogo.** No `aperto.json` ele é decisão
  // registrada; aqui seria uma linha que não muda desenho nenhum. Ausente é o que faz
  // `compor()` sair byte a byte igual ao de antes do aperto existir — a quarta
  // condição que `camadas.ts` cobra de toda válvula nova.
  const linhas = Object.keys(tabela)
    .filter((k) => tabela[k] < APERTO_MAX)
    .sort()
    .map((k) => `  ${JSON.stringify(k)}: ${tabela[k]},`);
  return `/**
 * ARQUIVO GERADO — não edite à mão.
 *
 * Escrito por \`npm run arte:apertos\` (\`scripts/avatar/arte/apertos.ts\`) a partir de
 * \`${CAMINHO_DO_APERTO}\`, que é a decisão do Doug par a par no editor
 * \`/dev/avatar-oclusao\`. Corrigir algo aqui é corrigir lá.
 *
 * O QUE O NÚMERO É: quanto o chapéu ACHATA o cabelo — escala em x, em volta do eixo
 * da cabeça, aplicada pelo compositor só quando os dois estão vestidos.
 *
 * Existe porque \`escondeCabelo\` fecha o cabelo que atravessa a peça e o que estoura
 * ACIMA dela, e não alcança o resto: os penteados do elenco vão de 105% a 133% da
 * largura da cabeça, e abaixo da aba não há chapéu para esconder nada. Esconder ali
 * cortaria a silhueta contra o fundo — estreitar não corta, e é o que um chapéu faz.
 *
 * **Par ausente vale 1**, e 1 é o SVG de sempre, byte a byte.
 */

export const APERTOS_DA_ARTE: Record<string, number> = {
${linhas.join("\n")}
};
`;
}

function principal(): void {
  const check = process.argv.includes("--check");
  const tabela = lerAperto();
  const chapeus = Object.keys(CHAPEUS_DA_ARTE);
  const cabelos = Object.keys(CABELOS).filter((c) => (CABELOS as Record<string, { tonal?: unknown }>)[c].tonal);

  console.log(
    `${check ? "CONFERINDO" : "ESCREVENDO"} ${SAIDA}` +
      `${check ? "  (--check: gera em memória, não escreve)" : ""}\n`,
  );

  // 1. TODA CHAVE DA ENTRADA É UM PAR REAL. O editor valida na rota; um `aperto.json`
  //    editado à mão, ou sobrevivente de uma peça apagada, não valida em lugar nenhum
  //    — e uma chave órfã é decisão que ninguém vê e que nunca será aplicada.
  let reprovas = 0;
  for (const chave of Object.keys(tabela)) {
    const [chapeu, cabelo] = chave.split("|");
    const okChapeu = chapeus.includes(chapeu);
    const okCabelo = cabelos.includes(cabelo);
    if (okChapeu && okCabelo) continue;
    console.error(
      `  ✗ ${chave}: ${!okChapeu ? `chapéu \`${chapeu}\` não existe` : ""}` +
        `${!okChapeu && !okCabelo ? " e " : ""}${!okCabelo ? `cabelo tonal \`${cabelo}\` não existe` : ""}.\n` +
        `    Chave órfã em ${CAMINHO_DO_APERTO} — decisão que nunca chegaria ao produto.`,
    );
    reprovas++;
  }
  if (reprovas) process.exit(1);

  // 2. A COBERTURA — E ELA REPROVA. É a trava que faz o passo virar esteira.
  //
  // ⚠️ **É aqui que um cabelo NOVO é pego.** Ele entra no elenco com nove pares sem
  // linha, e sem esta reprovação sairia desenhado com aperto 1,00 nos nove chapéus,
  // com toda a cadeia verde — o trabalho de vestir a peça sumindo em silêncio, que é
  // o modo de falha desta rota de arte.
  //
  // Reprovar só é honesto porque `1` OCUPA LINHA no `aperto.json` (ver a nota em
  // `aperto-do-cabelo.ts`): a régua não exige que o Doug aperte 171 peças, exige que
  // ele tenha OLHADO as 171. "Não precisa apertar" é resposta, e ela se grava.
  const faltando: string[] = [];
  for (const ch of chapeus) {
    for (const cb of cabelos) {
      if (!(chaveDoPar(ch, cb) in tabela)) faltando.push(`${cb} + ${ch.replace("chapeu-", "")}`);
    }
  }
  const total = chapeus.length * cabelos.length;
  const semAperto = Object.values(tabela).filter((v) => v >= APERTO_MAX).length;
  console.log(
    `  ${Object.keys(tabela).length} de ${total} par(es) decidido(s)` +
      ` · ${semAperto} em ${APERTO_MAX.toFixed(2)} (decidido: "não precisa apertar")`,
  );
  if (faltando.length) {
    console.error(`\n  ✗ ${faltando.length} par(es) do elenco SEM DECISÃO em ${CAMINHO_DO_APERTO}:\n`);
    for (const f of faltando) console.error(`      ${f}`);
    console.error(
      `\n    Peça nova não sai vestida sozinha. Abra \`/dev/avatar-oclusao\`, ponha cada\n` +
        `    par na mesa, ache o aperto no olho e clique em \`gravar par\` — inclusive nos\n` +
        `    que não precisarem apertar, porque \`1,00\` também é decisão e ela se grava.\n` +
        `    Depois rode \`npm run arte:apertos\`.`,
    );
    process.exit(1);
  }

  const texto = montar(tabela);
  if (!check) {
    writeFileSync(SAIDA, texto);
    console.log(`\n  escrito.`);
    return;
  }
  const disco = semCR(readFileSync(SAIDA, "utf-8"));
  if (disco === semCR(texto)) {
    console.log(`\n  · ${SAIDA} confere com ${CAMINHO_DO_APERTO}, caractere a caractere.`);
    return;
  }
  console.error(
    `\n  ✗ ${SAIDA} DEFASOU de ${CAMINHO_DO_APERTO}.\n` +
      `    ${primeiraDivergencia(semCR(disco), semCR(texto))}\n` +
      `    Rode \`npm run arte:apertos\`.`,
  );
  process.exit(1);
}

principal();
