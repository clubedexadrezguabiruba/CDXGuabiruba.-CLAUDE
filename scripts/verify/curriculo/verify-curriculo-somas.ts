/**
 * GATE: as somas do currículo — a meta de volume como conta, não como promessa
 *
 * O QUE ESTE GATE EXISTE PARA IMPEDIR
 * -----------------------------------
 * O currículo (`docs/curriculo/01-curriculo-definitivo-v1.md`) declara números em
 * cinco lugares diferentes — a grade da §3, a tabela de áreas, a meta de posições
 * da §4, as 126 linhas de aula da §6 e o quadro comparativo da §11 — e nada os
 * amarrava um ao outro. O resultado, medido numa auditoria de 2026-07-31:
 *
 *   1. A revisão 3 prometia **1.570 posições "do banco"** e as aulas especificavam
 *      **640** (41%). A promessa tinha mudado de coluna sem ninguém somar, e cada
 *      aula parecia completa isoladamente — o furo só aparece na soma.
 *   2. "10 mini-jogos em **22** aulas" quando eram 13; "corte de ~83% **em todas**"
 *      quando quatro blueprints davam até 87,5%; "1 aula de defesa + 4 novas = **6**";
 *      uma coluna de defesa marcada na T5 sem nenhuma aula de defesa na T5.
 *
 * Nenhum desses erros é de xadrez ou de pedagogia: são de aritmética, e aritmética
 * é justamente o que um script confere melhor que um leitor. A revisão 4 corrigiu
 * todos — este gate é o que impede a recaída na próxima edição do documento.
 *
 * A RÉGUA É O PRÓPRIO DOCUMENTO
 * -----------------------------
 * Quase nada aqui é número mágico. O gate lê o que o documento declara e refaz as
 * contas a partir das 126 linhas de aula: se a grade mudar, ele continua valendo;
 * se mudar em um lugar só, ele reprova. É isso que se quer de uma fonte de verdade.
 *
 * Roda offline, sem banco e sem rede — como os outros gates, para caber no CI.
 *
 * Uso: npm run verify:curriculo
 */

import { readFileSync } from "fs";

const DOC = "docs/curriculo/01-curriculo-definitivo-v1.md";

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

/** Células de uma linha de tabela markdown, sem as bordas e sem espaço. */
function celulas(linha: string): string[] {
  return linha.split("|").slice(1, -1).map((c) => c.trim());
}

/**
 * O texto de uma seção numerada, da sua chamada até a próxima.
 *
 * Sem isto o gate lê a tabela errada: "Aulas de abertura" aparece na §1 (o
 * diagnóstico do que existe hoje) antes de aparecer na §11 (a comparação), e
 * uma busca no documento inteiro casa com a primeira.
 */
function secao(numero: number): string {
  const re = new RegExp(`^#{1,2} ${numero}\\. [^\\n]*\\n([\\s\\S]*?)(?=^#{1,2} \\d+\\. )`, "m");
  return doc.match(re)?.[1] ?? "";
}

/** Linhas de tabela de um trecho, já em células, com o número de colunas pedido. */
function tabela(trecho: string, colunas: number, primeiraCelula = /^\d$/): string[][] {
  return trecho
    .split("\n")
    .map(celulas)
    .filter((c) => c.length === colunas && primeiraCelula.test(c[0] ?? ""));
}

/** Número de uma célula: "**~535**" → 535; "—" → 0. */
function num(celula: string): number {
  const limpo = celula.replace(/[*~\s]/g, "");
  if (limpo === "—" || limpo === "") return 0;
  return Number(limpo);
}

/** Soma todos os inteiros que aparecem num texto: "4 tática · 3 finais" → 7. */
function somaInteiros(texto: string): number {
  return [...texto.matchAll(/(\d+)/g)].reduce((a, m) => a + Number(m[1]), 0);
}

/** Soma "N puzzles", "N posições contra o motor" etc. numa célula de Treino. */
function doseDe(celula: string, sufixo: RegExp): number {
  return [...celula.matchAll(sufixo)].reduce((a, m) => a + Number(m[1]), 0);
}

const doc = readFileSync(DOC, "utf-8");

