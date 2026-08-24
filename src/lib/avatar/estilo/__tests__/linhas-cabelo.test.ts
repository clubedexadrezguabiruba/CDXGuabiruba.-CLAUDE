/**
 * O TRAÇO DA PEÇA TRAÇADA — e a regressão de que ele não vazou para quem não devia.
 *
 * ---------------------------------------------------------------------------
 * O DEFEITO, EM UMA FRASE
 * ---------------------------------------------------------------------------
 *
 * `.kk-cabelo-s` tem `fill` **e** `stroke`. Na família paramétrica isso está certo:
 * a touca fecha por um retângulo a `FORA` da caixa da cabeça, o clip come aquele
 * trecho inteiro, e o que sobra traçado é exatamente a franja — perímetro matemático
 * e traço visível coincidem por construção.
 *
 * Num laço FECHADO eles deixam de coincidir. O laço tem borda também por cima, e ali
 * quem desenha o contorno na arte é a cabeça do BONECO do gerador, que é `descarte`.
 * Medido na `curto-espetada`: em **876 dos 3 028** pontos do laço a sonda pela normal
 * não encontra preto nenhum. Traçar o laço inteiro põe uma barra preta atravessando a
 * coroa, com pele por cima, que ninguém desenhou.
 *
 * ---------------------------------------------------------------------------
 * O QUE ESTE ARQUIVO MEDE, E O QUE ELE DE PROPÓSITO NÃO MEDE
 * ---------------------------------------------------------------------------
 *
 * Ele **não** mede "a linha corre sobre a massa". Com `Cabelo.linhas` sendo arcos de
 * ÍNDICE, o traço não corre sobre a massa: ele *é* a massa no trecho apontado,
 * emitido pelos mesmos comandos `C`. Uma amarra que não pode falhar é a aprovação
 * por vacuidade que este projeto já pagou duas vezes — então o que se mede aqui é
 * que a **emissão** cumpre isso, comparando `d` com `d`.
 */

import { describe, expect, it } from "vitest";
import {
  CABELOS,
  MODELOS_CABELO,
  MODELOS_PARAMETRICOS,
  MODELOS_TONAIS,
  MODELOS_TRACADOS,
  SOBRANCELHA_COBERTA,
  completudeDasFamilias,
  arcosDeTraco,
  coberturaDaSobrancelha,
  pathCabelo,
  pathCabeloLinhas,
} from "../cabelo";
import type { Cabelo, ModeloCabelo, PontoFranja } from "../cabelo";
import { PECAS_DA_ARTE } from "../pecas-da-arte";
import { SOBRANCELHA } from "../geometria";
import { compor } from "../compositor";
import { conferirSvg } from "../../svgContrato";
import { CABELO, PELE } from "../../palette";
import { PARAMETRICO_CONGELADO } from "./parametrico-congelado";
import { createHash } from "node:crypto";

const svgDe = (modelo?: Parameters<typeof compor>[0]["modeloCabelo"], animado = false) =>
  compor({ pele: PELE[1], cabelo: CABELO[1], modeloCabelo: modelo, ns: "t", animado });

const formas = (svg: string) => (svg.match(/<(path|ellipse|rect|circle|use)\b/g) ?? []).length;
const sha = (s: string) => createHash("sha256").update(s, "utf-8").digest("hex");
const cssDe = (svg: string) => svg.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";

/** O mesmo laço com cortina de `cabelo.test.ts` — a topologia que a arte exige. */
const MASSA: readonly PontoFranja[] = [
  { t: -0.14, y: 236 },
  { t: 0.04, y: 300 },
  { t: 0.14, y: 246 },
  { t: 0.24, y: 132 },
  { t: 0.5, y: 122 },
  { t: 0.78, y: 130 },
  { t: 1.0, y: 178 },
  { t: 1.16, y: 234 },
  { t: 1.2, y: 30 },
  { t: 0.5, y: 12 },
  { t: -0.2, y: 30 },
];

/**
 * O `id` das FIXTURAS sintéticas — rótulo, não alvo. Ver o gêmeo em `cabelo.test.ts`.
 *
 * Era `"coque"` até 2026-08-24, quando o Doug apagou o último paramétrico do elenco.
 * A união `ModeloCabelo` exige um nome vivo; nenhuma destas fixtures lê a peça do
 * catálogo com esse nome.
 */
const ID_FIXTURA = "chanel" as const;

