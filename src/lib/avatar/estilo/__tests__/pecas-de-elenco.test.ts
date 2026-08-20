/**
 * AS PEÇAS DE CIMA — chapéu e rosto — e as DUAS pontas que elas precisam honrar.
 *
 * O Bloco 1 do doc 21 é encanamento com uma promessa forte: **zero mudança
 * visual**. Um campo novo em `EstadoAvatar` é exatamente o tipo de coisa que
 * quebra essa promessa sem ninguém ver — um `<g>` vazio emitido "só quando não
 * há peça", um espaço a mais na concatenação, e o teto de regressão da
 * `folha-base` deixa de ser teto de regressão para virar teto de folga.
 *
 * Mas o teste do lado oposto importa tanto quanto, e é o que este projeto já
 * pagou para aprender: um gate que só confere a ausência **passa por vacuidade**
 * se a presença nunca funcionar. A peça pode nunca ter sido emitida, e o Bloco 7
 * descobriria isso depois de desenhar quatro chapéus.
 *
 * Então: ausente não muda um byte, presente aparece — e aparece DEPOIS das
 * feições e do cabelo, que é a ordem declarada em `compor()`.
 */

import { describe, expect, it } from "vitest";
import { compor } from "../compositor";
import { conferirSvg } from "../../svgContrato";
import type { EstadoAvatar, PecaDeChapeu, PecaDeRosto, PecaSobreposta } from "../tipos";

const BASE: EstadoAvatar = {
  pele: "#E9B183",
  cabelo: "#3A2F2A",
  ns: "t",
};

/** Uma peça de mentira. Forma reconhecível, cor que não existe no boneco. */
const FALSA: PecaSobreposta = {
  id: "zz-peca-de-teste",
  nome: "Peça de teste",
  formas: [{ d: "M10 20 L30 20 L30 40 Z", cor: "#FF00FF" }],
};

describe("peças sobrepostas (chapéu e rosto)", () => {
  it("ausentes, o SVG sai byte a byte igual ao de antes do campo existir", () => {
    const semNada = compor(BASE);

    // `undefined` explícito tem de ser indistinguível do campo omitido — é o
    // caminho que `svgDoAluno` percorre em toda tela hoje, porque os dois
    // catálogos estão vazios e `pecaDeCabeca` devolve `undefined`.
    expect(compor({ ...BASE, chapeu: undefined, rosto: undefined })).toBe(semNada);

    // E uma peça sem forma nenhuma também não emite nada: lista vazia é ausência,
    // não é uma peça invisível que ocupa lugar na string.
    expect(compor({ ...BASE, chapeu: { id: "x", nome: "X", formas: [] } })).toBe(semNada);
  });

  it("presentes, aparecem — preenchimento e traço, nesta ordem", () => {
    const comChapeu = compor({ ...BASE, chapeu: FALSA });

    expect(comChapeu).not.toBe(compor(BASE));
    expect(comChapeu).toContain(`fill="#FF00FF"`);
    // O contorno é do compositor, não da peça: mesma classe do crânio e do tronco.
    expect(comChapeu).toContain(`<path class="kk-traco" d="M10 20 L30 20 L30 40 Z"/>`);
    expect(comChapeu.indexOf(`fill="#FF00FF"`)).toBeLessThan(
      comChapeu.indexOf(`<path class="kk-traco" d="M10 20 L30 20 L30 40 Z"/>`),
    );
  });

  it("entram DEPOIS das feições, e o chapéu depois do rosto", () => {
    const svg = compor({
      ...BASE,
      rosto: FALSA,
      chapeu: { ...FALSA, id: "zz-chapeu", formas: [{ d: "M50 60 L70 60 L70 80 Z", cor: "#00FF00" }] },
    });

    // A boca é a última feição emitida; tudo do elenco vem depois dela. Sem isto,
    // um óculos sairia pintado POR BAIXO do rosto — o defeito medido em 2026-08-08
    // com a sobrancelha, que custou uma investigação inteira.
    const boca = svg.lastIndexOf("kk-risco");
    const doRosto = svg.indexOf(`fill="#FF00FF"`);
    const doChapeu = svg.indexOf(`fill="#00FF00"`);

    expect(boca).toBeGreaterThan(-1);
    expect(doRosto).toBeGreaterThan(boca);
    expect(doChapeu).toBeGreaterThan(doRosto);
  });

  it("não quebram o contrato do SVG", () => {
    expect(conferirSvg(compor({ ...BASE, chapeu: FALSA, rosto: FALSA }))).toEqual([]);
  });
});

