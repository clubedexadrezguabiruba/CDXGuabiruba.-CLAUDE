/**
 * A BARBA DE ARTE VIRANDO `formas[]` — a esteira de quem RECOLORE.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ESTA ESTEIRA É OUTRA, E NÃO A DO TRAJE
 * ---------------------------------------------------------------------------
 *
 * A pergunta que bifurca toda peça nova é uma só (Regra Inviolável nº 4, doc 19
 * §12): **a peça recolore?** Traje, chapéu, óculos e pet têm cor assada, saem por
 * `peca-de-arte.ts` como `.svg` avulso e o compositor os cola com `<image>`. A
 * barba recolore junto com o cabelo (D17) — um `.svg` de cor assada seria preto
 * fixo — então ela tem de sair em **caminhos com token de cor**, no modo `formas`
 * de `PecaSobreposta`.
 *
 * É por isso que este arquivo existe ao lado de `peca-de-arte.ts` em vez de
 * reusá-lo: não é outra configuração de traçador, é outro **destino de tipo**.
 *
 * ---------------------------------------------------------------------------
 * SÃO DUAS FORMAS, E A SEGUNDA É A PRIMEIRA MENOS O QUE O GERADOR PINTOU DE PRETO
 * ---------------------------------------------------------------------------
 *
 *   forma 1 — a silhueta INTEIRA da peça, preta. O que sobra dela à vista, depois
 *             da forma 2 por cima, é exatamente a banda de contorno pintada.
 *   forma 2 — o miolo: os pixels da peça que NÃO são contorno, em
 *             `var(--av-cabelo, …)`.
 *
 * É a mesma receita da barba paramétrica (`rosto.ts`, `pecaDeRosto`) — massa preta
 * embaixo, núcleo colorido por cima —, e a mesma da família **transcrita** do
 * cabelo (doc 19 §4), que mede IoU 80,1% contra 34,4% da sintetizada. A diferença
 * é de onde vem a fronteira entre as duas: lá de um `recuo` escrito à mão, aqui do
 * pixel que o gerador pintou.
 *
 * O corte entre contorno e miolo é **luminância < 60**, e não é escolha nova: é
 * exatamente a regra da folha que o Doug aprovou em 2026-08-19
 * (`.scratch/folha-recolorida.ts`), onde `lum < 60` vira preto e o resto recebe a
 * cor do cabelo. Reproduzir no SVG a mesma partição que ele julgou no raster é o
 * ponto inteiro desta esteira.
 *
 * ---------------------------------------------------------------------------
 * `semTraco` NAS DUAS, E ISSO FECHA O G29
 * ---------------------------------------------------------------------------
 *
 * O compositor traça com `kk-traco`, 12 u centrados na fronteira. Medido em
 * 2026-08-19 (`.scratch/perfil-boca.ts`): com esse traço o bigode e a boca
 * **fundem** a 56 e a 32 px; com o contorno pintado pelo gerador (5,2 u) sobra
 * 1 px de pele entre os dois e a peça lê. A decisão do Doug: peça de arte usa o
 * contorno pintado. `semTraco: true` nas duas formas é como isso se escreve.
 *
 * ---------------------------------------------------------------------------
 * O QUE ELE NÃO FAZ
 * ---------------------------------------------------------------------------
 *
 * Não repara arte. A entrada é o PNG já aprovado no Gate −1 e já passado pela
 * quarta saída (`restaurar-peca.ts`, e no caso da `cheia` também
 * `reparo-cheia-um-tom.ts`). Aqui só se traça o que existe.
 *
 * Uso:
 *   npx tsx scripts/avatar/arte/barba-para-formas.ts scripts/avatar/arte/barba-cheia.png
 *   ... --sem-limite   (não recorta as feições — só para medir o que o recorte custa)
 */
import { Potrace } from "potrace";
import sharp from "sharp";

import { ESCALA, FEICOES, FUNDO, LADO, ORIGEM, PNG_BASE, paraPx } from "./base";

