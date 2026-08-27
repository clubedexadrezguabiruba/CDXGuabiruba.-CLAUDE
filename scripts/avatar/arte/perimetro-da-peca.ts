/**
 * O PERÍMETRO DA PEÇA TEM LINHA? — a régua que faltava, e ela nasce de uma
 * reprovação do Doug.
 *
 * ---------------------------------------------------------------------------
 * A REPROVAÇÃO, 2026-08-24
 * ---------------------------------------------------------------------------
 *
 * Duas tocas de cozinheiro chegaram ao render e o Doug reprovou as duas de olho:
 * *"reprovada e muito! (sem borda, descolada, cor vazando etc)"*.
 *
 * **Os três defeitos são o MESMO evento visto de três ângulos.** Onde o perímetro
 * da peça termina numa cor clara em vez de numa linha escura:
 *
 *  - não há borda — é literalmente o que falta;
 *  - a cor da peça encosta direto na pele ou no fundo — é o vazamento;
 *  - e a peça deixa de parecer assentada — é o descolamento.
 *
 * Medido na folha: o preenchimento das duas tocas tem contraste de **1,03:1** contra
 * o fundo da página. Onde falta contorno, a borda é **matematicamente invisível** —
 * não há o que ver. É por isso que o defeito grita.
 *
 * ---------------------------------------------------------------------------
 * POR QUE NENHUMA RÉGUA PEGOU, E ISSO É O ACHADO
 * ---------------------------------------------------------------------------
 *
 * `arte:traco`, `arte:borda` e `arte:figurinha` percorrem `ARTES_PROMOVIDAS`, que é
 * `NOMES_ROSTO + NOMES_CABELO`: **o slot `chapeu` tinha cobertura zero**. E as três
 * medem o traço **do boneco** — se ele foi apagado, se foi repintado em cinza, se a
 * peça tapou o rosto. Nenhuma delas pergunta se a **peça** tem contorno próprio.
 *
 * O doc 23 §7 já registrava o buraco na tabela de moldes: *"chapéu · óculos · pet —
 * nenhuma"*.
 *
 * ---------------------------------------------------------------------------
 * O PISO SAI DAS PEÇAS QUE O DOUG APROVOU, NÃO DE UM NÚMERO ESCOLHIDO
 * ---------------------------------------------------------------------------
 *
 * | peça | perímetro com linha escura |
 * |---|---|
 * | `cachos-anjo`, aprovada | **99,7%** |
 * | `chanel`, aprovada | **99,7%** |
 * | Toca Alta, reprovada | **65,1%** |
 * | Toca Curta, reprovada | **80,1%** |
 *
 * O piso é **95%**: bem abaixo do que as aprovadas entregam, bem acima do que as
 * reprovadas entregam, e com folga para o antialias de um rasterizador diferente.
 * Não é um número ajustado para o catálogo de hoje passar raspando — é a distância
 * entre duas populações que estão a 20 pontos uma da outra.
 *
 * ---------------------------------------------------------------------------
 * A FRONTEIRA DO CAMPO NÃO É PERÍMETRO, E ISSO CUSTOU UMA MEDIÇÃO ERRADA
 * ---------------------------------------------------------------------------
 *
 * A primeira versão desta régua contou **5 360 px** de perímetro na Toca Alta e
 * 61,1% de cobertura. Errado: 4 031 daqueles pixels eram a borda do **campo do
 * slot** — onde a máscara acaba porque a régua a cortou, não porque a peça acaba.
 * Ali não há linha para a artista ter desenhado, e contar é a régua medindo o
 * próprio recorte.
 *
 * ---------------------------------------------------------------------------
 * A SEGUNDA CONFERÊNCIA: O CAMPO AMPUTOU EM SILÊNCIO
 * ---------------------------------------------------------------------------
 *
 * `construirPeca` conta os candidatos que caem fora do campo e **constrói a peça
 * assim mesmo**. Na Toca Alta foram **15 766 px — 13% do que a artista desenhou** —,
 * cortados numa reta horizontal no piso da sobrancelha, e é essa reta que aparece
 * como "sem borda" na base do chapéu.
 *
 * Descarte em silêncio é *o* modo de falha que esta rota inteira existe para fechar,
 * e no slot novo ela estava fazendo exatamente isso.
 */

