/**
 * O DASHBOARD NÃO PODE VOLTAR A ENFILEIRAR AS CONSULTAS.
 *
 * Contar consultas não prova nada — em fila ou em paralelo, são três do mesmo
 * jeito. O que este teste mede é QUANDO cada uma parte: as três ficam penduradas
 * sem resolver, e a asserção é que as três já saíram antes de qualquer resposta
 * chegar. Em fila, só a primeira teria saído.
 *
 * Achado T10 de docs/achados.md.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// ── Cliente de mentira, com as respostas presas ──────────────

const banco = vi.hoisted(() => {
  const iniciadas: string[] = [];
  const presas: Array<() => void> = [];

  /** Registra que a consulta partiu e devolve uma promise que só o teste solta. */
  function presa<T>(nome: string, valor: T): Promise<T> {
    iniciadas.push(nome);
    return new Promise<T>((resolve) => presas.push(() => resolve(valor)));
  }

  return {
    iniciadas,
    presas,
    presa,
    perfil: {
      avatar_chosen: true,
      xp: 40,
      level: 7,
      display_name: "Ana Paula",
      name: "Ana Paula Souza",
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "aluno-1" } }, error: null }),
    },
    from: (tabela: string) => ({
      select: () => ({
        eq: () => ({
          single: () =>
            tabela === "users"
              ? banco.presa("users", { data: banco.perfil, error: null })
              : banco.presa("user_titles", {
                  data: { current_title: "Cabo" },
                  error: null,
                }),
        }),
      }),
    }),
    rpc: () =>
      banco.presa("rpc:ranking", {
        data: { entries: [], my_rank: null, is_hidden: false },
        error: null,
      }),
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (destino: string) => {
    throw new Error(`REDIRECT:${destino}`);
  },
}));

// Os filhos entram como casca: montá-los de verdade arrastaria os hooks, e
// `useChests`/`useEggs` criam um cliente do Supabase no topo do módulo — em
// `environment: node`, sem as variáveis do .env.local, isso explode no import.
vi.mock("@/components/gamification/DailyPanel", () => ({
  default: function DailyPanelFalso() {
    return null;
  },
}));
vi.mock("@/components/gamification/TaskPanel", () => ({
  default: function TaskPanelFalso() {
    return null;
  },
}));
vi.mock("@/components/layout/FaixaDeComando", () => ({
  default: function FaixaFalsa() {
    return null;
  },
}));

import DashboardPage from "../page";
import DailyPanel from "@/components/gamification/DailyPanel";

// ── Utilidades ───────────────────────────────────────────────

/** Esvazia a fila de microtasks pendentes. */
const respirar = () => new Promise((r) => setTimeout(r, 0));

/** Acha o primeiro elemento de um certo tipo na árvore devolvida e dá seus props. */
function acharProps(
  no: unknown,
  alvo: unknown
): Record<string, unknown> | null {
  if (!no || typeof no !== "object") return null;

  if (Array.isArray(no)) {
    for (const filho of no) {
      const achado = acharProps(filho, alvo);
      if (achado) return achado;
    }
    return null;
  }

  const el = no as { type?: unknown; props?: Record<string, unknown> };
  if (el.type === alvo) return el.props ?? {};
  if (el.props) return acharProps(el.props.children, alvo);
  return null;
}

// ── Testes ───────────────────────────────────────────────────

describe("dashboard — as consultas do servidor", () => {
  beforeEach(() => {
    banco.iniciadas.length = 0;
    banco.presas.length = 0;
  });

  it("dispara perfil, título e ranking JUNTOS, antes de qualquer resposta chegar", async () => {
    const emVoo = DashboardPage();

    // Só o `getUser` teve resposta. As outras três continuam penduradas.
    await respirar();

    expect(banco.iniciadas).toEqual(["users", "user_titles", "rpc:ranking"]);

    // Agora solta tudo e deixa a página terminar.
    for (const soltar of banco.presas) soltar();
    await emVoo;
  });

  it("desce o `level` do servidor para o DailyPanel, em vez de deixar o cliente buscar", async () => {
    const emVoo = DashboardPage();
    await respirar();
    for (const soltar of banco.presas) soltar();

    const props = acharProps(await emVoo, DailyPanel);

    expect(props).not.toBeNull();
    expect(props!.level).toBe(banco.perfil.level);
    expect(props!.title).toBe("Cabo");
  });
});