/**
 * UM PARAMÉTRICO SINTÉTICO — e ele nasceu porque o catálogo ficou sem nenhum.
 *
 * Três testes abaixo compunham a peça `coque` do catálogo para exercitar a família:
 * `.kk-cabelo-s` com fill e stroke, `pathCabeloLinhas` devolvendo vazio, `arcosDeTraco`
 * devolvendo `null`. Nenhum deles queria AQUELA peça — queriam *uma* peça com
 * `pontos`. Com `MODELOS_PARAMETRICOS` vazia, apontar para o catálogo é impossível, e
 * apontar para uma peça tonal mediria outra família em silêncio.
 *
 * Os pontos são os de `cabelo.test.ts` (`PONTOS_PARAMETRICO`), pelo mesmo motivo que
 * lá: congelar a forma aqui separa *como a família se emite* de *o que o catálogo tem*.
 */
const PARAMETRICO: Cabelo = {
  id: ID_FIXTURA,
  nome: "paramétrico (fixture)",
  pontos: [
    { t: -0.12, y: 232 },
    { t: 0.05, y: 178 },
    { t: 0.2, y: 134 },
    { t: 0.42, y: 124 },
    { t: 0.68, y: 123 },
    { t: 0.88, y: 130 },
    { t: 0.99, y: 176 },
    { t: 1.14, y: 228 },
  ],
};

/** Traço na borda de baixo (0→7) e num pedaço da volta. A coroa fica sem linha. */
const tracado: Cabelo = {
  id: ID_FIXTURA,
  nome: "curto (traçado, com arcos de traço)",
  massa: MASSA,
  linhas: [
    [0, 7],
    [9, 10],
  ],
};

/** Os três selos de um caso, na ordem em que eles dão o melhor relatório. */
const conferirSelo = (chave: string, svg: string) => {
  const antes = PARAMETRICO_CONGELADO[chave];
  expect(antes, `${chave}: não há selo — rode \`npm run avatar:congelar\``).toBeDefined();
  // O CSS primeiro: é o único dos três que dá um diff legível. O SHA logo abaixo é
  // quem garante o resto do arquivo.
  expect(cssDe(svg), `${chave}: o bloco <style> mudou`).toBe(antes.css);
  expect(Buffer.byteLength(svg, "utf-8"), `${chave}: o tamanho mudou`).toBe(antes.bytes);
  expect(sha(svg), `${chave}: algum byte fora do <style> mudou`).toBe(antes.sha);
};

