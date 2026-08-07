/**
 * GATE −1 — A ARTE É A MESMA BASE? Antes de vetorizar, provar que dá para medir.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELE VEM ANTES DE TUDO
 * ---------------------------------------------------------------------------
 *
 * A rota inteira se apoia numa afirmação: *a cabeça da arte É a cabeça do
 * produto, porque a arte foi editada sobre um render do compositor*. Se ela for
 * falsa, tudo que vem depois mede com uma régua errada e sai verde — que é
 * exatamente o modo de falha que este projeto já pagou três folhas para aprender
 * (93ETYY, HSHC93, XHHXP9: *"todos os gates automáticos passaram e a folha visual
 * reprovou"*).
 *
 * E ela **pode** ser falsa, por construção do gerador. A pesquisa de 2026-08-05
 * não achou garantia documentada de preservação pixel a pixel em nenhum editor de
 * imagem por IA: o modelo re-sintetiza a imagem inteira, o SynthID é gravado nos
 * pixels de toda imagem gerada, não há semente, e no app o tamanho pedido é
 * ignorável. Conferir dimensão não basta — cabe um boneco deslocado, ampliado,
 * recortado ou redesenhado dentro de um canvas de 1024 × 1024.
 *
 * ---------------------------------------------------------------------------
 * ELE NÃO CORRIGE NADA, E ISSO É A FUNÇÃO
 * ---------------------------------------------------------------------------
 *
 * Achar o deslocamento e compensá-lo seria fácil e seria o erro: uma arte que
 * voltou 3 px acima é uma arte em que o gerador **redesenhou** o boneco, e a
 * próxima coisa que ele redesenhou pode ser o queixo. Compensar esconde a causa e
 * deixa a peça nascer de uma cabeça que não é a nossa — que é o defeito de modelo
 * medido na `ficha.md` da `curto-espetada` (cúpula 163 u contra 246), o defeito
 * que a rota nova existe para não ter.
 *
 * O deslocamento e a escala são MEDIDOS, e o que se faz com o número é reprovar.
 *
 * ---------------------------------------------------------------------------
 * A INVERSÃO DE 2026-08-06 (BLOCO 2b): A PEÇA É RECONHECIDA ANTES DE SER JULGADA
 * ---------------------------------------------------------------------------
 *
 * O gate supunha que **todo pixel de região protegida é boneco**. A `entrada-2`
 * mostrou o preço: ela reprovou por estar CERTA — 97,4% do que mudou nas regiões
 * protegidas era a própria peça, uma mecha larga caindo na frente do tronco. O
 * próprio repositório já reconhecia o limite por escrito (`base.ts:174-189`): a
 * região do corpo virou silhueta para salvar cabelo que cai AO LADO do tronco, e
 * nada salvava cabelo que cai NA FRENTE dele.
 *
 * A ordem passou a ser em três tempos, e ela importa porque o teste de ciano
 * **não olha para a base** (HSL puro) enquanto a comparação estrutural lê a base
 * no índice idêntico e portanto depende do registro já provado:
 *
 *  1. **hash + dimensão** — independentes da peça, ficam onde estavam;
 *  2. **ciano → máscara preliminar da peça** — não precisa de registro nenhum;
 *  3. **registro + NCC sobre `região ∧ ¬peça`** — o boneco é julgado só onde ele
 *     está visível.
 *
 * O que isso NÃO afrouxa: um gerador que redesenhe o boneco continua reprovando,
 * porque redesenho não é ciano. O que muda é que cabelo legítimo deixa de ser
 * contado como boneco alterado.
 *
 * ---------------------------------------------------------------------------
 * AS TRÊS MEDIDAS, E POR QUE CADA UMA PRECISA DA OUTRA
 * ---------------------------------------------------------------------------
 *
 *  1. **Registro (dx, dy, k)** — busca conjunta que minimiza a soma de diferenças
 *     absolutas sobre a **faixa de rodapé**: tudo abaixo do fim do perfil do
 *     tronco, que é o fundo da roupa mais a sombra do chão.
 *
 *     Era o tronco inteiro, e isso era viés medido. `sad` é média de |Δluminância|,
 *     e cada pixel de PEÇA sobre o tronco entra como resíduo que não zera em
 *     (0, 0, 1) — ele achata o mínimo verdadeiro e oferece um mínimo alternativo
 *     na borda da peça. Com `TOL_DESLOCAMENTO = 1`, bastam 2 px de viés para o
 *     gate acusar um gerador que não mexeu em nada.
 *
 *     O rodapé é **inalcançável por cabelo** — `base.ts:186-189` já declara isso —
 *     e a sombra do chão tem estrutura de verdade: uma elipse com gradiente forte
 *     na borda (`geometria.ts:727-741`). Duas passadas (translação → escala →
 *     translação) em vez de uma varredura 3D, porque as duas são quase ortogonais
 *     nesta figura e a varredura completa custaria 25× sem mudar o mínimo.
 *  2. **Diferença por região** — quantos pixels mudaram, e quão AGRUPADOS estão.
 *     Fração sozinha não separa antialiasing de geometria: uma borda inteira
 *     redesenhada 1 px para o lado dá fração alta e é inofensiva, e um botão
 *     apagado dá fração baixa e é grave. A maior componente conexa é o que
 *     distingue os dois, e é ela que manda nas regiões protegidas.
 *  3. **Hash da base** — a arte foi feita sobre ESTA base? Sem isso, regenerar a
 *     base depois de o Doug ter gerado a arte faria todo o resto medir contra um
 *     boneco que ele nunca viu, e nada acusaria.
 *
 * ---------------------------------------------------------------------------
 * OS TETOS SAEM DAS FIXTURES, NUNCA DA ARTE
 * ---------------------------------------------------------------------------
 *
 * `gates.md` do pipeline vigente diz a regra e diz o motivo: *"teto calibrado na
 * peça que se quer aprovar aprova o defeito junto"*. Os números abaixo foram
 * medidos em `fixtures.ts` — seis imagens sintéticas derivadas da própria base,
 * cada uma violando UMA coisa — e os valores medidos estão no docstring de cada
 * constante. Nenhum deles olhou para uma arte real.
 */