/**
 * O MODO `arte` — a peça de COR ASSADA, e as três coisas que ele precisa honrar.
 *
 * Ele nasceu em 2026-08-17, quando o passo 4 da esteira deixou de ser do traje e
 * chapéu, óculos e pet passaram a sair como `.svg` avulso. O que o distingue do modo
 * `formas` não é o formato: é **quem desenha o contorno preto**.
 *
 * A asserção que carrega o peso é a do meio, e ela é o contrário do que o modo
 * `formas` cobra. Uma peça de arte que ganhasse `kk-traco` sairia com DUAS bordas —
 * a que a artista desenhou e a que o compositor pôs por cima —, e o sintoma seria
 * uma linha grossa demais que ninguém nota a 56 px e todo mundo nota a 425. Nenhum
 * gate de forma, byte ou contrato acusa isso: só esta linha.
 *
 * A terceira existe porque a colagem tem de ser a MESMA do traje. Se as duas
 * divergissem, a peça de cabeça cairia alguns pixels fora do lugar — e `colarArte`
 * existe justamente para não haver duas contas.
 */
describe("o modo `arte` — peça de cor assada, colada por <image>", () => {
  const DE_ARTE: PecaSobreposta = {
    id: "zz-chapeu-de-arte",
    nome: "Chapéu de arte",
    arte: "/items/chapeu/zz-chapeu-de-arte.svg",
  };

  it("emite <image> apontando para o .svg da peça", () => {
    const svg = compor({ ...BASE, chapeu: DE_ARTE });

    expect(svg).not.toBe(compor(BASE));
    expect(svg).toContain(`<image href="/items/chapeu/zz-chapeu-de-arte.svg"`);
  });

  it("NÃO emite traço nenhum — a arte traz o próprio", () => {
    const semNada = compor(BASE);
    const comArte = compor({ ...BASE, chapeu: DE_ARTE });

    // O boneco já tem os seus `kk-traco` (crânio, tronco). A peça não pode somar um.
    const conta = (s: string) => (s.match(/kk-traco/g) ?? []).length;
    expect(conta(comArte)).toBe(conta(semNada));
  });

  it("cola no MESMO lugar que o traje — `colarArte` é uma conta só", () => {
    const comChapeu = compor({ ...BASE, chapeu: DE_ARTE });
    const comTraje = compor({
      ...BASE,
      traje: { id: "zz", nome: "Zz", tinta: { arte: "/items/traje/zz.svg", cor: "#123456" } },
    });

    const caixa = (s: string) =>
      s.match(/<image href="[^"]*" (x="[^"]*" y="[^"]*" width="[^"]*" height="[^"]*")/)?.[1];

    expect(caixa(comChapeu)).toBeDefined();
    expect(caixa(comChapeu)).toBe(caixa(comTraje));
  });

  it("não quebra o contrato do SVG", () => {
    expect(conferirSvg(compor({ ...BASE, chapeu: DE_ARTE, rosto: FALSA }))).toEqual([]);
  });

  it("a peça não pode declarar os dois modos — a união é a trava", () => {
    // @ts-expect-error `arte` e `formas` são mutuamente exclusivos por construção.
    // Se este erro DEIXAR de existir, a união virou interface e a trava caiu — o
    // typecheck quebra aqui, que é o jeito certo de descobrir isso.
    const ambos: PecaSobreposta = {
      id: "zz-ambos",
      nome: "Ambos",
      arte: "/items/chapeu/zz.svg",
      formas: [{ d: "M0 0 L1 0 L1 1 Z", cor: "#000000" }],
    };
    expect(ambos.id).toBe("zz-ambos");
  });
});

/**
 * `semTraco` — E AS TRÊS ASSERÇÕES QUE O IMPEDEM DE PASSAR POR VACUIDADE.
 *
 * É o mesmo perigo que o docstring do topo nomeia, um andar abaixo: um campo
 * opcional cujo caminho verdadeiro nunca é exercido está "verde" e não existe.
 * Aqui a peça de duas camadas é o caso real — a barba do Bloco 5 —, e o que
 * quebraria em silêncio é o traço voltando para o núcleo: uma linha preta de 12 u
 * atravessando o meio da peça, que nenhum gate de forma, byte ou contrato acusa.
 *
 * A terceira asserção parece pedante e não é: `false` e ausente terem caminhos
 * diferentes seria a peça mudar de aparência ao ganhar um campo que declara o
 * comportamento de sempre.
 */