describe("as TRÊS famílias do catálogo são declaradas, não inferidas", () => {
  it("toda peça do catálogo está em EXATAMENTE uma das três listas", () => {
    // Sem esta amarra, um modelo novo nasceria fora das listas e escaparia dos blocos
    // de selo abaixo — em silêncio, e justamente no primeiro dia dele. É o modo de
    // falha por vacuidade, escrito na forma que este arquivo permite.
    //
    // A régua mora em `cabelo.ts` (`completudeDasFamilias`) e não aqui porque a
    // TERCEIRA lista nasceu vazia: uma soma escrita neste arquivo teria de ser
    // reescrita a cada promoção, e é exatamente o tipo de número que este
    // repositório já pagou para não manter em dois lugares.
    const { foraDasListas, emDuasListas } = completudeDasFamilias();
    expect(foraDasListas, "modelo do catálogo fora das três listas").toEqual([]);
    expect(emDuasListas, "modelo em mais de uma lista").toEqual([]);
  });

  it("as três listas somam o catálogo, e a soma é conferida contra `MODELOS_CABELO`", () => {
    // O par da amarra acima, pelo lado do conjunto: `completudeDasFamilias` responde
    // pelas duas queixas, mas não afirma que a UNIÃO é o catálogo — ela poderia
    // aprovar um id declarado que não existisse em `CABELOS`.
    const declarados = [...MODELOS_PARAMETRICOS, ...MODELOS_TRACADOS, ...MODELOS_TONAIS];
    expect([...declarados].sort()).toEqual([...MODELOS_CABELO].sort());
  });

  it("quantas peças cada família tem — e o dia em que uma migrar, é aqui que se lê", () => {
    // ⚠️ ESTES NÚMEROS SÃO PARA CAIR, uma vez por promoção. Eles não defendem nada
    // sozinhos: declaram o estado do elenco, que o plano de 2026-08-22 move peça a
    // peça — os cinco modelos vão para o padrão tonal, cada um depois do parecer do
    // Doug sobre a folha.
    //
    // O `chanel` foi o primeiro: migrou de `MODELOS_TRACADOS` para `MODELOS_TONAIS`
    // em 2026-08-22, com a arte velha sobrescrita e a linha dele apagada de `ARTES`
    // em `scripts/avatar/arte/pecas.ts`.
    //
    // Quando a próxima migrar, este teste reprova, e a mensagem diz o que fazer:
    // conferir que a promoção regravou os selos DAQUELA peça, e então mover o
    // número. Sem ele, o bloco de selos dos traçados encolheria em silêncio.
    //
    // ⚠️ O `burst-fade` subiu o tonal para 3 em 2026-08-22 SEM baixar nenhum dos
    // outros dois: ele não migrou de família, entrou de fora. É o caso que a leitura
    // ingênua destes números não prevê — "tonal subiu, então traçado desceu" é falso
    // aqui —, e é por isso que a soma vive na asserção de conjunto acima, não nesta.
    //
    // ⚠️ A `assimetrico` migrou em 2026-08-22/23: TRAÇADA -> TONAL. É o caso
    // "normal" que este bloco prevê, e o par de números move junto — tonal 3 -> 4,
    // traçado 2 -> 1. O selo dela foi regravado na mesma passada (`avatar:congelar`
    // escreveu 13 selos, contra 11: o `assimetrico` normal e o animado entraram, e
    // NENHUM selo existente mudou de bytes). O registro de bytes dela em
    // `cabelo.test.ts` caiu de 14 074 para 12 176, que é o que a família tonal faz.
    //
    // ⚠️ **2026-08-24: as duas últimas não migraram — foram APAGADAS.** O Doug
    // reprovou `espetado` (cor vazando pelo contorno) e `coque` (duas vezes, a última
    // com 9,0% da peça fora do `viewBox`), e decidiu desenhar arte nova em vez de
    // refazer aquelas. Traçado 1 -> 0 e paramétrico 1 -> 0 **sem** o tonal subir: é o
    // terceiro caso que este bloco vê, depois de "migrou" e "entrou de fora".
    expect(
      MODELOS_TONAIS.length,
      "uma peça migrou para a família tonal: regrave o selo DELA (`npm run avatar:congelar`) " +
        "e atualize este número — nunca em lote",
    ).toBe(4);
    expect(
      MODELOS_TRACADOS.length,
      "a família traçada está VAZIA desde 2026-08-24: se alguém entrou, os selos dos " +
        "traçados voltaram a medir e este número precisa subir junto",
    ).toBe(0);
    expect(
      MODELOS_PARAMETRICOS.length,
      "a família paramétrica está VAZIA desde 2026-08-24 — mesma regra da linha acima",
    ).toBe(0);
  });

  it("nenhum modelo declara duas famílias ao mesmo tempo — `pontos` × `massa` × `tonal`", () => {
    // A exclusividade é lei desde 2026-08-06 (`Cabelo`, docstring): duas descrições
    // da mesma borda divergem sempre. Com o braço tonal ela passa a ter três lados, e
    // o mais caro é `massa` + `tonal`: a máscara de tom é recortada na silhueta EXATA
    // do potrace, então uma massa decimada por corda ao lado dela poria o
    // claro-escuro fora de registro com a peça que o pinta.
    for (const m of MODELOS_CABELO) {
      const c = CABELOS[m];
      const familias = [c.pontos && "pontos", c.massa && "massa", c.tonal && "tonal"].filter(Boolean);
      expect(familias.length, `${m} declara ${familias.join(" + ")}`).toBeLessThanOrEqual(1);
    }
  });
});

describe("a regressão: o B4 não vazou para a família paramétrica", () => {
  it("os paramétricos continuam paramétricos — se um mudou de família, é aqui que se lê", () => {
    // Esta amarra vem ANTES das de bytes de propósito. No dia em que o `curto` for
    // re-traçado (checkpoint C), o SVG dele muda por um motivo legítimo, e sem esta
    // linha o relatório seria um diff de SHA sem explicação nenhuma.
    //
    // Ela percorre `MODELOS_PARAMETRICOS`, que é lista ESCRITA — não `MODELOS_CABELO`
    // filtrado por `massa`. Com o filtro, um paramétrico que ganhasse `massa` por
    // acidente sairia da lista e deixaria de ser conferido: o teste concordaria com
    // o defeito que ele existe para pegar.
    for (const modelo of MODELOS_PARAMETRICOS as readonly ModeloCabelo[]) {
      expect(CABELOS[modelo].massa, `${modelo} deixou de ser paramétrico`).toBeUndefined();
    }
  });

  it.each(MODELOS_PARAMETRICOS)("%s compõe byte a byte igual ao de antes do B4", (modelo) => {
    for (const animado of [false, true]) {
      conferirSelo(`${modelo}${animado ? " (animado)" : ""}`, svgDe(modelo, animado));
    }
  });

  it("a base careca continua idêntica — o teto de regressão absoluto do estilo", () => {
    const careca = svgDe();
    expect(cssDe(careca)).toBe(PARAMETRICO_CONGELADO["__careca"].css);
    expect(sha(careca)).toBe(PARAMETRICO_CONGELADO["__careca"].sha);
    // E ela continua sem pagar nada pelo slot: nem regra nova, nem classe nova.
    expect(careca).not.toContain(".kk-cabelo");
  });
});

