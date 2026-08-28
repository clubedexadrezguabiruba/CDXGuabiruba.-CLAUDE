/**
 * O VÃO DA LENTE — furo cercado que contém FEIÇÃO fica aberto, e só ele.
 *
 * ---------------------------------------------------------------------------
 * O DEFEITO QUE ESTE ARQUIVO PRENDE, E ELE TEM DATA E NÚMERO
 * ---------------------------------------------------------------------------
 *
 * `taparFurosCercados` tapa todo vão que não alcança a borda do canvas, porque *peça
 * é figurinha, opaca por dentro*. Para toca, aba e túnica isso é a lei. Para o
 * ÓCULOS é o contrário: a peça é definida pelos dois vãos que ela cerca, e o que
 * aparece por eles tem de ser a pele que o ALUNO escolheu.
 *
 * Medido no primeiro óculos, em 2026-08-27:
 *
 * | | com a regra | sem ela |
 * |---|---|---|
 * | máscara | 31 535 px | 53 478 px |
 * | furos tapados | 1 095 px | **23 038 px** |
 * | cor dominante | `#040000` (o contorno) | **`#E6AB7A` — PELE** |
 * | anel em volta dos olhos, opaco | 21,6% | **98,1%** |
 *
 * Sem a regra a armação chega ao produto com um retrato da base de edição dentro de
 * cada aro: a pele errada e os olhos congelados do render que foi ao gerador. E o
 * defeito é **invisível na página**, porque o fundo dela é o mesmo bege — é o mesmo
 * modo de falha da `chapeu-toca-de-cozinha`, do outro lado.
 *
 * ---------------------------------------------------------------------------
 * OS DOIS CONTROLES, E CADA UM MOVE UMA VARIÁVEL SÓ
 * ---------------------------------------------------------------------------
 *
 * Régua nova entra com controle negativo (amarra nº 2 do doc 19 §5), e aqui são dois
 * porque há duas maneiras de esta regra estar errada:
 *
 *  1. **ela não faz nada** — o mesmo anel, no mesmo lugar, com e sem `janela`. Se os
 *     dois derem igual, o parâmetro é decorativo;
 *  2. **ela faz tudo** — dois anéis IGUAIS, um sobre o olho e outro sobre a têmpora,
 *     os dois com `janela`. Se os dois ficarem abertos, a regra virou um tapa-nada e
 *     a peça deixa de ser figurinha em todo lugar.
 *
 * O anel é só a PAREDE: o interior fica com a base intacta, então ele não entra na
 * máscara (diferença 0) e vira furo cercado. É o mesmo mecanismo do óculos de
 * verdade, onde o vão da lente é a pele e o olho que a artista não pintou por cima.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import sharp from "sharp";

import { LADO, PASTA, PNG_BASE, noCampoDoOculos, noVaoDaLente, paraPx, paraUnidade } from "../base";
import { CAIXA_CABECA } from "../../../../src/lib/avatar/estilo/geometria";
import { NOMES_OCULOS } from "../promovidas";
import { extrairPorCampo } from "../extrair";
import { janelasAbertas, taparFurosCercados } from "../peca-de-arte";
import { OCULOS, VAOS_DECLARADOS } from "../oculos";
import { OLHO_CX_ESQ, OLHO_CY_ESQ } from "../../../../src/lib/avatar/estilo/geometria";

/** O lado do anel e a espessura da parede, em px do canvas de edição. */
const LADO_ANEL = 80;
const PAREDE = 10;
/** O miolo — o que tem de ficar aberto quando há feição dentro. */
const MIOLO = (LADO_ANEL - 2 * PAREDE) ** 2;

/** O azul instrumental do slot: difere do que estiver embaixo por 200 níveis. */
const PAREDE_COR = [0x00, 0x00, 0xc8, 0xff];

/**
 * SOBRE O OLHO — o anel cerca a cápsula do olho esquerdo, como o aro do óculos faz.
 * O miolo de 60 × 60 px pega o meio da cápsula (45,6 × 99,6 px), que é tudo o que a
 * regra precisa: ela pergunta se ALGUM pixel do furo é vão de lente.
 */
const SOBRE_O_OLHO = paraPx(OLHO_CX_ESQ, OLHO_CY_ESQ);

/**
 * SOBRE A TÊMPORA — o mesmo anel, sem feição nenhuma dentro. É o braço que impede
 * esta regra de virar um tapa-nada.
 *
 * u (73,3 · 131,7): dentro do campo do óculos nos dois eixos, longe dos dois olhos
 * (x 212,5 e 367,5) e muito acima da boca (y 298,8).
 */