import { readFileSync } from "fs";

import {
  FUNDO,
  LADO,
  MANIFESTO,
  PNG_BASE,
  REGIOES_QUE_REPROVAM,
  type Regiao,
  Y_FIM_TRONCO,
  paraUnidade,
  regiaoDoPixel,
  selo,
} from "./base";
import { mascaraDaPeca } from "./extrair";
import { type Img, carregar, componentes, delta, dilatar, distanciaMatiz, luz, matiz } from "./pixels";
import { type Laudo as LaudoDeCausa, porqueReprovou } from "./porque-reprovou";

// ---------------------------------------------------------------------------
// Os tetos
// ---------------------------------------------------------------------------

/**
 * Quanto um canal precisa mudar para o pixel contar como diferente: **24 níveis**.
 *
 * É o mesmo número que `folha-base.ts` usa no gate (a) de distinção a 56 px, e é
 * o mesmo pela mesma razão: abaixo disso a diferença não se acha olhando. Reusar
 * em vez de escolher um novo evita a segunda régua que diverge da primeira.
 *
 * **Ele mede TINTA, e tinta não reprova.** Ver abaixo.
 */
const NIVEL = 24;

/**
 * ---------------------------------------------------------------------------
 * A CORREÇÃO DE 2026-08-06: O GATE MEDIA COR ONDE PRECISAVA MEDIR FORMA
 * ---------------------------------------------------------------------------
 *
 * A primeira arte real reprovou, e a reprovação era do gate, não da arte.
 *
 * Medido no close de coordenada (`close.ts`, recorte 397,243 de 326×258): o
 * Gemini devolveu as cinco feições do rosto **na mesma caixa, dentro de 1 pixel**
 * — olho esquerdo x 141–278 nos dois, olho direito x 699–836 nos dois, boca e
 * sobrancelhas idem —, a pele inalterada (Δ ≤ 2 níveis em 12 amostras), o
 * contorno da cabeça preto, o corpo com mancha máxima de 3 px, deslocamento (0,0)
 * e escala 100,00%. E repintou o PREENCHIMENTO das feições de `#000000` para
 * cinza-carvão ~`#464646`: 70 níveis em todos os canais.
 *
 * 70 > 24 em cada pixel de olho, sobrancelha e boca. A área inteira do olho
 * acendeu, deu uma mancha de 4 158 px, e o gate reprovou uma arte cuja geometria
 * estava perfeita. As feições sozinhas explicavam 100% da conta.
 *
 * **E a tinta do rosto não importa para esta rota.** O rosto do produto é
 * desenhado pelo `compositor.ts`, não vem da arte — da arte sai só o cabelo. O
 * que uma região protegida precisa provar é *o boneco continua onde estava, do
 * jeito que estava*, porque é disso que depende a afirmação de que a cabeça da
 * arte é a cabeça do produto. Se o gerador pintar o olho de roxo e não mexer um
 * pixel na forma, a peça que sai dali continua correta.
 *
 * Então a régua passou a ser ESTRUTURAL, e a estrutura é medida por CORRELAÇÃO,
 * não por limiar.
 *
 * ---------------------------------------------------------------------------
 * A PRIMEIRA TENTATIVA — BINARIZAR POR LIMIAR — FOI MEDIDA E REPROVADA
 * ---------------------------------------------------------------------------
 *
 * Ela binarizava cada região em tinta/não-tinta com o limiar tirado dos
 * percentis 5 e 95 daquela região naquela imagem, e comparava as máscaras.
 * Funciona no rosto e **falha no corpo**: a fixture F (um quadrado preto de 14 u
 * desenhado sobre a roupa) passou com 0 px de desvio estrutural.
 *
 * A causa é a composição da região, não o código. A região do corpo é ~70% fundo
 * claro e a única coisa escura nela é o contorno do tronco, que dá menos de 5%
 * dos pixels — então o percentil 5 cai *na roupa*, o limiar sobe acima dela, e a
 * roupa passa a ser classificada como tinta nas DUAS imagens. Um quadrado preto
 * sobre roupa já classificada como tinta não muda classe nenhuma.
 *
 * A lição é a de sempre neste repositório: um limiar global é uma escolha que
 * depende do que mais existe na imagem, e o que mais existe muda de região para
 * região.
 *
 * ---------------------------------------------------------------------------
 * O QUE FICOU: NCC POR LADRILHO
 * ---------------------------------------------------------------------------
 *
 * Cada região é varrida em ladrilhos de 16 × 16 px, e cada ladrilho é comparado
 * pela **correlação cruzada normalizada** entre base e arte. A NCC é invariante a
 * qualquer mudança linear de contraste dentro do ladrilho — e uma repintura por
 * classe É linear dentro do ladrilho: no ladrilho do olho a base vale {185, 0} e
 * a arte {185, 70}, que é `arte = 0,62 · base + 70`, correlação 1,000.
 *
 * Já mover a feição um pixel descorrelaciona o ladrilho inteiro, porque a borda
 * deixa de cair onde caía. É exatamente a distinção que se quer.
 *
 * Os ladrilhos CHAPADOS precisam de outra conta, porque correlação de uma
 * constante não existe (desvio-padrão zero). A regra ali é de presença: se um dos
 * dois é chapado e o outro não, apareceu ou sumiu estrutura — é diferença. Se os
 * dois são chapados, a única coisa que pode ter mudado é o tom, e tom não
 * reprova. É o que faz a fixture F ser pega (a roupa é chapada, o quadrado não) e
 * uma repintura uniforme da camisa não ser.
 *
 * A diferença de tinta continua medida e impressa — ela diz o quanto o gerador
 * re-sintetizou —, mas ela **relata**, não reprova.
 */
