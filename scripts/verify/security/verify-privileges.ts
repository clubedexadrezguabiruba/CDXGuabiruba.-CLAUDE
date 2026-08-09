/**
 * GATE DE SEGURANÇA DO BANCO
 *
 * Assere três propriedades:
 *
 *  1. Toda função SECURITY DEFINER em `public` fixa search_path.
 *     Sem isso, o chamador pode plantar objetos que a função resolve
 *     (`function_search_path_mutable` no linter do Supabase).
 *
 *  2. Helpers internos que mutam estado NÃO são executáveis por anon nem
 *     authenticated. grant_xp chamável do browser é o caso crítico.
 *
 *  3. Nenhuma tabela de `public` é ESCREVÍVEL pelo browser. Escrever exige
 *     duas coisas ao mesmo tempo — `GRANT` de INSERT/UPDATE/DELETE ao papel
 *     **e** uma policy PERMISSIVE daquele comando que alcance o papel (ou RLS
 *     desligado). Policy sem grant não escreve; grant sem policy não escreve.
 *     A régua mede o par, que é o privilégio efetivo. Toda concessão é do
 *     servidor via RPC (Regra Inviolável nº 1): escrita direta do browser é
 *     dado forjável, e quem lê a tabela depois herda a mentira.
 *
 *  4. Objetos de dados que só devem ser lidos por RPC não são SELECTáveis
 *     direto por anon nem authenticated. O caso é `user_public_profiles`:
 *     é MATERIALIZED VIEW, e matview **não aceita RLS** no Postgres — a
 *     única defesa possível é o privilégio. Ela carrega `display_name` cru
 *     e a coluna `ranking_visible`. Ou seja, o opt-out do ranking e a
 *     máscara de nome são filtros aplicados **nas RPCs**, sobre um dado que
 *     ali está inteiro: se a matview for legível direto, os dois caem
 *     juntos. É o `materialized_view_in_api` do linter do Supabase.
 *
 * O QUE ESTA RÉGUA NÃO ENXERGA:
 *  - Grant por COLUNA. `has_table_privilege(...,'SELECT')` é falso quando o
 *    privilégio foi dado coluna a coluna; ali só `has_column_privilege` veria.
 *  - Se a expressão da policy de escrita é boa. A seção 5 pergunta "escreve ou
 *    não escreve", não "escreve só a linha certa". Uma policy que deixa o aluno
 *    gravar a própria linha reprova do mesmo jeito — é escrita direta.
 *  - Outro objeto que exponha o mesmo dado por outro caminho (view nova
 *    sobre `users`, função sem máscara). Esta régua olha a lista abaixo, não
 *    o dado.
 *  - Estado fora do versionado: ela mede o banco, não as migrations. É de
 *    propósito — migration é intenção, privilégio efetivo é fato.
 *
 * Uso: npm run verify:privileges
 */

import postgres from "postgres";
import { getDbUrl } from "../db-url";

/** Helpers internos que só devem ser chamáveis por outras funções DEFINER. */
const HELPERS_INTERNOS = [
  "grant_xp",
  "check_level_up",
  "emit_class_feed",
  "_create_random_pet_egg",
  "_create_specific_pet_egg",
  "refresh_public_profiles",
  "handle_new_user",
  "update_updated_at",
  "debug_puzzle_state",
  // Recebe user_id arbitrário. Exposta ao client, deixaria qualquer aluno
  // disparar reconciliação de patente para outro usuário.
  "recompute_user_title",
];

/**
 * Objetos de dados cuja leitura direta pelo browser é proibida — todo acesso
 * passa por RPC, que aplica máscara de nome e o filtro de `ranking_visible`.
 *
 * `service_role` segue lendo (é como `scripts/verify/phase2/validate-phase2.ts`
 * funciona), e revogar de anon/authenticated não quebra fluxo nenhum: nenhum
 * arquivo de `src/` lê estes objetos direto — só migrations e verify scripts.
 */
const SEM_LEITURA_DIRETA = ["user_public_profiles"];

