/**
 * A PRIMEIRA PEÇA DE ARTE DESTE PROJETO A VIRAR PEÇA DE CATÁLOGO — e as quatro
 * decisões que ela carrega, presas ao SVG emitido em vez de ao docstring.
 *
 * `rostos-da-arte.ts` é GERADO, e `arte:rostos --check` já garante que ele não
 * defase da esteira. O que o `--check` **não** garante é que a esteira esteja
 * produzindo o que foi decidido: ele compara o arquivo com o gerador, e os dois
 * mudariam juntos se alguém trocasse uma cor ou tirasse um `semTraco`. Este
 * arquivo é o outro lado — ele prende as decisões, não a esteira.
 *
 * É o mesmo papel que `parametrico-congelado.ts` faz pelo cabelo e o mesmo motivo
 * de `rosto-cor.test.ts` existir: uma disciplina documentada em prosa, que nada
 * confere, é a família de defeito que este projeto mais pagou para aprender.
 */

import { describe, expect, it } from "vitest";

import { CATALOGO, ROSTOS } from "../../catalogo";
import { conferirSvg } from "../../svgContrato";
import { compor } from "../compositor";
import { ROSTOS_DA_ARTE, TOTAL_ROSTOS_DA_ARTE } from "../rostos-da-arte";
import { PELE } from "../../palette";

const SLUG = "rosto-barba-cheia";

describe("o slot `rosto` deixou de ser vazio", () => {
  it("a peça está no registro, e `ROSTOS` a espalha", () => {
    expect(ROSTOS_DA_ARTE[SLUG]).toBeDefined();
    expect(ROSTOS[SLUG]).toBe(ROSTOS_DA_ARTE[SLUG]);
    expect(TOTAL_ROSTOS_DA_ARTE).toBe(Object.keys(ROSTOS_DA_ARTE).length);
  });

  it("`CATALOGO.rosto` DERIVA do registro — não é uma segunda lista", () => {
    // Uma lista escrita à mão aqui é a semente exata do que matou a v2: 8
    // uniformes semeados no banco, 0 renderáveis. Ver o topo de `catalogo.ts`.
    expect(CATALOGO.rosto).toEqual(Object.keys(ROSTOS));
  });

  it("o `id` da peça é o próprio slug — a chave que o banco guarda", () => {
    for (const [slug, peca] of Object.entries(ROSTOS_DA_ARTE)) expect(peca.id).toBe(slug);
  });
});

describe("as duas formas, e as decisões que cada uma carrega", () => {
  const peca = ROSTOS_DA_ARTE[SLUG];

  it("são duas: a silhueta preta e o miolo que recolore", () => {
    expect(peca.formas).toHaveLength(2);
    expect(peca.arte).toBeUndefined(); // o outro braço da união
  });

  it("a silhueta pinta em `var(--av-linha)`", () => {
    expect(peca.formas![0].cor).toBe("var(--av-linha)");
  });

  it("o miolo pinta em `var(--av-cabelo)` COM A RESERVA DECLARADA", () => {
    // O ponto do teste, e ele vale um parágrafo. `--av-cabelo` só é emitido quando
    // há `modeloCabelo` (`compositor.ts`, o bloco das custom properties). Num boneco
    // CARECA a variável não existe, e um `fill:var(--av-cabelo)` sem reserva cai no
    // valor inicial do SVG — PRETO, que é a cor da própria silhueta. A barba viraria
    // uma mancha sólida, e nenhuma régua desta etapa acusaria: elas medem forma.
    //
    // `#262626` é a reserva que o Doug julgou na folha recolorida de 2026-08-19
    // ("está ótimo agora"), depois de pedir "a cor reserva será preta com tons de
    // preto mais fraco". NÃO é a `#5A4632` da barba paramétrica de `rosto.ts` — lá a
    // reserva é a cor modal do cabelo, e é outra decisão, de outro dia.
    expect(peca.formas![1].cor).toBe("var(--av-cabelo, #262626)");
  });

  it("as duas declaram `semTraco` — o contorno é o PINTADO, não o `kk-traco`", () => {
    // A decisão que fechou o achado G29. Medido em `.scratch/perfil-boca.ts`: com o
    // `kk-traco` de 12 u do compositor, a barba e a boca FUNDEM a 56 e a 32 px; com
    // o contorno de 5,2 u que o gerador pintou, sobra 1 px de pele entre as duas.
    for (const f of peca.formas!) expect(f.semTraco).toBe(true);
  });

  it("declara `cabeloPorCima` — é PELO, e pelo veste sob o cabelo", () => {
    // A DIRETRIZ DO EMPILHAMENTO, não uma preferência sobre esta peça. Ela está
    // escrita na linha `rosto-sob-cabelo` de `camadas.ts`, e a pergunta que decide é:
    // **a peça nasce da cabeça, ou é posta nela?**
    //
    //   nasce  → PELO (barba, bigode, costeleta): o cabelo cai sobre ela, como na
    //            vida. `cabeloPorCima: true`;
    //   posta  → ACESSÓRIO (óculos): vestido por último, e não pode depender de qual
    //            franja está embaixo (doc 21 §2c). Ausente.
    //
    // Decidida pelo Doug em 2026-08-20, olhando os quatro casos lado a lado em
    // `.scratch/estilo/quatro-casos.png`: com a barba POR CIMA ela e o cabelo são a
    // mesma cor e formam uma massa contínua em volta do rosto — lê como cabeça
    // peluda, não como bob com barba. Com ela SOB, o bob mantém a silhueta e a barba
    // que sobra fica contra a PELE, que é onde ela lê.
    //
    // **O custo, medido e aceito:** sob o `chanel` sobram 56,8% da peça e sob o
    // `assimetrico` 75,3% (`.scratch/estilo/quanto-da-barba-sobra.ts`). O que some é
    // justamente a parte que ficaria encostada no cabelo — mesma cor, sem contraste,
    // ilegível de qualquer jeito. A colisão que resta é a mecha da bochecha do
    // `chanel`: UMA peça, UMA região, medida e nomeada.
    //
    // ⚠️ **Inerte em 2 dos 5 cabelos.** `coque` e `moicano` são paramétricos e moram
    // dentro do clip do crânio, emitidos muito antes das feições: a barba fica por
    // cima deles com bandeira ou sem. Não é defeito hoje — nenhum dos dois desce ao
    // queixo —, é limitação declarada em `PecaDeRosto` e em `camadas.ts`.
    expect(peca.cabeloPorCima).toBe(true);
  });
});

