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
import { MODELOS_CABELO, MODELOS_PARAMETRICOS } from "../cabelo";
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
    expect(comChapeu).toContain(`<path class="kk-traco" fill-rule="evenodd" d="M10 20 L30 20 L30 40 Z"/>`);
    expect(comChapeu.indexOf(`fill="#FF00FF"`)).toBeLessThan(
      comChapeu.indexOf(`<path class="kk-traco" fill-rule="evenodd" d="M10 20 L30 20 L30 40 Z"/>`),
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

    expect(svg).toContain(`<path d="M10 10 L80 10 L80 80 Z" fill-rule="evenodd" fill="#5A4632"/>`);
    expect(svg).not.toContain(`<path class="kk-traco" fill-rule="evenodd" d="M10 10 L80 10 L80 80 Z"/>`);
  });

  it("na peça mista sobra exatamente um traço — o da forma que tem borda externa", () => {
    const svg = compor({ ...BASE, rosto: MISTA });
    const traçosDaPeca = MISTA.formas.filter(
      (f) => svg.includes(`<path class="kk-traco" fill-rule="evenodd" d="${f.d}"/>`),
    );

    expect(traçosDaPeca).toHaveLength(MISTA.formas.filter((f) => !f.semTraco).length);
    expect(traçosDaPeca[0].d).toBe("M0 0 L100 0 L100 100 Z");

    // E a ordem de `sobrepor()` continua sendo TODO fill antes de TODO traço: o
    // filtro tira uma linha da segunda passada, não muda de passada.
    expect(svg.indexOf(`fill="#5A4632"`)).toBeLessThan(
      svg.indexOf(`<path class="kk-traco" fill-rule="evenodd" d="M0 0 L100 0 L100 100 Z"/>`),
    );
  });

  /**
   * O BURACO DA PEÇA SOBREVIVE — e sem esta linha a barba APAGA A BOCA.
   *
   * O `d` de uma peça `formas` vem do potrace, que declara a regra na própria saída:
   * `<path stroke="none" fill="black" fill-rule="evenodd"/>`. A esteira extrai só o
   * `d`, então quem reemite a regra é `sobrepor()`.
   *
   * Sem ela o SVG cai no `nonzero`, o padrão — e `nonzero` **preenche os buracos**.
   * Numa barba que CERCA a boca (bigode em ferradura mais queixo) a boca é um buraco
   * no laço e some inteira. Medido em 2026-08-20, no render:
   *
   *   peça                traço da boca preto     pele em volta
   *   antes (nonzero)              0%                  0%
   *   depois (evenodd)            88%              85 a 93%
   *
   * **O defeito ficou latente até existir um bigode:** num laço SEM buraco as duas
   * regras desenham igual, e por isso a `cheia` e a `cavanhaque` saem byte a byte
   * iguais com a linha e sem ela. O Doug viu na folha antes de qualquer régua.
   */
  it("o buraco da peça sobrevive — a regra do potrace é reemitida", () => {
    // Um anel: quadrado externo mais quadrado interno, os dois no MESMO sentido.
    // Sob `nonzero` isso pinta um bloco cheio; sob `evenodd`, um anel com buraco.
    const ANEL: PecaDeRosto = {
      id: "zz-anel",
      nome: "Anel de teste",
      formas: [
        { d: "M0 0 L100 0 L100 100 L0 100 Z M30 30 L70 30 L70 70 L30 70 Z", cor: "#5A4632", semTraco: true },
      ],
    };
    const svg = compor({ ...BASE, rosto: ANEL });

    // A ponta que falha ANTES: sem a regra, o `<path>` sai sem ela e o buraco fecha.
    expect(svg).toContain(`fill-rule="evenodd"`);
    expect(svg).toContain(
      `<path d="M0 0 L100 0 L100 100 L0 100 Z M30 30 L70 30 L70 70 L30 70 Z" fill-rule="evenodd" fill="#5A4632"/>`,
    );

    // R10, e sem ela a asserção acima passaria por vacuidade: TODA forma de peça
    // sobreposta carrega a regra, não só a primeira.
    const paths = svg.match(/<path [^>]*d="M0 0 L100 0[^"]*"[^>]*>/g) ?? [];
    expect(paths.length).toBeGreaterThan(0);
    for (const t of paths) expect(t).toContain(`fill-rule="evenodd"`);
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
  /**
   * O ELENCO É UMA PEÇA **TRAÇADA**, e a escolha deixou de ser livre em 2026-08-22.
   *
   * Este bloco mede a partição em DUAS camadas — silhueta preta (`kk-tinta`) e núcleo
   * colorido (`kk-cabelo-m`) —, e ela é do braço TRANSCRITO da família traçada. O
   * `chanel` era esse elenco e virou TONAL na promoção daquele dia: a tonal sai por
   * `sobrepor()` em duas passadas sem classe nenhuma, então os dois marcadores
   * passariam a valer −1 e o bloco inteiro mediria o nada.
   *
   * `assimetrico` é o que sobrou com as duas camadas (o `espetado` é o braço
   * SINTETIZADO e não tem `kk-tinta`). Quando ele também for refeito, este bloco
   * troca de elenco outra vez — ou morre junto com a família, no Bloco G do plano.
   *
   * ⚠️ **A ordem da peça tonal não fica sem gate:** quem a mede é
   * `pilha-de-camadas.test.ts`, que tem um elenco tonal sintético e cobra o mesmo
   * contrato (`sob` × `sobre`) nas três famílias.
   */
  // A peça de referência dos testes que ainda precisam de UMA: a `assimetrico`, que
  // é TONAL — a técnica definitiva. O nome antigo desta constante era `COM_CABELO`,
  // e ele mentia desde a promoção dela.
  const COM_CABELO = { ...BASE, modeloCabelo: "assimetrico" as const };
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
  const iPeca = (svg: string) => svg.indexOf(`fill="#FF00FF"`);

  /**
   * ONDE O CABELO É DESENHADO — e o marcador atravessa as TÉCNICAS, de propósito.
   *
   * ⚠️ ESTE BLOCO MEDIA `kk-tinta` + `kk-cabelo-m` E QUEBROU EM 2026-08-23. Ele
   * estava ancorado em `assimetrico`, chamando-a de "peça traçada", e ela migrou
   * para o TONAL. Peça tonal não declara `nucleo`, então o ramo `if (nucleo)` de
   * `compositor.ts:633` não roda e aquelas duas camadas nunca saem: o teste
   * procurava −1 e achava −1, sobre um render que estava CERTO.
   *
   * **O TONAL É A TÉCNICA DEFINITIVA** (decisão do Doug): as peças que ainda são
   * paramétricas ou traçadas vão ser convertidas. Então reancorar este bloco na
   * "peça traçada da vez" só adiaria a mesma quebra para a próxima promoção. O que
   * ele mede é o CONTRATO — *a barba veste, o cabelo cobre* —, e o marcador tem de
   * sobreviver à conversão inteira.
   *
   * As duas técnicas marcam assim, medido:
   *
   *   tonal   `<defs><mask id="…-tom-cabelo"><image href="/items/cabelo/…"/></mask>`
   *           e depois a silhueta vestida por `mask="url(#…)"`. A máscara é o
   *           PRIMEIRO byte do cabelo no corpo do SVG;
   *   antiga  `<path class="kk-tinta">` (silhueta preta), `kk-cabelo-m` (núcleo),
   *           `kk-cabelo` (clara) — as camadas de laços simples.
   *
   * O corte em `</style>` não é detalhe: o CSS cita `var(--av-cabelo)` nas regras, e
   * sem ele o marcador acharia o cabelo dentro da folha de estilo, antes de tudo.
   */
  const depoisDoCss = (svg: string) => svg.indexOf("</style>");

  const MARCAS_DE_CABELO = [
    `<mask id=`,
    `<path class="kk-tinta" d="M`,
    `<path class="kk-cabelo-m"`,
    `<path class="kk-cabelo"`,
    `mask="url(#`,
  ];

  const posicoes = (svg: string) => {
    const corte = depoisDoCss(svg);
    const r: number[] = [];
    for (const marca of MARCAS_DE_CABELO) {
      let i = svg.indexOf(marca, corte);
      while (i > -1) {
        r.push(i);
        i = svg.indexOf(marca, i + 1);
      }
    }
    return r.sort((a, b) => a - b);
  };

  /** O primeiro byte do cabelo no corpo do SVG. −1 se a peça não desenha nada. */
  const iCabeloInicio = (svg: string) => posicoes(svg)[0] ?? -1;
  /** O último. Com a bandeira, a barba fica antes dele; sem, depois. */
  const iCabeloFim = (svg: string) => posicoes(svg).at(-1) ?? -1;

  /**
   * As peças que este bloco mede: **todas menos as paramétricas.**
   *
   * O paramétrico mora dentro do clip do crânio e sai muito antes das feições, então
   * a bandeira é inerte nele — não é defeito, é limitação declarada em `PecaDeRosto`,
   * e tem teste próprio logo abaixo. Derivar a lista de `MODELOS_PARAMETRICOS` em vez
   * de escrevê-la é o que faz este bloco crescer sozinho a cada conversão para tonal.
   */
  const MEDIDAS = MODELOS_CABELO.filter(
    (m) => !(MODELOS_PARAMETRICOS as readonly string[]).includes(m),
  );

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
    //
    // Roda em TODA peça do elenco, não numa só: era um teste sobre `assimetrico` e
    // virou um sobre o contrato. Cada conversão para tonal entra aqui sozinha.
    expect(MEDIDAS.length, "nenhuma peça a medir — o gate ficou vácuo").toBeGreaterThan(0);

    for (const modeloCabelo of MEDIDAS) {
      const svg = compor({ ...BASE, modeloCabelo, rosto: { ...FALSA, cabeloPorCima: true } });
      const boca = svg.lastIndexOf("kk-risco");

      expect(iPeca(svg), `${modeloCabelo}: a peça não foi emitida`).toBeGreaterThan(-1);
      expect(iCabeloInicio(svg), `${modeloCabelo}: o cabelo não desenhou nada`).toBeGreaterThan(-1);
      expect(boca, `${modeloCabelo}: não há boca`).toBeGreaterThan(-1);

      // A barba entra depois das feições…
      expect(iPeca(svg), `${modeloCabelo}: a barba saiu antes da boca`).toBeGreaterThan(boca);
      // …e ANTES do cabelo INTEIRO, contorno junto. É a linha do contrato.
      expect(
        iPeca(svg),
        `${modeloCabelo}: o cabelo começou a ser desenhado ANTES da barba`,
      ).toBeLessThan(iCabeloInicio(svg));
    }
  });

  it("SEM a bandeira, a MESMA peça sai depois das DUAS — as desigualdades invertem", () => {
    // O controle negativo do bloco, e é ele que prova que a bandeira é a causa. Sem
    // ele, o teste de cima passaria com um compositor que ignorasse o campo e pusesse
    // todo rosto sob o cabelo.
    for (const modeloCabelo of MEDIDAS) {
      const svg = compor({ ...BASE, modeloCabelo, rosto: FALSA });

      expect(iPeca(svg), `${modeloCabelo}: a peça não foi emitida`).toBeGreaterThan(-1);
      expect(iCabeloFim(svg), `${modeloCabelo}: o cabelo não desenhou nada`).toBeGreaterThan(-1);
      // Sem a bandeira a barba sai depois do cabelo INTEIRO — a desigualdade inverte
      // contra o ÚLTIMO byte dele, e não contra o primeiro.
      expect(
        iPeca(svg),
        `${modeloCabelo}: sem a bandeira a barba deveria sair depois de todo o cabelo`,
      ).toBeGreaterThan(iCabeloFim(svg));
    }
  });

  // ⚠️ A ASSERÇÃO "silhueta preta e núcleo saem COLADOS" SAIU DAQUI em 2026-08-23,
  // e foi para `nucleo-cabelo.test.ts`. Ela mede a partição em duas camadas da
  // técnica ANTIGA, e **nenhuma peça do elenco vivo a exercita**: só uma fixture com
  // `nucleo` declarado, que é justamente onde aquele arquivo trabalha. Mantê-la aqui
  // sobre uma peça real a fazia medir o nada — foi assim que ela quebrou.

  it("a peça é emitida UMA vez só, com bandeira ou sem", () => {
    // A partição é sobre UMA peça, não sobre uma lista: escrever a emissão nas duas
    // pontas sem o filtro desenharia a barba duas vezes, uma exatamente sobre a
    // outra. A tela ficaria idêntica, e o custo — dois `<path>` a mais, × 30 bonecos
    // no ranking — só apareceria no orçamento de formas.
    const dosDoisJeitos: PecaDeRosto[] = [FALSA, { ...FALSA, cabeloPorCima: true }];
    for (const rosto of dosDoisJeitos)
      // O elenco inteiro, e não uma amostra por família: o TONAL é a técnica
      // definitiva e as outras vão ser convertidas, então uma lista por família
      // envelheceria a cada promoção. A emissão dupla que este teste pega não é de
      // uma técnica só.
      for (const modeloCabelo of MODELOS_CABELO)
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
    //
    // ⚠️ A peça é SINTÉTICA desde 2026-08-24, e a troca é obrigatória: era o `coque`
    // do catálogo, e o catálogo ficou sem nenhum paramétrico quando o Doug o apagou.
    // Trocar por uma peça viva poria uma TONAL onde o nome do teste diz paramétrica —
    // e a bandeira não é inerte na tonal, então o teste passaria a afirmar o contrário
    // do que mede. Fixture é o único caminho enquanto a família estiver vazia.
    const parametrico = {
      id: "chanel" as const,
      nome: "paramétrico (fixture)",
      pontos: [
        { t: -0.1, y: 200 },
        { t: 0.5, y: 170 },
        { t: 1.1, y: 200 },
      ],
    };
    const comFlag = compor({
      ...BASE,
      modeloCabelo: parametrico,
      rosto: { ...FALSA, cabeloPorCima: true },
    });
    expect(
      iPeca(comFlag) < iCabeloInicio(comFlag),
      "o paramétrico passou a respeitar a bandeira — a limitação declarada mudou",
    ).toBe(false);
    expect(comFlag).toBe(compor({ ...BASE, modeloCabelo: parametrico, rosto: FALSA }));
  });

  it("o CHAPÉU não participa da partição — ele continua sendo o último", () => {
    const svg = compor({
      ...COM_CABELO,
      rosto: { ...FALSA, cabeloPorCima: true },
      chapeu: { ...FALSA, id: "zz-chapeu", formas: [{ d: "M50 60 L70 60 L70 80 Z", cor: "#00FF00" }] },
    });
    const doChapeu = svg.indexOf(`fill="#00FF00"`);

    expect(doChapeu).toBeGreaterThan(-1);
    // A barba entra antes do cabelo; o chapéu sai depois de TODO ele. É o que
    // "o chapéu é sempre o último" quer dizer em posição de byte.
    expect(iPeca(svg)).toBeLessThan(iCabeloInicio(svg));
    expect(doChapeu, "o chapéu entrou no meio do cabelo").toBeGreaterThan(iCabeloFim(svg));
  });

  it("o traço VIAJA junto com o preenchimento, e não fica para trás", () => {
    // `sobrepor()` emite fill e traço na MESMA chamada, então partir por peça leva os
    // dois juntos. Se alguém um dia juntar as passadas de traço das duas pontas "para
    // economizar", o contorno da barba volta para cima do cabelo e só isto acusa.
    const svg = compor({ ...COM_CABELO, rosto: { ...FALSA, cabeloPorCima: true } });
    const traco = svg.indexOf(`<path class="kk-traco" fill-rule="evenodd" d="M10 20 L30 20 L30 40 Z"/>`);

    expect(traco, "o traço da barba não foi emitido").toBeGreaterThan(-1);
    expect(traco, "o traço da barba ficou para trás do cabelo").toBeLessThan(
      iCabeloInicio(svg),
    );
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

/**
 * `tom` — O CLARO-ESCURO POR MÁSCARA, E O QUE ELE NÃO PODE QUEBRAR.
 *
 * O terceiro modo de peça do Bloco 5: a silhueta continua vetor e recolorindo, e o
 * claro-escuro vem por cima como máscara de LUMINOSIDADE — um PNG cinza em base64.
 * Ver `TomDaPeca` (`tipos.ts`) para o porquê disso não furar a Regra Inviolável nº 4.
 *
 * As quatro asserções cobrem os quatro jeitos de isto quebrar em silêncio:
 *
 *  1. **o id não fechar** — `<mask id>` e `mask="url(#…)"` divergirem é a peça
 *     perder o tom sem erro nenhum, em nenhum lugar;
 *  2. **`tom: undefined` não ser ausência** — o campo opcional cujo valor explícito
 *     muda um byte é o mesmo defeito que o `describe` do topo deste arquivo existe
 *     para pegar, um andar abaixo;
 *  3. **os ids colidirem entre slots** — o boneco pode ter tom no rosto E no chapéu,
 *     e no `ranking` são 30 bonecos num `<svg>` só. Id repetido faz a segunda
 *     máscara vestir o desenho da primeira, e a folha sai errada sem reprovar;
 *  4. **a peça de cor assada declarar tom** — ela É o raster; um tom ali é a
 *     confissão de que alguém entendeu a máscara como "camada de sombra genérica".
 */
describe("tom — o claro-escuro por máscara de luminosidade", () => {
  /** O caminho da máscara. Ela é servida à parte, como o `.svg` do traje. */
  const PNG = "/items/rosto/zz-com-tom-tom.png";

  /** Duas formas — a de baixo é o traço, a de cima é a tinta que a máscara veste. */
  const COM_TOM: PecaSobreposta = {
    id: "zz-com-tom",
    nome: "Com tom",
    formas: [
      { d: "M10 20 L30 20 L30 40 Z", cor: "var(--av-linha)" },
      { d: "M10 20 L30 20 L30 40 Z", cor: "var(--av-cabelo, #262626)", semTraco: true },
    ],
    tom: { arte: PNG, x: 10, y: 20, w: 20, h: 20 },
  };

  it("emite UMA máscara e UM `mask=url(#…)`, e os dois fecham no mesmo id", () => {
    const svg = compor({ ...BASE, rosto: COM_TOM });

    expect(svg.match(/<mask /g) ?? []).toHaveLength(1);
    const usos = svg.match(/mask="url\(#([^)]+)\)"/g) ?? [];
    expect(usos).toHaveLength(1);

    // O id fecha, e leva `ns` e slot — é isso que o mantém único no `ranking`.
    const id = /<mask id="([^"]+)"/.exec(svg)?.[1];
    expect(id).toBe("t-tom-rosto");
    expect(svg).toContain(`mask="url(#${id})"`);

    // A caixa é a mesma no `<mask>` e no `<image>`, e em unidades do viewBox.
    expect(svg).toContain('maskUnits="userSpaceOnUse"');
    expect(svg.match(/x="10" y="20" width="20" height="20"/g) ?? []).toHaveLength(2);
    expect(svg).toContain('preserveAspectRatio="none"');
    // O `href` é um CAMINHO, não `data:`. Ver `TomDaPeca` (`tipos.ts`): base64
    // embutido custava 753 KB de gzip numa lista de 30 bonecos.
    expect(svg).toContain(`href="${PNG}"`);
    expect(svg).not.toContain("data:image/png;base64,");
  });

  it("a máscara veste a ÚLTIMA forma, e nunca o traço", () => {
    const svg = compor({ ...BASE, rosto: COM_TOM });

    // A de baixo — `--av-linha` — sai limpa; a de cima leva a máscara.
    expect(svg).toContain(`d="M10 20 L30 20 L30 40 Z" fill-rule="evenodd" fill="var(--av-linha)"/>`);
    expect(svg).toContain(
      `fill="var(--av-cabelo, #262626)" mask="url(#t-tom-rosto)"/>`,
    );
    // Mascarar o contorno o comeria pelas beiradas — justamente onde ele existe.
    expect(svg).not.toMatch(/class="kk-traco"[^>]*mask=/);
  });

  it("`tom: undefined` é byte a byte igual ao campo ausente", () => {
    const sem: PecaSobreposta = { ...COM_TOM, tom: undefined };
    const svg = compor({ ...BASE, rosto: sem });

    expect(svg).toBe(compor({ ...BASE, rosto: { id: COM_TOM.id, nome: COM_TOM.nome, formas: COM_TOM.formas } }));
    expect(svg).not.toContain("<mask");
    expect(svg).not.toContain("mask=");
  });

  it("rosto e chapéu com tom saem com ids DISTINTOS — a colisão é fatal e muda", () => {
    const svg = compor({
      ...BASE,
      rosto: COM_TOM,
      chapeu: { id: "zz-chapeu-tom", nome: "Chapéu", formas: COM_TOM.formas, tom: COM_TOM.tom },
    });

    expect(svg).toContain('<mask id="t-tom-rosto"');
    expect(svg).toContain('<mask id="t-tom-chapeu"');
    expect(svg.match(/<mask /g) ?? []).toHaveLength(2);
    expect(svg.match(/mask="url\(/g) ?? []).toHaveLength(2);
  });

  it("não quebra o contrato do SVG", () => {
    // O `conferirSvg` não tem allowlist de elemento; o que ele trava é custom
    // property fora do contrato e comentário dentro do `<style>`. O alfabeto do
    // base64 não colide com as regexes de `var(--…)`.
    expect(conferirSvg(compor({ ...BASE, rosto: COM_TOM }))).toEqual([]);
  });

  it("uma peça de cor ASSADA não pode declarar tom — o `never` é a trava", () => {
    // O par do `@ts-expect-error` da união `formas`/`arte`, e existe pelo mesmo
    // motivo: se o `tom?: never` sair do braço `arte`, este erro deixa de existir
    // para consumir e o `npm run typecheck` quebra aqui.
    // @ts-expect-error peça de cor assada É o raster; ela não tem tom a declarar.
    const assadaComTom: PecaSobreposta = {
      id: "zz-assada-com-tom",
      nome: "Assada com tom",
      arte: "/items/chapeu/zz.svg",
      tom: { arte: PNG, x: 0, y: 0, w: 1, h: 1 },
    };
    expect(assadaComTom.id).toBe("zz-assada-com-tom");
  });
});