const SOBRE_A_TEMPORA = paraPx(73.3, 131.7);

function parede(): Buffer {
  const b = Buffer.alloc(LADO_ANEL * LADO_ANEL * 4); // alfa 0 no miolo — a base fica
  for (let y = 0; y < LADO_ANEL; y++)
    for (let x = 0; x < LADO_ANEL; x++) {
      const naParede =
        x < PAREDE || x >= LADO_ANEL - PAREDE || y < PAREDE || y >= LADO_ANEL - PAREDE;
      if (!naParede) continue;
      const i = (y * LADO_ANEL + x) * 4;
      for (let c = 0; c < 4; c++) b[i + c] = PAREDE_COR[c];
    }
  return b;
}

const pintar = (destino: string, centro: { x: number; y: number }) =>
  sharp(PNG_BASE)
    .composite([
      {
        input: parede(),
        raw: { width: LADO_ANEL, height: LADO_ANEL, channels: 4 },
        left: Math.round(centro.x - LADO_ANEL / 2),
        top: Math.round(centro.y - LADO_ANEL / 2),
      },
    ])
    .toFile(destino);

const emUnidades = (p: (x: number, y: number) => boolean) => (i: number) => {
  const u = paraUnidade(i % LADO, Math.floor(i / LADO));
  return p(u.x, u.y);
};
const noCampo = emUnidades(noCampoDoOculos);
const janela = emUnidades(noVaoDaLente);

