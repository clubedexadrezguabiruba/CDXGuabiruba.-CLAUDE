/**
 * O DASHBOARD NÃO PODE VOLTAR A ENFILEIRAR AS CONSULTAS.
 *
 * Contar consultas não prova nada — em fila ou em paralelo, são as mesmas. O
 * que este teste mede é QUANDO cada uma parte: todas ficam penduradas sem
 * resolver, e a asserção é que todas já saíram antes de qualquer resposta
 * chegar. Em fila, só a primeira teria saído.
 *
 * Achado T10 de docs/achados.md.
 *
 * ERAM TRÊS E VIRARAM SEIS em 2026-08-23, com a linha do próximo título (D11).
 * As três novas — a régua `title_tiers`, a contagem de aulas concluídas e as
 * trilhas que têm aula — entraram na MESMA `Promise.all`, e é exatamente isso
 * que este teste existe para travar: a tentação, ao adicionar consulta, é
 * escrever um `await` solto logo abaixo dos que já estavam lá.
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

/**
 * A resposta presa de cada tabela. `user_lesson_progress` devolve `count`
 * porque a consulta real é `head: true` — ela não traz linha nenhuma.
 */
const RESPOSTA: Record<string, unknown> = {
  users: { data: null as unknown, error: null },
  user_titles: { data: { current_title: "Cabo", achieved_tier: 1 }, error: null },
  title_tiers: {
    data: [
      { tier: 1, title: "Aprendiz", trail: "recruta", lessons_required: 15 },
      { tier: 2, title: "Explorador", trail: "soldado", lessons_required: 30 },
      { tier: 3, title: "Analista", trail: "aspirante", lessons_required: 45 },
    ],
    error: null,
  },
  user_lesson_progress: { count: 28, error: null },
  lessons: { data: [{ trail: "recruta" }, { trail: "soldado" }], error: null },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "aluno-1" } }, error: null }),
    },
    /**
     * O construtor do Supabase é encadeável E aguardável: `.eq()` devolve ele
     * mesmo, `.single()` e o `await` resolvem a mesma promessa. A promessa
     * nasce no `select()` — é lá que a consulta "parte", e é o instante que
     * este teste mede.
     */
    from: (tabela: string) => ({
      select: () => {
        const valor = tabela === "users" ? { data: banco.perfil, error: null } : RESPOSTA[tabela];
        const promessa = banco.presa(tabela, valor);
        const construtor = {
          eq: () => construtor,
          single: () => promessa,
          then: (ok: (v: unknown) => unknown, err?: (e: unknown) => unknown) =>
            promessa.then(ok, err),
        };
        return construtor;
      },
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
import FaixaDeComando from "@/components/layout/FaixaDeComando";

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

  it("dispara as SEIS consultas JUNTAS, antes de qualquer resposta chegar", async () => {
    const emVoo = DashboardPage();

    // Só o `getUser` teve resposta. As outras seis continuam penduradas.
    await respirar();

    expect(banco.iniciadas).toEqual([
      "users",
      "user_titles",
      "rpc:ranking",
      // As três do próximo título entraram no mesmo lote, não numa segunda onda.
      "title_tiers",
      "user_lesson_progress",
      "lessons",
    ]);

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

  /**
   * A fiação da linha do próximo título (D11), de ponta a ponta: o tier vem de
   * `user_titles`, o nome do degrau seguinte vem de `title_tiers`, a contagem
   * sai da diferença entre o marco e as aulas concluídas — e a frase só traz
   * NÚMERO porque 28 de 30 está dentro da reta final.
   *
   * A trava do conteúdo tem teste próprio, na unidade
   * (`lib/gamification/__tests__/proximoTitulo.test.ts`). Aqui o que se prova é
   * que os quatro dados chegam ao componente certo.
   */
  it("monta a frase do próximo título a partir das quatro fontes e a entrega à faixa", async () => {
    const emVoo = DashboardPage();
    await respirar();
    for (const soltar of banco.presas) soltar();

    const props = acharProps(await emVoo, FaixaDeComando);

    expect(props).not.toBeNull();
    expect(props!.proximoTitulo).toBe("Faltam 2 aulas para você virar Explorador.");
  });
});