import { existsSync, readdirSync, rmSync } from "fs";

import sharp from "sharp";

import { ESCALA, LADO, PASTA, noCampoDoChapeu, paraUnidade, regiaoDoPixel } from "./base";
import { taparFurosCercados } from "./peca-de-arte";
import { tintaDoChapeu } from "./chapeu";
import { extrairPorCampo } from "./extrair";
import { TRACO } from "../../../src/lib/avatar/estilo/geometria";

/** Metade do traço, em pixels do canvas: 7. É o alcance da busca por linha. */
const MEIO_TRACO = Math.round((TRACO * ESCALA) / 2);
/** O corte de "escuro". O mesmo `ESCURO` de `extrair.ts`, menos folgado. */
const ESCURO = 60;
/** Quanto do perímetro precisa ter linha atrás. Ver o docstring do topo. */
const PISO_PERIMETRO = 95;
/** Quanto a peça pode perder para o campo antes de a amputação virar defeito. */
const TETO_AMPUTADO = 3;

const campoDoCabelo = (x: number, y: number) => {
  const r = regiaoDoPixel(x, y);
  return r !== "rosto" && r !== "corpo";
};

type Slot = "chapeu" | "cabelo";
const campoDe = (s: Slot) => (s === "chapeu" ? noCampoDoChapeu : campoDoCabelo);

export interface Medida {
  perimetro: number;
  /** Perímetro que dá para o LADO DE FORA — a silhueta que o olho vê. */
  perimetroExterno: number;
  /** Desses, quantos têm linha escura atrás. */
  comLinhaExterno: number;
  /** Perímetro de FURO — borda de vazio cercado pela própria peça. */
  perimetroFuro: number;
  /** Furo cercado que a esteira tapou antes de medir, como `construirPeca` faz. */
  furosTapados: number;
  comLinha: number;
  pct: number;
  amputado: number;
  desenhado: number;
  pctAmputado: number;
  caixa: string;
  reprova: boolean;
}