// ---------------------------------------------------------------------------
// As réguas, todas com o número que as funda
// ---------------------------------------------------------------------------

/** Diferença por canal que conta como peça. O mesmo nível do Gate −1. */
const NIVEL = 24;
/** Componente solta menor que isto, em fração da maior, é ruído. O mesmo de `extrair.ts`. */
const PISO_SOLTA = 0.05;
/** Luminância abaixo da qual o pixel é CONTORNO. A régua da folha aprovada. */
const LUM_CONTORNO = 60;

/**
 * A ILHA MÍNIMA — 50 px² no canvas de edição, e o número sai da SOBRANCELHA.
 *
 * `turdSize` do `potrace` descarta caminho menor que N px², de qualquer polaridade:
 * ilha solta e furo. Em `estilo/rotas/potrace.ts` ele é **0**, e o argumento de lá
 * continua de pé — o destino ali é `Cabelo.massa`, e um `turdSize` "razoável"
 * decapitava a ponta da coroa, que estava desconectada na máscara.
 *
 * Aqui a pergunta é outra e tem número próprio. Medido na `cheia`
 * (`.scratch/bancada-barba-bytes.ts`): o miolo são **389 ilhas**, e duas delas —
 * 30 421 px e 846 px — somam **97,4%** da tinta. As outras 387 medem no máximo
 * 33 px cada, que é **0,28 px de lado num boneco de 56 px**. O limite do legível
 * nessa escala é a sobrancelha inteira, 0,66 px (`cabelo.ts:334-337`, e é a mesma
 * régua que decide `fiel` × `lei` no doc 19 §3): 0,66 px a 56 são ~7 px de lado no
 * canvas de 1024, ou **50 px² de área**.
 *
 * Elas não são textura — são o antialias da borda do gerador virando ilha. Traçá-las
 * custou **25 274 bytes de `d` contra 6 456**, quatro vezes o desenho, para pintar
 * o que ninguém vê em tamanho nenhum.
 */
const TURD = 50;

/**
 * `potrace` sobre máscara binária — os mesmos parâmetros medidos em
 * `estilo/rotas/potrace.ts`, com UMA diferença deliberada.
 *
 * Lá `optCurve` fica desligado porque o destino é `Cabelo.massa`, que é lista de
 * PONTOS: otimizar em Bézier ali seria aproximar duas vezes para chegar ao mesmo
 * tipo de dado com que se começou. Aqui o destino é o `d` que o navegador pinta —
 * a Bézier é a forma final, não uma etapa —, e desligá-la custaria bytes sem
 * comprar fidelidade nenhuma.
 */
const POTRACE = {
  turnPolicy: "minority" as const,
  turdSize: TURD,
  alphaMax: 0.6,
  optCurve: true,
  optTolerance: 0.2,
  threshold: 128,
  blackOnWhite: true,
};

/** Quantas casas o `d` guarda, em unidades. 0,1 u = 0,12 px da base de edição. */
const CASAS = 1;


const cru = (p: string) =>
  sharp(p).flatten({ background: FUNDO }).removeAlpha().raw().toBuffer({ resolveWithObject: true });