/**
 * Tabelas em que a escrita direta do browser é **decisão registrada**, não
 * descuido. Nome aqui sem justificativa escrita em `docs/achados.md` é dívida,
 * não permissão — a lista existe para ser curta e explicada, nunca para
 * absorver o que o gate reprovou.
 *
 * Vazia de propósito enquanto o R1 estiver aberto. Ver `docs/achados.md`, R1.
 */
const ESCRITA_PELO_BROWSER_PERMITIDA: string[] = [];

/** polcmd do pg_policy → o privilégio de tabela correspondente. */
const CMD_PARA_PRIV: Record<string, "INSERT" | "UPDATE" | "DELETE"> = {
  a: "INSERT",
  w: "UPDATE",
  d: "DELETE",
};

let passed = 0;
let failed = 0;

function ok(msg: string) {
  console.log(`  [PASS] ${msg}`);
  passed++;
}

function nok(msg: string, detail: string) {
  console.log(`  [FAIL] ${msg} -- ${detail}`);
  failed++;
}

async function main() {
  const sql = postgres(getDbUrl(), { connect_timeout: 30 });

  console.log("========================================");
  console.log("GATE: privilégios e search_path do banco");
  console.log("========================================");

  try {
    // --- 1. search_path fixo em toda função SECURITY DEFINER ---
    console.log("\n1. search_path em funções SECURITY DEFINER");

    const definers = await sql<
      { proname: string; args: string; has_sp: boolean }[]
    >`
      select p.proname,
             pg_get_function_identity_arguments(p.oid) as args,
             (p.proconfig is not null
              and exists (select 1 from unnest(p.proconfig) c where c like 'search_path%')) as has_sp
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.prosecdef
      order by p.proname`;

    const semSearchPath = definers.filter((d) => !d.has_sp);

    if (definers.length === 0) {
      nok("Funções SECURITY DEFINER", "nenhuma encontrada — schema aplicado?");
    } else if (semSearchPath.length > 0) {
      nok(
        `search_path fixo em ${definers.length} funções DEFINER`,
        `${semSearchPath.length} sem search_path: ${semSearchPath
          .map((d) => d.proname)
          .slice(0, 8)
          .join(", ")}${semSearchPath.length > 8 ? "..." : ""}`
      );
    } else {
      ok(`Todas as ${definers.length} funções SECURITY DEFINER fixam search_path`);
    }

    // --- 2. helpers internos não executáveis pelo browser ---
    console.log("\n2. EXECUTE dos helpers internos");

    const privs = await sql<
      { proname: string; args: string; anon_exec: boolean; auth_exec: boolean }[]
    >`
      select p.proname,
             pg_get_function_identity_arguments(p.oid) as args,
             has_function_privilege('anon', p.oid, 'EXECUTE') as anon_exec,
             has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_exec
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = any(${HELPERS_INTERNOS})
      order by p.proname`;

    const encontrados = new Set(privs.map((p) => p.proname));
    for (const nome of HELPERS_INTERNOS) {
      if (!encontrados.has(nome)) {
        console.log(`  [SKIP] ${nome} não existe no banco`);
      }
    }

    for (const p of privs) {
      const expostoA: string[] = [];
      if (p.anon_exec) expostoA.push("anon");
      if (p.auth_exec) expostoA.push("authenticated");

      if (expostoA.length > 0) {
        nok(`${p.proname} não deve ser executável pelo browser`, `exposto a: ${expostoA.join(", ")}`);
      } else {
        ok(`${p.proname}: EXECUTE revogado de anon e authenticated`);
      }
    }

    // --- 3. RPCs legítimos seguem chamáveis (não revogamos demais) ---
    console.log("\n3. RPCs legítimos seguem executáveis por authenticated");

    const rpcsPublicos = [
      "puzzle_attempt",
      "complete_lesson_step",
      "claim_chest",
      "equip_item",
      "get_ranking",
      "start_rush",
      "end_rush",
      "join_class",
      "hatch_egg",
      // As duas que substituíram escrita direta do browser no R1. Se um REVOKE
      // futuro as alcançar, a tela de configurações e o liga-desliga de tarefa
      // param de salvar em silêncio — é o que esta seção existe para pegar.
      "set_preferencias",
      "set_task_active",
    ];

    const pub = await sql<{ proname: string; auth_exec: boolean }[]>`
      select p.proname, has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_exec
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = any(${rpcsPublicos})
      order by p.proname`;

    // Sem esta conferência a seção passa por VACUIDADE: o laço percorre só o
    // que a query achou, então uma RPC dropada some da régua em silêncio — que
    // é o modo de falha exato que ela existe para pegar.
    const rpcsNoBanco = new Set(pub.map((r) => r.proname));
    for (const nome of rpcsPublicos) {
      if (!rpcsNoBanco.has(nome)) {
        nok(`${nome} não existe no banco`, "RPC pública sumiu ou foi renomeada");
      }
    }

    for (const r of pub) {
      if (r.auth_exec) ok(`${r.proname}: executável por authenticated (esperado)`);
      else nok(`${r.proname} deveria seguir executável`, "EXECUTE revogado demais");
    }

    // --- 4. objetos de dados sem leitura direta pelo browser ---
    console.log("\n4. SELECT direto em objetos que só devem sair por RPC");

    const objetos = await sql<
      {
        relname: string;
        relkind: string;
        anon_select: boolean;
        auth_select: boolean;
      }[]
    >`
      select c.relname,
             c.relkind,
             has_table_privilege('anon', c.oid, 'SELECT') as anon_select,
             has_table_privilege('authenticated', c.oid, 'SELECT') as auth_select
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = any(${SEM_LEITURA_DIRETA})
      order by c.relname`;

    const achados = new Set(objetos.map((o) => o.relname));
    for (const nome of SEM_LEITURA_DIRETA) {
      if (!achados.has(nome)) nok(`${nome} não existe no banco`, "objeto sumiu ou foi renomeado");
    }

    for (const o of objetos) {
      const tipo = o.relkind === "m" ? "matview (não aceita RLS)" : "relação";
      const expostoA: string[] = [];
      if (o.anon_select) expostoA.push("anon");
      if (o.auth_select) expostoA.push("authenticated");

      if (expostoA.length > 0) {
        nok(
          `${o.relname} não deve ser legível pelo browser — ${tipo}`,
          `SELECT exposto a: ${expostoA.join(", ")} — display_name cru e ranking_visible saem sem o filtro das RPCs`
        );
      } else {
        ok(`${o.relname}: SELECT revogado de anon e authenticated (${tipo})`);
      }
    }

    // --- 5. escrita direta do browser em tabelas de public ---
    console.log("\n5. INSERT/UPDATE/DELETE direto por anon e authenticated");

    const tabelas = await sql<
      {
        oid: number;
        relname: string;
        rls: boolean;
        anon_insert: boolean;
        anon_update: boolean;
        anon_delete: boolean;
        auth_insert: boolean;
        auth_update: boolean;
        auth_delete: boolean;
      }[]
    >`
      select c.oid::int as oid,
             c.relname,
             c.relrowsecurity as rls,
             has_table_privilege('anon', c.oid, 'INSERT') as anon_insert,
             has_table_privilege('anon', c.oid, 'UPDATE') as anon_update,
             has_table_privilege('anon', c.oid, 'DELETE') as anon_delete,
             has_table_privilege('authenticated', c.oid, 'INSERT') as auth_insert,
             has_table_privilege('authenticated', c.oid, 'UPDATE') as auth_update,
             has_table_privilege('authenticated', c.oid, 'DELETE') as auth_delete
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r', 'p')
      order by c.relname`;

    // Só policy PERMISSIVE abre porta; RESTRICTIVE apenas estreita.
    // polroles = {0} significa PUBLIC, que alcança anon e authenticated.
    const policies = await sql<
      { oid: number; polname: string; cmd: string; anon: boolean; auth: boolean }[]
    >`
      select pol.polrelid::int as oid,
             pol.polname,
             pol.polcmd::text as cmd,
             (0 = any(pol.polroles) or 'anon'::regrole::oid = any(pol.polroles)) as anon,
             (0 = any(pol.polroles) or 'authenticated'::regrole::oid = any(pol.polroles)) as auth
      from pg_policy pol
      join pg_class c on c.oid = pol.polrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and pol.polpermissive
        and pol.polcmd::text in ('a', 'w', 'd', '*')`;

    const escrevem: { relname: string; detalhe: string }[] = [];

    for (const t of tabelas) {
      const doTabela = policies.filter((p) => p.oid === t.oid);
      const vias: string[] = [];

      for (const priv of ["INSERT", "UPDATE", "DELETE"] as const) {
        const temGrant = {
          anon: t[`anon_${priv.toLowerCase()}` as "anon_insert" | "anon_update" | "anon_delete"],
          authenticated:
            t[`auth_${priv.toLowerCase()}` as "auth_insert" | "auth_update" | "auth_delete"],
        };
        if (!temGrant.anon && !temGrant.authenticated) continue;

        // RLS desligado: o grant sozinho já escreve, sem policy nenhuma.
        if (!t.rls) {
          const papeis = (["anon", "authenticated"] as const).filter((p) => temGrant[p]);
          vias.push(`${priv} com RLS DESLIGADO [${papeis.join(",")}]`);
          continue;
        }

        const doPriv = doTabela.filter((p) => p.cmd === "*" || CMD_PARA_PRIV[p.cmd] === priv);
        const papeis = (["anon", "authenticated"] as const).filter(
          (papel) => temGrant[papel] && doPriv.some((p) => (papel === "anon" ? p.anon : p.auth))
        );
        if (papeis.length === 0) continue;

        const nomes = [...new Set(doPriv.map((p) => p.polname))].sort();
        vias.push(`${priv} via ${nomes.join("+")} [${papeis.join(",")}]`);
      }

      if (vias.length > 0) escrevem.push({ relname: t.relname, detalhe: vias.join(" · ") });
    }

    if (tabelas.length === 0) {
      nok("Tabelas de public", "nenhuma encontrada — schema aplicado?");
    }

    const permitidas = new Set(ESCRITA_PELO_BROWSER_PERMITIDA);
    for (const nome of ESCRITA_PELO_BROWSER_PERMITIDA) {
      if (!escrevem.some((e) => e.relname === nome)) {
        console.log(`  [SKIP] ${nome} está na lista de permitidas mas não é escrevível — linha morta`);
      }
    }

    const violacoes = escrevem.filter((e) => !permitidas.has(e.relname));

    for (const e of escrevem.filter((e) => permitidas.has(e.relname))) {
      ok(`${e.relname}: escrita direta permitida por decisão registrada — ${e.detalhe}`);
    }

    for (const v of violacoes) {
      nok(
        `${v.relname} não deve aceitar escrita direta do browser`,
        `${v.detalhe} — toda concessão passa por RPC (Regra Inviolável nº 1)`
      );
    }

    if (escrevem.length === 0) {
      ok(
        `Nenhuma das ${tabelas.length} tabelas de public aceita escrita direta ` +
          `de anon ou authenticated`
      );
    } else if (violacoes.length === 0) {
      ok(
        `Das ${tabelas.length} tabelas de public, ${escrevem.length} aceitam escrita ` +
          `direta e todas estão na lista de decisões registradas`
      );
    } else {
      console.log(
        "\n  NOTA: `anon` na lista de papéis significa que a policy é PUBLIC — foi criada\n" +
          "  sem cláusula TO, então alcança o papel anônimo. Se a expressão exigir\n" +
          "  `auth.uid()`, que é nulo no anônimo, ele não passa. Esta régua mede o\n" +
          "  privilégio, não a expressão; quem escreve de fato é `authenticated`."
      );
    }
  } finally {
    await sql.end();
  }

  console.log("\n========================================");
  console.log(`RESULTADO: ${passed} passed | ${failed} failed`);
  console.log("========================================");

  if (failed > 0) process.exit(1);
  console.log("\nGate de privilégios: OK");
}

main().catch((e) => {
  console.error("Erro no gate:", e.message);
  process.exit(1);
});