export async function perimetroDaPeca(arte: string, slot: Slot): Promise<Medida> {
  const campo = campoDe(slot);
  const e = await extrairPorCampo(arte, campo);

  // ⚠️ A RÉGUA MEDE A MÁSCARA QUE A ESTEIRA DO SLOT CONSTRÓI, não a que a extração
  // devolve. `construirPeca` — o braço de cor assada, que é por onde o chapéu passa
  // — tapa furo cercado desde 2026-08-25, então medir antes disso seria reprovar
  // uma peça que sai boa. É a lição de "medir o render, não a arte".
  //
  // O braço TONAL (`construirPecaTonal`, cabelo e rosto) **não** tapa, e por isso o
  // cabelo é medido cru: a régua segue a esteira de cada slot em vez de inventar uma
  // terceira. No dia em que o tonal tapar, esta linha acompanha.
  const furosTapados =
    slot === "chapeu"
      ? taparFurosCercados(e.mascara, LADO, LADO, (i) => {
          const u = paraUnidade(i % LADO, Math.floor(i / LADO));
          return campo(u.x, u.y);
        })
      : 0;
  // A tinta do slot, porque é a cor FINAL que decide se há linha: no chapéu o azul
  // instrumental vira cinza escuro, e medir antes dela veria azul, não linha.
  const t = slot === "chapeu" ? tintaDoChapeu(e) : null;
  const cor = (i: number): [number, number, number] =>
    t ? t.aplicar(i) : [e.arte.data[i * 3], e.arte.data[i * 3 + 1], e.arte.data[i * 3 + 2]];

  const m = e.mascara;
  let perimetro = 0;
  let comLinha = 0;
  let perimetroExterno = 0;
  let comLinhaExterno = 0;
  let perimetroFuro = 0;

  // O LADO DE FORA, para separar silhueta de furo no relatório. A primeira versão
  // desta régua somava os dois e imprimia "a linha não dá a volta completa" —
  // mandando o leitor consertar o contorno numa peça cujo contorno externo estava
  // 100% fechado. O número não estava errado; a CAUSA que ele nomeava estava.
  const fora = new Uint8Array(m.length);
  {
    const pilha: number[] = [];
    const empilhar = (i: number) => {
      if (!m[i] && !fora[i]) {
        fora[i] = 1;
        pilha.push(i);
      }
    };
    for (let x = 0; x < LADO; x++) {
      empilhar(x);
      empilhar((LADO - 1) * LADO + x);
    }
    for (let y = 0; y < LADO; y++) {
      empilhar(y * LADO);
      empilhar(y * LADO + LADO - 1);
    }
    while (pilha.length) {
      const i = pilha.pop() as number;
      const x = i % LADO;
      const y = (i / LADO) | 0;
      if (x > 0) empilhar(i - 1);
      if (x < LADO - 1) empilhar(i + 1);
      if (y > 0) empilhar(i - LADO);
      if (y < LADO - 1) empilhar(i + LADO);
    }
  }
  let x0 = 1e9;
  let y0 = 1e9;
  let x1 = -1e9;
  let y1 = -1e9;
  let semLinha = 0;

  for (let y = 1; y < LADO - 1; y++)
    for (let x = 1; x < LADO - 1; x++) {
      const i = y * LADO + x;
      if (!m[i]) continue;
      if (m[i - 1] && m[i + 1] && m[i - LADO] && m[i + LADO]) continue;

      // A fronteira do CAMPO não é perímetro da peça — ver o docstring.
      const viz: [number, number][] = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ];
      if (viz.some(([vx, vy]) => !m[vy * LADO + vx] && !campo(paraUnidade(vx, vy).x, paraUnidade(vx, vy).y)))
        continue;

      perimetro++;
      const externo = viz.some(([vx, vy]) => fora[vy * LADO + vx]);
      if (externo) perimetroExterno++;
      else perimetroFuro++;
      let achou = false;
      for (let dy = -MEIO_TRACO; dy <= MEIO_TRACO && !achou; dy++)
        for (let dx = -MEIO_TRACO; dx <= MEIO_TRACO; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || xx >= LADO || yy < 0 || yy >= LADO) continue;
          const k = yy * LADO + xx;
          if (!m[k]) continue;
          const [r, g, b] = cor(k);
          if (0.2126 * r + 0.7152 * g + 0.0722 * b < ESCURO) {
            achou = true;
            break;
          }
        }
      if (achou) {
        comLinha++;
        if (externo) comLinhaExterno++;
      } else {
        semLinha++;
        const u = paraUnidade(x, y);
        if (u.x < x0) x0 = u.x;
        if (u.x > x1) x1 = u.x;
        if (u.y < y0) y0 = u.y;
        if (u.y > y1) y1 = u.y;
      }
    }

  // Quanto a artista desenhou e o campo cortou.
  const tudo = await extrairPorCampo(arte, () => true);
  let dentro = 0;
  let desenhado = 0;
  for (let i = 0; i < tudo.mascara.length; i++) {
    if (!tudo.mascara[i]) continue;
    desenhado++;
    const u = paraUnidade(i % LADO, Math.floor(i / LADO));
    if (campo(u.x, u.y)) dentro++;
  }
  const amputado = desenhado - dentro;
  const pctAmputado = desenhado ? (amputado / desenhado) * 100 : 0;
  const pct = perimetro ? (comLinha / perimetro) * 100 : 100;

  return {
    perimetro,
    perimetroExterno,
    comLinhaExterno,
    perimetroFuro,
    furosTapados,
    comLinha,
    pct,
    amputado,
    desenhado,
    pctAmputado,
    caixa: semLinha ? `u x ${x0.toFixed(0)}→${x1.toFixed(0)} · y ${y0.toFixed(0)}→${y1.toFixed(0)}` : "—",
    reprova: pct < PISO_PERIMETRO || pctAmputado > TETO_AMPUTADO,
  };
}