/** A maior componente conexa, mais toda componente >= `PISO_SOLTA` dela. */
function componentes(m: Uint8Array, W: number, H: number, piso = PISO_SOLTA) {
  const n = W * H;
  const rotulo = new Int32Array(n).fill(-1);
  const tam: number[] = [];
  for (let i = 0; i < n; i++) {
    if (rotulo[i] >= 0 || !m[i]) continue;
    const r = tam.length;
    let t = 0;
    const fila = [i];
    rotulo[i] = r;
    while (fila.length) {
      const p = fila.pop()!;
      t++;
      const x = p % W;
      const y = (p / W) | 0;
      for (const q of [
        x > 0 ? p - 1 : -1,
        x < W - 1 ? p + 1 : -1,
        y > 0 ? p - W : -1,
        y < H - 1 ? p + W : -1,
      ])
        if (q >= 0 && rotulo[q] < 0 && m[q]) {
          rotulo[q] = r;
          fila.push(q);
        }
    }
    tam.push(t);
  }
  const maior = tam.length ? Math.max(...tam) : 0;
  const corte = maior * piso;
  const out = new Uint8Array(n);
  let mantidos = 0;
  let descartados = 0;
  for (let i = 0; i < n; i++) {
    if (rotulo[i] < 0) continue;
    if (tam[rotulo[i]] >= corte) {
      out[i] = 1;
      mantidos++;
    } else descartados++;
  }
  return {
    m: out,
    mantidos,
    descartados,
    quantas: tam.filter((t) => t >= corte).length,
    tamanhos: tam,
  };
}

/** Máscara binária -> `d` do `potrace`, em pixels do canvas. */
async function tracar(m: Uint8Array, W: number, H: number): Promise<string> {
  const buf = Buffer.alloc(W * H);
  for (let i = 0; i < W * H; i++) buf[i] = m[i] ? 0 : 255; // preto = tinta
  const png = await sharp(buf, { raw: { width: W, height: H, channels: 1 } }).png().toBuffer();
  const p = new Potrace(POTRACE);
  await new Promise<void>((ok, falhar) => p.loadImage(png, (e) => (e ? falhar(e) : ok())));
  const d = /d="([^"]*)"/.exec(p.getPathTag())?.[1];
  if (!d) throw new Error("potrace devolveu um `<path>` sem `d`");
  return d;
}

/**
 * O `d` de pixels do canvas para unidades do `viewBox`.
 *
 * Só comandos ABSOLUTOS aparecem — é o que o `potrace` emite —, e qualquer letra
 * fora da lista **explode** em vez de passar reto: um `h`/`v` relativo transformado
 * como se fosse par (x, y) sairia deslocado, e o defeito só apareceria na tela.
 */
export function paraUnidades(d: string): string {
  const partes = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const saida: string[] = [];
  let i = 0;
  const u = (v: number, eixo: "x" | "y") =>
    ((v - (eixo === "x" ? ORIGEM.x : ORIGEM.y)) / ESCALA).toFixed(CASAS).replace(/\.0$/, "");
  while (i < partes.length) {
    const c = partes[i++];
    if (c === "Z" || c === "z") {
      saida.push("Z");
      continue;
    }
    const pares = c === "M" || c === "L" ? 1 : c === "C" ? 3 : -1;
    if (pares < 0) throw new Error(`comando \`${c}\` fora de M/L/C/Z no \`d\` do potrace`);
    // O `potrace` REPETE o grupo de coordenadas sem repetir a letra ("C" seguido de
    // 6, 12, 18 números). Consumir só um grupo por letra deixaria o resto dos
    // números virando "comando" na volta do laço — foi o que a primeira versão fez.
    const n: string[] = [];
    do {
      for (let k = 0; k < pares; k++) {
        n.push(u(Number(partes[i++]), "x"), u(Number(partes[i++]), "y"));
      }
    } while (i < partes.length && /^[-\d.]/.test(partes[i]));
    saida.push(c + n.join(" "));
  }
  return saida.join("");
}


// ---------------------------------------------------------------------------
// A peça
// ---------------------------------------------------------------------------

export interface RostoDeArte {
  /** `barba-cheia.png` → `rosto-barba-cheia`. */
  slug: string;
  /** O caminho do PNG de origem. */
  arte: string;
  /** As duas formas, na ordem de desenho. */
  formas: { d: string; cor: string; semTraco: true }[];
  pxPeca: number;
  pxContorno: number;
  pxNucleo: number;
  pxNoRosto: number;
  ruidoDaPeca: number;
  /** As ilhas de miolo, e quantas delas o `turdSize` guarda. */
  ilhasDoNucleo: number;
  ilhasGuardadas: number;
  componentes: number;
  /** A máscara final da peça, para quem quiser medir fidelidade contra o render. */
  mascara: Uint8Array;
  mascaraDoNucleo: Uint8Array;
}