const LADRILHO = 16;
/** Abaixo deste desvio-padrão de luminância, o ladrilho é chapado. */
const STD_CHAPADO = 3;

/**
 * Quanta variação um ladrilho precisa ter para "apareceu estrutura" valer: **12**.
 *
 * A regra "um chapado e o outro não → é diferença" foi medida e reprovou a
 * fixture E, que precisa passar: um borrão de 0,6 px empurra ladrilhos de baixa
 * variação (desvio 3,5) para baixo do corte de chapado (3,0), e dez deles no
 * corpo viravam reprovação por nada.
 *
 * O que faltava era grandeza. Sair de 3,5 para 2,5 não é estrutura aparecendo nem
 * sumindo, é o mesmo quase-nada com outro nome. Um quadrado preto sobre roupa
 * chapada leva o ladrilho de desvio ~1 para ~50. 12 fica entre os dois e longe
 * dos dois — e é o único número deste arquivo que separa uma fixture que precisa
 * passar de uma que precisa reprovar.
 */
const STD_ESTRUTURA = 12;

/**
 * Deslocamento tolerado: **1 pixel**.
 *
 * Não é zero porque o gerador recomprime a imagem e o arredondamento de um
 * reencode pode mover a borda meio pixel — a fixture E (só antialiasing) mede
 * dx = dy = 0, então 1 é folga e não permissão. As fixtures B (3 px) e D (recorte)
 * ficam muito acima.
 */
const TOL_DESLOCAMENTO = 1;

/**
 * Escala tolerada: **0,5%**.
 *
 * 0,5% de 600 px de figura são 3 px de largura — abaixo do que a busca resolve
 * com passo de 0,25%. A fixture C usa 3%, doze vezes o teto.
 */
const TOL_ESCALA = 0.005;

/**
 * Correlação mínima para um ladrilho ser considerado o mesmo desenho: **0,90**.
 *
 * Medido nas fixtures — os valores estão na tabela de `TETO_LADRILHOS`. O corte
 * fica bem acima do ruído de reamostragem (a fixture E não marca ladrilho nenhum
 * no rosto) e bem abaixo do que um deslocamento de 3 px faz.
 */
const NCC_MIN = 0.9;

/**
 * O QUE REPROVA É O MAIOR GRUPO CONTÍGUO DE LADRILHOS, E ELE É **1**.
 *
 * Ou seja: dois ladrilhos vizinhos marcados já reprovam; um ladrilho sozinho, não.
 *
 * A contagem não serve de critério principal, e as fixtures mostram por quê —
 * medido em 2026-08-06, coluna do CORPO, que é onde as duas se cruzam:
 *
 * | entrada                          | ladrilhos | maior grupo | veredito exigido |
 * |----------------------------------|-----------|-------------|------------------|
 * | E — só antialiasing (borrão 0,6) |     1     |    **1**    | passar           |
 * | arte real do Gemini              |     1     |    **1**    | passar           |
 * | F — quadrado de 14 u no tronco   |     4     |    **4**    | reprovar         |
 * | B — deslocamento de 3 px         |   191     |    175      | reprovar         |
 * | C — escala 103%                  |   220     |    219      | reprovar         |
 * | D — recorte de 60 px             |   254     |    253      | reprovar         |
 *
 * Por contagem, E (1) e F (4) ficam a um passo um do outro e qualquer corte entre
 * eles é arbitrário. Por CONTIGUIDADE eles são coisas diferentes: reamostragem
 * marca ladrilhos **soltos**, espalhados por onde a variação era baixa; alteração
 * de desenho marca ladrilhos **vizinhos**, porque desenho ocupa área.
 *
 * A folga é declarada e é pequena: um defeito que caiba em dois ladrilhos e não
 * encoste em um terceiro passa por aqui. Dois ladrilhos são ~26 unidades do
 * `viewBox` — quase a largura de um olho. Não é uma ordem de grandeza, e não
 * adianta fingir que é. Quem pega menor que isso é a folha.
 */