/** O CONTROLE: a mesma arte com um trecho do contorno apagado na cor da peça. */
async function semContorno(arte: string, altura: number): Promise<string> {
  const { data, info } = await sharp(arte).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const e = await extrairPorCampo(arte, campoDoCabelo);
  // ⚠️ NÃO é `corDominante`: no `chanel` ela vale (18, 18, 66) — a cor da própria
  // LINHA, porque o traço é a maior massa de um tom só. Apagar a linha pintando-a de
  // linha não apaga nada, e o controle passou uma rodada mentindo que se comportou.
  // A cor certa é a da MASSA: a média dos pixels de peça que não são escuros.
  let sr = 0, sg = 0, sb = 0, q = 0;
  for (let i = 0; i < e.mascara.length; i++) {
    if (!e.mascara[i]) continue;
    const j = i * 3;
    const d = e.arte.data;
    if (0.2126 * d[j] + 0.7152 * d[j + 1] + 0.0722 * d[j + 2] < ESCURO) continue;
    sr += d[j]; sg += d[j + 1]; sb += d[j + 2]; q++;
  }
  const cr = Math.round(sr / Math.max(1, q));
  const cg = Math.round(sg / Math.max(1, q));
  const cb = Math.round(sb / Math.max(1, q));
  // Apaga a linha numa faixa horizontal: tudo que é escuro E é peça vira a cor dela.
  let meio = 0;
  let n = 0;
  for (let i = 0; i < e.mascara.length; i++)
    if (e.mascara[i]) {
      meio += Math.floor(i / LADO);
      n++;
    }
  const yc = Math.round(meio / Math.max(1, n));
  let apagados = 0;
  for (let y = yc - altura; y <= yc + altura; y++)
    for (let x = 0; x < LADO; x++) {
      const i = y * LADO + x;
      if (i < 0 || i >= e.mascara.length || !e.mascara[i]) continue;
      const j = i * 3;
      if (0.2126 * data[j] + 0.7152 * data[j + 1] + 0.0722 * data[j + 2] >= ESCURO) continue;
      data[j] = cr;
      data[j + 1] = cg;
      data[j + 2] = cb;
      apagados++;
    }
  const saida = `${PASTA}/zz-controle-sem-contorno.png`;
  console.log(
    `  (o controle apagou ${apagados} px de linha na faixa y ${yc - altura}→${yc + altura}, ` +
      `pintando-a da cor da MASSA ${cr},${cg},${cb} — ver o comentário sobre \`corDominante\`)`,
  );
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } })
    .png()
    .toFile(saida);
  return saida;
}

const pctDe = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : "—");

const linha = (nome: string, m: Medida) =>
  `  ${nome.padEnd(30)} perím ${m.perimetro.toLocaleString("pt-BR").padStart(5)}   ` +
  `com linha ${`${m.pct.toFixed(1)}%`.padStart(6)}   ` +
  `externo ${pctDe(m.comLinhaExterno, m.perimetroExterno).padStart(6)}   ` +
  `furo ${m.perimetroFuro.toLocaleString("pt-BR").padStart(5)}   ` +
  `tapado ${m.furosTapados.toLocaleString("pt-BR").padStart(6)}   ` +
  `amput ${`${m.pctAmputado.toFixed(1)}%`.padStart(5)}   ` +
  `${m.reprova ? "✗ REPROVA" : "·        "}`;

const slotDe = (a: string): Slot => (/[\\/]chapeu-/.test(a) ? "chapeu" : "cabelo");