/**
 * `barba-cheia.png` → `rosto-barba-cheia`.
 *
 * O prefixo `rosto-` é o do SLOT, e ele é obrigatório: `avatar_catalogo` tem uma
 * chave primária só para os quatro slots, e `chapeu-bone` e `rosto-bone` são peças
 * diferentes que sem o prefixo colidiriam.
 */
export const slugDoRosto = (caminhoArte: string): string =>
  `rosto-${(caminhoArte.split(/[\/]/).pop() ?? "").replace(/\.png$/i, "")}`;

/**
 * A COR DE CADA FORMA, e as duas reservas estão escritas aqui de propósito.
 *
 * `--av-cabelo` só é emitido quando há `modeloCabelo` (`compositor.ts:876-878`).
 * Num boneco CARECA a variável não existe, e sem reserva declarada o `fill` cai no
 * valor inicial do SVG — **preto**. A barba inteira viraria uma mancha sólida da
 * cor do próprio contorno, e nenhuma régua desta etapa acusaria: elas medem forma,
 * não cor.
 *
 * A reserva é `#262626` porque foi a que o Doug julgou. A folha recolorida de
 * 2026-08-19 (`.scratch/folha-recolorida.ts`) desenhou as três barbas na coluna
 * "careca · reserva #262626" ao lado das 8 cores da D27, e o parecer foi *"está
 * ótimo agora"* — depois de ele ter pedido explicitamente *"a cor reserva será
 * preta com tons de preto mais fraco"*. Ela NÃO é a `#5A4632` da barba paramétrica:
 * lá a reserva é a cor modal do cabelo, e a decisão de 2026-08-19 é outra.
 */
export const COR_CONTORNO = "var(--av-linha)";
export const COR_MIOLO = "var(--av-cabelo, #262626)";

