/**
 * A FOLHA DE VARIANTES — `npm run avatar:variantes`
 *
 * O forçador da skill `avatar-desenho`, e ele existe por causa de um defeito
 * concreto e recente: no Bloco 2a.1 os cinco cabelos foram desenhados em **uma**
 * versão cada, e depois consertados. O resultado é correto e é *o primeiro
 * resultado plausível, refinado* — que não é a mesma coisa que uma escolha.
 *
 * Três defeitos daquele bloco só apareceram quando alguém renderizou e olhou: o
 * moicano lia como pluma de capacete, o coque como boina, a trança como borrão.
 * Gate nenhum pegou, e gate nenhum poderia — nenhum deles é erro de número.
 *
 * Então este script não mede se a peça está bonita. Ele torna caro **não olhar** e
 * impossível **não divergir**.
 *
 * ---------------------------------------------------------------------------
 * AS QUATRO REPROVAÇÕES, E O QUE CADA UMA IMPEDE
 * ---------------------------------------------------------------------------
 *
 * 1. **Menos de três variantes.** Sem `MOTIVO_DE_DUAS` escrito no rascunho, sai
 *    com código 1. Entregar uma peça só é o comportamento que este script existe
 *    para tornar impossível.
 * 2. **Dois eixos iguais.** O eixo é a frase que diz em QUE a variante diverge.
 *    Duas iguais são uma variante escrita duas vezes.
 * 3. **Duas variantes que não se distinguem a 56 px.** Esta é a que vale: o eixo é
 *    prosa e prosa se escreve bonito, mas se dois desenhos diferem em menos de 5%
 *    dos pixels na miniatura, eles **são** a mesma direção — não importa o que a
 *    frase prometeu. É a mesma régua do gate (a) da `folha-base`, aplicada aqui
 *    contra o autoengano em vez de contra o catálogo.
 * 4. **Qualquer amarra estourada.** Divergência não desculpa variante mal-feita:
 *    uma que reprova não alarga a exploração, ela perde por execução e não ensina
 *    nada sobre a direção que representava. As três passam pelos mesmos gates.
 *
 * ---------------------------------------------------------------------------
 * O SELO, E O QUE ELE HONESTAMENTE PROVA
 * ---------------------------------------------------------------------------
 *
 * A folha carrega seis caracteres desenhados num canto, e eles **não são impressos
 * no terminal**. A skill exige que o relatório da crítica comece citando o selo.
 *
 * Ele prova que a imagem foi **aberta**. Não prova que foi bem julgada, e fingir o
 * contrário seria o mesmo autoengano que ele combate. O que justifica o mecanismo é
 * que o custo de abrir a imagem é praticamente o custo de olhar para ela — e o
 * defeito real do bloco passado não foi julgar mal, foi que os defeitos **só
 * aparecem renderizando**.
 */

import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import sharp from "sharp";
import { chromium } from "@playwright/test";
import { compor } from "../../../src/lib/avatar/estilo/compositor";
import {
  FOLGA_ROSTO,
  ORCAMENTO_COMPOSTO,
  ancoragemDasExtensoes,
  ateAPoligonal,
  ponto,
  CABELOS,
  coberturaDaCoroa,
  contencaoDaClara,
  folgaDoRosto,
  type Cabelo,
} from "../../../src/lib/avatar/estilo/cabelo";
import {
  CAIXA_CABECA,
  SANGRIA,
  TRACO,
  VIEWBOX,
  amostrarSpline,
  bordasEm,
} from "../../../src/lib/avatar/estilo/geometria";
import {
  PISOS_DE_PRODUCAO,
  PISO_DE_PROJETO_Y,
  TETO_DURO_Y,
  amarrasDaBarba,
  bandaDeclarada,
  caixaDaTinta,
  coberturaDoRosto,
  derivaDoQueixo,
  folgaDaBoca,
  irregularidadeDasMechas,
  mechaTocaAFronteira,
  paralelismoAoCranio,
  pecaDeRosto,
  pontosDaMassa,
  serrilhaDaBorda,
  sondasDaBanda,
  type Barba,
  type PisosDoRosto,
} from "../../../src/lib/avatar/estilo/rosto";
import { RECORTE_CABECA, recortarNaCabeca } from "../../../src/lib/avatar/estilo/recorte";
import { ESCALA_PADRAO, naTela } from "../../../src/lib/avatar/estilo/compositor";
import { conferirSvg } from "../../../src/lib/avatar/svgContrato";
import { CABELO, PELE } from "../../../src/lib/avatar/palette";
import type { Traje } from "../../../src/lib/avatar/estilo/tipos";

/**
 * Uma direção candidata.
 *
 * `eixo` não é enfeite: é a frase que diz **em que** esta variante diverge das
 * outras, e é contra ela que a reprovação 2 mede. "Mais bonito" não é eixo;
 * "franja curta e volume atrás" é.
 */
export interface Variante {
  /** Nome que descreve a DIREÇÃO — "Domada", "Selvagem". Nunca "A", "B", "C". */
  nome: string;
  /** Em que ela diverge, numa frase. */
  eixo: string;
  cabelo?: Cabelo;
  traje?: Traje;
  /**
   * A PEÇA DE ROSTO, e ela chega como `Barba` e **não** como `PecaSobreposta`.
   *
   * O plano pedia `rosto?: PecaSobreposta`, e trocar foi a mesma correção que
   * `Cabelo.extensoes` já recebeu no Bloco 2a.1: `PecaSobreposta` guarda `d:
   * string`, e path emitido não se mede. Com o `d` na mão, a folga à boca, a folga
   * aos olhos e a ancoragem ficariam **cegas** — verdes por vacuidade, que é
   * exatamente o defeito que o aviso do traje logo abaixo existe para confessar.
   *
   * Com a `Barba`, quem emite a `PecaSobreposta` é este script, pela mesma
   * `pecaDeRosto` do produto: continua havendo uma composição só.
   */
  barba?: Barba;
  /** A mesma barba com e sem bigode são DUAS variantes — ver o rascunho. */
  comBigode?: boolean;
  /**
   * OS PISOS DA PEÇA, REBAIXADOS SÓ NESTA COLUNA — e é por isso que existe.
   *
   * A folha 1 da etapa 1b pergunta *"quanto custam as travas?"*, e a única resposta
   * honesta é uma coluna que roda **sem** elas do lado de uma que roda **com**. O
   * caminho errado seria editar `PISOS_DE_PRODUCAO` para a folha sair — a lei mudaria
   * antes de o Doug decidir, e ninguém veria o momento em que isso aconteceu.
   *
   * Passar aqui deixa os pisos de produção intactos e faz `amarrasDaBarba` imprimir,
   * em voz alta, que aquela coluna **não é peça aprovável**. Omitir usa a lei.
   */
  pisos?: PisosDoRosto;
}

