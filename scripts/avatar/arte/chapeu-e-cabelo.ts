/**
 * A RÉGUA DO PAR — cada chapéu contra cada cabelo, e o que sobra de cada um.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ELA EXISTE, E POR QUE SÓ AGORA
 * ---------------------------------------------------------------------------
 *
 * Até 2026-08-25 o compositor pintava o chapéu por cima do cabelo INTEIRO, e
 * ninguém tinha medido o resultado porque as duas esteiras nunca se cruzaram: o
 * `arte:cabelos-check` mede cabelo sozinho, o `arte:chapeus-check` mede chapéu
 * sozinho, e o defeito só existe no PAR.
 *
 * Medido: o `moicano` deixava **29,2% da própria massa** visível acima da linha da
 * `touca-de-la`, e o `coque-individual` atravessava a `cartola` com 0,2% da massa
 * subindo 238 u. Os dois números dizem a mesma coisa por caminhos opostos — o
 * primeiro é muito cabelo do lado errado, o segundo é pouco cabelo muito longe —, e
 * é por isso que **porcentagem sozinha não serve de régua aqui.**
 *
 * ---------------------------------------------------------------------------
 * O PONTO CEGO QUE ELA TEVE DE 25 A 26 DE AGOSTO, E COMO ELE SE ABRIU
 * ---------------------------------------------------------------------------
 *
 * ⚠️ **A primeira versão só sabia olhar PARA CIMA, e o Doug viu o que ela não via.**
 * Ela contava escape como *"cabelo acima da linha de baixo do chapéu, NA MESMA
 * COLUNA"*. Onde o chapéu não tem tinta não existe linha — `limite[x] = -1` —, e o
 * pixel caía num balde chamado `fora` que nada lia. Ou seja: **cabelo AO LADO do
 * chapéu, na altura dele, era invisível para a régua por construção.**
 *
 * O tamanho do ponto cego, medido nos 171 pares com a metade 1 da região só:
 *
 * | zona | px somados |
 * |---|---|
 * | ACIMA da linha, na coluna do chapéu — o que ela contava | 4 636 |
 * | **ESTOURANDO o chapéu pelo lado — o balde `fora`** | **43 868** |
 * | SAINDO POR BAIXO — franja, costeleta, rabo, aba: legítimo | 4 238 424 |
 *
 * Quase dez vezes o que ela media. E a régua chegava a dizer o lado ERRADO: na
 * `boina` — que é torta, e cuja massa pende para x menor — sobra mais cabelo à
 * direita do que à esquerda, e ela jurava o contrário.
 *
 * ⚠️ **A primeira correção desta régua errou o balde para o outro lado**, e vale
 * escrito: ela chamou de "ao lado" tudo que estava fora da peça na altura dela, e
 * acusou 4 949 px no `chanel` + `chapeu-de-palha`, onde não sobra nada. Aba larga e
 * baixa deixa cabelo aparecer por baixo, e isso é o desenho funcionando. A linha que
 * separa as duas coisas está logo abaixo, e é do chapéu.
 *
 * Por isso as três zonas, e por isso **cada uma sai partida por lado**. A zona não é
 * opinião: ela sai da própria tinta da peça, linha a linha e coluna a coluna. O que
 * é opinião — *"isso se vê?"* — é do olho, e para isso existe o overlay do editor
 * (`/dev/avatar-oclusao`), que pinta o que sobra sobre o boneco.
 *
 * ---------------------------------------------------------------------------
 * O QUE ELA REPROVA, E O QUE ELA SÓ CONTA
 * ---------------------------------------------------------------------------
 *
 * **Reprova** o que é defeito de máquina:
 *
 *  1. chapéu do elenco sem `escondeCabelo` — a esteira não extraiu a linha;
 *  2. linha que não atravessa o crânio inteiro. Uma coluna de crânio descoberta é
 *     uma fresta por onde o cabelo sai, e foi assim que a `chapeu-mago` produziu os
 *     dois vazamentos que a folha de 2026-08-25 pegou a olho, um a 10 h e outro a
 *     1–2 h — cabelo emoldurado por preto dos dois lados, lendo como mecha enfiada
 *     numa fenda.
 *
 * **Só conta**, e imprime alto, o que é decisão de PRODUTO ou de ARTE:
 *
 *  - o par em que sobra quase nada de cabelo. Um `moicano` debaixo de uma touca
 *    some, e sumir é o que acontece na vida real — mas é o Doug quem decide se o
 *    produto oferece o par. Régua que reprova decisão de produto é régua decidindo
 *    pelo dono;
 *  - o par em que sobra quase nada de cabelo (ver acima).
 *
 * **REPROVA, desde 2026-08-26 (fim do dia):** o cabelo ESTOURANDO o chapéu acima de
 * um px de ranking. Ele calou o dia inteiro, e calar estava certo enquanto não havia
 * conserto — régua que reprova o que ninguém sabe consertar é régua mandando no dono.
 * Agora há dois, os dois de máquina: a metade 2 de `medirOclusao` fecha o que está ao
 * lado acima do ponto mais largo, e o aperto do par estreita o que sobra abaixo dele.
 * Com conserto, calar vira buraco — **um cabelo novo entraria com aperto 1,00 nos
 * nove chapéus e ninguém avisaria**. Ver a trava e o piso de visibilidade no corpo.
 */