describe("o SVG que o compositor emite com ela", () => {
  const semPeca = compor({ pele: PELE[0], cabelo: "#3A2F2A", ns: "t" });
  const comPeca = compor({ pele: PELE[0], cabelo: "#3A2F2A", ns: "t", rosto: ROSTOS[SLUG] });

  it("NENHUM `kk-traco` a mais — as duas formas são `semTraco`", () => {
    const conta = (s: string) => (s.match(/class="kk-traco"/g) ?? []).length;
    expect(conta(comPeca)).toBe(conta(semPeca));
  });

  it("os dois `d` aparecem, e depois das feições", () => {
    for (const f of ROSTOS[SLUG].formas!) expect(comPeca).toContain(`d="${f.d}"`);
    // A boca é a última feição emitida; a peça de rosto vem depois dela.
    expect(comPeca.lastIndexOf("kk-risco")).toBeLessThan(
      comPeca.indexOf(`d="${ROSTOS[SLUG].formas![0].d}"`),
    );
  });

  it("não quebra o contrato do SVG", () => {
    expect(conferirSvg(comPeca)).toEqual([]);
  });

  it("a peça AUSENTE não muda um byte — o teto de regressão continua sendo teto", () => {
    expect(compor({ pele: PELE[0], cabelo: "#3A2F2A", ns: "t", rosto: undefined })).toBe(semPeca);
  });
});

describe("os `d` traçados — o que a conversão px → unidade pressupõe", () => {
  it("só comandos ABSOLUTOS M/L/C/Z", () => {
    // `paraUnidades` (barba-para-formas.ts) transforma pares (x, y). Um `h`/`v`
    // relativo que escapasse sairia deslocado, e o defeito só apareceria na tela.
    for (const f of ROSTOS_DA_ARTE[SLUG].formas!)
      expect(f.d.match(/[A-Za-z]/g)?.filter((c) => !"MLCZ".includes(c)) ?? []).toEqual([]);
  });

  it("todo subcaminho VOLTA ao ponto de partida, e por isso o `Z` não faz falta", () => {
    // O `potrace` não emite `Z`: ele fecha a curva GEOMETRICAMENTE, e o último ponto
    // de cada subcaminho é o mesmo do `M`. É mais forte que ter `Z` — com `Z` o
    // renderizador fecharia por uma corda reta, e uma corda de 60 u atravessando a
    // peça é exatamente o defeito que este teste procuraria. Aqui a distância é zero.
    for (const f of ROSTOS_DA_ARTE[SLUG].formas!)
      for (const sub of f.d.split("M").slice(1)) {
        const n = (sub.match(/-?\d*\.?\d+/g) ?? []).map(Number);
        expect(Math.hypot(n[0] - n[n.length - 2], n[1] - n[n.length - 1])).toBe(0);
      }
  });

  it("o selo de bytes — registro, não teto que veta", () => {
    // O doc 19 §6 é explícito: `ORCAMENTO_COMPOSTO` é autoimposto e **não veta arte
    // aprovada**. O número existe para que uma mudança de esteira que dobre o peso
    // apareça no `git diff` em vez de passar. Se ele mudar sem ninguém ter mexido na
    // arte, a mudança veio do traçador e vale para todas as peças — isso é achado.
    const bytes = ROSTOS_DA_ARTE[SLUG].formas!.reduce((a, f) => a + f.d.length, 0);
    expect(bytes).toBe(13674);
  });
});
