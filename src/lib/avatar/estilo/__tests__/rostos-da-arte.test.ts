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

import { readFileSync } from "fs";

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

  it("são duas, e têm o MESMO `d` — a de baixo é o preto da de cima", () => {
    expect(peca.formas).toHaveLength(2);
    expect(peca.arte).toBeUndefined(); // o outro braço da união

    // ISTO É A ESPINHA DO TOM CONTÍNUO, e não redundância. Até 2026-08-20 a forma 2
    // era o MIOLO — uma silhueta encolhida, traçada por um segundo `potrace`, que
    // deixava a arte de 917 tons chegando ao boneco com dois. Hoje a forma 2 é a
    // mesma curva, e quem faz o claro-escuro é a máscara. Um `d` diferente aqui
    // significa que alguém devolveu a partição, e a peça volta a ter duas cores.
    expect(peca.formas![0].d).toBe(peca.formas![1].d);
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

  it("o `d` sai DUAS vezes, e depois das feições", () => {
    // Duas, porque as duas formas têm a mesma curva. Contar em vez de só procurar é
    // o que separa "as duas saíram" de "uma saiu e a outra sumiu" — com `d` idêntico,
    // um `toContain` passaria nos dois casos.
    const d = ROSTOS[SLUG].formas![0].d;
    expect(comPeca.split(`d="${d}"`).length - 1).toBe(2);
    // A boca é a última feição emitida; a peça de rosto vem depois dela.
    expect(comPeca.lastIndexOf("kk-risco")).toBeLessThan(comPeca.indexOf(`d="${d}"`));
  });

  it("a máscara de tom sai UMA vez, e veste só a forma de cima", () => {
    expect(comPeca.match(/<mask /g) ?? []).toHaveLength(1);
    expect(comPeca).toContain('<mask id="t-tom-rosto"');
    expect(comPeca.match(/mask="url\(#t-tom-rosto\)"/g) ?? []).toHaveLength(1);
    // A de cima é a que leva `--av-cabelo`; a de baixo, o preto, sai limpa.
    expect(comPeca).toContain(`fill="var(--av-cabelo, #262626)" mask="url(#t-tom-rosto)"`);
    expect(comPeca).not.toMatch(/fill="var\(--av-linha\)" mask=/);
  });

  it("não quebra o contrato do SVG", () => {
    // `conferirSvg` não tem allowlist de elemento: `<mask>` e `<image>` passam por
    // serem estrutura, não propriedade. O que ele trava é custom property fora do
    // contrato e comentário dentro do `<style>`, e o `href` não é nem um nem outro.
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

  it("o selo de bytes — DOIS números agora, e os dois são registro", () => {
    // O doc 19 §6 é explícito: `ORCAMENTO_COMPOSTO` é autoimposto e **não veta arte
    // aprovada**. O número existe para que uma mudança de esteira que dobre o peso
    // apareça no `git diff` em vez de passar. Se ele mudar sem ninguém ter mexido na
    // arte, a mudança veio do traçador e vale para todas as peças — isso é achado.
    //
    // **São dois porque a peça passou a ter duas naturezas.** O `d` é vetor, vive
    // dentro do SVG e comprime como texto; a máscara é raster, é ARQUIVO servido à
    // parte, e não comprime (o PNG já vem comprimido). Somá-los num número só
    // esconderia exatamente a diferença que interessa — e eles nem viajam juntos.
    //
    // A HISTÓRIA DO PRIMEIRO NÚMERO, porque ela mostra o selo funcionando duas vezes:
    //
    //   13 674 B  a esteira original, silhueta + miolo traçados
    //   11 372 B  2026-08-20, o passo 3b tirou a franja de antialias do miolo (o
    //             defeito *"a cor está fugindo do traço"*, que o Doug pegou a olho)
    //   10 624 B  2026-08-20, o TOM CONTÍNUO: o miolo deixou de ser traçado e a
    //             forma 2 virou a mesma curva da 1. Duas cópias de um `d` de 5 312 B.
    //
    // O `d` caiu 6,6% e a peça ganhou **6 718 B de PNG**, que é o preço do tom e está
    // pago com os olhos abertos: a arte tinha 917 tons e chegava ao boneco com dois.
    //
    // ⚠️ Este segundo número **não vai no SVG nem no bundle**. Ele foi base64 embutido
    // por um dia, e a medição do ranking mostrou o que isso custava: 30 bonecos com a
    // `trancada-v4` fechavam em 753,0 KB de gzip contra 17,6 KB com o arquivo
    // externo, porque o boneco composto passa da janela de 32.768 B do DEFLATE. Ver
    // `TomDaPeca` (`tipos.ts`). No SVG, a máscara custa hoje 38 bytes de caminho.
    const bytes = ROSTOS_DA_ARTE[SLUG].formas!.reduce((a, f) => a + f.d.length, 0);
    expect(bytes, "os `d` das duas formas").toBe(10624);
    expect(readFileSync(`public${ROSTOS_DA_ARTE[SLUG].tom!.arte}`), "o PNG da máscara").toHaveLength(
      6718,
    );
  });
});

/**
 * O TOM — o campo novo, e as quatro coisas que ele pode ter de errado em silêncio.
 *
 * Ele é o único campo do catálogo que carrega **bytes de codificador**: tudo o mais
 * aqui é número ou string que alguém consegue ler. Um base64 corrompido, uma caixa
 * fora do `viewBox` ou um PNG na proporção errada não quebram o `typecheck`, não
 * quebram `conferirSvg` e não quebram o censo de camadas — eles só aparecem na tela,
 * e aparecem como "a barba ficou estranha".
 */
describe("o tom, e o que ele não pode ter de errado", () => {
  const tom = ROSTOS_DA_ARTE[SLUG].tom!;

  it("o campo é um CAMINHO da prateleira, e o arquivo lá é PNG de verdade", () => {
    // Mesma forma e mesma exigência de `Traje.tinta.arte`: começa em `/items/`, e o
    // `arteDaPecaNoDeploy.test.ts` cobra que ele exista no disco E seja rastreado
    // pelo git. Aqui a pergunta é a de conteúdo — o arquivo é mesmo um PNG?
    expect(tom.arte).toMatch(/^\/items\/rosto\/.+\.png$/);
    expect(tom.arte).not.toContain("data:");

    const buf = readFileSync(`public${tom.arte}`);
    expect([...buf.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  });

  it("o IHDR do PNG bate com a proporção da caixa, dentro de 1%", () => {
    // O `<image>` entra com `preserveAspectRatio="none"`: ele é ESTICADO para a
    // caixa. Se a proporção do PNG divergir da da caixa, o tom entra deformado — a
    // luz da barba desliza para o lado e nada acusa.
    //
    // O IHDR são os 8 bytes logo depois do nome do chunk, em big-endian: largura,
    // depois altura. Lê-los aqui em vez de usar o `sharp` é de propósito — este teste
    // mora em `src/`, e `sharp` é ferramenta de esteira.
    const buf = readFileSync(`public${tom.arte}`);
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    expect(w).toBeGreaterThan(0);
    expect(h).toBeGreaterThan(0);
    expect(Math.abs(w / h - tom.w / tom.h) / (tom.w / tom.h)).toBeLessThan(0.01);
  });

  it("a caixa cabe no `viewBox`, e é uma caixa de verdade", () => {
    // 500 × 700 é o `viewBox` do compositor. Uma caixa fora dele põe metade da
    // máscara em lugar nenhum, e a barba sai com o tom cortado.
    expect(tom.x).toBeGreaterThanOrEqual(0);
    expect(tom.y).toBeGreaterThanOrEqual(0);
    expect(tom.w).toBeGreaterThan(0);
    expect(tom.h).toBeGreaterThan(0);
    expect(tom.x + tom.w).toBeLessThanOrEqual(500);
    expect(tom.y + tom.h).toBeLessThanOrEqual(700);
  });

  it("a caixa cobre a CURVA, com a folga de um pixel do canvas de edição", () => {
    // A régua independente: a caixa da máscara tem de conter o desenho. Menor que
    // ele, a máscara devolve 0 na sobra — e ali a forma de cima some, deixando à
    // vista só o preto de baixo. Uma faixa escura na ponta do queixo que ninguém
    // consegue explicar, e nenhuma outra régua acusa.
    //
    // ⚠️ **Mede a CURVA, não os pontos de controle**, e a diferença não é detalhe:
    // medido em 2026-08-20, o controle mais alto desta peça está em y 241,1 e a
    // curva não passa de 243,8 — 2,7 u de diferença, e ponto de controle não
    // desenha. Uma asserção sobre os números crus do `d` reprovaria um desenho
    // correto.
    //
    // A FOLGA sai da grade, não de tentativa: a caixa é a bbox dos PIXELS da máscara,
    // e o `potrace` suaviza a escada de pixels em Bézier — a curva pode abaular até
    // cerca de um pixel do canvas para fora da caixa. Um pixel são `1 / ESCALA` =
    // 1/1,2 ≈ 0,83 u. Medido aqui: 0,40 u no topo, e negativo nos outros três lados.
    const FOLGA = 1 / 1.2;
    const d = ROSTOS_DA_ARTE[SLUG].formas![0].d;

    // Achatamento das Béziers: 16 amostras por segmento. O `d` só tem M, L, C e Z
    // (o teste acima cobra isso), então o laço não precisa de mais casos.
    const partes = d.match(/[A-Za-z]|-?\d*\.?\d+/g) ?? [];
    let i = 0;
    let cx = 0;
    let cy = 0;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    const ponto = (x: number, y: number) => {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    };
    while (i < partes.length) {
      const c = partes[i++];
      if (c === "Z" || c === "z") continue;
      const pares = c === "C" ? 3 : 1;
      do {
        const n: number[] = [];
        for (let k = 0; k < pares * 2; k++) n.push(Number(partes[i++]));
        if (pares === 1) {
          [cx, cy] = n;
          ponto(cx, cy);
        } else {
          const [x1, y1, x2, y2, x3, y3] = n;
          for (let s = 0; s <= 16; s++) {
            const t = s / 16;
            const u = 1 - t;
            ponto(
              u ** 3 * cx + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t ** 3 * x3,
              u ** 3 * cy + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3 * y3,
            );
          }
          cx = x3;
          cy = y3;
        }
      } while (i < partes.length && /^[-\d.]/.test(partes[i]));
    }

    expect(minX, "a curva sai pela esquerda da caixa").toBeGreaterThanOrEqual(tom.x - FOLGA);
    expect(maxX, "a curva sai pela direita da caixa").toBeLessThanOrEqual(tom.x + tom.w + FOLGA);
    expect(minY, "a curva sai por cima da caixa").toBeGreaterThanOrEqual(tom.y - FOLGA);
    expect(maxY, "a curva sai por baixo da caixa").toBeLessThanOrEqual(tom.y + tom.h + FOLGA);

    // E a caixa não é folgada: ela encosta no desenho nos quatro lados. Uma caixa
    // muito maior que a peça passaria na asserção acima e desperdiçaria bytes de PNG
    // em fundo preto — e desperdiçaria RESOLUÇÃO, que é o que custa tom.
    expect(minX - tom.x).toBeLessThan(2);
    expect(tom.x + tom.w - maxX).toBeLessThan(2);
    expect(minY - tom.y).toBeLessThan(2);
    expect(tom.y + tom.h - maxY).toBeLessThan(2);
  });
});