import { readFileSync } from "fs";

import sharp from "sharp";

import { APERTOS_DA_ARTE } from "../../../src/lib/avatar/estilo/apertos-da-arte";
import { CABELOS } from "../../../src/lib/avatar/estilo/cabelo";
import { CHAPEUS_DA_ARTE } from "../../../src/lib/avatar/estilo/chapeus-da-arte";
import {
  CAIXA_CABECA,
  CAIXA_DA_ARTE,
  FORA_DO_CHAPEU,
  VIEWBOX,
} from "../../../src/lib/avatar/estilo/geometria";

/**
 * O QUADRO DA MEDIÇÃO — o raster da própria arte, 1,2 px por unidade.
 *
 * Era meio px por unidade até 2026-08-26, e o motivo era velocidade. Mas é neste
 * quadro que a arte da peça vive e é nele que a correção à mão (`oclusao/<slug>.png`)
 * é pintada: medir em outro seria a segunda descrição do mesmo retângulo, e um px
 * daqui não valeria um px de lá. Custa 2,2 s nos 171 pares — cabe no `verify:arte`.
 */
const W = 780;
const H = 930;

/** Abaixo disto o par virou `"tudo"` na prática: o cabelo sumiu. */
const PISO_DE_SOBREVIVENCIA = 3;

/** O mesmo piso de "este pixel existe" que o resto da esteira usa. */
const ALFA = 8;

const uX = (px: number) => CAIXA_DA_ARTE.x + ((px + 0.5) / W) * CAIXA_DA_ARTE.w;
const uY = (py: number) => CAIXA_DA_ARTE.y + ((py + 0.5) / H) * CAIXA_DA_ARTE.h;

/** O eixo que parte a figura em dois. Esquerda é a de quem OLHA, x menor. */
const CENTRO = (CAIXA_CABECA.x0 + CAIXA_CABECA.x1) / 2;

/**
 * ⚠️ **A LINHA QUE SEPARA "ESTOURANDO O CHAPÉU" DE "SAINDO POR BAIXO DELE" É DO
 * CHAPÉU, NUNCA DA CABEÇA** — e é o ponto mais largo da peça, de cada lado.
 *
 * A primeira versão desta régua usou meia altura da cabeça (y 196) e acusou 4 949 px
 * no `chanel` + `chapeu-de-palha`, onde não sobra nada: a aba da palha é larga e
 * baixa, e o que aparece está EMBAIXO dela — que é o que um chapéu de palha faz.
 *
 * Abaixo do ponto mais largo a aba está ABRINDO, e cabelo ali é cabelo saindo por
 * baixo do chapéu. Acima dele o chapéu está sobre a cabeça, e cabelo por fora é
 * cabelo mais largo que o chapéu. É a mesma linha que `oclusao-do-chapeu.ts` usa
 * para fechar a região, e ela vale POR LADO: a `boina` é torta, e o ponto mais largo
 * dela está em y 208 à esquerda e y 69 à direita.
 */

/**
 * Rasteriza `d` em máscara binária, no quadro da `CAIXA_DA_ARTE`.
 *
 * O `sharp` (librsvg) desenha aqui e está certo: **não há custom property nenhuma**
 * — é `fill="#000"` literal. O veto de `folha.ts` vale para o BONECO, cuja cor sai
 * toda de `var(--av-*)` e viraria preto no librsvg; uma forma preta chapada não tem
 * como divergir do Chromium.
 */