describe("semTraco — a forma que vive dentro de outra", () => {
  const MISTA: PecaSobreposta = {
    id: "zz-mista",
    nome: "Mista",
    formas: [
      { d: "M0 0 L100 0 L100 100 Z", cor: "var(--av-linha)" },
      { d: "M10 10 L80 10 L80 80 Z", cor: "#5A4632", semTraco: true },
    ],
  };

  it("a forma com semTraco pinta, mas não ganha o `kk-traco`", () => {
    const svg = compor({ ...BASE, rosto: MISTA });

    expect(svg).toContain(`<path d="M10 10 L80 10 L80 80 Z" fill="#5A4632"/>`);
    expect(svg).not.toContain(`<path class="kk-traco" d="M10 10 L80 10 L80 80 Z"/>`);
  });

  it("na peça mista sobra exatamente um traço — o da forma que tem borda externa", () => {
    const svg = compor({ ...BASE, rosto: MISTA });
    const traçosDaPeca = MISTA.formas.filter(
      (f) => svg.includes(`<path class="kk-traco" d="${f.d}"/>`),
    );

    expect(traçosDaPeca).toHaveLength(MISTA.formas.filter((f) => !f.semTraco).length);
    expect(traçosDaPeca[0].d).toBe("M0 0 L100 0 L100 100 Z");

    // E a ordem de `sobrepor()` continua sendo TODO fill antes de TODO traço: o
    // filtro tira uma linha da segunda passada, não muda de passada.
    expect(svg.indexOf(`fill="#5A4632"`)).toBeLessThan(
      svg.indexOf(`<path class="kk-traco" d="M0 0 L100 0 L100 100 Z"/>`),
    );
  });

  it("`semTraco: false` é byte a byte igual ao campo ausente", () => {
    const ausente = compor({ ...BASE, rosto: FALSA });
    const explicito = compor({
      ...BASE,
      rosto: { ...FALSA, formas: FALSA.formas.map((f) => ({ ...f, semTraco: false })) },
    });

    expect(explicito).toBe(ausente);
  });
});

/**
 * `cabeloPorCima` — DE QUE LADO DO CABELO A PEÇA DE ROSTO VESTE.
 *
 * O pedido do Doug, 2026-08-19: *"a camada barba veste, depois a camada cabelo deve
 * vir e cobrir a barba (se houver o que cobrir)"*. Antes disso o slot inteiro saía
 * depois do cabelo, e a serrilha da barba cortava a curva lisa do `chanel`.
 *
 * **Por que ordem de string e não pixel** — a mesma razão que `linhas-cabelo.test.ts`
 * escreve: medir o defeito de verdade pede render, e a relação entre as duas coisas é
 * determinística, porque é oclusão de SVG e não heurística. Aqui mede-se o mecanismo.
 *
 * **A não-vacuidade é metade deste bloco**, e ela tem duas pernas: cada índice é
 * exigido presente ANTES de ser comparado, e a mesma peça sem a bandeira é medida ao
 * lado, com a desigualdade INVERTIDA. Sem a segunda perna, o bloco passaria no dia em
 * que alguém pusesse tudo sob o cabelo e a bandeira virasse enfeite.
 */
