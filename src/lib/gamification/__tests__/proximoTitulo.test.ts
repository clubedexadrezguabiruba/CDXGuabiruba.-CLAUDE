import { describe, it, expect } from "vitest";
import {
  proximoTitulo,
  fraseDoProximoTitulo,
  RETA_FINAL,
  type DegrauDaEscada,
} from "../proximoTitulo";

/**
 * A escada como o banco a tem em 2026-08-23, depois da migration do Explorador.
 * Os marcos são `tier * 15`, que é o estado real: o acumulado do currículo
 * (0·26·47·66·84·101·115·126) só entra quando a T1 tiver as 26 aulas.
 */
const ESCADA: DegrauDaEscada[] = [
  { tier: 0, title: "Calouro", trail: null, lessons_required: 0 },
  { tier: 1, title: "Aprendiz", trail: "recruta", lessons_required: 15 },
  { tier: 2, title: "Explorador", trail: "soldado", lessons_required: 30 },
  { tier: 3, title: "Analista", trail: "aspirante", lessons_required: 45 },
  { tier: 4, title: "Estrategista", trail: "capitao", lessons_required: 60 },
  { tier: 5, title: "Mestre", trail: "comandante", lessons_required: 75 },
  { tier: 6, title: "Grão-Mestre", trail: "general", lessons_required: 90 },
  { tier: 7, title: "Lenda", trail: "mestre", lessons_required: 105 },
];

/** O banco real de hoje: só `recruta` e `soldado` têm aula. */
const CONTEUDO_DE_HOJE = new Map([
  ["recruta", 15],
  ["soldado", 15],
]);

describe("proximoTitulo — o destino", () => {
  it("nomeia o próximo título de quem está começando", () => {
    const p = proximoTitulo(0, ESCADA, 0, CONTEUDO_DE_HOJE);
    expect(p).toEqual({
      estado: "nomeado",
      titulo: "Aprendiz",
      trilha: "recruta",
      faltam: null,
    });
  });

  it("não promete nada a quem está no topo da escada", () => {
    expect(proximoTitulo(7, ESCADA, 105, CONTEUDO_DE_HOJE)).toEqual({ estado: "topo" });
  });

  it("trata régua sem o degrau seguinte como topo, em vez de quebrar", () => {
    const truncada = ESCADA.slice(0, 3);
    expect(proximoTitulo(2, truncada, 30, CONTEUDO_DE_HOJE)).toEqual({ estado: "topo" });
  });
});

describe("proximoTitulo — a contagem só na reta final", () => {
  it("esconde o número quando o título está longe", () => {
    // 30 aulas para Explorador, 10 feitas: faltam 20, muito além da reta final.
    const p = proximoTitulo(1, ESCADA, 10, CONTEUDO_DE_HOJE);
    expect(p).toMatchObject({ estado: "nomeado", titulo: "Explorador", faltam: null });
  });

  it("mostra o número exatamente no limite da reta final", () => {
    const p = proximoTitulo(1, ESCADA, 30 - RETA_FINAL, CONTEUDO_DE_HOJE);
    expect(p).toMatchObject({ faltam: RETA_FINAL });
  });

  it("esconde o número uma aula antes da reta final começar", () => {
    const p = proximoTitulo(1, ESCADA, 30 - RETA_FINAL - 1, CONTEUDO_DE_HOJE);
    expect(p).toMatchObject({ faltam: null });
  });

  it("nunca devolve contagem negativa — quem fez as aulas está preso no gate", () => {
    // 35 aulas feitas contra marco de 30: já passou, mas não subiu de tier.
    const p = proximoTitulo(1, ESCADA, 35, CONTEUDO_DE_HOJE);
    expect(p).toMatchObject({ faltam: 0 });
  });
});

describe("proximoTitulo — a TRAVA do conteúdo", () => {
  it("não promete prazo para trilha que não tem uma aula sequer", () => {
    // Quem chega a Explorador tem `aspirante` pela frente — e ela está vazia.
    const p = proximoTitulo(2, ESCADA, 30, CONTEUDO_DE_HOJE);
    expect(p).toEqual({ estado: "sem-conteudo", titulo: "Analista" });
  });

  it("destrava sozinha no dia em que a trilha ganha a primeira aula", () => {
    const comUmaAula = new Map(CONTEUDO_DE_HOJE).set("aspirante", 1);
    const p = proximoTitulo(2, ESCADA, 30, comUmaAula);
    expect(p).toMatchObject({ estado: "nomeado", titulo: "Analista", trilha: "aspirante" });
  });

  it("não promete prazo quando a régua vem com trilha nula acima do tier 0", () => {
    const quebrada = ESCADA.map((d) => (d.tier === 1 ? { ...d, trail: null } : d));
    expect(proximoTitulo(0, quebrada, 0, CONTEUDO_DE_HOJE)).toEqual({
      estado: "sem-conteudo",
      titulo: "Aprendiz",
    });
  });
});

describe("fraseDoProximoTitulo", () => {
  it("cala no topo", () => {
    expect(fraseDoProximoTitulo({ estado: "topo" })).toBeNull();
  });

  it("nomeia sem prazo quando a trilha ainda não abriu", () => {
    expect(fraseDoProximoTitulo({ estado: "sem-conteudo", titulo: "Analista" })).toBe(
      "A seguir: Analista. A trilha dele ainda vai abrir.",
    );
  });

  it("diz só o destino fora da reta final", () => {
    expect(
      fraseDoProximoTitulo({
        estado: "nomeado",
        titulo: "Explorador",
        trilha: "soldado",
        faltam: null,
      }),
    ).toBe("Você estuda para Explorador.");
  });

  it("manda ao Desafio Final quem já fez as aulas", () => {
    expect(
      fraseDoProximoTitulo({
        estado: "nomeado",
        titulo: "Explorador",
        trilha: "soldado",
        faltam: 0,
      }),
    ).toBe("Falta o Desafio Final para você virar Explorador.");
  });

  it("concorda o singular na última aula", () => {
    expect(
      fraseDoProximoTitulo({
        estado: "nomeado",
        titulo: "Explorador",
        trilha: "soldado",
        faltam: 1,
      }),
    ).toBe("Falta 1 aula para você virar Explorador.");
  });

  it("conta no plural na reta final", () => {
    expect(
      fraseDoProximoTitulo({
        estado: "nomeado",
        titulo: "Explorador",
        trilha: "soldado",
        faltam: 4,
      }),
    ).toBe("Faltam 4 aulas para você virar Explorador.");
  });
});