/**
 * OS TRAÇADOS PROMOVIDOS CONTINUAM BYTE A BYTE — e o que este bloco pega é OUTRA
 * coisa que o de cima.
 *
 * Lá em cima, vermelho quer dizer *"uma regra de CSS vazou para quem não devia"*.
 * Aqui quer dizer *"a saída da **rota de arte** mudou"* — ou uma arte foi
 * redesenhada, ou o `converter()` passou a produzir outra coisa. Nos dois casos há
 * uma peça que o Doug aprovou olhando mudando de aparência sem ele olhar de novo.
 *
 * A geometria destas duas não mora em `cabelo.ts`: ela é espalhada de
 * `PECAS_DA_ARTE`, que é **gerado** por `npm run arte:pecas`. `arte:pecas --check`
 * (em `verify:arte`) pega o literal defasando do conversor; estes quatro selos
 * pegam o passo seguinte, que é o render mudando.
 */
describe("os traçados promovidos continuam byte a byte", () => {
  it("eles são traçados mesmo — `massa` presente, `pontos` ausente", () => {
    // O par da amarra de família do bloco de cima, na direção contrária. Sem ela,
    // um traçado que voltasse a ser paramétrico passaria pelos selos calado.
    for (const modelo of MODELOS_TRACADOS as readonly ModeloCabelo[]) {
      expect(CABELOS[modelo].massa, `${modelo} perdeu a massa`).toBeDefined();
      expect(CABELOS[modelo].pontos, `${modelo} virou paramétrico`).toBeUndefined();
    }
  });

  it("o catálogo sobrescreve a identidade que o gerador gravou do NOME DO ARQUIVO", () => {
    // `PECAS_DA_ARTE.entrada.id` é `"entrada"`, gravado por `arte/pecas.ts` a partir
    // de `entrada.png`. Importar o objeto inteiro poria `CABELOS.espetado.id ===
    // "entrada"` em runtime — o cast do arquivo gerado mascara isso no tipo.
    for (const modelo of MODELOS_TRACADOS as readonly ModeloCabelo[]) {
      expect(CABELOS[modelo].id, `${modelo} carrega o id do arquivo de origem`).toBe(modelo);
    }
  });

  it.each(MODELOS_TRACADOS)("%s compõe byte a byte igual ao da aprovação", (modelo) => {
    for (const animado of [false, true]) {
      conferirSelo(`${modelo}${animado ? " (animado)" : ""}`, svgDe(modelo, animado));
    }
  });
});

/**
 * OS TONAIS PROMOVIDOS — e este bloco existe porque o buraco dele foi medido.
 *
 * Quando o `chanel` migrou de `MODELOS_TRACADOS` para `MODELOS_TONAIS`, em
 * 2026-08-22, `dump-parametricos.ts` só emitia paramétricos e traçados. Os dois
 * selos dele **saíram do teste sem sair do arquivo**: ficaram no disco como texto que
 * ninguém lia, e por isso passaram despercebidos — um selo morto não reprova, ele
 * some. Foi descoberto na promoção do `moicano`, no mesmo dia, quando o segundo
 * modelo ia pelo mesmo caminho.
 *
 * A regra da rota de arte diz *"um paramétrico que mude de família não pode sumir do
 * teste em silêncio"*, e ela era cobrada só na saída — a lista de origem encolhia e
 * `completudeDasFamilias` reclamava. Não havia nada cobrando a **chegada**. Este
 * bloco é essa cobrança.
 *
 * O que um movimento aqui quer dizer é o mesmo do bloco de cima, por outra esteira:
 * a máscara de tom ou a silhueta mudaram, e quem escreve as duas é
 * `npm run arte:cabelos` a partir do PNG aprovado. `arte:cabelos --check` (em
 * `verify:arte`) pega o literal defasando da esteira; estes selos pegam o passo
 * seguinte, que é o render mudando.
 */