// A partir da §15 o documento é changelog: cita de propósito os números velhos.
const vivo = doc.split(/^## 15\. /m)[0];

type Trilha = {
  n: number;
  aulas: number;
  ultimaNumerada: number;
  banco: number;
  motor: number;
  aulasComMotor: number;
  aulasComMiniJogo: number;
  corpo: string;
};

function main() {
  console.log("========================================");
  console.log("GATE: as somas do currículo");
  console.log("========================================\n");

  // -------------------------------------------------------------------------
  // 1. As 126 linhas de aula da §6 — a base de tudo que vem depois.
  //
  //    Tudo o mais é declaração; só aqui existe aula de verdade. Se a numeração
  //    de uma trilha pular um número, toda soma abaixo mente em silêncio.
  // -------------------------------------------------------------------------
  console.log("1. As linhas de aula da §6 — numeração contínua\n");
  const secoes = doc.split(/^## Trilha /m).slice(1, 8);
  checar(secoes.length === 7, "§6: seções de trilha", `${secoes.length} encontradas (esperado 7)`);

  const trilhas: Trilha[] = secoes.map((s, i) => {
    const corpo = s.split(/^## /m)[0];
    const linhasAula = corpo
      .split("\n")
      .filter((l) => /^\| \d+ \|/.test(l))
      .map(celulas);
    const numeros = linhasAula.map((c) => Number(c[0]));
    const treinos = linhasAula.map((c) => c[3] ?? "");
    return {
      n: i + 1,
      aulas: linhasAula.length,
      ultimaNumerada: numeros[numeros.length - 1] ?? 0,
      banco: treinos.reduce((a, t) => a + doseDe(t, /(\d+) puzzles/g), 0),
      motor: treinos.reduce((a, t) => a + doseDe(t, /(\d+) posições contra o motor/g), 0),
      aulasComMotor: treinos.filter((t) => /posições contra o motor/.test(t)).length,
      // Nas colunas de Treino, itálico é sempre nome de mini-jogo.
      aulasComMiniJogo: treinos.filter((t) => /mini-jogo|\*[^*]+\*/.test(t)).length,
      corpo,
    };
  });

  for (const t of trilhas) {
    const sequencial = t.ultimaNumerada === t.aulas;
    checar(sequencial, `T${t.n}: numeração`, `${t.aulas} linhas de aula, última numerada a${t.ultimaNumerada}`);
  }
  const totalAulas = trilhas.reduce((a, t) => a + t.aulas, 0);
  despejar();
  console.log(`\n  total de aulas escritas: ${totalAulas}`);

  // -------------------------------------------------------------------------
  // 2. A grade da §3 contra as aulas escritas — e o acumulado da régua.
  //
  //    O acumulado vira UPDATE em title_tiers.lessons_required. Errar aqui é
  //    aluno promovido cedo ou preso — ver [[patente-update-sem-upsert]].
  // -------------------------------------------------------------------------
  console.log(`\n2. A grade da §3, e o acumulado que vira régua de patentes\n`);
  const grade = tabela(secao(3), 7);
  checar(grade.length === 7, "§3: linhas da grade", `${grade.length} encontradas`);

  let acumulado = 0;
  grade.forEach((c, i) => {
    const [, , , , aulas, acum] = c;
    acumulado += num(aulas);
    const t = trilhas[i];
    checar(
      num(aulas) === t?.aulas && num(acum) === acumulado,
      `grade T${i + 1}`,
      `declara ${num(aulas)} aulas (§6 tem ${t?.aulas}) · acumulado ${num(acum)} (soma ${acumulado})`,
    );
  });
  checar(acumulado === totalAulas, "grade: total", `soma da grade ${acumulado} = aulas escritas ${totalAulas}`);

  const regua = doc.match(/\*\*((?:\d+ · )+\d+)\*\*/);
  const esperada = [0, ...grade.map((_, i) => grade.slice(0, i + 1).reduce((a, c) => a + num(c[4]), 0))];
  checar(
    regua?.[1]?.replace(/\s/g, "") === esperada.join("·"),
    "régua de patentes",
    `documento diz "${regua?.[1] ?? "não encontrada"}" · acumulados reais ${esperada.join(" · ")}`,
  );
  despejar();

  // -------------------------------------------------------------------------
  // 3. "Onde cada área aparece" — as colunas fecham com as trilhas.
  //
  //    Esta é a tabela que mentiu na revisão 3: marcava 1 aula de defesa na T5
  //    quando nenhuma das 16 aulas da T5 era de defesa. A coluna só fechava
  //    reclassificando uma aula de estratégia.
  // -------------------------------------------------------------------------
  console.log(`\n3. A tabela de áreas — cada coluna soma o total da trilha\n`);
  const areaLinhas = secao(3)
    .split("\n")
    .filter((l) => /^\| (Fundamentos|Abertura|Tática|\*\*Defesa\*\*|Estratégia|Finais|Arena|\*\*Total\*\*)/.test(l))
    .map(celulas);
  checar(areaLinhas.length === 8, "tabela de áreas", `${areaLinhas.length} linhas (7 áreas + total)`);

  const areas = areaLinhas.slice(0, 7);
  const totalDeclarado = areaLinhas[7];
  for (let col = 0; col < 7; col++) {
    const soma = areas.reduce((a, l) => a + num(l[col + 1] ?? "0"), 0);
    const declarado = num(totalDeclarado?.[col + 1] ?? "0");
    checar(
      soma === declarado && declarado === trilhas[col]?.aulas,
      `áreas T${col + 1}`,
      `coluna soma ${soma} · total declarado ${declarado} · aulas na §6 ${trilhas[col]?.aulas}`,
    );
  }
  const porArea = (nome: string) => {
    const l = areas.find((a) => a[0]?.replace(/\*/g, "").startsWith(nome));
    return l ? l.slice(1, 8).reduce((a, c) => a + num(c), 0) : -1;
  };
  despejar();

  // -------------------------------------------------------------------------
  // 4. A meta de posições da §4 — cada linha é a SOMA das células da §6.
  //
  //    O achado mais grave da auditoria. A tabela prometia volume que as aulas
  //    não especificavam, e a diferença não tinha endereço em lugar nenhum.
  // -------------------------------------------------------------------------
  console.log(`\n4. A meta de posições — derivável célula a célula da §6\n`);
  const meta = tabela(secao(4), 6, /^\d [A-ZÀ-Ü]/);
  checar(meta.length === 7, "§4: linhas da meta", `${meta.length} encontradas`);

  meta.forEach((c, i) => {
    const t = trilhas[i];
    const [, nasAulas, banco, motor, revisao, total] = c;
    checar(
      num(banco) === t?.banco,
      `meta T${i + 1}: coluna "Do banco"`,
      `declara ${num(banco)} · blocos somados na §6 ${t?.banco}`,
    );
    checar(
      num(motor) === t?.motor,
      `meta T${i + 1}: coluna "Contra o motor"`,
      `declara ${num(motor)} · posições somadas na §6 ${t?.motor}`,
    );
    const soma = num(nasAulas) + num(banco) + num(motor) + num(revisao);
    checar(
      num(total) === soma,
      `meta T${i + 1}: total`,
      `declara ${num(total)} · ${num(nasAulas)}+${num(banco)}+${num(motor)}+${num(revisao)} = ${soma}`,
    );
  });
  despejar();

  // -------------------------------------------------------------------------
  // 5. Os blueprints do Desafio Final — composição soma os itens, corte >= 80%.
  //
  //    O piso de 80% vem da literatura de mastery learning citada na §5; o
  //    sistema antigo (7/10) estava abaixo dele.
  // -------------------------------------------------------------------------
  console.log(`\n5. Os blueprints do Desafio Final\n`);
  const blueprints = tabela(secao(5), 5);
  checar(blueprints.length === 7, "§5: blueprints", `${blueprints.length} encontrados`);

  for (const c of blueprints) {
    const [trilha, itens, composicao, corte] = c;
    const soma = somaInteiros(composicao ?? "");
    const pct = (100 * num(corte)) / num(itens);
    checar(
      soma === num(itens) && pct >= 80,
      `blueprint T${trilha}`,
      `composição soma ${soma} = ${num(itens)} itens · corte ${num(corte)}/${num(itens)} = ${pct.toFixed(1)}%`,
    );
  }
  despejar();

  // -------------------------------------------------------------------------
  // 6. O quadro comparativo da §11 — onde os números declarados desgarram.
  //
  //    Cada número aqui é uma afirmação sobre a grade, e cada um deles já esteve
  //    errado. Agora todos são medidos contra ela.
  // -------------------------------------------------------------------------
  console.log(`\n6. Os números declarados na §11, contra a grade medida\n`);
  const quadro = secao(11);
  const declarado = (rotulo: RegExp): number => {
    const l = quadro.split("\n").find((x) => rotulo.test(x));
    if (!l) return -1;
    const c = celulas(l);
    return Number(c[2]?.match(/\d+/)?.[0] ?? -1);
  };

  checar(declarado(/^\| Aulas \| 30 \|/) === totalAulas, "§11: total de aulas", `declara ${declarado(/^\| Aulas \| 30 \|/)} · escritas ${totalAulas}`);
  checar(declarado(/^\| Aulas de abertura/) === porArea("Abertura"), "§11: aulas de abertura", `declara ${declarado(/^\| Aulas de abertura/)} · tabela de áreas ${porArea("Abertura")}`);
  checar(declarado(/^\| Aulas de defesa/) === porArea("Defesa"), "§11: aulas de defesa", `declara ${declarado(/^\| Aulas de defesa/)} · tabela de áreas ${porArea("Defesa")}`);
  checar(declarado(/^\| Aulas de estratégia/) === porArea("Estratégia"), "§11: aulas de estratégia", `declara ${declarado(/^\| Aulas de estratégia/)} · tabela de áreas ${porArea("Estratégia")}`);
  checar(declarado(/^\| Aulas de final/) === porArea("Finais"), "§11: aulas de final", `declara ${declarado(/^\| Aulas de final/)} · tabela de áreas ${porArea("Finais")}`);

  const miniJogosMedido = trilhas.reduce((a, t) => a + t.aulasComMiniJogo, 0);
  const miniJogosDeclarado = Number(quadro.match(/\| Mini-jogos \| 0 \| \d+, em (\d+) aulas/)?.[1] ?? -1);
  checar(miniJogosDeclarado === miniJogosMedido, "§11: aulas com mini-jogo", `declara ${miniJogosDeclarado} · medido na §6 ${miniJogosMedido}`);

  const motorMedido = trilhas.reduce((a, t) => a + t.aulasComMotor, 0);
  const motorDeclarado = Number(quadro.match(/\| Prática contra o motor \| 0 \| (\d+) aulas/)?.[1] ?? -1);
  checar(motorDeclarado === motorMedido, "§11: aulas que fecham no motor", `declara ${motorDeclarado} · medido na §6 ${motorMedido}`);

  const t1Total = num(meta[0]?.[5] ?? "0");
  const t1Declarado = Number(quadro.match(/~(\d+) só na T1/)?.[1] ?? -1);
  checar(t1Declarado === t1Total, "§11: posições de prática na T1", `declara ${t1Declarado} · meta da §4 ${t1Total}`);
  despejar();

  // -------------------------------------------------------------------------
  // 7. O catálogo de mini-jogos (§7) contra as aulas que os usam.
  //
  //    Pega o mini-jogo catalogado que nenhuma aula chama — e a aula que chama
  //    um mini-jogo que não está no catálogo.
  // -------------------------------------------------------------------------
  console.log(`\n7. O catálogo de mini-jogos contra as aulas\n`);
  const catalogo = [...doc.matchAll(/^\| \*\*([^*]+)\*\* \| [^|]+\| [^|]+\| T\d/gm)].map((m) => m[1]!);
  checar(catalogo.length === 10, "§7: mini-jogos catalogados", `${catalogo.length} (a §11 declara 10)`);
  const corpoAulas = trilhas.map((t) => t.corpo).join("\n");
  for (const jogo of catalogo) {
    checar(corpoAulas.includes(jogo), `mini-jogo "${jogo}"`, corpoAulas.includes(jogo) ? "usado em alguma aula" : "catalogado mas nenhuma aula o usa");
  }
  despejar();

  // -------------------------------------------------------------------------
  // 8. Números velhos que sobrevivem a uma revisão colando em outra seção.
  // -------------------------------------------------------------------------
  console.log(`\n8. Resíduos de revisões anteriores no texto vivo\n`);
  const residuos: Array<[string, RegExp]> = [
    ["contagem antiga de aulas (124)", /124 aulas/],
    ["mini-jogos “em 22 aulas”", /em 22 aulas/],
    ["corte “~83% em todas”", /~83% em todas/],
  ];
  for (const [nome, re] of residuos) {
    checar(!re.test(vivo), `sem resíduo: ${nome}`, re.test(vivo) ? "ainda presente antes da §15" : "ausente do texto vivo");
  }
  despejar();

  console.log("\n========================================");
  if (violacoes.length > 0) {
    console.log(`RESULTADO: ${violacoes.length} violações`);
    console.log("========================================\n");
    for (const v of violacoes) console.log(`  [FAIL] ${v}`);
    console.log("\nUm número declarado que não bate com a grade não é erro de escrita:");
    console.log("é a meta de volume voltando a ser promessa. Foi assim que a revisão 3");
    console.log("prometeu 1.570 posições do banco com 640 especificadas nas aulas.");
    process.exit(1);
  }
  console.log("RESULTADO: 0 violações");
  console.log("========================================");
  console.log(`\n  ${totalAulas} aulas · régua ${esperada.join(" · ")}`);
  console.log(`  volume total especificado: ${meta.reduce((a, c) => a + num(c[5] ?? "0"), 0)} posições`);
  console.log("\nGate somas do currículo: OK");
}

main();