describe("cabeloPorCima — a barba veste, o cabelo cobre", () => {
  /** `chanel` é traçado, e traçado é o único que vira peça sobreposta. */
  const COM_CHANEL = { ...BASE, modeloCabelo: "chanel" as const };
  /**
   * A peça traçada sai em DUAS partes, e a barba entra no meio das duas — então o
   * marcador tem de saber qual das duas está medindo.
   *
   *   `iSilhueta` — a camada 1, a silhueta PRETA cheia. Vai ANTES da barba, para o
   *                 anel dela não virar barra preta atravessando a massa unificada;
   *   `iNucleo`   — a camada 2, o núcleo COLORIDO. Vai DEPOIS, e é ele que faz o
   *                 cabelo cobrir a barba.
   *
   * A primeira versão deste bloco media `kk-(tinta|cabelo-m)`, o mesmo marcador de
   * `linhas-cabelo.test.ts`. Ele casava com as DUAS camadas e pegava a primeira —
   * uma régua grossa demais, que dizia "a barba saiu depois do cabelo" quando ela
   * tinha saído no meio dele. O `search` de união é confortável e é onde o erro mora.
   */
  const iSilhueta = (svg: string) => svg.indexOf(`<path class="kk-tinta"`);
  const iNucleo = (svg: string) => svg.indexOf(`<path class="kk-cabelo-m"`);
  const iPeca = (svg: string) => svg.indexOf(`fill="#FF00FF"`);

  it("com a bandeira, a peça entra ANTES do cabelo INTEIRO — silhueta preta inclusive", () => {
    // O contrato inteiro numa linha: barba → silhueta preta → núcleo colorido.
    //
    // ⚠️ ESTA DESIGUALDADE JÁ ESTEVE INVERTIDA, e a inversão foi o defeito de
    // 2026-08-20. Entre 2026-08-19 e 2026-08-20 a barba entrava ENTRE a silhueta
    // preta do cabelo e o núcleo, para que o anel preto do cabelo não caísse sobre
    // ela. A premissa era que esse anel media ~18 u e lia como uma barra.
    //
    // **Medido em 2026-08-20 (`.scratch/largura-do-anel.ts`): ele mede p50 11,7 u e
    // p90 12,2 u — é o `TRACO` de 12 u do próprio desenho.** Só 205 px dos 12 733
    // (1,6%) passam de 16 u, e ficam no queixo. Não era barra: era o contorno de
    // oclusão do cabelo, na espessura de linha de todo o resto do boneco.
    //
    // Apagá-lo custou os dois defeitos que o Doug pegou a olho: o cabelo perdeu a
    // aresta sobre a barba (*"saiu o contorno preto do cabelo"*), e o núcleo escuro
    // do chanel (`--av-cabelo-s`) passou a encostar direto na massa clara da barba
    // (`--av-cabelo`) por 489 px de costura, de u x 156 a 424 (*"ainda é possível ver
    // o tom diferente que sobrou do chanel"*). A linha preta cobria a costura.
    //
    // A bandeira `cabeloPorCima` continua valendo e continua sendo o pedido dele de
    // 2026-08-19: a barba veste, o cabelo cobre. O que voltou é o cabelo cobrir
    // INTEIRO, com o contorno junto, em vez de só com as camadas coloridas.
    const svg = compor({ ...COM_CHANEL, rosto: { ...FALSA, cabeloPorCima: true } });
    const boca = svg.lastIndexOf("kk-risco");

    expect(iPeca(svg), "a peça não foi emitida — o gate mediria o nada").toBeGreaterThan(-1);
    expect(iSilhueta(svg), "não há silhueta preta — o gate mediria o nada").toBeGreaterThan(-1);
    expect(iNucleo(svg), "não há núcleo colorido — o gate mediria o nada").toBeGreaterThan(-1);
    expect(boca).toBeGreaterThan(-1);

    expect(iPeca(svg)).toBeGreaterThan(boca);
    expect(iPeca(svg), "a silhueta preta do cabelo saiu ANTES da barba").toBeLessThan(
      iSilhueta(svg),
    );
    expect(iPeca(svg), "o núcleo do cabelo saiu ANTES da barba").toBeLessThan(iNucleo(svg));
  });

  it("SEM a bandeira, a MESMA peça sai depois das DUAS — as desigualdades invertem", () => {
    // O controle negativo do bloco, e é ele que prova que a bandeira é a causa. Sem
    // ele, o teste de cima passaria com um compositor que ignorasse o campo e pusesse
    // todo rosto sob o cabelo.
    const svg = compor({ ...COM_CHANEL, rosto: FALSA });

    expect(iPeca(svg)).toBeGreaterThan(-1);
    expect(iSilhueta(svg)).toBeGreaterThan(-1);
    expect(iNucleo(svg)).toBeGreaterThan(-1);
    expect(iPeca(svg)).toBeGreaterThan(iSilhueta(svg));
    expect(iPeca(svg)).toBeGreaterThan(iNucleo(svg));
  });

  it("a silhueta preta e o núcleo do cabelo saem COLADOS — byte a byte", () => {
    // A condição que mantém os 11 selos de `parametrico-congelado.ts` de pé: nada
    // entra entre a silhueta preta do cabelo e o núcleo colorido, nem com peça de
    // rosto nem sem. Foi escrita em 2026-08-19, quando a peça saía partida em
    // `{ fundo, frente }` e a barba entrava no meio; a partição caiu em 2026-08-20
    // (ver o teste da ordem, acima), e a linha fica porque é ela que reprova se
    // alguém tentar de novo — um caractere a mais ali mata os 11 selos de uma vez,
    // com a causa longe daqui.
    const svg = compor(COM_CHANEL);
    expect(svg.indexOf(`<path class="kk-cabelo-m"`)).toBe(
      svg.indexOf(`<path class="kk-tinta"`) +
        svg.slice(svg.indexOf(`<path class="kk-tinta"`)).indexOf("/>") +
        2,
    );
  });

  it("a peça é emitida UMA vez só, com bandeira ou sem", () => {
    // A partição é sobre UMA peça, não sobre uma lista: escrever a emissão nas duas
    // pontas sem o filtro desenharia a barba duas vezes, uma exatamente sobre a
    // outra. A tela ficaria idêntica, e o custo — dois `<path>` a mais, × 30 bonecos
    // no ranking — só apareceria no orçamento de formas.
    const dosDoisJeitos: PecaDeRosto[] = [FALSA, { ...FALSA, cabeloPorCima: true }];
    for (const rosto of dosDoisJeitos)
      for (const modeloCabelo of ["chanel", "coque"] as const)
        expect(
          (compor({ ...BASE, modeloCabelo, rosto }).match(/fill="#FF00FF"/g) ?? []).length,
          `${rosto.cabeloPorCima ? "com" : "sem"} bandeira × ${modeloCabelo}`,
        ).toBe(1);
  });

  it("sem cabelo nenhum, a bandeira não muda um byte", () => {
    // Careca: não há massa para cobrir, então as duas passadas dão a mesma string. É
    // o que mantém a ausência de cabelo sendo o caso byte a byte de sempre.
    expect(compor({ ...BASE, rosto: { ...FALSA, cabeloPorCima: true } })).toBe(
      compor({ ...BASE, rosto: FALSA }),
    );
  });

  it("com cabelo PARAMÉTRICO a bandeira é inerte, e isso é limitação declarada", () => {
    // O paramétrico mora dentro do clip do crânio e sai muito antes das feições, então
    // a peça de rosto continua por cima dele com bandeira ou sem. Não é defeito hoje —
    // nenhum paramétrico desce ao queixo —, mas está escrito em `PecaDeRosto` como
    // limitação, e este teste é o que impede que alguém "conserte" por engano.
    const comFlag = compor({ ...BASE, modeloCabelo: "coque", rosto: { ...FALSA, cabeloPorCima: true } });
    expect(iNucleo(comFlag), "o `coque` passou a emitir massa fora do clip").toBe(-1);
    expect(comFlag).toBe(compor({ ...BASE, modeloCabelo: "coque", rosto: FALSA }));
  });

  it("o CHAPÉU não participa da partição — ele continua sendo o último", () => {
    const svg = compor({
      ...COM_CHANEL,
      rosto: { ...FALSA, cabeloPorCima: true },
      chapeu: { ...FALSA, id: "zz-chapeu", formas: [{ d: "M50 60 L70 60 L70 80 Z", cor: "#00FF00" }] },
    });
    const doChapeu = svg.indexOf(`fill="#00FF00"`);

    expect(doChapeu).toBeGreaterThan(-1);
    expect(iPeca(svg)).toBeLessThan(iNucleo(svg));
    expect(doChapeu).toBeGreaterThan(iNucleo(svg));
  });

  it("o traço VIAJA junto com o preenchimento, e não fica para trás", () => {
    // `sobrepor()` emite fill e traço na MESMA chamada, então partir por peça leva os
    // dois juntos. Se alguém um dia juntar as passadas de traço das duas pontas "para
    // economizar", o contorno da barba volta para cima do cabelo e só isto acusa.
    const svg = compor({ ...COM_CHANEL, rosto: { ...FALSA, cabeloPorCima: true } });
    const traco = svg.indexOf(`<path class="kk-traco" d="M10 20 L30 20 L30 40 Z"/>`);

    expect(traco).toBeGreaterThan(-1);
    expect(traco).toBeLessThan(iNucleo(svg));
  });

  it("um chapéu que tente escolher lado NÃO COMPILA — a trava é do tipo", () => {
    // O par do `@ts-expect-error` da união `formas`/`arte`, e existe pelo mesmo motivo:
    // `CHAPEUS` está vazio, então um teste que iterasse o catálogo não asseguraria
    // nada. Aqui a trava vale sem haver peça — e se alguém tirar o `never` de
    // `PecaDeChapeu`, este `@ts-expect-error` fica sem erro para consumir e o
    // `npm run typecheck` quebra. Mecanismo em vez de disciplina.
    // @ts-expect-error o chapéu é sempre o último; ele não escolhe lado do cabelo.
    const comFlag: PecaDeChapeu = { ...FALSA, cabeloPorCima: true };
    expect(comFlag.id).toBe(FALSA.id);
  });
});