/** Traça uma arte de barba já aprovada. Não repara nada — ver o topo. */
export async function construirRosto(
  caminhoArte: string,
  opcoes: { semLimite?: boolean } = {},
): Promise<RostoDeArte> {
  const { data: A, info } = await cru(caminhoArte);
  const { data: B } = await cru(PNG_BASE);
  const W = info.width;
  const H = info.height;
  if (W !== LADO || H !== LADO)
    throw new Error(`${caminhoArte} tem ${W}x${H} e a rota pressupõe ${LADO}²`);
  const n = W * H;

  // --- 1. a peça é o que difere da base, na mancha grande ---
  const dif = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const d = Math.max(
      Math.abs(A[i * 3] - B[i * 3]),
      Math.abs(A[i * 3 + 1] - B[i * 3 + 1]),
      Math.abs(A[i * 3 + 2] - B[i * 3 + 2]),
    );
    if (d > NIVEL) dif[i] = 1;
  }
  const peca0 = componentes(dif, W, H);

  // --- 2. as FEIÇÕES saem da peça — e são três caixas, não uma ---
  //
  // A peça de rosto é desenhada POR CIMA das feições (`compor()`), então tudo que ela
  // cobrir some. `mascaraDaPeca` protege isso com `ROSTO`, que é **uma caixa só** — a
  // que envolve os dois olhos e a boca. Para cabelo serviu sempre; para a barba não
  // serve, e custou um defeito que o Doug pegou a olho:
  //
  //   *"falta um contorno no lado direito, abaixo do olho direito"*
  //
  // Medido: a `barba-cheia` entra no canto inferior direito de `ROSTO`, a 84 px
  // ABAIXO do olho direito e 67 u à direita da boca — canto vazio da caixa, feição
  // nenhuma ali. O recorte tirava 217 px e passava pelo MIOLO da peça, deixando
  // **27 px de aresta nua**: massa terminando sem o contorno preto que o gerador
  // pintou. A asserção logo abaixo é o que impede isso de voltar.
  //
  // `FEICOES` são as mesmas constantes de `ROSTO`, partidas em três caixas. `ROSTO`
  // fica intacto: ele é o que o Gate −1 e a extração de cabelo medem. Ver **G32**.
  const peca = new Uint8Array(peca0.m);
  let pxNoRosto = 0;
  for (const caixa of FEICOES) {
    const a = paraPx(caixa.x0, caixa.y0);
    const b = paraPx(caixa.x1, caixa.y1);
    for (let y = Math.floor(a.y); y <= Math.ceil(b.y); y++)
      for (let x = Math.floor(a.x); x <= Math.ceil(b.x); x++) {
        const i = y * W + x;
        if (!peca[i]) continue;
        pxNoRosto++;
        if (!opcoes.semLimite) peca[i] = 0;
      }
  }
  const pecaLimpa = componentes(peca, W, H);
  const lum = (i: number) => 0.299 * A[i * 3] + 0.587 * A[i * 3 + 1] + 0.114 * A[i * 3 + 2];

  // --- 2b. A ARESTA NUA — o gate deste passo, e ele reprova em vez de relatar ---
  //
  // Toda borda da peça tem de ser contorno PINTADO. Onde o recorte passa pelo miolo,
  // a massa termina sem preto nenhum e o boneco fica com a barba aberta — foi o
  // defeito de 2026-08-19. A régua: pixel de MIOLO (lum ≥ 60) que encosta no vazio.
  //
  // Ela conta as duas versões e cobra só a DIFERENÇA. O número absoluto não serve de
  // teto: a arte tem aresta nua legítima onde a peça sai pela borda do canvas ou
  // encosta no contorno da própria base. O que não pode existir é aresta que **o
  // recorte criou** — essa é sempre defeito, porque o recorte corta por dentro.
  const arestaNua = (m: Uint8Array) => {
    const s = new Set<number>();
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        const i = y * W + x;
        if (!m[i] || lum(i) < LUM_CONTORNO) continue;
        if (!m[i - 1] || !m[i + 1] || !m[i - W] || !m[i + W]) s.add(i);
      }
    return s;
  };
  const antes = arestaNua(peca0.m);
  const depois = arestaNua(pecaLimpa.m);
  const criadas = [...depois].filter((i) => !antes.has(i));
  if (criadas.length) {
    const xs = criadas.map((i) => i % W);
    const ys = criadas.map((i) => (i / W) | 0);
    throw new Error(
      `o recorte das feições cortou o MIOLO da peça: ${criadas.length} px de aresta nua\n` +
        `  caixa px x ${Math.min(...xs)}→${Math.max(...xs)}  y ${Math.min(...ys)}→${Math.max(...ys)}\n` +
        `  A massa termina ali sem o contorno preto que o gerador pintou, e o boneco\n` +
        `  sai com a barba aberta naquele ponto. É o defeito de 2026-08-19, e o\n` +
        `  conserto NÃO é afrouxar esta asserção: é a caixa que recorta estar errada.`,
    );
  }

  // --- 3. contorno x miolo, pela luminância ---
  const nucleo = new Uint8Array(n);
  let pxContorno = 0;
  for (let i = 0; i < n; i++) {
    if (!pecaLimpa.m[i]) continue;
    if (lum(i) < LUM_CONTORNO) pxContorno++;
    else nucleo[i] = 1;
  }
  // O MIOLO NÃO PASSA PELO FILTRO DE COMPONENTE, e a assimetria com a peça é
  // deliberada. Lá o filtro separa a barba do ruído de reencode do gerador; aqui
  // cada ilha de miolo é TEXTURA — o tufo de pelo claro entre duas mechas escuras.
  // Medido na `cheia`: com o piso de 5% da maior componente, 1 628 px de miolo
  // viravam preto, e o que se perde é justamente o que o Doug mandou preservar
  // quando reprovou a regra uniforme de contorno em 2026-08-19 ("piorou, afetou as
  // outras barbas que estavam perfeitas"). Speck de 1 px quem descarta é o
  // `turdSize` do potrace, e ele está em 0 pelo mesmo motivo de `rotas/potrace.ts`.
  const ilhas = componentes(nucleo, W, H, 0);
  let pxNucleo = 0;
  for (let i = 0; i < n; i++) if (nucleo[i]) pxNucleo++;

  // --- 4. traçado ---
  const dPeca = paraUnidades(await tracar(pecaLimpa.m, W, H));
  const dNucleo = paraUnidades(await tracar(nucleo, W, H));

  return {
    slug: slugDoRosto(caminhoArte),
    arte: caminhoArte,
    formas: [
      { d: dPeca, cor: COR_CONTORNO, semTraco: true },
      { d: dNucleo, cor: COR_MIOLO, semTraco: true },
    ],
    pxPeca: pecaLimpa.mantidos,
    pxContorno,
    pxNucleo,
    pxNoRosto,
    ruidoDaPeca: peca0.descartados,
    ilhasDoNucleo: ilhas.tamanhos.length,
    ilhasGuardadas: ilhas.tamanhos.filter((t) => t >= TURD).length,
    componentes: pecaLimpa.quantas,
    mascara: pecaLimpa.m,
    mascaraDoNucleo: nucleo,
  };
}