async function rasterizar(d: string, regra: "evenodd" | "nonzero", aperto = 1): Promise<Uint8Array> {
  // ⚠️ **O APERTO ENTRA AQUI, e não entrava até 2026-08-26.** A régua rasterizava o
  // `d` cru e media um cabelo mais largo que o do produto — acusaria escape que o
  // compositor já não desenha. Medir o alvo errado é o modo de falha nº 1 desta
  // bancada: quatro réguas caíram por isso num dia só.
  const massa =
    aperto === 1
      ? `<path d="${d}" fill="#000" fill-rule="${regra}"/>`
      : `<g transform="translate(${CENTRO} 0) scale(${aperto} 1) translate(${-CENTRO} 0)">` +
        `<path d="${d}" fill="#000" fill-rule="${regra}"/></g>`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" ` +
    `viewBox="${CAIXA_DA_ARTE.x} ${CAIXA_DA_ARTE.y} ${CAIXA_DA_ARTE.w} ${CAIXA_DA_ARTE.h}">` +
    `${massa}</svg>`;
  const r = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const m = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) if (r.data[i * r.info.channels + 3] >= ALFA) m[i] = 1;
  return m;
}

/**
 * A TINTA da peça — o alfa do `<image>` que o `.svg` carrega.
 *
 * A região de oclusão sozinha não diz onde o chapéu ESTÁ, só o que ele contém; e é
 * a tinta que decide se um pixel de cabelo está ao lado da peça ou dentro dela.
 * Mesma leitura de `oclusao-do-chapeu.ts`, no quadro desta régua.
 */
async function tintaDaPeca(rota: string): Promise<Uint8Array> {
  const svg = readFileSync(`public${rota}`, "utf-8");
  const emb = svg.match(/href="data:image\/(?:webp|png);base64,([^"]+)"/);
  if (!emb) throw new Error(`${rota} não traz \`<image>\` base64 — a esteira mudou de formato`);
  const r = await sharp(Buffer.from(emb[1], "base64"))
    .resize(W, H, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const m = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) if (r.data[i * r.info.channels + 3] >= ALFA) m[i] = 1;
  return m;
}

export interface Par {
  chapeu: string;
  cabelo: string;
  massa: number;
  escondido: number;
  sobrevive: number;
  pctSobrevive: number;
  /** px de cabelo visível ACIMA da linha de baixo do chapéu, na coluna dele. */
  acima: [number, number];
  /** px de cabelo ESTOURANDO o chapéu: ao lado dele, acima do ponto mais largo. */
  aoLado: [number, number];
  /** px de cabelo SAINDO POR BAIXO — franja, costeleta, rabo, o que passa da aba. */
  abaixo: number;
}

const soma = (p: [number, number]) => p[0] + p[1];