const TETO_GRUPO = 1;

/**
 * O segundo laço da rede: **2%** dos ladrilhos considerados da região.
 *
 * Existe para o caso que a contiguidade não pega — muitos ladrilhos alterados,
 * todos isolados uns dos outros, que somariam um boneco diferente sem nunca
 * formarem um par. Nas fixtures ele nunca é quem reprova (2% do corpo são 24
 * ladrilhos, e F marca 4), então ele não está calibrado em nada: é rede, não
 * régua, e está declarado como tal.
 */
const TETO_FRACAO_LADRILHOS = 0.02;

/** Alcance da busca de registro, em pixels. Além disso não é desvio, é outra arte. */
const BUSCA = 8;

/**
 * O PISO DE ÁREA DO REGISTRO: **metade** da faixa de rodapé.
 *
 * Ele existe para o gate poder dizer *"o registro não é mensurável"* em vez de
 * ficar verde por vacuidade. Se uma peça cobrir tanto que sobre pouca área, `sad`
 * continua devolvendo um mínimo — só que de uma amostra pequena demais para
 * significar alguma coisa, e um mínimo de ruído é indistinguível de um registro
 * perfeito.
 *
 * É **rede declarada, não teto calibrado**, igual a `TETO_FRACAO_LADRILHOS`: nas
 * artes de hoje o rodapé é inalcançável por cabelo e a fração medida é 100%. Ele
 * está aqui para o dia em que alguém desenhar uma peça que desça até o chão, e
 * para que nesse dia o laudo diga o que aconteceu em vez de aprovar em silêncio.
 */
const PISO_AREA_REGISTRO = 0.5;

/** Os mesmos três de `extrair.ts` — o ciano instrumental do pedido ao Gemini. */
const MATIZ_PECA = 180;
const TOL_MATIZ_PECA = 30;
const SAT_MIN_PECA = 0.18;

// ---------------------------------------------------------------------------
// O laudo
// ---------------------------------------------------------------------------

export interface Desvio {
  diferentes: number;
  fracao: number;
  maiorComponente: number;
  /**
   * Quantos ladrilhos foram de fato AVALIADOS na região.
   *
   * Ele existe porque o laudo o reconstruía por divisão (`diferentes / fracao`),
   * e com zero diferentes a conta é 0/0 e imprimia `de 0` — que se lê como
   * "nenhum ladrilho foi conferido", ou seja o oposto do que aconteceu. Numa
   * coluna que serve de evidência, denominador invisível é pior que ausente.
   */
  considerados: number;
}

export interface MedidaRegiao {
  pixels: number;
  /** Mudança de FORMA. É esta que reprova. */
  estrutura: Desvio;
  /** Mudança de COR. Só relata — ver o docstring de `PERCENTIL_BAIXO`. */
  tinta: Desvio;
  reprova: boolean;
}

export interface Laudo {
  aprovada: boolean;
  motivos: string[];
  base: { versao: string; hashManifesto: string; hashArquivo: string; confere: boolean };
  dimensoes: { base: [number, number]; arte: [number, number]; confere: boolean };
  registro: {
    dx: number;
    dy: number;
    escala: number;
    confere: boolean;
    /** Quanto da faixa de rodapé sobrou depois de tirar a peça. Ver `PISO_AREA_REGISTRO`. */
    fracaoMensuravel: number;
    mensuravel: boolean;
  };
  regioes: Record<Regiao, MedidaRegiao>;
  /** A máscara preliminar da peça, por matiz. É ela que sai do julgamento. */
  peca: Uint8Array;
  /**
   * A CAUSA, SEMPRE — não mais diagnóstico opcional.
   *
   * Com a inversão, a peça passa a ser *definida* pelo teste de matiz em vez de
   * conferida. O que quebra essa circularidade é imprimir SEMPRE quanto do que
   * mudou em rosto/corpo é peça, quanto é repintura e quanto não se explica — em
   * arte aprovada e em arte reprovada, igual. Um gate que só mostra a causa quando
   * reprova não deixa ninguém conferir o critério dele.
   */
  causa: LaudoDeCausa;
  /** A máscara das diferenças, para a extração e a folha reusarem. */
  diferenca: Uint8Array;
  arte: Img;
  baseImg: Img;
}