describe("o vão da lente: furo com feição dentro fica aberto", () => {
  let tmp: string;
  let noOlho: string;
  let naTempora: string;

  beforeAll(async () => {
    tmp = mkdtempSync(join(tmpdir(), "vao-da-lente-"));
    noOlho = join(tmp, "oculos-zz-olho.png");
    naTempora = join(tmp, "oculos-zz-tempora.png");
    await pintar(noOlho, SOBRE_O_OLHO);
    await pintar(naTempora, SOBRE_A_TEMPORA);
  }, 60_000);

  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  it(
    "o miolo do anel VIRA furo cercado — sem isto os dois testes abaixo passam por vacuidade",
    { timeout: 60_000 },
    async () => {
      const e = await extrairPorCampo(noOlho, noCampoDoOculos);
      expect(janelasAbertas(e.mascara, LADO, LADO)).toBeGreaterThanOrEqual(1);
    },
  );

  it("COM `janela`, o furo sobre o OLHO fica aberto", { timeout: 60_000 }, async () => {
    const e = await extrairPorCampo(noOlho, noCampoDoOculos);
    const tapados = taparFurosCercados(e.mascara, LADO, LADO, noCampo, janela);

    expect(tapados).toBe(0);
    expect(janelasAbertas(e.mascara, LADO, LADO)).toBe(1);
  });

  it(
    "CONTROLE 1 — o MESMO anel, SEM `janela`: o furo é tapado",
    { timeout: 60_000 },
    async () => {
      // Move uma variável só: o parâmetro. Se este braço desse 0 tapados, `janela`
      // seria decorativa e o teste acima estaria medindo o comportamento de sempre.
      const e = await extrairPorCampo(noOlho, noCampoDoOculos);
      const tapados = taparFurosCercados(e.mascara, LADO, LADO, noCampo);

      expect(tapados).toBeGreaterThan(MIOLO * 0.9);
      expect(janelasAbertas(e.mascara, LADO, LADO)).toBe(0);
    },
  );

  it(
    "CONTROLE 2 — o mesmo anel na TÊMPORA, COM `janela`: o furo é tapado",
    { timeout: 60_000 },
    async () => {
      // Move a outra variável: o lugar. É este braço que impede a regra de virar um
      // tapa-nada — sem feição dentro, a peça continua sendo figurinha opaca.
      const e = await extrairPorCampo(naTempora, noCampoDoOculos);
      const tapados = taparFurosCercados(e.mascara, LADO, LADO, noCampo, janela);

      expect(tapados).toBeGreaterThan(MIOLO * 0.9);
      expect(janelasAbertas(e.mascara, LADO, LADO)).toBe(0);
    },
  );

  /**
   * O PISO DO CAMPO DESCE ABAIXO DO QUEIXO, e esta é a cobaia dele.
   *
   * `noCampoDoOculos` parava na base da CABEÇA até 2026-08-27, e o Doug apontou o que
   * isso cortava: *"a corrente que desce do aro… eu quero que eles apareçam."* Óculos
   * de leitura têm corrente, e corrente desce.
   *
   * A arte que fundou a decisão foi apagada — ela era a terceira do lote e o Doug a
   * substituiu (*"aqui entrou, entrou no lugar"*). **A cobaia mudou de peça, não
   * sumiu:** o enfeite de contas da `duplo-art-nouveau` desce 950 px abaixo do queixo,
   * e é ele que esta asserção prende. Sem ela, alguém devolveria o piso a
   * `CAIXA_CABECA.y1` e nenhum gate acusaria.
   *
   * A régua que separa peça de ruído NÃO é a altura, é a conectividade — mas isso
   * `extrairPorCampo` já faz (descarta componente < 5% da maior). O que se prende aqui
   * é só o piso.
   */
  it("o campo desce ABAIXO do queixo — a `duplo-art-nouveau` é a cobaia", async () => {
    const abaixo = [
      { x: 110, y: CAIXA_CABECA.y1 + 20 },
      { x: 110, y: CAIXA_CABECA.y1 + 30 },
    ];
    for (const p of abaixo)
      expect(noCampoDoOculos(p.x, p.y), `u (${p.x} · ${p.y}) devia estar no campo`).toBe(true);

    // E o CONTROLE: abaixo do piso do TRAJE continua fora. Sem este braço, um campo
    // sem piso nenhum passaria — e a peça engoliria a sombra do chão.
    expect(noCampoDoOculos(110, 700)).toBe(false);
  });

  // O CASO REAL, e ele varre a LISTA em vez de um nome. Os slugs do slot mudaram uma
  // vez (de `oculos-1..5` para os nomes que o Doug deu), e um teste que cita um nome
  // de arquivo morre no primeiro `mv`. Foi o que aconteceu em 2026-08-27.
  it.each(Object.keys(NOMES_OCULOS))(
    "%s sai com uma janela por lente, mais os vãos que a PEÇA declarar",
    { timeout: 120_000 },
    async (arquivo) => {
      // Zero aqui é peça CEGA: os vãos dos aros teriam sido tapados com a pele e os
      // olhos da base de edição, e o aluno veria a pele errada dentro das lentes.
      const e = await extrairPorCampo(`${PASTA}/${arquivo}.png`, noCampoDoOculos);

      // ⚠️ **O `janela` DA ESTEIRA, e não `noVaoDaLente`.** Até 2026-08-28 esta linha
      // montava o próprio predicado a partir da função de base — e no dia em que o
      // `aviator` ganhou vão declarado por PEÇA, o teste teria continuado verde
      // medindo um predicado que o produto não usa mais. Verde por vacuidade,
      // exatamente o padrão que este repositório já pagou cinco vezes.
      taparFurosCercados(e.mascara, LADO, LADO, noCampo, (i) => {
        const u = paraUnidade(i % LADO, Math.floor(i / LADO));
        return OCULOS.janela!(u.x, u.y, arquivo);
      });

      // DUAS pelas lentes, mais uma por vão que a peça declara. A conta sai de
      // `VAOS_DECLARADOS`, e não de um número escrito aqui: declarar vão novo sem
      // ele aparecer no render passaria a reprovar sozinho.
      const declarados = (VAOS_DECLARADOS[arquivo] ?? []).length;
      expect(janelasAbertas(e.mascara, LADO, LADO)).toBe(2 + declarados);
    },
  );

  /**
   * O CONTROLE DO VÃO DECLARADO: sem a declaração, ele fecha.
   *
   * Sem este braço, a asserção acima passaria se `VAOS_DECLARADOS` fosse decorativo e
   * o vão do `aviator` estivesse aberto por outro motivo qualquer.
   */
  it("o vão declarado do `aviator` fecha quando a declaração sai", { timeout: 120_000 }, async () => {
    const alvo = Object.keys(VAOS_DECLARADOS)[0];
    expect(alvo, "nenhum vão declarado — este controle ficou sem cobaia").toBeTruthy();

    const e = await extrairPorCampo(`${PASTA}/${alvo}.png`, noCampoDoOculos);
    // O predicado da esteira MENOS a declaração — `noVaoDaLente` puro.
    taparFurosCercados(e.mascara, LADO, LADO, noCampo, janela);
    expect(
      janelasAbertas(e.mascara, LADO, LADO),
      `${alvo}: sem a declaração o vão continuou aberto — quem o abre não é VAOS_DECLARADOS`,
    ).toBe(2);
  });
});