async function principal(): Promise<void> {
  const chapeus = Object.entries(CHAPEUS_DA_ARTE);
  const cabelos = Object.entries(CABELOS).filter(([, c]) => c.tonal);
  let reprovas = 0;

  console.log(
    `A RÉGUA DO PAR — ${chapeus.length} chapéus × ${cabelos.length} cabelos ` +
      `= ${chapeus.length * cabelos.length} pares, no raster da arte (${W}×${H})\n`,
  );

  // 1. TODO CHAPÉU DO ELENCO DECLARA A LINHA, E ELA ATRAVESSA O CRÂNIO INTEIRO.
  //
  // Junto sai o ENVELOPE da peça — `limite` por coluna, `esq`/`dir` por linha —, que
  // é o que permite dizer se um pixel de cabelo está acima da peça ou ao lado dela.
  interface Envelope {
    tinta: Uint8Array;
    oclusao: Uint8Array;
    limite: Int32Array;
    esq: Int32Array;
    dir: Int32Array;
    /** a linha do ponto mais largo, de cada lado — ver a nota no topo do arquivo. */
    linhaEsq: number;
    linhaDir: number;
    xEsq: number;
    xDir: number;
  }
  const envelopes = new Map<string, Envelope>();
  for (const [slug, peca] of chapeus) {
    if (!peca.escondeCabelo) {
      console.error(
        `  ✗ ${slug} não declara \`escondeCabelo\`. A esteira não extraiu a linha —\n` +
          `    rode \`npm run arte:chapeus\` e confira o relatório dela.`,
      );
      reprovas++;
      continue;
    }
    const m = await rasterizar(`${FORA_DO_CHAPEU}${peca.escondeCabelo}`, "evenodd");
    // O clip GUARDA o que está fora do chapéu; a oclusão é o complemento dele.
    const oclusao = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) oclusao[i] = m[i] ? 0 : 1;

    const tinta = await tintaDaPeca(peca.arte!);
    const limite = new Int32Array(W).fill(-1);
    for (let x = 0; x < W; x++) {
      for (let y = H - 1; y >= 0; y--) {
        if (tinta[y * W + x]) {
          limite[x] = y;
          break;
        }
      }
    }
    const esq = new Int32Array(H).fill(-1);
    const dir = new Int32Array(H).fill(-1);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (tinta[y * W + x]) {
          esq[y] = x;
          break;
        }
      }
      for (let x = W - 1; x >= 0; x--) {
        if (tinta[y * W + x]) {
          dir[y] = x;
          break;
        }
      }
    }
    // O ponto mais largo de cada lado. No empate fica a linha MAIS BAIXA — é onde a
    // aba termina de abrir; guardar a do topo faria a régua chamar a aba inteira de
    // "estourando".
    let xEsq = W;
    let xDir = -1;
    let linhaEsq = -1;
    let linhaDir = -1;
    for (let y = 0; y < H; y++) {
      if (esq[y] < 0) continue;
      if (esq[y] <= xEsq) {
        xEsq = esq[y];
        linhaEsq = y;
      }
      if (dir[y] >= xDir) {
        xDir = dir[y];
        linhaDir = y;
      }
    }
    envelopes.set(slug, { tinta, oclusao, limite, esq, dir, linhaEsq, linhaDir, xEsq, xDir });

    let descobertas = 0;
    for (let px = 0; px < W; px++) {
      const u = uX(px);
      if (u < CAIXA_CABECA.x0 || u > CAIXA_CABECA.x1) continue;
      let temAlguma = false;
      for (let py = 0; py < H && !temAlguma; py++) if (oclusao[py * W + px]) temAlguma = true;
      if (!temAlguma) descobertas++;
    }
    if (descobertas > 0) {
      console.error(
        `  ✗ ${slug}: ${descobertas} coluna(s) do crânio SEM oclusão. Cada uma é uma\n` +
          `    fresta por onde o cabelo sai emoldurado pelo preto do chapéu.`,
      );
      reprovas++;
    }
  }

  if (reprovas) process.exit(1);

  // 2. O PAR: quanto de cada cabelo sobrevive a cada chapéu, e ONDE ele sobrevive.
  // A massa é POR PAR desde que o aperto existe: o mesmo penteado tem largura
  // diferente debaixo de cada chapéu. A chave carrega o aperto, então o cache serve
  // a todos os pares que decidiram o mesmo número.
  const massas = new Map<string, Uint8Array>();
  const massaDe = async (nomeCabelo: string, formas: readonly { d: string }[], aperto: number) => {
    const chave = `${nomeCabelo}@${aperto}`;
    const guardada = massas.get(chave);
    if (guardada) return guardada;
    const m = new Uint8Array(W * H);
    for (const f of formas) {
      const s = await rasterizar(f.d, "evenodd", aperto);
      for (let i = 0; i < W * H; i++) if (s[i]) m[i] = 1;
    }
    massas.set(chave, m);
    return m;
  };
  for (const [nomeCabelo, cabelo] of cabelos) {
    // ⚠️ **UNIÃO FORMA A FORMA, NUNCA `d` CONCATENADO.** As duas `formas` de um
    // cabelo tonal carregam o MESMO `d` — uma é o contorno (`--av-linha`), a outra
    // é a tinta que veste a máscara de tom (ver `sobrepor()`). Concatenadas sob
    // `evenodd` elas se cancelam **inteiras**, e a silhueta sai com 0 px: a régua
    // mediria zero cabelo em todo par e passaria verde por vacuidade. Custou uma
    // rodada inteira desta régua para aparecer.
    await massaDe(nomeCabelo, cabelo.tonal!.formas, 1);
  }

  const pares: Par[] = [];
  for (const [nomeCabelo, cabelo] of cabelos) {
    for (const [slug] of chapeus) {
      const g = envelopes.get(slug)!;
      // O QUE O PRODUTO DESENHA, e não o que a arte tem: o chapéu achata o cabelo, e
      // `compor()` aplica o aperto do par ANTES do clip.
      const aperto = APERTOS_DA_ARTE[`${slug}|${nomeCabelo}`] ?? 1;
      const massa = await massaDe(nomeCabelo, cabelo.tonal!.formas, aperto);
      let total = 0;
      for (let i = 0; i < W * H; i++) if (massa[i]) total++;
      let escondido = 0;
      let abaixo = 0;
      const acima: [number, number] = [0, 0];
      const aoLado: [number, number] = [0, 0];
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = y * W + x;
          if (!massa[i]) continue;
          // Some da tela por dois motivos: a região o contém, ou a tinta o tapa.
          if (g.oclusao[i] || g.tinta[i]) {
            escondido++;
            continue;
          }
          const lado = uX(x) < CENTRO ? 0 : 1;
          if (g.limite[x] >= 0 && y <= g.limite[x]) {
            acima[lado]++;
          } else if (
            g.esq[y] >= 0 &&
            ((x < g.esq[y] && y <= g.linhaEsq) || (x > g.dir[y] && y <= g.linhaDir))
          ) {
            aoLado[lado]++;
          } else {
            abaixo++;
          }
        }
      }
      // ⚠️ **AS QUATRO ZONAS TÊM DE FECHAR A MASSA.** Cada pixel do cabelo cai em
      // exatamente um balde — escondido, acima, ao lado, abaixo. Se a conta não
      // fechar, a classificação contou um pixel duas vezes ou perdeu um, e as
      // tabelas de baixo passam a mentir com cara de medida. É o modo de falha desta
      // régua: ela já nasceu verde por vacuidade uma vez.
      const conferencia = escondido + soma(acima) + soma(aoLado) + abaixo;
      if (conferencia !== total) {
        console.error(
          `  ✗ ${slug} × ${nomeCabelo}: as zonas somam ${conferencia} px e a massa é ${total} px.\n` +
            `    Um pixel caiu em dois baldes ou em nenhum — a classificação está errada.`,
        );
        reprovas++;
      }
      const sobrevive = total - escondido;
      pares.push({
        chapeu: slug.replace("chapeu-", ""),
        cabelo: nomeCabelo,
        massa: total,
        escondido,
        sobrevive,
        pctSobrevive: total ? (sobrevive / total) * 100 : 0,
        acima,
        aoLado,
        abaixo,
      });
    }
  }

  // A tabela: uma linha por cabelo, uma coluna por chapéu.
  const nomesChapeu = [...new Set(pares.map((p) => p.chapeu))];
  const nomesCabelo = [...new Set(pares.map((p) => p.cabelo))];
  const larg = Math.max(...nomesCabelo.map((c) => c.length));
  const cabecalho = ["cabelo".padEnd(larg), ...nomesChapeu.map((c) => c.slice(0, 7).padStart(7))].join(" ");
  console.log("QUANTO DO CABELO SOBREVIVE AO CHAPÉU (% da massa da peça)\n");
  console.log(cabecalho);
  console.log("-".repeat(cabecalho.length));
  const porCabelo = new Map(nomesCabelo.map((c) => [c, pares.filter((p) => p.cabelo === c)]));
  for (const c of [...nomesCabelo].sort(
    (a, b) =>
      Math.min(...porCabelo.get(a)!.map((p) => p.pctSobrevive)) -
      Math.min(...porCabelo.get(b)!.map((p) => p.pctSobrevive)),
  )) {
    const linha = nomesChapeu.map((ch) => {
      const p = porCabelo.get(c)!.find((x) => x.chapeu === ch)!;
      return `${p.pctSobrevive.toFixed(0)}`.padStart(7);
    });
    console.log([c.padEnd(larg), ...linha].join(" "));
  }

  // 2b. ONDE A PEÇA TEM MASSA — o número que um redesenho precisa.
  //
  // Um par ruim não é culpa do chapéu: é penteado sem nada abaixo da aba. A linha
  // mais alta do elenco está em y 130 (`mago`) e a mais baixa em y 290; nas colunas
  // laterais do crânio, TODO chapéu do elenco fecha abaixo de y 183. Então
  // **massa abaixo de y 183 é massa que nenhum chapéu de hoje come** — e é isso, e
  // só isso, que faz um penteado sobreviver a vestir chapéu.
  console.log(`
ONDE CADA PEÇA TEM MASSA (y 183 = o ponto mais alto em que a aba mais rasa fecha)
`);
  console.log(`cabelo             topo      piso   massa sob y 183`);
  console.log(`-----------------  ------  ------  ----------------`);
  const perfilDaPeca: { nome: string; topo: number; piso: number; sob: number }[] = [];
  for (const [nomeCabelo] of cabelos) {
    const massa = massas.get(`${nomeCabelo}@1`)!;
    let topo = Infinity,
      piso = -Infinity,
      total = 0,
      sob = 0;
    for (let py = 0; py < H; py++) {
      const u = uY(py);
      for (let px = 0; px < W; px++) {
        if (!massa[py * W + px]) continue;
        total++;
        if (u < topo) topo = u;
        if (u > piso) piso = u;
        if (u >= 183) sob++;
      }
    }
    perfilDaPeca.push({ nome: nomeCabelo, topo, piso, sob: total ? (sob / total) * 100 : 0 });
  }
  for (const q of perfilDaPeca.sort((a, b) => a.sob - b.sob)) {
    console.log(
      `${q.nome.padEnd(17)}  ${q.topo.toFixed(0).padStart(6)}  ${q.piso.toFixed(0).padStart(6)}  ` +
        `${q.sob.toFixed(1).padStart(15)}%`,
    );
  }

  // 3. O QUE SOBRA, POR ZONA E POR LADO — o ponto cego de 25/08, aberto.
  const sAcima = pares.reduce((a, p) => a + soma(p.acima), 0);
  const sLado = pares.reduce((a, p) => a + soma(p.aoLado), 0);
  const sAbaixo = pares.reduce((a, p) => a + p.abaixo, 0);
  console.log(`
O QUE SOBRA DO CABELO, POR ZONA — soma dos ${pares.length} pares
`);
  console.log(
    `  ACIMA da linha, na coluna do chapéu    ${sAcima.toLocaleString("pt-BR").padStart(11)} px   ` +
      `a metade 1 da região`,
  );
  console.log(
    `  ESTOURANDO o chapéu pelo lado          ${sLado.toLocaleString("pt-BR").padStart(11)} px   ` +
      `a metade 2 da região`,
  );
  console.log(
    `  SAINDO POR BAIXO — franja, rabo, aba   ${sAbaixo.toLocaleString("pt-BR").padStart(11)} px   legítimo`,
  );

  console.log(`
ESTOURANDO, POR CHAPÉU E POR LADO — e a linha do ponto mais largo que decide
(px somados nos ${cabelos.length} cabelos; esquerda é a de quem olha)
`);
  console.log("chapeu             esquerda      direita   mais largo esq  mais largo dir   pior par");
  console.log("---------------  -----------  -----------  --------------  --------------  ------------------");
  for (const ch of nomesChapeu) {
    const g = envelopes.get(`chapeu-${ch}`)!;
    const ls = pares.filter((p) => p.chapeu === ch);
    const e = ls.reduce((a, p) => a + p.aoLado[0], 0);
    const d = ls.reduce((a, p) => a + p.aoLado[1], 0);
    const pior = [...ls].sort((a, b) => soma(b.aoLado) - soma(a.aoLado))[0];
    console.log(
      `${ch.padEnd(15)}  ${e.toLocaleString("pt-BR").padStart(11)}  ${d.toLocaleString("pt-BR").padStart(11)}  ` +
        `${`x ${uX(g.xEsq).toFixed(0)} em y ${uY(g.linhaEsq).toFixed(0)}`.padStart(14)}  ` +
        `${`x ${uX(g.xDir).toFixed(0)} em y ${uY(g.linhaDir).toFixed(0)}`.padStart(14)}  ` +
        `${pior.cabelo.padEnd(17)} ${soma(pior.aoLado).toLocaleString("pt-BR")}`,
    );
  }

  // 3b. A TRAVA DO PAR NOVO — e ela só pôde nascer depois que o conserto existiu.
  //
  // Até 2026-08-26 esta régua MEDIA o cabelo estourando o chapéu e calava, porque
  // reprovar sem conserto disponível é régua exigindo que o dono resolva o
  // impossível. Hoje há dois consertos, os dois de máquina: a metade 2 de
  // `medirOclusao` fecha o que está ao lado ACIMA do ponto mais largo, e o aperto do
  // par (`aperto.json` -> `APERTOS_DA_ARTE`) estreita o que sobra abaixo dele.
  //
  // Com conserto, calar vira buraco: **um cabelo NOVO entra com aperto 1,00 nos nove
  // chapéus e ninguém avisa**. É o modo de falha desta rota — trabalho perdido em
  // silêncio, com tudo verde. A partir daqui, o par que estoura reprova e diz o que
  // fazer.
  //
  // ⚠️ **O PISO É DE VISIBILIDADE, e sai de conta, não de gosto.** O tamanho que
  // manda é o do ranking, 56 px de altura para as 700 unidades do `viewBox`: um px
  // de tela vale 12,5 unidades, que neste quadro são 15 px de lado — **225 px de
  // área**. Abaixo disso o estouro não chega a um pixel na tela do aluno e reprovar
  // seria reprovar o que ninguém vê. Acima, vê-se.
  const PISO_VISIVEL = Math.round((VIEWBOX.h / 56) * (W / CAIXA_DA_ARTE.w)) ** 2;
  const estourando = pares.filter((p) => soma(p.aoLado) > PISO_VISIVEL);
  if (estourando.length) {
    console.error(
      `
  ✗ ${estourando.length} par(es) com cabelo ESTOURANDO o chapéu acima de ` +
        `${PISO_VISIVEL} px (um px de ranking):
`,
    );
    for (const p of estourando.sort((a, b) => soma(b.aoLado) - soma(a.aoLado))) {
      console.error(
        `      ${String(soma(p.aoLado)).padStart(6)} px   ${p.cabelo.padEnd(larg)} + ${p.chapeu}` +
          `   (aperto de hoje: ${(APERTOS_DA_ARTE[`chapeu-${p.chapeu}|${p.cabelo}`] ?? 1).toFixed(2)})`,
      );
    }
    console.error(
      `
    O cabelo é mais largo que o chapéu ali. Abra \`/dev/avatar-oclusao\`, ponha o
` +
        `    par na mesa, ache o aperto no olho, clique em \`gravar par\` e rode
` +
        `    \`npm run arte:apertos\`. Se o par não tiver conserto por aperto — o penteado
` +
        `    perde o que ele é antes de caber —, é decisão de ARTE, e ela é do Doug.`,
    );
    reprovas += estourando.length;
  }

  // 4. O QUE É DECISÃO DE PRODUTO — contado, nomeado, e NÃO reprovado.
  const sumidos = pares.filter((p) => p.pctSobrevive < PISO_DE_SOBREVIVENCIA);
  console.log(
    `\n${pares.length} pares · ` +
      `média ${(pares.reduce((a, p) => a + p.pctSobrevive, 0) / pares.length).toFixed(1)}% de cabelo sobrevivendo`,
  );
  if (sumidos.length) {
    console.log(
      `\n  ⚠ ${sumidos.length} par(es) em que sobra menos de ${PISO_DE_SOBREVIVENCIA}% do cabelo —\n` +
        `    o chapéu virou \`"tudo"\` na prática, e com ele some UMA DAS DUAS cores que\n` +
        `    o aluno escolhe. Não é defeito de máquina e por isso não reprova: é o\n` +
        `    catálogo oferecendo um par que não se veste. Decisão do Doug.\n`,
    );
    for (const p of sumidos.sort((a, b) => a.pctSobrevive - b.pctSobrevive)) {
      console.log(`      ${p.pctSobrevive.toFixed(1).padStart(5)}%   ${p.cabelo.padEnd(larg)} + ${p.chapeu}`);
    }
  }
  console.log(`\n  · ${reprovas} reprovação(ões) de máquina.`);
  // A reprovação da conferência de zonas nasce DEPOIS do `exit` lá de cima, e sem
  // esta linha ela imprimiria em vermelho e devolveria 0 — gate que grita e passa.
  if (reprovas) process.exit(1);
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