/**
 * O desvio ESTRUTURAL de uma região, em ladrilhos. Ver o docstring de `LADRILHO`.
 *
 * Devolve também a máscara de ladrilhos marcados, em resolução de ladrilho, para
 * a folha poder desenhar onde a estrutura mudou.
 */
function desvioEstrutural(
  base: Img,
  arte: Img,
  mapa: Uint8Array,
  idx: number,
  peca: Uint8Array,
): { considerados: number; diferentes: number; maiorGrupo: number; marcados: Uint8Array; tw: number; th: number } {
  const tw = Math.ceil(base.w / LADRILHO);
  const th = Math.ceil(base.h / LADRILHO);
  const marcados = new Uint8Array(tw * th);
  let considerados = 0;
  let diferentes = 0;

  for (let ty = 0; ty < th; ty++) {
    for (let tx = 0; tx < tw; tx++) {
      let n = 0,
        sb = 0,
        sa = 0,
        sbb = 0,
        saa = 0,
        sba = 0;
      for (let y = ty * LADRILHO; y < Math.min(base.h, (ty + 1) * LADRILHO); y++) {
        for (let x = tx * LADRILHO; x < Math.min(base.w, (tx + 1) * LADRILHO); x++) {
          const i = y * base.w + x;
          // `região ∧ ¬peça` — o boneco é julgado só onde ele está visível. Onde a
          // peça cobre não há o que comparar: a base tem boneco e a arte tem
          // cabelo, e a NCC de duas coisas diferentes é baixa porque elas SÃO
          // diferentes, não porque o gerador mexeu no boneco.
          if (mapa[i] !== idx || peca[i]) continue;
          const j = i * 3;
          const vb = luz(base.data[j], base.data[j + 1], base.data[j + 2]);
          const va = luz(arte.data[j], arte.data[j + 1], arte.data[j + 2]);
          n++;
          sb += vb;
          sa += va;
          sbb += vb * vb;
          saa += va * va;
          sba += vb * va;
        }
      }
      // Menos de meio ladrilho na região: a estatística seria de uma borda, não
      // de um pedaço de desenho.
      if (n < (LADRILHO * LADRILHO) / 2) continue;
      considerados++;

      const mb = sb / n;
      const ma = sa / n;
      const vb = Math.max(0, sbb / n - mb * mb);
      const va = Math.max(0, saa / n - ma * ma);
      const dpB = Math.sqrt(vb);
      const dpA = Math.sqrt(va);
      const chapadoB = dpB < STD_CHAPADO;
      const chapadoA = dpA < STD_CHAPADO;

      let difere: boolean;
      if (chapadoB && chapadoA) {
        difere = false; // os dois chapados: só o tom pode ter mudado
      } else if (chapadoB || chapadoA) {
        // Um chapado e o outro não. Só conta se o que apareceu (ou sumiu) for
        // estrutura DE VERDADE — ver `STD_ESTRUTURA`.
        difere = Math.max(dpB, dpA) > STD_ESTRUTURA;
      } else {
        const cov = sba / n - mb * ma;
        difere = cov / (dpB * dpA) < NCC_MIN;
      }
      if (difere) {
        marcados[ty * tw + tx] = 1;
        diferentes++;
      }
    }
  }
  return { considerados, diferentes, maiorGrupo: 0, marcados, tw, th };
}

/** Mapa de região por pixel. Calculado uma vez: são 1 M de chamadas. */
export function mapaDeRegioes(w: number, h: number): Uint8Array {
  const ordem: Regiao[] = ["rosto", "corpo", "sobrancelha", "permitida"];
  const mapa = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      mapa[y * w + x] = ordem.indexOf(regiaoDoPixel(x, y));
    }
  }
  return mapa;
}
export const REGIOES: Regiao[] = ["rosto", "corpo", "sobrancelha", "permitida"];

/**
 * Soma de diferenças absolutas de luminância entre base e arte, sobre a máscara,
 * com a arte lida em (x·k + dx, y·k + dy) em torno do centro do canvas.
 *
 * Amostra de 2 em 2 pixels: são ~200 mil pixels de tronco e 289 deslocamentos
 * candidatos, e a metade da amostra move o mínimo em menos de um décimo de pixel.
 */
function sad(base: Img, arte: Img, alvo: Uint8Array, dx: number, dy: number, k: number): number {
  const c = LADO / 2;
  let soma = 0;
  let n = 0;
  for (let y = 0; y < base.h; y += 2) {
    for (let x = 0; x < base.w; x += 2) {
      if (!alvo[y * base.w + x]) continue;
      const ax = Math.round(c + (x - c) * k + dx);
      const ay = Math.round(c + (y - c) * k + dy);
      if (ax < 0 || ay < 0 || ax >= arte.w || ay >= arte.h) continue;
      const i = (y * base.w + x) * 3;
      const j = (ay * arte.w + ax) * 3;
      soma += Math.abs(
        luz(base.data[i], base.data[i + 1], base.data[i + 2]) -
          luz(arte.data[j], arte.data[j + 1], arte.data[j + 2]),
      );
      n++;
    }
  }
  return n === 0 ? Infinity : soma / n;
}