// ---------------------------------------------------------------------------
// O CLI — laudo e nada mais. Quem escreve o literal é `rostos.ts`.
// ---------------------------------------------------------------------------

async function principal(): Promise<void> {
  const arte = process.argv[2];
  const semLimite = process.argv.includes("--sem-limite");
  if (!arte) {
    console.error("uso: barba-para-formas.ts <arte.png> [--sem-limite]");
    process.exit(2);
  }

  const p = await construirRosto(arte, { semLimite });
  const [f1, f2] = p.formas;
  const total = p.pxContorno + p.pxNucleo;

  console.log(`\nBARBA -> formas[] — ${arte}\n`);
  console.log(`  slug                           ${p.slug}`);
  console.log(
    `  peça (difere da base > ${NIVEL})     ${p.pxPeca + p.pxNoRosto * (semLimite ? 0 : 1)} px ` +
      `em ${p.componentes} componente(s) · ${p.ruidoDaPeca} px de ruído descartado`,
  );
  console.log(
    `  dentro das FEIÇÕES             ${p.pxNoRosto} px  ` +
      `${semLimite ? "MANTIDOS (--sem-limite)" : "recortados, como na extração"}`,
  );
  console.log(`  a peça, afinal                 ${total} px`);
  console.log(
    `    contorno (lum < ${LUM_CONTORNO})           ${p.pxContorno} px  ` +
      `${((100 * p.pxContorno) / total).toFixed(1)}%   <- NAO recolore`,
  );
  console.log(
    `    miolo                        ${p.pxNucleo} px  ` +
      `${((100 * p.pxNucleo) / total).toFixed(1)}%   <- recolore`,
  );
  console.log(
    `    o miolo são ${p.ilhasDoNucleo} ilhas; o traçado guarda as ${p.ilhasGuardadas} ` +
      `com ${TURD} px² ou mais (turdSize) — o resto é antialias, ver o topo`,
  );
  console.log(`\n  forma 1  ${f1.cor.padEnd(24)} ${f1.d.length} bytes · ${(f1.d.match(/M/g) ?? []).length} subcaminhos`);
  console.log(`  forma 2  ${f2.cor.padEnd(24)} ${f2.d.length} bytes · ${(f2.d.match(/M/g) ?? []).length} subcaminhos`);
  console.log(`  soma     ${f1.d.length + f2.d.length} bytes de \`d\`\n`);
}

if (process.argv[1]?.endsWith("barba-para-formas.ts")) {
  principal().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