const DIAG = ".scratch/estilo";
const FOLHA = `${DIAG}/folha-variantes.png`;

/** Onde mora o rascunho. Efêmero de propósito — variante não vira catálogo sozinha. */
const RASCUNHO = process.env.VARIANTES ?? ".scratch/variantes.ts";

/** Os quatro tamanhos. 56 é o do ranking e é o que manda (regra 8 da §7). */
const TAMANHOS = [56, 100, 200, 425] as const;

/**
 * Os quatro do RECORTE DE CABEÇA — e o 32 entra porque ali ele existe de verdade.
 *
 * No corpo inteiro, 32 px de altura deixam a cabeça com 13,2 px e não há o que
 * julgar. No recorte ela fica com 19,2 px (`recorte.ts:9-12`), que é o tamanho da
 * navbar e do mural. Uma peça de rosto que não lê a 32 no recorte não lê em lugar
 * nenhum.
 */
const TAMANHOS_CABECA = [32, 56, 112, 425] as const;

/** O mesmo piso do gate (a): 5% dos pixels de 40×56, ou ~112 px. */
const PISO_DISTINCAO = 0.05;

/**
 * O piso da SEPARAÇÃO da peça de rosto — outra pergunta, outro número.
 *
 * A distinção acima é uma fração do QUADRO; esta é uma fração da PEGADA das duas
 * peças. Reaproveitar os 5% seria mudar a semântica de um piso calado, que é
 * exatamente o tipo de erro que este repositório paga caro: o denominador cai de
 * 2 240 px para a área da barba (~75 px a 32), e 5% ali seriam 4 pixels.
 */
const PISO_SEPARACAO = 0.35;

const contarFormas = (svg: string) =>
  (svg.match(/<(path|ellipse|rect|circle|use)\b/g) ?? []).length;

/** O mesmo teto de `folha-base.ts` e do teste — um valor só, em `cabelo.ts`. */
const TETO_FORMAS = ORCAMENTO_COMPOSTO.formas;
const TETO_BYTES = ORCAMENTO_COMPOSTO.bytes;

interface Reprovacao {
  variante: string;
  detalhe: string;
}

/**
 * As amarras computáveis de uma variante.
 *
 * Para CABELO elas são completas, porque `Cabelo.extensoes` guarda pontos e não
 * path emitido — foi a troca feita no Bloco 2a.1 justamente para o gate enxergar a
 * peça. Para TRAJE elas são parciais, e o script diz isso em voz alta em vez de
 * ficar verde por vacuidade: `Traje.extensoes` ainda guarda `d: string`, então a
 * sobreposição ≥ SANGRIA que o `tipos.ts:65` promete não é medível daqui.
 */