export async function gateMenosUm(caminhoArte: string): Promise<Laudo> {
  const manifesto = JSON.parse(readFileSync(MANIFESTO, "utf-8"));
  const hashArquivo = selo(readFileSync(PNG_BASE));
  const motivos: string[] = [];

  const baseImg = await carregar(PNG_BASE, FUNDO);
  const arte = await carregar(caminhoArte, FUNDO);

  const confereHash = hashArquivo === manifesto.hash.png;
  if (!confereHash) {
    motivos.push(
      `a base no disco não é a do manifesto — a arte pode ter sido feita sobre outro boneco`,
    );
  }

  const confereDim = arte.w === baseImg.w && arte.h === baseImg.h;
  if (!confereDim) {
    motivos.push(
      `dimensões: a arte tem ${arte.w}×${arte.h} e a base tem ${baseImg.w}×${baseImg.h}`,
    );
  }

  const mapa = mapaDeRegioes(baseImg.w, baseImg.h);

  // ------------------------------------- TEMPO 2: a peça PRELIMINAR, só por matiz
  //
  // Nenhuma linha aqui olha para a base, e é isso que torna lícito usar esta
  // máscara ANTES de o registro estar provado. Só o ciano entra — o traço da peça
  // depende de comparar com a base no índice idêntico, e comparar índices é
  // exatamente o que o registro ainda não garantiu.
  const nPx = baseImg.w * baseImg.h;
  const preliminar = new Uint8Array(nPx);
  if (confereDim) {
    for (let i = 0; i < nPx; i++) {
      const j = i * 3;
      const { h, s } = matiz(arte.data[j], arte.data[j + 1], arte.data[j + 2]);
      if (s >= SAT_MIN_PECA && distanciaMatiz(h, MATIZ_PECA) <= TOL_MATIZ_PECA) preliminar[i] = 1;
    }
  }

  // ------------------------------------- TEMPO 3: registro sobre o rodapé
  //
  // A faixa abaixo do fim do perfil do tronco, menos o que a peça cobrir. Ver o
  // docstring do topo: era o tronco inteiro, e a peça sobre ele enviesava o SAD.
  const nominal = new Uint8Array(nPx);
  for (let y = 0; y < baseImg.h; y++) {
    for (let x = 0; x < baseImg.w; x++) {
      nominal[y * baseImg.w + x] = paraUnidade(x, y).y > Y_FIM_TRONCO ? 1 : 0;
    }
  }
  const alvo = new Uint8Array(nPx);
  let areaNominal = 0;
  let areaAlvo = 0;
  for (let i = 0; i < nPx; i++) {
    if (!nominal[i]) continue;
    areaNominal++;
    if (!preliminar[i]) (alvo[i] = 1), areaAlvo++;
  }
  const fracaoMensuravel = areaNominal ? areaAlvo / areaNominal : 0;
  const registroMensuravel = fracaoMensuravel >= PISO_AREA_REGISTRO;
  if (confereDim && !registroMensuravel) {
    motivos.push(
      `o registro NÃO é mensurável: a peça cobre ${((1 - fracaoMensuravel) * 100).toFixed(1)}% ` +
        `da faixa de rodapé, e sobram ${areaAlvo} px de ${areaNominal} ` +
        `(piso ${(PISO_AREA_REGISTRO * 100).toFixed(0)}%). Um mínimo de amostra pequena é ` +
        `indistinguível de um registro perfeito — o gate não aprova por vacuidade`,
    );
  }

  // ------------------------------------------------------------- o registro
  let dx = 0,
    dy = 0,
    k = 1;
  if (confereDim) {
    let melhor = Infinity;
    for (let cy = -BUSCA; cy <= BUSCA; cy++) {
      for (let cx = -BUSCA; cx <= BUSCA; cx++) {
        const v = sad(baseImg, arte, alvo, cx, cy, 1);
        if (v < melhor) (melhor = v), (dx = cx), (dy = cy);
      }
    }
    for (let c = -12; c <= 12; c++) {
      const cand = 1 + c * 0.0025;
      const v = sad(baseImg, arte, alvo, dx, dy, cand);
      if (v < melhor) (melhor = v), (k = cand);
    }
    for (let cy = dy - 2; cy <= dy + 2; cy++) {
      for (let cx = dx - 2; cx <= dx + 2; cx++) {
        const v = sad(baseImg, arte, alvo, cx, cy, k);
        if (v < melhor) (melhor = v), (dx = cx), (dy = cy);
      }
    }
  }
  const confereRegistro =
    confereDim &&
    Math.abs(dx) <= TOL_DESLOCAMENTO &&
    Math.abs(dy) <= TOL_DESLOCAMENTO &&
    Math.abs(k - 1) <= TOL_ESCALA;
  if (confereDim && !confereRegistro) {
    motivos.push(
      `registro: deslocamento (${dx}, ${dy}) px e escala ${(k * 100).toFixed(2)}% — ` +
        `o gerador moveu ou redimensionou o boneco`,
    );
  }

  // ------------------------- TEMPO 3b: com o registro provado, o traço completa
  //
  // Agora — e só agora — é lícito perguntar "este pixel era escuro na base?", que
  // é a pergunta que o traço da peça depende de responder. A máscara completa é a
  // MESMA de `extrair.ts`, pela mesma função, sem limitar por região: é dentro das
  // protegidas que o gate precisa saber onde a peça está.
  //
  // Sem este tempo a inversão fica pela metade, e a `entrada-2` mediu quanto: com
  // ciano só, o contorno preto da mecha sobre o tronco continuava sendo julgado
  // como boneco redesenhado, e a arte reprovava do mesmo jeito.
  //
  // E ela é DILATADA 2 px. Toda borda vetorial rasterizada tem uma orla de
  // antialiasing de ~1 px em que a cor é mistura de peça e fundo — nem ciano o
  // bastante para o teste de matiz, nem escura o bastante para o de traço. Esses
  // pixels mudaram muito em relação à base e não são boneco redesenhado: são a
  // beira da peça. Sem a orla, a `entrada-2` continuava marcando ladrilhos ao
  // longo de todo o contorno da mecha.
  //
  // 2 px é a orla, não folga de julgamento: ela não move o registro (que é medido
  // no rodapé, longe daqui) e não esconde deslocamento (que já foi medido como
  // número próprio).
  const ORLA = 2;
  const peca = confereDim
    ? dilatar(mascaraDaPeca(arte, baseImg, false).peca, baseImg.w, baseImg.h, ORLA)
    : preliminar;

  // -------------------------------------------------- a diferença por região
  const n = nPx;
  const diferenca = new Uint8Array(n);
  const conta: Record<string, { pixels: number; diferentes: number }> = {};
  for (const r of REGIOES) conta[r] = { pixels: 0, diferentes: 0 };
  if (confereDim) {
    for (let y = 0; y < baseImg.h; y++) {
      for (let x = 0; x < baseImg.w; x++) {
        const i = y * baseImg.w + x;
        const r = REGIOES[mapa[i]];
        conta[r].pixels++;
        if (delta(baseImg, arte, x, y) > NIVEL) {
          diferenca[i] = 1;
          conta[r].diferentes++;
        }
      }
    }
  }

  const medir = (mascara: Uint8Array, total: number): Desvio => {
    let d = 0;
    for (let i = 0; i < mascara.length; i++) if (mascara[i]) d++;
    const comps = componentes(mascara, baseImg.w, baseImg.h);
    return {
      diferentes: d,
      fracao: total ? d / total : 0,
      maiorComponente: comps.length ? comps[0].area : 0,
      considerados: total,
    };
  };

  const regioes = {} as Record<Regiao, MedidaRegiao>;
  const ladrilhos = {} as Record<Regiao, Uint8Array>;
  for (const r of REGIOES) {
    const idx = REGIOES.indexOf(r);
    const total = conta[r].pixels;

    const soTinta = new Uint8Array(n);
    for (let i = 0; i < n; i++) soTinta[i] = diferenca[i] && mapa[i] === idx ? 1 : 0;

    let estrutura: Desvio = { diferentes: 0, fracao: 0, maiorComponente: 0, considerados: 0 };
    if (confereDim) {
      const e = desvioEstrutural(baseImg, arte, mapa, idx, peca);
      const grupos = componentes(e.marcados, e.tw, e.th);
      estrutura = {
        diferentes: e.diferentes,
        fracao: e.considerados ? e.diferentes / e.considerados : 0,
        maiorComponente: grupos.length ? grupos[0].area : 0,
        considerados: e.considerados,
      };
      ladrilhos[r] = e.marcados;
    }

    const protegida = REGIOES_QUE_REPROVAM.includes(r);
    const reprova =
      confereDim &&
      protegida &&
      (estrutura.maiorComponente > TETO_GRUPO || estrutura.fracao > TETO_FRACAO_LADRILHOS);
    if (reprova) {
      motivos.push(
        `região protegida "${r}": a FORMA mudou — ${estrutura.diferentes} ladrilho(s) ` +
          `de 16 px, maior grupo contíguo ${estrutura.maiorComponente} (teto ${TETO_GRUPO}). ` +
          `Repintura não faz isso; deslocamento e redesenho fazem`,
      );
    }
    regioes[r] = { pixels: total, estrutura, tinta: medir(soTinta, total), reprova };
  }

  // A causa só existe se houver o que comparar pixel a pixel. Com dimensões
  // diferentes não há índice comum, e é por isso que a dimensão é o TEMPO 1.
  const causa: LaudoDeCausa = confereDim
    ? await porqueReprovou(caminhoArte)
    : {
        conta: {},
        caixa: {},
        soma: { peca: 0, repintura: 0, outro: 0 },
        total: 0,
        fracao: { peca: 0, repintura: 0, outro: 0 },
        painel: "",
      };

  return {
    aprovada: motivos.length === 0,
    motivos,
    base: {
      versao: manifesto.versao,
      hashManifesto: manifesto.hash.png,
      hashArquivo,
      confere: confereHash,
    },
    dimensoes: { base: [baseImg.w, baseImg.h], arte: [arte.w, arte.h], confere: confereDim },
    registro: { dx, dy, escala: k, confere: confereRegistro, fracaoMensuravel, mensuravel: registroMensuravel },
    regioes,
    peca,
    causa,
    diferenca,
    arte,
    baseImg,
  };
}

