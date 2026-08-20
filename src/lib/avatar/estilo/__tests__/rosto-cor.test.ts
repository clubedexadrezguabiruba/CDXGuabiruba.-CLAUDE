/**
 * A COR DAS TRÊS PEÇAS DO ROSTO — prendida ao SVG emitido, não ao docstring.
 *
 * POR QUE ESTE ARQUIVO EXISTE
 * --------------------------
 * O `palette.ts` afirmou por escrito, durante todo o Bloco 1, que `--av-cabelo`
 * era lido "também pela sobrancelha, que mora na base", e usou essa afirmação
 * para JUSTIFICAR o escopo da propriedade. A arte nunca fez isso — a sobrancelha
 * sempre saiu em `--av-linha`. Ninguém notou porque não havia cabelo para
 * contradizer: a divergência só apareceria quando os 8 tons entrassem, e aí
 * seriam 5 modelos para refazer.
 *
 * É a mesma família do `UPDATE` sem `UPSERT` da patente e da curva de XP
 * revertida: uma disciplina documentada em prosa, que nada confere.
 *
 * A DECISÃO QUE ESTE TESTE PRENDE (Doug, 2026-07-31)
 * --------------------------------------------------
 * A sobrancelha é PRETA, não tingida com o cabelo. Medido: 5 das 8 cores de
 * cabelo ficam abaixo de `MIN_CONTORNO` contra pelo menos um dos 8 tons de pele
 * — castanho (9), castanho claro (20), loiro (33) e ruivo (29) no valor cru,
 * porque cabelo castanho e pele castanha moram no mesmo matiz. A tabela completa
 * está no docstring de `PROPRIEDADES`, em palette.ts.
 *
 * Se um dia a decisão mudar, é para cá que se vem primeiro — e o teste que
 * quebra diz qual era a razão.
 */

import { describe, expect, it } from "vitest";
import { compor } from "../compositor";
import { ROSTOS } from "../../catalogo";
import { CABELO, PELE } from "../../palette";

/** Um boneco qualquer: a cor do rosto não depende de qual pele ou cabelo. */
const svg = compor({ pele: PELE[0], cabelo: CABELO[3], ns: "t1" });

/** A regra CSS de uma classe, extraída do `<style>` emitido. */
function regra(classe: string): string {
  const m = svg.match(new RegExp(`\\.t1 \\.${classe}\\{([^}]*)\\}`));
  if (!m) throw new Error(`classe .${classe} não encontrada no SVG emitido`);
  return m[1];
}

describe("a sobrancelha e a boca são TRAÇO, não cabelo", () => {
  it("`.kk-risco` pinta com --av-linha", () => {
    expect(regra("kk-risco")).toContain("stroke:var(--av-linha)");
  });

  it("`.kk-risco` NÃO lê --av-cabelo", () => {
    // O ponto do teste. Tingir a sobrancelha com o cabelo apaga 5 das 8 cores
    // contra a pele — a razão está no docstring acima.
    expect(regra("kk-risco")).not.toContain("--av-cabelo");
  });

  it("sobrancelha e boca usam a mesma classe — uma decisão, não duas", () => {
    // Duas classes seriam dois lugares para divergir, e foi divergência de
    // descrição que criou este arquivo.
    const riscos = svg.match(/class="kk-risco"/g) ?? [];
    expect(riscos.length).toBe(3); // duas sobrancelhas + uma boca
  });
});

describe("o cabelo é o único leitor de --av-cabelo na base", () => {
  it("nenhuma classe da base emitida lê --av-cabelo", () => {
    // A base é composta SEM cabelo (o slot `hair` é camada à parte, Bloco 2a).
    // Se alguma classe daqui lesse a cor, o escopo `avatar` da propriedade
    // voltaria a ter o leitor que o docstring antigo inventava.
    expect(svg).not.toContain("--av-cabelo");
  });
});

/**
 * A PEÇA DE ROSTO RECOLORE MESMO SEM MODELO DE CABELO — o boneco CARECA de barba.
 *
 * `--av-cabelo` era emitido só quando havia `modeloCabelo`. A barba lê essa
 * propriedade (D17: barba é cabelo), então num boneco careca ela caía na reserva
 * `#262626` e saía **PRETA — ignorando a cor que o aluno escolheu**. Ele podia ter
 * escolhido loiro: a barba saía preta do mesmo jeito, e nada na tela explicava.
 *
 * A careca não é um caso de canto: é uma das seis opções do seletor, e
 * `users.avatar_hair_color` existe independentemente de `users.avatar_hair`. O aluno
 * escolhe a cor, some com o cabelo, e a barba tem de continuar sendo daquela cor.
 *
 * **A ausência continua valendo onde ela é o contrato**: sem cabelo E sem peça que
 * leia a propriedade, nada é emitido — é o que o bloco acima cobra e o que mantém os
 * onze selos de `parametrico-congelado.ts` e o teto da base careca de pé.
 */
describe("a barba do boneco CARECA usa a cor escolhida, não a reserva", () => {
  const barba = ROSTOS["rosto-barba-cheia"];
  const careca = (cabelo: string) =>
    compor({ pele: PELE[2], cabelo, ns: "t2", rosto: barba });

  it("`--av-cabelo` É emitido quando há peça de rosto que a lê", () => {
    expect(careca(CABELO[3])).toContain(`--av-cabelo:${CABELO[3]}`);
  });

  it("trocar a cor do cabelo muda o SVG do careca de barba", () => {
    // Sem isto, a asserção acima passaria com a propriedade emitida e ignorada.
    expect(careca(CABELO[3])).not.toBe(careca(CABELO[0]));
  });

  it("SEM peça de rosto, a ausência continua — a base careca não muda um byte", () => {
    expect(compor({ pele: PELE[2], cabelo: CABELO[3], ns: "t2" })).not.toContain("--av-cabelo");
  });
});