describe("os tonais promovidos continuam byte a byte", () => {
  it("eles são tonais mesmo — `tonal` presente, `pontos` e `massa` ausentes", () => {
    // O par da amarra de família dos dois blocos de cima. O `moicano` veio da
    // família PARAMÉTRICA (2026-08-22), então aqui a queixa cobre os dois lados:
    // voltar a ter `pontos` é desfazer a promoção dele; ganhar `massa` é confundi-lo
    // com a família traçada, cujo `d` é outro.
    for (const modelo of MODELOS_TONAIS) {
      expect(CABELOS[modelo].tonal, `${modelo} perdeu o braço tonal`).toBeDefined();
      expect(CABELOS[modelo].pontos, `${modelo} virou paramétrico`).toBeUndefined();
      expect(CABELOS[modelo].massa, `${modelo} virou traçado`).toBeUndefined();
    }
  });

  it("a máscara de tom é um CAMINHO servido à parte, nunca bytes embutidos", () => {
    // O `data:` foi a primeira versão e custava 753,0 KB de gzip num ranking de 30,
    // contra 17,6 KB com arquivo externo: o boneco composto passa da janela de
    // 32 768 B do DEFLATE e a dedução do blob morre. A trava é o campo ser um
    // caminho — e um `data:` aqui reprova antes de alguém medir gzip de novo.
    for (const modelo of MODELOS_TONAIS) {
      const arte = CABELOS[modelo].tonal?.tom.arte ?? "";
      expect(arte, `${modelo} sem máscara de tom`).not.toBe("");
      expect(arte.startsWith("/items/"), `${modelo}: a máscara não é caminho — "${arte.slice(0, 24)}…"`).toBe(true);
    }
  });

  it("o catálogo sobrescreve a identidade que o gerador gravou do NOME DO ARQUIVO", () => {
    // Mesma armadilha dos traçados: `CABELOS_DA_ARTE.moicano.id` é `"cabelo-moicano"`
    // ou o nome do arquivo, gravado pela esteira — e o cast do literal gerado
    // mascara isso no tipo.
    for (const modelo of MODELOS_TONAIS) {
      expect(CABELOS[modelo].id, `${modelo} carrega o id do arquivo de origem`).toBe(modelo);
    }
  });

  it.each(MODELOS_TONAIS)("%s compõe byte a byte igual ao da aprovação", (modelo) => {
    for (const animado of [false, true]) {
      conferirSelo(`${modelo}${animado ? " (animado)" : ""}`, svgDe(modelo, animado));
    }
  });
});

describe("a peça sobreposta é emitida DEPOIS das feições, e o cabelo tapa o rosto", () => {
  /**
   * O GATE DO DEFEITO DE 2026-08-08 — a sobrancelha aparecia POR CIMA do cabelo.
   *
   * Medido na `entrada-2` (Assimétrico): **315 dos 753 px visíveis de sobrancelha,
   * 41,8%, pintados em cima da massa**. A causa era ordem de emissão — a peça
   * sobreposta saía logo depois do contorno da cabeça, antes de olhos, sobrancelhas
   * e boca, porque a lista de camadas foi escrita quando cabelo só existia dentro do
   * clip do crânio e nunca alcançava a testa.
   *
   * **Por que ordem de string e não pixel:** medir o defeito de verdade pede render
   * (Playwright, duas passadas, classificar cor sob cada pixel) — caro demais para a
   * suíte, e é o que o script de reprodução faz. Aqui mede-se o MECANISMO: se a peça
   * sai depois das feições, o cabelo tapa; se sai antes, não tapa. A relação entre os
   * dois é determinística, porque é oclusão de SVG, não heurística.
   *
   * **A não-vacuidade é metade deste teste.** Um gate que só compara dois índices
   * passa liso no dia em que um dos dois marcadores deixar de existir — foi assim que
   * `conferirSvg` aprovou auto-trace e que `--av-cabelo` ficou congelado sem nunca ser
   * emitido. Por isso cada índice é exigido presente ANTES de serem comparados, e a
   * família paramétrica é cobrada de NÃO ter a marca, para o teste não passar por
   * medir a peça errada.
   */
  const iSobrancelha = (svg: string) => svg.indexOf(`<path class="kk-risco"`);
  /** A peça sobreposta é o `<g>` fora de clip que carrega a massa traçada. */
  const iPeca = (svg: string) => svg.search(/<path class="kk-(tinta|cabelo-m)"/);

  it.each(MODELOS_TRACADOS)("%s: a massa sai depois da sobrancelha", (modelo) => {
    const svg = svgDe(modelo);
    const s = iSobrancelha(svg);
    const p = iPeca(svg);
    expect(s, `${modelo}: nenhuma sobrancelha no SVG — o gate mediria o nada`).toBeGreaterThan(-1);
    expect(p, `${modelo}: nenhuma massa traçada no SVG — o gate mediria o nada`).toBeGreaterThan(-1);
    expect(p, `${modelo}: a massa sai ANTES da sobrancelha, e a sobrancelha vaza por cima`).toBeGreaterThan(s);
  });

  it("o paramétrico não tem peça sobreposta — e é por isso que a ordem nunca o afetou", () => {
    // O controle negativo do bloco. Se um dia um paramétrico passar a emitir massa
    // fora do clip, esta linha cai e o teste de cima passa a valer para ele também.
    for (const modelo of MODELOS_PARAMETRICOS as readonly ModeloCabelo[]) {
      expect(iPeca(svgDe(modelo)), `${modelo} passou a emitir massa fora do clip`).toBe(-1);
    }
  });
});