function amarras(
  v: Variante,
  svg: string,
  folhaDeRosto: boolean,
): { problemas: string[]; avisos: string[] } {
  const problemas: string[] = [];
  const avisos: string[] = [];

  for (const p of conferirSvg(svg)) problemas.push(`contrato: ${p.detalhe}`);

  const formas = contarFormas(svg);
  const bytes = Buffer.byteLength(svg, "utf-8");
  if (formas > TETO_FORMAS) problemas.push(`${formas} formas contra o teto de ${TETO_FORMAS}`);

  // O TETO DE BYTES É DECLARADO PARA base + UM CABELO, e a variante de rosto é um
  // composto de TRÊS camadas — para o qual não existe teto declarado em lugar
  // nenhum. Reprovar por ele seria cobrar da barba uma conta que a `chanel` sozinha
  // já estoura (12 524 B, marcada "▲ registrado" em `avatar:folha-base`, sob a
  // regra do doc 15:463 — teto de bytes não veta arte aprovada).
  //
  // Então o número sai alto, com o delta separado, e a ausência do teto fica dita
  // em voz alta em vez de virar um gate que se aprende a ignorar. Vira achado.
  if (bytes > TETO_BYTES) {
    if (v.barba) {
      avisos.push(
        `${bytes} bytes — e o teto de ${TETO_BYTES} é de base + UM cabelo, não de ` +
          `base + cabelo + rosto. NÃO HÁ TETO DECLARADO para o composto de três ` +
          `camadas: isto é dívida a registrar, não gate furado`,
      );
    } else if (folhaDeRosto) {
      // A COLUNA DE REFERÊNCIA SEM PEÇA NENHUMA — e ela estoura o teto sozinha.
      //
      // A folha 1 tem uma coluna "Sem barba" para medir o que a peça de fato
      // acrescenta, e ela é base + `chanel` = 11 895 B, acima do teto de 10 240 antes
      // de qualquer peça existir. Reprovar aqui seria a folha reprovar a própria
      // régua: é o mesmo "▲ registrado" que `avatar:folha-base` já imprime, sob a
      // regra do doc 15:463 — teto de bytes não veta arte aprovada.
      avisos.push(
        `${bytes} bytes contra o teto de ${TETO_BYTES} — e esta coluna não tem peça ` +
          `nenhuma: é base + \`chanel\`, que já estoura sozinha e é tolerada como ` +
          `"▲ registrado" em \`avatar:folha-base\`. Referência, não candidata`,
      );
    } else {
      problemas.push(`${bytes} bytes contra o teto de ${TETO_BYTES}`);
    }
  }

  if (v.cabelo) {
    const f = folgaDoRosto(v.cabelo);
    const pior = Math.min(f.esq, f.dir);
    const folga =
      `folga do rosto ${pior.toFixed(1)} contra o piso de ${FOLGA_ROSTO} ` +
      `(esq ${f.esq === Infinity ? "—" : f.esq.toFixed(1)}, ` +
      `dir ${f.dir === Infinity ? "—" : f.dir.toFixed(1)})`;
    if (pior < FOLGA_ROSTO) {
      /**
       * NA PEÇA TRAÇADA A AMARRA É OUTRA, E ELA NÃO MORA AQUI.
       *
       * No paramétrico a franja é desenhada, então uma folga curta é escolha de quem
       * desenhou e o piso de 24 é a régua certa. Na peça traçada ela é **um fato da
       * arte**: o gerador não conhece `FOLGA_ROSTO`, e a `curto-espetada` deixa 6,2
       * unidades de testa. O que o traço controla ali não é a folga, é **não piorá-la**
       * — e isso exige a arte do lado, que este script não tem.
       *
       * Por isso o piso da traçada é `folga da arte − meio traço`, medido por
       * `avatar:fidelidade` (gate 3), e não por aqui. O que sobra neste aviso é o
       * número absoluto: abaixo de 24 u franja e sobrancelha encostam por antialiasing
       * a 56 px, e trocar a arte é direção de arte — item (f), o olho do Doug.
       *
       * A régua paramétrica resolvia subindo a peça inteira, e foi isso que produziu a
       * faixa de testa nua da folha HSHC93: translação determinística ainda é a régua
       * decidindo o enquadramento da arte. O traçador não sobe mais nada (ver
       * `tracar()`).
       */
      if (v.cabelo.massa) {
        avisos.push(
          `${folga} — peça TRAÇADA: é a folga DA ARTE. O piso dela é a própria arte ` +
            `menos meio traço, e quem gateia é \`avatar:fidelidade\` (gate 3). ` +
            `Abaixo de ${FOLGA_ROSTO} é legibilidade a 56 px — item (f)`,
        );
      }
      else problemas.push(folga);
    }

    for (const [i, fundo] of ancoragemDasExtensoes(v.cabelo).entries()) {
      if (fundo < SANGRIA) {
        problemas.push(
          `extensão ${i + 1} ancora só ${fundo.toFixed(1)} dentro da cabeça ` +
            `(mínimo ${SANGRIA}) — ela lê como adesivo colado ao lado`,
        );
      }
    }

    const pontos = v.cabelo.pontos;
    if (pontos?.length) {
      for (const p of [pontos[0], pontos[pontos.length - 1]]) {
        const { esq, dir } = bordasEm(p.y);
        const x = esq + p.t * (dir - esq);
        if (x >= esq && x <= dir) {
          problemas.push(
            `ponta da franja em t=${p.t} cai DENTRO da silhueta — ` +
              `quem corta a lateral é o clipPath, não o cabelo`,
          );
        }
      }
    }

    // A mesma exigência da linha de cima, perguntada pelo defeito em vez de pela
    // ponta: num laço fechado "a última ponta" é vizinha da primeira, e o que
    // continua fazendo sentido é se sobrou couro cabeludo à mostra.
    if (v.cabelo.massa) {
      const cobertura = coberturaDaCoroa(v.cabelo);
      if (cobertura !== null && cobertura < 1) {
        problemas.push(
          `a massa cobre ${(100 * cobertura).toFixed(1)}% da coroa — o que falta é ` +
            `couro cabeludo aparecendo no alto do crânio`,
        );
      }
      const contencao = contencaoDaClara(v.cabelo);
      if (contencao < 0) {
        problemas.push(
          `a região clara vaza ${(-contencao).toFixed(1)} u da massa — a camada clara ` +
            `não tem contorno, então isso sai como tinta sem borda sobre o fundo`,
        );
      }
    }
  }

  if (v.barba) {
    const comBigode = v.comBigode ?? true;
    const daBarba = amarrasDaBarba(v.barba, comBigode, v.pisos ?? PISOS_DE_PRODUCAO);
    problemas.push(...daBarba.problemas);
    avisos.push(...daBarba.avisos);

    // A CONTENÇÃO NO RECORTE, nos QUATRO lados. A peça de rosto é a primeira que
    // pode descer abaixo do queixo, e o recorte de cabeça é a janela por onde a
    // navbar, o mural e o ranking olham para ela: o que passar dali some sem erro
    // e sem aviso, que é o modo de falha do `viewBox` que o doc 14 (T1.5) nomeia.
    const caixa = caixaDaTinta(v.barba, comBigode);
    const janela = {
      x0: (RECORTE_CABECA.x - naTela({ x: 0 }).x) / 0.92,
      x1: (RECORTE_CABECA.x + RECORTE_CABECA.w - naTela({ x: 0 }).x) / 0.92,
      y0: (RECORTE_CABECA.y - naTela({ y: 0 }).y) / 0.92,
      y1: TETO_DURO_Y,
    };
    for (const [lado, sobra] of [
      ["esquerdo", caixa.x0 - janela.x0],
      ["direito", janela.x1 - caixa.x1],
      ["de cima", caixa.y0 - janela.y0],
      ["de baixo", janela.y1 - caixa.y1],
    ] as const) {
      if (sobra < 0) {
        problemas.push(
          `a tinta passa ${(-sobra).toFixed(1)} u do recorte de cabeça pelo lado ` +
            `${lado} — ali ela some sem erro e sem aviso`,
        );
      }
    }
    if (caixa.y1 > PISO_DE_PROJETO_Y) {
      avisos.push(
        `a tinta desce a y ${caixa.y1.toFixed(1)}, além do piso de projeto ${PISO_DE_PROJETO_Y} ` +
          `(o teto duro é ${TETO_DURO_Y}) — cabe, mas sem folga para o transbordo do traje`,
      );
    }

    // A BARBA ENCOSTA NO CABELO? — e as duas são pintadas com as MESMAS duas cores.
    //
    // A crítica da 1ª folha nomeou: *"barba e cabelo não têm separação tonal —
    // viram uma peça só, e o usuário perde a leitura do cabelo que escolheu"*.
    // Medido, é verdade e é pior: as três SOBREPÕEM a massa da `chanel`. A cortina
    // dela desce até y 397 do lado esquerdo, e o lóbulo dela ocupa x 421 em y 245 —
    // que é exatamente onde a costeleta direita cabe.
    //
    // **Fica como AVISO e não como gate**, e a escolha é declarada: barba e cabelo
    // se encontrarem é anatomicamente certo, e as duas usam `--av-cabelo` porque a
    // barba recolorir junto foi decisão de produto. Gatear aqui cortaria toda barba
    // de bochecha por decreto — e essa é uma decisão de produto do Doug, não uma
    // régua de legibilidade. O número está aqui para ele decidir vendo.
    const cabeloDeReferencia = amostrarSpline(
      (CABELOS.chanel.massa ?? []).map((p) => ponto(p, 0)),
      true,
    );
    let encosto = Infinity;
    for (const p of amostrarSpline(pontosDaMassa(v.barba), true)) {
      encosto = Math.min(encosto, ateAPoligonal(cabeloDeReferencia, p));
    }
    const folgaCabelo = encosto - TRACO;
    if (folgaCabelo < 24) {
      avisos.push(
        `folga à massa da \`chanel\` ${folgaCabelo.toFixed(1)} u ` +
          `${folgaCabelo < 0 ? "(SOBREPÕE)" : ""} contra a referência de 24. As duas são ` +
          `pretas e recolorem pela MESMA \`--av-cabelo\`: onde encostam, viram uma peça só ` +
          `e o aluno perde a leitura do cabelo que escolheu. Decisão de produto, não gate`,
      );
    }

    // A gola futura come a ponta da barba, e isso é declarado em vez de medido:
    // `extensoes(traje, false)` é emitido DEPOIS do rosto (`compositor.ts:1041`), e
    // y 360–420 é exatamente onde gola mora. Nenhum dos dois trajes de hoje tem
    // extensão, então a colisão é futura e certa — não há o que gatear ainda.
    if (caixa.y1 > 360) {
      avisos.push(
        `a tinta desce a y ${caixa.y1.toFixed(1)}, dentro da faixa 360–420 onde gola mora. ` +
          `Extensão de traje é desenhada DEPOIS do rosto e vai comer esta ponta — ` +
          `nenhum traje de hoje tem extensão, a colisão é futura e certa`,
      );
    }
  }

  return { problemas, avisos };
}