async function principal(): Promise<void> {
  const alvos = process.argv.slice(2).filter((a) => !a.startsWith("--"));

  console.log(
    `\nO PERÍMETRO DA PEÇA TEM LINHA? — piso ${PISO_PERIMETRO}% do perímetro\n` +
      `                                 linha = tinta com luminância < ${ESCURO} a até ${MEIO_TRACO} px para dentro\n` +
      `                                 e o campo do slot NÃO conta como perímetro\n` +
      `                                 mais: teto de ${TETO_AMPUTADO}% do desenho amputado pelo campo\n`,
  );

  // O CONTROLE VEM PRIMEIRO, SEMPRE. Duas peças que o Doug aprovou têm de passar; a
  // mesma peça com o contorno apagado tem de reprovar. Sem isso, nenhum "·" abaixo
  // quer dizer nada — é o modo de falha que esta rota já pagou cinco vezes.
  const aprovadas = ["cachos-anjo", "chanel"].map((s) => `${PASTA}/${s}.png`).filter(existsSync);
  let controleOk = true;
  for (const a of aprovadas) {
    const m = await perimetroDaPeca(a, "cabelo");
    console.log(linha(`contra-controle: ${a.split(/[\\/]/).pop()}`, m) + "   ← esperado PASSAR");
    if (m.reprova) controleOk = false;
  }
  let mutilada = "";
  if (aprovadas.length) {
    mutilada = await semContorno(aprovadas[aprovadas.length - 1], 40);
    const m = await perimetroDaPeca(mutilada, "cabelo");
    console.log(linha("CONTROLE: chanel sem contorno", m) + "   ← esperado REPROVAR");
    if (!m.reprova) controleOk = false;
    rmSync(mutilada, { force: true });
  }
  if (!controleOk) {
    console.error(
      `\n  ✗ O CONTROLE NÃO SE COMPORTOU, e isso invalida a rodada inteira.\n` +
        `    Ou a régua reprovou uma peça aprovada, ou não viu um contorno apagado.\n` +
        `    Não confie em nenhum "·" desta tela.`,
    );
    process.exit(1);
  }
  console.log("");

  const lista = alvos.length ? alvos : artesDeChapeuNoDisco();
  if (!lista.length) {
    console.log(`  · nenhuma arte de chapéu no disco — nada a medir, e é estado legítimo.`);
    return;
  }

  const ruins: string[] = [];
  const medidas: [string, Medida][] = [];
  for (const a of lista) {
    const m = await perimetroDaPeca(a, slotDe(a));
    medidas.push([a, m]);
    console.log(linha(a.split(/[\\/]/).pop() ?? a, m));
    if (m.reprova)
      ruins.push(
        `${a}: perímetro com linha ${m.pct.toFixed(1)}% (piso ${PISO_PERIMETRO}) · ` +
          `amputado ${m.pctAmputado.toFixed(1)}% (teto ${TETO_AMPUTADO})`,
      );
  }

  if (ruins.length) {
    console.error(`\n  ✗ ${ruins.length} arte(s) reprovada(s):\n` + ruins.map((r) => `    ${r}`).join("\n"));
    for (const [a, m] of medidas) {
      if (!m.reprova) continue;
      // A CAUSA sai do que foi MEDIDO, não de uma lista fixa de suspeitos. A versão
      // anterior imprimia sempre as mesmas duas frases, e numa peça de contorno externo
      // 100% fechado ela mandava consertar o contorno — medido na `chapeu-toca-de-cozinha`
      // em 2026-08-25, e foi o Doug quem pegou.
      console.error(`\n    ${a.split(/[\\/]/).pop()}`);
      const extPct = (m.comLinhaExterno / (m.perimetroExterno || 1)) * 100;
      if (extPct < PISO_PERIMETRO)
        console.error(
          `      · A SILHUETA não tem linha em ${(100 - extPct).toFixed(1)}% da volta` +
            ` (${m.perimetroExterno - m.comLinhaExterno} de ${m.perimetroExterno} px).\n` +
            `        É desenho: a linha afina ou some, e o pedido cobra "sem afinar em lugar\n` +
            `        nenhum, inclusive embaixo, onde a peça encosta em outra coisa".`,
        );
      else
        console.error(
          `      · a silhueta externa está FECHADA (${extPct.toFixed(1)}% com linha) — não é ela.`,
        );
      if (m.perimetroFuro)
        console.error(
          `      · FURO por dentro: ${m.perimetroFuro} px de borda de vazio.\n` +
            `        A esteira tapou ${m.furosTapados.toLocaleString("pt-BR")} px de furo CERCADO;\n` +
            `        o que sobrou alcança a borda do canvas, então é fenda aberta, não furo.`,
        );
      if (m.pctAmputado > TETO_AMPUTADO)
        console.error(
          `      · AMPUTADO: ${m.pctAmputado.toFixed(1)}% do desenho caiu fora do campo do slot\n` +
            `        e foi cortado em reta. A reta não tem contorno. O campo está em\n` +
            `        \`noCampoDoChapeu\` (base.ts) — piso, teto e lados.`,
        );
    }
    console.error(`\n    Ver \`docs/avatar/23-linha-de-arte.md\` §3.`);
    process.exit(1);
  }
  console.log(
    `\n  · ${lista.length} arte(s) com o perímetro fechado, e o controle se comportou nas ${aprovadas.length + 1} medições.`,
  );
}

function artesDeChapeuNoDisco(): string[] {
  return readdirSync(PASTA)
    .filter((f) => /^chapeu-.+\.png$/i.test(f))
    .sort()
    .map((f) => `${PASTA}/${f}`);
}

if (process.argv[1] && /perimetro-da-peca\.ts$/.test(process.argv[1])) {
  principal().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