describe("a sobrancelha coberta pelo cabelo não é desenhada", () => {
  /**
   * O SEGUNDO GATE DO MESMO DEFEITO — e ele existe porque a ordem não bastou.
   *
   * Emitir a peça depois das feições fez o cabelo tapar o que está sob ele, mas na
   * `entrada-2` a massa cobre **97,6%** da sobrancelha esquerda e sobravam 19 px da
   * ponta. Medido em close a 4×, esse resto lia como rebarba no contorno do cabelo,
   * não como sobrancelha. O alvo é cobertura total.
   *
   * **A não-vacuidade aqui tem nome: contar `toBe(2)`, e não `toBeGreaterThan(0)`.**
   * Um gate que só exigisse "existe sobrancelha" passaria no dia em que as duas
   * sumissem por acidente — que é o modo de falha exato deste conserto, já que ele
   * REMOVE elemento. Por isso o número é exato dos dois lados: 2 para quem não é
   * coberto, 1 para a `entrada-2`. Zero reprova.
   */
  /**
   * ⚠️ O LIMIAR É LIDO DE `cabelo.ts`, NUNCA COPIADO — e esta linha nasceu de um
   * defeito real (2026-08-23).
   *
   * Este bloco trazia `0.85` escrito à mão em cinco lugares. Quando a `assimetrico`
   * derrubou `SOBRANCELHA_COBERTA` para **0.50** — decisão medida, com o docstring
   * da constante guardando os dois casos que a provaram —, o produto passou a
   * esconder a sobrancelha dela e o teste continuou cobrando 85%. As três asserções
   * abaixo reprovaram sobre um render que estava CERTO, e o número que a mensagem
   * mostrava (74,1%) era exatamente o da peça que motivou a mudança.
   *
   * Segunda cópia de régua é a classe de bug que este repositório mais persegue.
   * Importando a constante, mover o limiar volta a ser uma linha em um arquivo.
   */
  const quantasSobrancelhas = (svg: string) =>
    (svg.match(new RegExp(`<path class="kk-risco" stroke-width="${SOBRANCELHA.espessura}"`, "g")) ?? [])
      .length;

  it("cada peça emite exatamente as sobrancelhas que ela NÃO cobre", () => {
    // A conta sai da MEDIÇÃO, não de uma lista escrita à mão de quem cobre o quê:
    // uma lista envelheceria no dia em que uma arte nova cobrisse a testa, e o teste
    // continuaria verde medindo a peça errada.
    for (const modelo of MODELOS_CABELO) {
      const c = coberturaDaSobrancelha(CABELOS[modelo]);
      const cobertas =
        (c.esq >= SOBRANCELHA_COBERTA ? 1 : 0) + (c.dir >= SOBRANCELHA_COBERTA ? 1 : 0);
      expect(quantasSobrancelhas(svgDe(modelo)), `${modelo}: emissão × cobertura`).toBe(
        2 - cobertas,
      );
    }
    // A careca é o piso absoluto: sem cabelo nenhum, as duas têm de sair.
    expect(quantasSobrancelhas(svgDe(undefined))).toBe(2);
  });

  it("o catálogo tem os DOIS casos vivos — sem isso a régua acima não prova nada", () => {
    // A não-vacuidade deste bloco. A asserção de cima passaria feliz num catálogo em
    // que **ninguém** cobre (0 − 0 = 2 sempre) ou em que **todos** cobrem. Ela só
    // mede alguma coisa enquanto os dois lados existirem, e é isto que cobra isso.
    const coberturas = MODELOS_CABELO.map((m) => coberturaDaSobrancelha(CABELOS[m]));
    const comCobertura = coberturas.filter(
      (c) => c.esq >= SOBRANCELHA_COBERTA || c.dir >= SOBRANCELHA_COBERTA,
    );
    const semCobertura = coberturas.filter(
      (c) => c.esq < SOBRANCELHA_COBERTA && c.dir < SOBRANCELHA_COBERTA,
    );
    expect(comCobertura.length, "nenhuma peça cobre sobrancelha — a régua ficou vácua").toBeGreaterThan(0);
    expect(semCobertura.length, "todas as peças cobrem — a régua ficou vácua").toBeGreaterThan(0);
  });

  it("a `assimetrico` cobre a esquerda e ela some — a direita fica", () => {
    const c = coberturaDaSobrancelha(CABELOS.assimetrico);
    // O par de asserções que impede o teste de passar medindo o nada: a esquerda
    // tem de estar coberta E a direita tem de estar livre. Uma peça que cobrisse as
    // duas, ou nenhuma, cairia aqui em vez de passar calada.
    expect(c.esq, "a assimetrico deixou de cobrir a sobrancelha esquerda").toBeGreaterThan(
      SOBRANCELHA_COBERTA,
    );
    expect(c.dir, "a assimetrico passou a cobrir a direita também").toBeLessThan(
      SOBRANCELHA_COBERTA,
    );
    expect(quantasSobrancelhas(svgDe("assimetrico"))).toBe(1);
  });
});