export function imprimirLaudo(l: Laudo, caminho: string): void {
  console.log(`GATE −1 — ${caminho}\n`);
  console.log(`  Base oficial:        ${l.base.versao}  ${l.base.hashManifesto.slice(0, 12)}`);
  console.log(
    `  Base no disco:       ${l.base.hashArquivo.slice(0, 12)}  ${l.base.confere ? "confere" : "NÃO CONFERE"}`,
  );
  console.log(`  Base:                ${l.dimensoes.base[0]} × ${l.dimensoes.base[1]}`);
  console.log(`  Arte entregue:       ${l.dimensoes.arte[0]} × ${l.dimensoes.arte[1]}`);
  console.log(`  Deslocamento X:      ${l.registro.dx} px`);
  console.log(`  Deslocamento Y:      ${l.registro.dy} px`);
  console.log(`  Escala estimada:     ${(l.registro.escala * 100).toFixed(2)}%`);
  console.log(
    `  Rodapé mensurável:   ${(l.registro.fracaoMensuravel * 100).toFixed(1)}% ` +
      `${l.registro.mensuravel ? "· acima do piso" : "✗ ABAIXO DO PISO — a peça cobre o rodapé"}`,
  );
  console.log(`\n  região         FORMA — ladrilhos 16px      TINTA — pixels`);
  console.log(`                 difer.  de     maior       px       %`);
  for (const r of REGIOES) {
    const m = l.regioes[r];
    const protegida = REGIOES_QUE_REPROVAM.includes(r);
    const marca = protegida ? (m.reprova ? "✗" : "·") : " ";
    const e = m.estrutura;
    const de = e.considerados;
    console.log(
      `  ${marca} ${r.padEnd(11)} ${String(e.diferentes).padStart(6)} ${String(de).padStart(6)} ` +
        `${String(e.maiorComponente).padStart(6)}  ${String(m.tinta.diferentes).padStart(8)} ` +
        `${(m.tinta.fracao * 100).toFixed(2).padStart(6)}%` +
        (protegida ? "" : "   ← só relata"),
    );
  }
  // A CAUSA ENTRA SEMPRE, aprovada ou não — ver o campo `causa` do laudo.
  const c = l.causa;
  console.log(`\n  A CAUSA do que mudou nas protegidas (${c.total} px)`);
  if (!c.total) {
    console.log(`    nada mudou.`);
  } else {
    console.log(
      `    PEÇA cobrindo o boneco   ${String(c.soma.peca).padStart(7)} px  ${c.fracao.peca.toFixed(1).padStart(5)}%   ← sai do julgamento`,
    );
    console.log(
      `    REPINTURA das feições    ${String(c.soma.repintura).padStart(7)} px  ${c.fracao.repintura.toFixed(1).padStart(5)}%   ← tinta, não forma`,
    );
    console.log(
      `    NÃO EXPLICADO            ${String(c.soma.outro).padStart(7)} px  ${c.fracao.outro.toFixed(1).padStart(5)}%`,
    );
    for (const r of REGIOES_QUE_REPROVAM) {
      const b = c.caixa[r];
      if (b.x1 < 0) continue;
      const a0 = paraUnidade(b.x0, b.y0);
      const a1 = paraUnidade(b.x1, b.y1);
      console.log(
        `    caixa em "${r}"   u x ${a0.x.toFixed(0)}→${a1.x.toFixed(0)}  y ${a0.y.toFixed(0)}→${a1.y.toFixed(0)}`,
      );
    }
    console.log(`    painel em ${c.painel}`);
  }

  console.log(`\n  Resultado: ${l.aprovada ? "APROVADA" : "REPROVADA"}`);
  for (const m of l.motivos) console.log(`    ✗ ${m}`);
  if (!l.aprovada) {
    console.log(
      `\n  Nada é corrigido automaticamente, de propósito. Gere a arte de novo sobre` +
        `\n  a base oficial — corrigir aqui esconderia o gerador ter redesenhado o boneco.`,
    );
  }
}

if (process.argv[1]?.endsWith("gate-menos-um.ts")) {
  const caminho = process.argv[2] ?? `${".scratch/arte"}/entrada.png`;
  gateMenosUm(caminho)
    .then((l) => {
      imprimirLaudo(l, caminho);
      process.exit(l.aprovada ? 0 : 1);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