/** Seis caracteres que só existem dentro do PNG. Ver o docstring do topo. */
function gerarSelo(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    alfabeto[Math.floor(Math.random() * alfabeto.length)],
  ).join("");
}

async function main() {
  mkdirSync(DIAG, { recursive: true });

  const caminho = resolve(process.cwd(), RASCUNHO);
  let modulo: { VARIANTES?: Variante[]; MOTIVO_DE_DUAS?: string };
  try {
    modulo = await import(`file://${caminho.replace(/\\/g, "/")}`);
  } catch (e) {
    console.error(
      `não consegui ler o rascunho em ${RASCUNHO}\n` +
        `  ${String(e instanceof Error ? e.message : e)}\n\n` +
        `Ele precisa exportar VARIANTES: Variante[]. Exemplo mínimo:\n\n` +
        `  import type { Variante } from "../scripts/avatar/estilo/variantes";\n` +
        `  export const VARIANTES: Variante[] = [\n` +
        `    { nome: "Domada",  eixo: "franja reta, volume nenhum", cabelo: { ... } },\n` +
        `    { nome: "Selvagem", eixo: "recorte em festões, volume acima do crânio", cabelo: { ... } },\n` +
        `    { nome: "Presa",   eixo: "testa à mostra, massa atrás da cabeça", cabelo: { ... } },\n` +
        `  ];\n`,
    );
    process.exit(1);
  }

  const variantes = modulo.VARIANTES ?? [];
  const motivoDeDuas = modulo.MOTIVO_DE_DUAS;
  const reprovacoes: Reprovacao[] = [];

  // --- reprovação 1: quantas direções ---------------------------------------
  if (variantes.length < 2) {
    console.error(
      `${variantes.length} variante(s) declarada(s). O mínimo é 3.\n` +
        `Uma peça só é o primeiro resultado plausível, e refiná-lo não produz escolha.`,
    );
    process.exit(1);
  }
  if (variantes.length === 2 && !motivoDeDuas) {
    console.error(
      `2 variantes e nenhum MOTIVO_DE_DUAS declarado.\n\n` +
        `Duas é permitido quando a peça não comporta três eixos genuínos — um par de\n` +
        `óculos tem uma forma e dois tamanhos, não três direções. Mas o motivo tem de\n` +
        `estar escrito, e tem de dizer qual terceira direção foi descartada e por quê:\n\n` +
        `  export const MOTIVO_DE_DUAS = "...";\n`,
    );
    process.exit(1);
  }

  // --- reprovação 2: eixos repetidos ----------------------------------------
  const vistos = new Map<string, string>();
  for (const v of variantes) {
    const chave = v.eixo.trim().toLowerCase();
    const antes = vistos.get(chave);
    if (antes) {
      reprovacoes.push({
        variante: v.nome,
        detalhe: `eixo idêntico ao de "${antes}" — é uma variante escrita duas vezes`,
      });
    }
    vistos.set(chave, v.nome);
  }

  // --- compor e medir as amarras --------------------------------------------
  //
  // A VARIANTE DE ROSTO COMPÕE DUAS CENAS, e as duas são obrigatórias:
  //
  //  - **com `chanel`**, que é o composto mais pesado do catálogo (23 formas). A
  //    folha mede o pior caso do orçamento, não um caso simpático;
  //  - **careca**, que é onde `--av-cabelo` NÃO existe (`compositor.ts:866` só a
  //    declara quando há modelo) e o *fallback* castanho é que aparece. A barba
  //    salta de cor entre as duas cenas, e isso é consequência aceita — a folha
  //    mostra as duas justamente para o Doug VER o salto em vez de deduzi-lo.
  //
  // E ela é recortada na cabeça: `recortarNaCabeca` é a janela por onde a navbar, o
  // mural e o ranking olham. Julgar uma peça de rosto no corpo inteiro a 56 px é
  // julgar 13 px de cabeça.
  // A FOLHA INTEIRA É DE ROSTO OU NENHUMA COLUNA É, e a decisão é da folha e não da
  // coluna. A folha 1 da etapa 1b tem uma coluna **sem peça nenhuma** — a referência,
  // para medir o que a barba de fato acrescenta —, e se ela caísse no caminho de
  // sempre sairia em corpo inteiro, com quatro tamanhos diferentes das outras duas.
  // O Doug compararia layouts, não peças.
  const folhaDeRosto = variantes.some((v) => v.barba);

  const compostos = variantes.map((v, i) => {
    const peca = v.barba ? pecaDeRosto(v.barba, v.comBigode ?? true) : undefined;
    const cena = (
      modeloCabelo: typeof v.cabelo | "chanel" | undefined,
      sufixo: string,
      comPeca = true,
    ) =>
      compor({
        pele: PELE[1],
        cabelo: CABELO[0],
        modeloCabelo,
        traje: v.traje,
        rosto: comPeca ? peca : undefined,
        ns: `v${i}${sufixo}`,
      });

    if (!folhaDeRosto) {
      const svg = cena(v.cabelo, "");
      return {
        v,
        svg,
        recorta: false,
        cenas: [{ rot: "corpo inteiro", svg, base: svg }],
        base: undefined as string | undefined,
        formas: contarFormas(svg),
        bytes: Buffer.byteLength(svg, "utf-8"),
      };
    }

    const comCabelo = cena("chanel", "c");
    // A base é a MESMA cena sem a peça: é contra ela que a pegada é medida, e é dela
    // que sai o "preto da cabeça" de referência. Na coluna sem barba as duas são
    // iguais byte a byte — que é justamente o que faz a pegada dela dar 0 px.
    const baseCabelo = cena("chanel", "c", false);
    return {
      v,
      svg: comCabelo,
      recorta: true,
      cenas: [
        { rot: "com Chanel", svg: comCabelo, base: baseCabelo },
        { rot: "careca — o fallback", svg: cena(undefined, "k"), base: cena(undefined, "k", false) },
      ],
      base: baseCabelo,
      formas: contarFormas(comCabelo),
      bytes: Buffer.byteLength(comCabelo, "utf-8"),
    };
  });

  console.log(`${variantes.length} variantes, de ${RASCUNHO}:\n`);
  for (const c of compostos) {
    const { problemas, avisos } = amarras(c.v, c.svg, folhaDeRosto);
    for (const p of problemas) reprovacoes.push({ variante: c.v.nome, detalhe: p });
    console.log(
      `  ${c.v.nome.padEnd(14)} ${String(c.formas).padStart(2)} formas · ` +
        `${String(c.bytes).padStart(5)} B   ${problemas.length ? "✗" : "ok"}`,
    );
    console.log(`  ${"".padEnd(14)} eixo: ${c.v.eixo}`);
    for (const p of problemas) console.log(`  ${"".padEnd(14)} ✗ ${p}`);
    for (const a of avisos) console.log(`  ${"".padEnd(14)} ⚠ ${a}`);
  }

  if (compostos.some((c) => c.v.traje)) {
    console.log(
      `\n  ⚠ variante de TRAJE: a sobreposição ≥ ${SANGRIA} das extensões NÃO é medida aqui.\n` +
        `    \`Traje.extensoes\` guarda \`d: string\`, e path emitido não se mede. É a mesma\n` +
        `    correção que \`Cabelo.extensoes\` já recebeu (guardar pontos). Até lá, essa\n` +
        `    amarra é olho, não gate — e este aviso existe para ninguém achar que é gate.`,
    );
  }

  // --- a folha, e a distinção medida nela ------------------------------------
  const selo = gerarSelo();
  const nav = await chromium.launch();
  try {
    const pg = await nav.newPage();

    const em = (svg: string, h: number) =>
      svg.replace("<svg ", `<svg width="${Math.round((h * VIEWBOX.w) / VIEWBOX.h)}" height="${h}" `);

    /** O recorte de cabeça num quadrado — a janela da navbar, do mural e do ranking. */
    const emCabeca = (svg: string, px: number) =>
      recortarNaCabeca(svg).replace("<svg ", `<svg width="${px}" height="${px}" `);

    const rasterizar = async (html: string, w: number, h: number) => {
      await pg.setViewportSize({ width: Math.max(w, 60), height: Math.max(h, 60) });
      await pg.setContent(`<body style="margin:0;background:#FFF">${html}</body>`);
      const png = await pg.screenshot({ clip: { x: 0, y: 0, width: w, height: h } });
      return sharp(png).ensureAlpha().raw().toBuffer();
    };

    /** Onde diferem, pixel a pixel. Devolve a máscara, não só a conta. */
    const mascara = (a: Buffer, b: Buffer) => {
      const m: boolean[] = [];
      for (let i = 0; i < a.length; i += 4) {
        m.push(
          Math.max(
            Math.abs(a[i] - b[i]),
            Math.abs(a[i + 1] - b[i + 1]),
            Math.abs(a[i + 2] - b[i + 2]),
          ) > 24,
        );
      }
      return m;
    };
    const soma = (m: boolean[]) => m.reduce((s, v) => s + (v ? 1 : 0), 0);

    if (!folhaDeRosto) {
      // ------------------------------------------------- a régua de sempre (56 px)
      const L = { w: Math.round((56 * VIEWBOX.w) / VIEWBOX.h), h: 56 };
      const chapas: Buffer[] = [];
      for (const c of compostos) chapas.push(await rasterizar(em(c.svg, 56), L.w, L.h));

      console.log(`\ndistinção a 56 px (piso ${(PISO_DISTINCAO * 100).toFixed(0)}%):`);
      for (let i = 0; i < chapas.length; i++) {
        for (let j = i + 1; j < chapas.length; j++) {
          const d = soma(mascara(chapas[i], chapas[j])) / (chapas[i].length / 4);
          const ruim = d < PISO_DISTINCAO;
          console.log(
            `  ${compostos[i].v.nome.padEnd(14)} × ${compostos[j].v.nome.padEnd(14)} ` +
              `${(d * 100).toFixed(2)}%${ruim ? "   ✗" : ""}`,
          );
          if (ruim) {
            reprovacoes.push({
              variante: `${compostos[i].v.nome} × ${compostos[j].v.nome}`,
              detalhe:
                `só ${(d * 100).toFixed(2)}% de pixels diferentes a 56 px. Os eixos prometem ` +
                `direções distintas e os desenhos são a mesma. Prosa não é divergência.`,
            });
          }
        }
      }
    } else {
      // ------------------------------------------- a régua da PEÇA DE ROSTO (32 px)
      //
      // A régua de sempre conta pixels diferentes no quadro INTEIRO, e para peça de
      // rosto isso está errado por construção: as variantes dividem cabeça, olhos,
      // boca e cabelo — ~85% do quadro NÃO PODE diferir. O número que sairia mede
      // *"quanto da cabeça a barba cobre"*, não *"as duas barbas se separam"*, e o
      // piso de 5% mudaria de semântica calado porque o denominador vira 32×32.
      //
      //   PEGADA(i)        = os pixels que a peça i de fato POSSUI, a 32 px, no
      //                      recorte: onde `compor(base)` e `compor(base + rosto)`
      //                      diferem;
      //   SEPARAÇÃO(i, j)  = |diff(i, j)| / |pegada(i) ∪ pegada(j)| — *"dos pixels
      //                      que qualquer uma das duas barbas reivindica, em quantos
      //                      elas discordam?"*. Duas barbas que só diferem no
      //                      interno pontuam ~0.
      const P = 32;
      const chapas: Buffer[] = [];
      const pegadas: boolean[][] = [];
      for (const c of compostos) {
        const chapa = await rasterizar(emCabeca(c.svg, P), P, P);
        chapas.push(chapa);
        pegadas.push(
          c.base
            ? mascara(await rasterizar(emCabeca(c.base, P), P, P), chapa)
            : new Array<boolean>(chapa.length / 4).fill(false),
        );
      }

      console.log(
        `\npegada a ${P} px, no recorte de cabeça — a tinta que a peça de fato possui:`,
      );
      for (const [i, c] of compostos.entries()) {
        const m = pegadas[i];
        const xs: number[] = [];
        const ys: number[] = [];
        m.forEach((v, k) => {
          if (v) {
            xs.push(k % P);
            ys.push(Math.floor(k / P));
          }
        });
        // Pegada VAZIA é o caso da coluna de referência, e ela é informação e não
        // defeito: zero pixel de diferença contra a própria base é a definição de
        // "sem peça". Sem esta guarda, `Math.max` de lista vazia imprime −Infinity.
        if (!xs.length) {
          console.log(`  ${c.v.nome.padEnd(14)}    0 px  ·  sem peça — é a referência`);
          continue;
        }
        const caixa = c.v.barba ? caixaDaTinta(c.v.barba, c.v.comBigode ?? true) : null;
        console.log(
          `  ${c.v.nome.padEnd(14)} ${String(soma(m)).padStart(4)} px  ·  caixa ` +
            `${Math.max(...xs) - Math.min(...xs) + 1} × ${Math.max(...ys) - Math.min(...ys) + 1} px` +
            (caixa
              ? `  ·  em unidades: x ${caixa.x0.toFixed(0)}–${caixa.x1.toFixed(0)} · ` +
                `y ${caixa.y0.toFixed(0)}–${caixa.y1.toFixed(0)}`
              : ""),
        );
      }
      console.log(
        `  (duas caixas que concordam em 1 px nas duas dimensões e áreas dentro de 10%\n` +
          `   são a MESMA direção, diga o diff o que disser — este bloco não reprova)`,
      );

      console.log(
        `\ndistância da borda ao contorno do crânio — a acusação de "offset", medida:`,
      );
      for (const c of compostos) {
        if (!c.v.barba) continue;
        const q = paralelismoAoCranio(c.v.barba);
        const irreg = irregularidadeDasMechas(c.v.barba);
        console.log(
          `  ${c.v.nome.padEnd(14)} p10 ${q.p10.toFixed(1).padStart(5)} · p50 ${q.p50.toFixed(1).padStart(5)} · ` +
            `p90 ${q.p90.toFixed(1).padStart(5)} · espalhamento ${(q.p90 - q.p10).toFixed(1).padStart(5)} u` +
            `   ·   mechas com ${irreg === null ? "—" : `${(100 * irreg).toFixed(0)}%`} de dispersão de área`,
        );
      }
      console.log(
        `  um offset de fator constante daria espalhamento ~0. Impresso, NÃO gateado: uma\n` +
          `  direção pode ter por eixo seguir a borda do crânio, e um piso aqui a reprovaria\n` +
          `  por definição — seria a régua projetando a peça em vez de julgá-la.`,
      );

      // ---------------------------------------- AS RÉGUAS NOVAS DA ETAPA 1b
      //
      // ESTE É O BLOCO DA FOLHA 1, e ele existe porque as cinco amarras da etapa 1
      // eram todas distâncias às feições: nenhuma perguntava se a peça TOCA o rosto.
      // Uma peça que não encosta em nada passava em todas com folga — e uma peça que
      // não encosta no rosto é um colar. Medido nas três reprovadas: 15,3%, 46,9% e
      // 98,5% da tinta dentro do contorno.
      //
      // Os três números que o Doug pediu para decidir o conjunto de regra saem aqui:
      // **pele em volta da boca em px a 32**, **preto da cabeça em %** e **tinta
      // dentro da silhueta em %**.
      const U_POR_PX_32 = RECORTE_CABECA.h / 32 / ESCALA_PADRAO;

      // O LIMIAR É "PRETO", NÃO "ESCURO", e a diferença é a régua inteira: o núcleo
      // (`CABELO[0]` = #3A2F2A, lum 48,9) também passaria por escuro, e a conta
      // mediria a peça toda em vez do contorno dela. O corte vai no MEIO do caminho
      // entre a linha (#000) e o núcleo — possível porque `palette.test.ts` já cobra
      // `distancia(LINHA, cor) ≥ MIN_CONTORNO` para as 8 cores de cabelo.
      const LUM_NUCLEO = 0.2126 * 0x3a + 0.7152 * 0x2f + 0.0722 * 0x2a;

      /** Internas → pixel do recorte, para `px` de lado. A mesma conta do bloco da banda. */
      const emPxDoRecorte = (p: { x: number; y: number }, px: number) => {
        const t = naTela(p);
        return {
          x: Math.round(((t.x - RECORTE_CABECA.x) / RECORTE_CABECA.w) * px),
          y: Math.round(((t.y - RECORTE_CABECA.y) / RECORTE_CABECA.h) * px),
        };
      };

      /**
       * O PRETO DENTRO DA CAIXA DA CABEÇA — e o denominador é a metade da régua.
       *
       * Contar sobre o quadrado inteiro do recorte daria um número honesto e inútil:
       * a folga lateral de 80 u existe para o `assimetrico` caber, então mais de um
       * terço do quadro é fundo branco, e a fração diria mais sobre a folga que sobre
       * a peça. Dentro da caixa da cabeça a base careca dá **16,5%** — o contorno, os
       * olhos, as sobrancelhas e a boca.
       *
       * ⚠️ O plano da etapa cita 19,5% para "a base", de outra sonda e outro
       * denominador. Os dois números não se comparam, e **quem decide é o delta**: a
       * base sai impressa ao lado da peça em toda linha justamente para ninguém ter de
       * confiar num absoluto de origem esquecida.
       *
       * A base com `chanel` dá **menos** preto que a careca (13,5% contra 16,5%), e
       * isso não é erro: o núcleo castanho do cabelo cobre parte do contorno do crânio.
       */
      const pretoNaCabeca = async (svg: string, px: number) => {
        const d = await rasterizar(emCabeca(svg, px), px, px);
        const a = emPxDoRecorte({ x: CAIXA_CABECA.x0 - TRACO / 2, y: CAIXA_CABECA.y0 - TRACO / 2 }, px);
        const b = emPxDoRecorte({ x: CAIXA_CABECA.x1 + TRACO / 2, y: CAIXA_CABECA.y1 + TRACO / 2 }, px);
        let preto = 0;
        let total = 0;
        for (let y = Math.max(0, a.y); y <= Math.min(px - 1, b.y); y++) {
          for (let x = Math.max(0, a.x); x <= Math.min(px - 1, b.x); x++) {
            const i = 4 * (y * px + x);
            total++;
            if (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2] < LUM_NUCLEO / 2) preto++;
          }
        }
        return total ? preto / total : 0;
      };

      console.log(`\nas réguas da etapa 1b — os três números que decidem o conjunto de regra:`);
      for (const c of compostos) {
        const pisos = c.v.pisos ?? PISOS_DE_PRODUCAO;
        const linhas: string[] = [];

        // O preto da cabeça, no raster de 425 px do recorte, cena por cena. É a
        // pergunta "quanto a peça escurece a cabeça?", e ela só tem resposta no
        // raster: contar área de polígono não sabe o que o traço cobre.
        for (const cn of c.cenas) {
          const peca = await pretoNaCabeca(cn.svg, 425);
          const base = cn.base === cn.svg ? peca : await pretoNaCabeca(cn.base, 425);
          linhas.push(
            `preto da cabeça ${(100 * peca).toFixed(1)}% (${cn.rot}; base ${(100 * base).toFixed(1)}%, ` +
              `${peca >= base ? "+" : ""}${(100 * (peca - base)).toFixed(1)})`,
          );
        }

        if (c.v.barba) {
          const comBigode = c.v.comBigode ?? true;
          const boca = folgaDaBoca(c.v.barba, comBigode);
          const cob = coberturaDoRosto(c.v.barba, comBigode);
          const dq = derivaDoQueixo(c.v.barba, comBigode);
          const ser = serrilhaDaBorda(c.v.barba);
          const toques = mechaTocaAFronteira(c.v.barba);
          linhas.unshift(
            `pele em volta da boca ${boca.toFixed(1)} u = **${(boca / U_POR_PX_32).toFixed(2)} px a 32** ` +
              `(piso desta coluna: ${pisos.boca} u = ${(pisos.boca / U_POR_PX_32).toFixed(2)} px)`,
          );
          linhas.push(
            `tinta dentro da silhueta ${(100 * cob.dentro).toFixed(1)}% · ` +
              `ocupa ${(100 * cob.ocupacao).toFixed(1)}% da área da cabeça`,
          );
          linhas.push(
            dq
              ? `deriva ${dq.deriva.toFixed(1)} u · centro abaixo do queixo x ${dq.centroAbaixo.toFixed(1)} ` +
                `contra o crânio em x ${dq.cranioNoQueixo.toFixed(1)} → desalinho ${dq.desalinho.toFixed(1)}`
              : `deriva — a peça não desce abaixo do queixo, não há do que pender`,
          );
          linhas.push(
            `serrilha da borda de baixo: p50 ${ser.p50.toFixed(1)} u · máx ${ser.max.toFixed(1)} u · ` +
              `${ser.dentes} dentes  (spline lisa dá ~0 — é a assinatura de tecido)`,
          );
          linhas.push(
            `mechas tocam a fronteira a ${toques.map((d) => d.toFixed(1)).join(" · ")} u ` +
              `(máx 16 — acima disso o furo é ilha de preto, e ilha de preto lê como pinta)`,
          );
        }

        console.log(`  ${c.v.nome}`);
        for (const l of linhas) console.log(`      ${l}`);
      }
      console.log(
        `  a pele em volta da boca é o número da decisão: ${(26 / U_POR_PX_32).toFixed(2)} px com as travas de\n` +
          `  hoje contra ${(6 / U_POR_PX_32).toFixed(2)} px com elas cortadas — sub-pixel nos dois tamanhos do produto.`,
      );

      console.log(`\nseparação a ${P} px (piso ${(PISO_SEPARACAO * 100).toFixed(0)}%):`);
      for (let i = 0; i < chapas.length; i++) {
        for (let j = i + 1; j < chapas.length; j++) {
          const uniao = soma(pegadas[i].map((v, k) => v || pegadas[j][k]));
          const d = uniao ? soma(mascara(chapas[i], chapas[j])) / uniao : 0;
          const ruim = d < PISO_SEPARACAO;
          console.log(
            `  ${compostos[i].v.nome.padEnd(14)} × ${compostos[j].v.nome.padEnd(14)} ` +
              `${(d * 100).toFixed(1)}%   (união ${uniao} px)${ruim ? "   ✗" : ""}`,
          );
          if (ruim) {
            reprovacoes.push({
              variante: `${compostos[i].v.nome} × ${compostos[j].v.nome}`,
              detalhe:
                `separação ${(d * 100).toFixed(1)}% a ${P} px. Dos pixels que as duas ` +
                `barbas reivindicam, elas concordam em ${(100 - d * 100).toFixed(1)}% — ` +
                `os eixos prometem silhuetas distintas e a tinta é a mesma.`,
            });
          }
        }
      }

      // ------------------------------------------------- o histograma da banda preta
      //
      // É ESTE NÚMERO QUE RESPONDE À PERGUNTA DA ETAPA. Um `stroke` dá 12 u
      // constantes e espalhamento ZERO; a receita de duas formas cheias dá a
      // espessura que a tabela pediu, ponto a ponto. É o IoU 80,1% × 34,4% dito em
      // régua de espessura, e é o contrário de *"tudo muito quadrado"*.
      //
      // Medido no raster de 425 px, caminhando pela normal — a mesma sonda que
      // `tracar-cabelo.ts` usa para ler arte, virada para o outro lado.
      const G = 425;
      console.log(`\nbanda preta medida no raster de ${G} px (impresso, não gateado):`);
      const uPorPx = RECORTE_CABECA.h / G / 0.92;
      for (const c of compostos) {
        if (!c.v.barba) continue;
        const dados = await rasterizar(emCabeca(c.svg, G), G, G);
        const lum = (x: number, y: number) => {
          if (x < 0 || y < 0 || x >= G || y >= G) return 255;
          const i = 4 * (y * G + x);
          return 0.2126 * dados[i] + 0.7152 * dados[i + 1] + 0.0722 * dados[i + 2];
        };
        const emPx = (p: { x: number; y: number }) => {
          const t = naTela(p);
          return {
            x: Math.round(((t.x - RECORTE_CABECA.x) / RECORTE_CABECA.w) * G),
            y: Math.round(((t.y - RECORTE_CABECA.y) / RECORTE_CABECA.h) * G),
          };
        };

        // O LIMIAR NÃO É "ESCURO", É "PRETO", e a diferença é a régua inteira.
        //
        // A primeira versão usou `lum < 100` e mediu 79,5 u nas três — que era o
        // limite da varredura, não a banda: o núcleo também passa por "escuro", então
        // a sonda atravessava a peça toda sem achar onde o preto acabava. O corte é
        // `LUM_NUCLEO / 2`, declarado uma vez no bloco das réguas da 1b — duas cópias
        // do mesmo limiar seriam duas réguas livres para divergir.
        const ehPreto = (x: number, y: number) => lum(x, y) < LUM_NUCLEO / 2;

        const bandas: number[] = [];
        let saturadas = 0;
        const FORA = 22;
        const DENTRO = 90;
        for (const s of sondasDaBanda(c.v.barba)) {
          const em = (u: number) => {
            const q = emPx({ x: s.p.x + u * s.n.x, y: s.p.y + u * s.n.y });
            return ehPreto(q.x, q.y);
          };
          if (!em(0)) continue;
          let a = 0;
          let b = 0;
          const passo = uPorPx / 2;
          while (a > -FORA && em(a - passo)) a -= passo;
          while (b < DENTRO && em(b + passo)) b += passo;
          // Saturou = a corrida preta encosta num dos extremos da varredura. Ali a
          // barba está colada em OUTRA tinta preta — o contorno do crânio, a massa
          // da `chanel` — e a sonda estaria medindo as duas juntas.
          if (a <= -FORA + passo || b >= DENTRO - passo) saturadas++;
          else bandas.push(b - a);
        }
        bandas.sort((a, b) => a - b);
        const dec = bandaDeclarada(c.v.barba, c.v.comBigode ?? true);
        if (!bandas.length) {
          console.log(
            `  ${c.v.nome.padEnd(14)} nenhuma sonda limpa — a peça encosta em tinta preta ` +
              `em todo o perímetro`,
          );
          continue;
        }
        const p = (q: number) => bandas[Math.min(bandas.length - 1, Math.floor(q * bandas.length))];
        console.log(
          `  ${c.v.nome.padEnd(14)} mín ${bandas[0].toFixed(1).padStart(5)} · ` +
            // p90 e não o máximo: a normal de uma sonda que cai num trecho ESTREITO
          // corre pelo comprimento dele em vez de atravessá-lo, e mede a ponte
          // inteira. Um outlier assim não descreve a banda, e é o máximo que ele
          // sequestra — daí os dois números.
          `p50 ${p(0.5).toFixed(1).padStart(5)} · p90 ${p(0.9).toFixed(1).padStart(5)} · ` +
          `máx ${bandas[bandas.length - 1].toFixed(1).padStart(5)} · ` +
            `espalhamento ${(bandas[bandas.length - 1] - bandas[0]).toFixed(1).padStart(5)} u` +
            `   (declarado: ${dec.min.toFixed(0)}–${dec.max.toFixed(0)}, espalh. ${dec.espalhamento.toFixed(0)})` +
            `   ${bandas.length} sondas limpas, ${saturadas} coladas em outra tinta preta`,
        );
      }
      console.log(
        `  um \`stroke\` daria 12,0 constante e espalhamento 0,0 — é isso que este bloco\n` +
          `  existe para desmentir. Meta: mín ≥ 8, máx 30–34, espalhamento ≥ 22.`,
      );
    }

    // a folha
    const fig = (rot: string, dentro: string) =>
      `<figure style="margin:0;text-align:center">${dentro}` +
      `<figcaption style="font:10px system-ui;color:#777;margin-top:4px">${rot}</figcaption></figure>`;

    /** Os quatro tamanhos de uma cena, lado a lado e alinhados pela base. */
    const tira = (rot: string, svg: string, recorta: boolean) =>
      `<div style="font:10px system-ui;color:#999;margin:2px 0 4px">${rot}</div>` +
      `<div style="display:flex;gap:10px;align-items:flex-end;justify-content:center">` +
      (recorta ? TAMANHOS_CABECA : TAMANHOS)
        .map((t) => fig(`${t}${t === 56 ? " · ranking" : t === 32 ? " · navbar" : ""}`, recorta ? emCabeca(svg, t) : em(svg, t)))
        .join("") +
      `</div>`;

    const colunas = compostos
      .map(
        (c) =>
          `<div style="display:flex;flex-direction:column;gap:6px;align-items:center;` +
          `border:1px solid #eee;border-radius:4px;padding:12px;background:#fff">` +
          `<div style="font:600 13px system-ui;color:#333">${c.v.nome}</div>` +
          `<div style="font:11px system-ui;color:#888;max-width:260px;text-align:center;` +
          `line-height:1.4;min-height:2.8em">${c.v.eixo}</div>` +
          c.cenas.map((cn) => tira(cn.rot, cn.svg, c.recorta)).join("") +
          `<div style="font:10px ui-monospace,monospace;color:#aaa;margin-top:6px">${c.formas} formas · ${c.bytes} B</div>` +
          `</div>`,
      )
      .join("");

    await pg.setViewportSize({ width: Math.max(900, 300 * compostos.length), height: 900 });
    await pg.setContent(
      `<body style="margin:0;background:#FAF8F3;padding:20px;font:12px system-ui;color:#555">` +
        `<div style="display:flex;justify-content:space-between;align-items:baseline">` +
        `<h1 style="font:600 16px system-ui;margin:0 0 4px">Variantes — o Doug escolhe</h1>` +
        `<div style="font:600 15px ui-monospace,monospace;color:#0F1A2E;letter-spacing:.18em;` +
        `border:1px solid #C9A84C;padding:4px 10px;border-radius:2px">${selo}</div>` +
        `</div>` +
        `<p style="margin:0 0 14px;color:#888">O que manda é a coluna de 56 px. ` +
        `Nenhuma está marcada como favorita de propósito.</p>` +
        `<div style="display:flex;gap:14px;align-items:flex-start">${colunas}</div>` +
        `</body>`,
    );
    await pg.screenshot({ path: FOLHA, fullPage: true });
  } finally {
    await nav.close();
  }

  writeFileSync(`${DIAG}/variantes.svg`, compostos.map((c) => c.svg).join("\n"));

  // O SELETOR VIVO lê ESTE arquivo, e é por isso que ele existe.
  //
  // A rota poderia importar o rascunho e compor por conta própria — e aí existiriam
  // duas composições, uma medida pelo gate e outra mostrada ao Doug, livres para
  // divergir. Publicando o SVG já composto, o que ele julga na tela é byte a byte o
  // que a folha mediu.
  //
  // Vai para `public/dev/`, que o `.gitignore` cobre: é artefato de rascunho, não
  // entra no repositório e não quebra o CI quando não existe — a rota trata a
  // ausência dizendo o que rodar.
  mkdirSync("public/dev", { recursive: true });
  writeFileSync(
    "public/dev/variantes.json",
    JSON.stringify(
      {
        selo,
        variantes: compostos.map((c) => ({
          nome: c.v.nome,
          eixo: c.v.eixo,
          formas: c.formas,
          bytes: c.bytes,
          svg: c.svg,
        })),
      },
      null,
      2,
    ),
  );

  console.log(`\n${FOLHA}`);
  console.log(`/dev/avatar-variantes  (public/dev/variantes.json)`);

  if (motivoDeDuas) {
    console.log(`\nDUAS variantes, e o motivo declarado é:\n  "${motivoDeDuas}"`);
  }

  if (reprovacoes.length) {
    console.error(`\n${reprovacoes.length} reprovação(ões):`);
    for (const r of reprovacoes) console.error(`  ✗ ${r.variante}: ${r.detalhe}`);
    process.exitCode = 1;
  } else {
    console.log(
      `\nAs ${variantes.length} passam nas amarras e se distinguem entre si.\n` +
        `Agora ABRA a folha e critique — o selo está nela, e o relatório começa citando ele.`,
    );
  }
}

main().catch((e) => {
  console.error(String(e instanceof Error ? e.message : e));
  process.exit(1);
});