describe("as classes do cabelo saem por família, e nenhuma regra sai à toa", () => {
  it("o paramétrico emite `.kk-cabelo-s` com fill E stroke, e nenhuma das duas novas", () => {
    const css = cssDe(svgDe(PARAMETRICO));
    expect(css).toContain(".t .kk-cabelo-s{fill:var(--av-cabelo-s);stroke:var(--av-linha)");
    expect(css).not.toContain(".kk-cabelo-m");
    expect(css).not.toContain(".kk-cabelo-l");
  });

  it("o traçado emite `.kk-cabelo-m` SEM stroke, e `.kk-cabelo-l` sem fill", () => {
    const css = cssDe(svgDe(tracado));
    expect(css).toContain(".t .kk-cabelo-m{fill:var(--av-cabelo-s)}");
    expect(css).toContain(".t .kk-cabelo-l{fill:none;stroke:var(--av-linha)");
    // A que tinha os dois papéis não sai para quem não é dela. Se saísse, o laço
    // fechado voltaria a ser traçado no perímetro inteiro pela regra antiga.
    expect(css).not.toContain(".kk-cabelo-s");
  });

  it("traçado SEM arcos não emite `.kk-cabelo-l` — regra emitida à toa custa bytes", () => {
    const semTraco: Cabelo = { id: ID_FIXTURA, nome: "chapado de traço", massa: MASSA };
    const css = cssDe(svgDe(semTraco));
    expect(css).toContain(".kk-cabelo-m");
    expect(css).not.toContain(".kk-cabelo-l");
    expect(svgDe(semTraco)).not.toContain(`d=""`);
  });
});

describe("o traço é a própria massa, no trecho apontado", () => {
  it("os comandos do arco são os MESMOS que o laço emite ali — não uma curva parecida", () => {
    // A prova de que não há duas descrições da mesma borda. O laço fechado emite um
    // `C` por trecho, na ordem; o arco [0,7] tem de ser os sete primeiros, idênticos.
    const doLaco = pathCabelo(tracado).match(/C [^C]*/g) ?? [];
    const arco = pathCabeloLinhas(tracado);
    const doArco = arco.split("M ")[1].match(/C [^C]*/g) ?? [];
    expect(doLaco.length).toBe(MASSA.length);
    expect(doArco.length).toBe(7);
    expect(doArco.join("")).toBe(doLaco.slice(0, 7).join(""));
  });

  it("o arco dá a volta pelo fim do vetor quando `último` é menor que `primeiro`", () => {
    const daVolta: Cabelo = { ...tracado, linhas: [[9, 2]] };
    const d = pathCabeloLinhas(daVolta);
    // 9→10→0→1→2 são quatro trechos, e um `M` só.
    expect((d.match(/C /g) ?? []).length).toBe(4);
    expect((d.match(/M /g) ?? []).length).toBe(1);
  });

  it("um arco por subpath, e o traço não fecha com `Z`", () => {
    // Fechar transformaria a polilinha aberta num laço, e o `stroke-linecap:round`
    // deixaria de aparecer nas pontas — que é justamente onde o traço da arte acaba.
    const d = pathCabeloLinhas(tracado);
    expect((d.match(/M /g) ?? []).length).toBe(2);
    expect(d).not.toContain("Z");
  });

  it("sem `linhas`, não há path de traço — e o compositor não emite forma vazia", () => {
    const semTraco: Cabelo = { id: ID_FIXTURA, nome: "chapado de traço", massa: MASSA };
    expect(pathCabeloLinhas(semTraco)).toBe("");
    expect(pathCabeloLinhas(PARAMETRICO)).toBe("");
  });
});

describe("a régua dos arcos", () => {
  it("mede a fração do laço que sai traçada, e não reprova a peça boa", () => {
    const r = arcosDeTraco(tracado)!;
    expect(r.falhas).toEqual([]);
    // 8 dos 11 trechos: [0,7] são sete, [9,10] é um.
    expect(r.fracao).toBeCloseTo(8 / 11, 6);
  });

  it("devolve `null` quando não há o que medir, e os dois casos são nomeados", () => {
    expect(arcosDeTraco(PARAMETRICO)).toBeNull(); // paramétrico
    expect(arcosDeTraco({ id: ID_FIXTURA, nome: "chapado", massa: MASSA })).toBeNull();
  });

  it("R10: reprova índice fora da massa — o `d` sairia com NaN e nada acusaria", () => {
    const fora: Cabelo = { ...tracado, linhas: [[0, 99]] };
    expect(arcosDeTraco(fora)!.falhas.length).toBeGreaterThan(0);
    expect(arcosDeTraco(fora)!.falhas[0]).toContain("fora da massa");
  });

  it("R10: reprova arcos sobrepostos — dois traços coincidentes são invisíveis na tela", () => {
    const sobrepostos: Cabelo = {
      ...tracado,
      linhas: [
        [0, 7],
        [5, 9],
      ],
    };
    const falhas = arcosDeTraco(sobrepostos)!.falhas;
    expect(falhas.length).toBeGreaterThan(0);
    expect(falhas[0]).toContain("mais de um arco");
  });

  it("`primeiro === último` é o laço INTEIRO, e a fração diz isso", () => {
    // É a barra preta falsa escrita de outro jeito. Ela não reprova aqui — só é
    // defeito quando a arte não tem preto no perímetro todo, e a arte não mora neste
    // arquivo. Quem tem as duas do lado é `avatar:importar`.
    const inteiro: Cabelo = { ...tracado, linhas: [[3, 3]] };
    expect(arcosDeTraco(inteiro)!.fracao).toBe(1);
    expect(arcosDeTraco(inteiro)!.falhas).toEqual([]);
  });
});

describe("a peça traçada composta", () => {
  it("passa no contrato de custom properties", () => {
    expect(conferirSvg(svgDe(tracado))).toEqual([]);
  });

  it("paga UMA forma pelo traço, e só quando há arcos", () => {
    const semTraco: Cabelo = { id: ID_FIXTURA, nome: "chapado de traço", massa: MASSA };
    // Sem clara: massa (1) + traço (1). A base careca são 19.
    expect(formas(svgDe(tracado))).toBe(19 + 2);
    expect(formas(svgDe(semTraco))).toBe(19 + 1);
  });

  it("o traço vem DEPOIS da camada clara, senão a clara o cobriria", () => {
    const comClara: Cabelo = {
      ...tracado,
      clara: [
        { t: 0.28, y: 108 },
        { t: 0.5, y: 100 },
        { t: 0.72, y: 106 },
        { t: 0.72, y: 52 },
        { t: 0.28, y: 52 },
      ],
    };
    const svg = svgDe(comClara);
    // Pelo ATRIBUTO, e não pelo nome da classe: o nome aparece antes, dentro do
    // `<style>`, e a ordem que importa é a dos elementos — quem é pintado por cima.
    const ondeEsta = (classe: string) => svg.indexOf(`class="${classe}"`);
    expect(ondeEsta("kk-cabelo-l")).toBeGreaterThan(ondeEsta("kk-cabelo"));
    expect(ondeEsta("kk-cabelo")).toBeGreaterThan(ondeEsta("kk-cabelo-m"));
  });
});
