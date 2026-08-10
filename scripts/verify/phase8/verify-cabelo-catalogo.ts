/**
 * GATE: o catálogo de cabelo do avatar kokeshi — Bloco C da troca de pilha.
 *
 * O QUE ELE EXISTE PARA IMPEDIR
 * -----------------------------
 * Duas falhas, e as duas são silenciosas:
 *
 *  1. **Divergência de slug.** A forma do cabelo é do código (`MODELOS_CABELO`),
 *     a régua de quem pode usar é do banco (`avatar_hair_catalog`). Um cabelo
 *     desenhado e não semeado é uma opção que a tela oferece e o servidor nega;
 *     um slug semeado e não desenhado é um cadeado que abre para o nada. Nenhum
 *     dos dois quebra nada no `apply` — só na cara da criança.
 *
 *  2. **Régua que não é régua.** Se `update_avatar_identity` não conferir o
 *     nível, o cadeado vira enfeite de CSS: um `rpc()` no devtools veste o
 *     moicano no nível 1. É a Regra Inviolável nº 1, e a única prova aceitável é
 *     a negação MEDIDA — chamada de verdade, como o papel `authenticated`.
 *
 * A CARECA NÃO ENTRA NA COMPARAÇÃO, e isso é o desenho, não uma exceção
 * ---------------------------------------------------------------------
 * Careca é `avatar_hair IS NULL`: ausência de peça. Não é linha do catálogo e
 * não é modelo do código, então as duas listas podem ser comparadas byte a byte,
 * sem lista de exceções dos dois lados. O gate cobra ativamente que 'careca'
 * NÃO apareça no banco — o dia em que alguém a semear, a comparação exata morre.
 *
 * COMO ELE NÃO SUJA A PRODUÇÃO
 * ----------------------------
 * A seção 4 roda dentro de UMA transação que termina em ROLLBACK. Ela rebaixa o
 * nível da cobaia para 1 (como dono, antes de virar `authenticated`) para que
 * exista cabelo acima do alcance dela seja qual for o XP real da conta. Nada
 * sobrevive: nem o nível, nem o avatar.
 *
 * Uso: npm run verify:cabelo-catalogo
 */

import postgres from "postgres";
import { getDbUrl } from "../db-url";
import { MODELOS_CABELO } from "../../../src/lib/avatar/estilo/cabelo";
import { CABELO, PELE } from "../../../src/lib/avatar/palette";

/** As três colunas que o Bloco C acrescentou, e o que cada uma indexa. */
const COLUNAS: { nome: string; tipo: string; paleta?: number }[] = [
  { nome: "avatar_skin", tipo: "smallint", paleta: PELE.length },
  { nome: "avatar_hair", tipo: "text" },
  { nome: "avatar_hair_color", tipo: "smallint", paleta: CABELO.length },
];

let passed = 0;
let failed = 0;

function ok(msg: string) {
  console.log(`  [PASS] ${msg}`);
  passed++;
}

function nok(msg: string, detalhe: string) {
  console.log(`  [FAIL] ${msg}`);
  console.log(`         ${detalhe}`);
  failed++;
}

function info(msg: string) {
  console.log(`  [INFO] ${msg}`);
}

class Rollback extends Error {}

function finalizar(): never {
  console.log("\n========================================");
  console.log(`RESULTADO: ${passed} passed | ${failed} failed`);
  console.log("========================================");
  if (failed > 0) process.exit(1);
  console.log("\nGate do catálogo de cabelo: OK");
  process.exit(0);
}

async function main() {
  const sql = postgres(getDbUrl(), { connect_timeout: 30 });

  console.log("========================================");
  console.log("GATE: catálogo de cabelo (banco x código)");
  console.log("========================================");

  try {
    // --- 1. Os slugs batem dos dois lados ---
    console.log("\n1. Os slugs do banco são exatamente os MODELOS_CABELO do código");

    const [{ existe: temTabela }] = await sql<{ existe: boolean }[]>`
      select to_regclass('public.avatar_hair_catalog') is not null as existe`;

    if (!temTabela) {
      nok(
        "tabela avatar_hair_catalog não existe",
        "aplicar supabase/migrations/20260810160000_bloco_c_identidade_do_avatar.sql",
      );
      return finalizar();
    }
    ok("tabela avatar_hair_catalog existe");

    const linhas = await sql<{ slug: string; min_level: number }[]>`
      select slug, min_level from public.avatar_hair_catalog order by min_level, slug`;

    const noBanco = new Set(linhas.map((l) => l.slug));
    const noCodigo = new Set<string>(MODELOS_CABELO);

    const sobrando = [...noBanco].filter((s) => !noCodigo.has(s));
    const faltando = [...noCodigo].filter((s) => !noBanco.has(s));

    if (sobrando.length > 0) {
      nok(
        `${sobrando.length} slug(s) no banco que o código não desenha: ${sobrando.join(", ")}`,
        "cadeado que abre para o nada — a tela ofereceria um cabelo que compor() não sabe emitir",
      );
    }
    if (faltando.length > 0) {
      nok(
        `${faltando.length} modelo(s) do código sem linha no banco: ${faltando.join(", ")}`,
        "o servidor negaria um cabelo que a tela oferece — RPC nova ou seed faltando",
      );
    }
    if (sobrando.length === 0 && faltando.length === 0) {
      ok(`${linhas.length} slugs iguais dos dois lados: ${[...noBanco].sort().join(", ")}`);
    }

    // A careca é ausência de peça. Semeada, ela quebra a comparação exata acima.
    if (noBanco.has("careca")) {
      nok(
        "'careca' foi semeada no catálogo",
        "careca é avatar_hair IS NULL — ausência de peça, não peça. Como linha, ela obriga as duas listas a discordarem de propósito",
      );
    } else {
      ok("'careca' não é linha do catálogo (é avatar_hair IS NULL)");
    }

    // --- 2. A escada é usável ---
    console.log("\n2. A escada de desbloqueio");

    const livres = linhas.filter((l) => l.min_level <= 1);
    if (livres.length === 0) {
      nok(
        "nenhum cabelo livre na criação",
        "com todos travados, a criação de personagem oferece só a careca",
      );
    } else {
      ok(`${livres.length} cabelo(s) livre(s) na criação: ${livres.map((l) => l.slug).join(", ")}`);
    }

    const invalidos = linhas.filter((l) => l.min_level < 1);
    if (invalidos.length > 0) {
      nok(
        `${invalidos.length} linha(s) com min_level abaixo de 1`,
        "o nível do aluno começa em 1; min_level 0 é degrau que não existe",
      );
    } else {
      ok("nenhum min_level abaixo de 1");
    }

    info(
      "escada viva: " +
        linhas.map((l) => `${l.slug} n${l.min_level}`).join(" · ") +
        " (careca sempre livre)",
    );

    // --- 3. As colunas e a faixa do CHECK ---
    console.log("\n3. As três colunas de users, e a faixa contra a paleta do código");

    const cols = await sql<{ column_name: string; data_type: string; udt_name: string }[]>`
      select column_name, data_type, udt_name
      from information_schema.columns
      where table_schema='public' and table_name='users'`;
    const porNome = new Map(cols.map((c) => [c.column_name, c]));

    for (const col of COLUNAS) {
      const achada = porNome.get(col.nome);
      if (!achada) {
        nok(`users.${col.nome} não existe`, "coluna do Bloco C — a migration não foi aplicada");
        continue;
      }
      if (achada.udt_name !== (col.tipo === "smallint" ? "int2" : "text")) {
        nok(
          `users.${col.nome} tem tipo ${achada.udt_name}, esperado ${col.tipo}`,
          "índice de paleta cabe em smallint; slug é text",
        );
      } else {
        ok(`users.${col.nome} existe (${col.tipo})`);
      }
    }

    // A faixa do CHECK tem de ter exatamente o tamanho da paleta do código. É o
    // que permite guardar índice em vez de hex sem criar uma segunda paleta:
    // cor nova em palette.ts sem migration reprova aqui, e não em produção.
    const checks = await sql<{ conname: string; def: string }[]>`
      select con.conname, pg_get_constraintdef(con.oid) as def
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace n on n.oid = rel.relnamespace
      where n.nspname='public' and rel.relname='users' and con.contype='c'`;

    for (const col of COLUNAS.filter((c) => c.paleta !== undefined)) {
      const check = checks.find((c) => c.def.includes(col.nome));
      if (!check) {
        nok(`users.${col.nome} sem CHECK de faixa`, "sem ele, índice fora da paleta entra no banco");
        continue;
      }
      const teto = col.paleta! - 1;
      // A migration escreve `BETWEEN 0 AND 7`, mas o Postgres NORMALIZA para
      // `((x >= 0) AND (x <= 7))` — procurar por "BETWEEN" aqui não acha nada
      // nunca, e o gate reprovaria por defeito próprio. Medido em transação
      // revertida antes de a migration ser aplicada.
      const temPiso = />=\s*0\b/.test(check.def);
      const casaTeto = check.def.match(/<=\s*(\d+)/);
      const bate = temPiso && casaTeto !== null && Number(casaTeto[1]) === teto;
      if (!bate) {
        nok(
          `users.${col.nome}: a faixa do CHECK não é 0..${teto}`,
          `${check.def} — a paleta do código tem ${col.paleta} entradas; migration nova é obrigatória quando ela muda`,
        );
      } else {
        ok(`users.${col.nome}: CHECK 0..${teto}, igual à paleta do código (${col.paleta} entradas)`);
      }
    }

    const fk = await sql<{ def: string }[]>`
      select pg_get_constraintdef(con.oid) as def
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace n on n.oid = rel.relnamespace
      where n.nspname='public' and rel.relname='users' and con.contype='f'
        and pg_get_constraintdef(con.oid) ilike '%avatar_hair_catalog%'`;

    if (fk.length === 0) {
      nok(
        "users.avatar_hair sem FK para avatar_hair_catalog",
        "sem ela, um UPDATE grava slug que não existe e o compositor recebe lixo",
      );
    } else {
      ok("users.avatar_hair referencia avatar_hair_catalog");
    }

    // --- 4. A negação, medida como o papel authenticated ---
    console.log("\n4. A régua é do servidor (transação revertida, papel authenticated)");

    const [{ existe: temRpc }] = await sql<{ existe: boolean }[]>`
      select exists (
        select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname='public' and p.proname='update_avatar_identity'
      ) as existe`;

    if (!temRpc) {
      nok(
        "RPC update_avatar_identity não existe",
        "é ela quem confere o nível; sem ela o cadeado é enfeite de CSS",
      );
      return finalizar();
    }
    ok("RPC update_avatar_identity existe");

    const [{ pode }] = await sql<{ pode: boolean }[]>`
      select has_function_privilege(
        'authenticated',
        'public.update_avatar_identity(integer, text, integer)',
        'EXECUTE'
      ) as pode`;
    if (pode) ok("update_avatar_identity é executável por authenticated");
    else nok("authenticated não pode executar update_avatar_identity", "o browser não conseguiria trocar de cabelo");

    const [cobaia] = await sql<{ id: string; email: string }[]>`
      select id, email from users order by created_at limit 1`;
    if (!cobaia) {
      nok("nenhum usuário no banco", "a simulação precisa de uma conta para personificar");
      return finalizar();
    }

    // O mais alto da escada: é o que a cobaia rebaixada não pode alcançar.
    const maisAlto = [...linhas].sort((a, b) => b.min_level - a.min_level)[0];
    const livre = livres[0];
    if (!maisAlto || maisAlto.min_level <= 1 || !livre) {
      nok(
        "a escada não tem degrau travado para medir",
        "sem nenhum cabelo acima do nível 1 não há negação a provar",
      );
      return finalizar();
    }

    console.log(
      `   personificando ${cobaia.email}, rebaixado a nível 1 dentro da transação ` +
        `(nada é gravado: ROLLBACK ao final)`,
    );

    const resultado = {
      negouNivel: false,
      msgNivel: "",
      negouSlug: false,
      aceitouLivre: false,
      gravou: null as { skin: number; hair: string | null; cor: number } | null,
      aceitouCareca: false,
      negouEscritaNaRegua: false,
      erroInesperado: null as string | null,
    };

    try {
      await sql.begin(async (tx) => {
        await tx`update public.users set level = 1 where id = ${cobaia.id}`;
        await tx`select set_config('request.jwt.claims', ${JSON.stringify({
          sub: cobaia.id,
          role: "authenticated",
        })}, true)`;
        await tx`set local role authenticated`;

        // (a) cabelo acima do nível — tem de ser NEGADO
        try {
          await tx.savepoint(async (sp) => {
            await sp`select public.update_avatar_identity(0, ${maisAlto.slug}, 0)`;
          });
        } catch (e) {
          resultado.negouNivel = true;
          resultado.msgNivel = e instanceof Error ? e.message : String(e);
        }

        // (b) slug que não existe — tem de ser NEGADO
        try {
          await tx.savepoint(async (sp) => {
            await sp`select public.update_avatar_identity(0, 'cabelo-que-nao-existe', 0)`;
          });
        } catch {
          resultado.negouSlug = true;
        }

        // (c) cabelo livre — tem de ser ACEITO, e tem de gravar
        try {
          await tx.savepoint(async (sp) => {
            await sp`select public.update_avatar_identity(3, ${livre.slug}, 4)`;
          });
          resultado.aceitouLivre = true;
          const [u] = await tx<{ skin: number; hair: string | null; cor: number }[]>`
            select avatar_skin as skin, avatar_hair as hair, avatar_hair_color as cor
            from public.users where id = ${cobaia.id}`;
          resultado.gravou = u ?? null;
        } catch (e) {
          resultado.erroInesperado = e instanceof Error ? e.message : String(e);
        }

        // (d) careca — NULL é valor legítimo, tem de ser ACEITO
        try {
          await tx.savepoint(async (sp) => {
            await sp`select public.update_avatar_identity(0, null, 0)`;
          });
          resultado.aceitouCareca = true;
        } catch (e) {
          resultado.erroInesperado ??= e instanceof Error ? e.message : String(e);
        }

        // (e) a régua não é editável por quem ela governa
        try {
          await tx.savepoint(async (sp) => {
            await sp`update public.avatar_hair_catalog set min_level = 1 where slug = ${maisAlto.slug}`;
          });
        } catch {
          resultado.negouEscritaNaRegua = true;
        }

        await tx`reset role`;
        throw new Rollback();
      });
    } catch (e) {
      if (!(e instanceof Rollback)) {
        resultado.erroInesperado ??= e instanceof Error ? e.message : String(e);
      }
    }

    if (resultado.erroInesperado) {
      nok("a simulação quebrou", resultado.erroInesperado);
      return finalizar();
    }

    if (resultado.negouNivel) {
      ok(
        `gravar "${maisAlto.slug}" (nível ${maisAlto.min_level}) no nível 1 foi NEGADO pelo servidor`,
      );
      info(`mensagem do servidor: ${resultado.msgNivel.trim()}`);
    } else {
      nok(
        `gravar "${maisAlto.slug}" no nível 1 foi ACEITO`,
        `o cabelo exige nível ${maisAlto.min_level} — a régua do banco não está sendo conferida, e o cadeado da tela é enfeite`,
      );
    }

    if (resultado.negouSlug) ok("slug inexistente foi negado");
    else nok("slug inexistente foi aceito", "a RPC não confere existência — grava lixo em users.avatar_hair");

    if (resultado.aceitouLivre && resultado.gravou?.hair === livre.slug) {
      ok(
        `gravar "${livre.slug}" (livre) no nível 1 foi aceito e persistiu ` +
          `(skin ${resultado.gravou.skin}, cor ${resultado.gravou.cor})`,
      );
    } else {
      nok(
        `gravar "${livre.slug}" (livre) no nível 1 não persistiu`,
        `gravado: ${JSON.stringify(resultado.gravou)} — um gate que só nega passa por vacuidade se a RPC negar tudo`,
      );
    }

    if (resultado.aceitouCareca) ok("careca (avatar_hair NULL) foi aceita");
    else nok("careca foi negada", "NULL é ausência de peça, sempre livre — nenhum nível a governa");

    if (resultado.negouEscritaNaRegua) ok("authenticated não consegue escrever em avatar_hair_catalog");
    else
      nok(
        "authenticated escreveu na própria régua de desbloqueio",
        "baixar o próprio min_level destrava qualquer cabelo sem XP nenhum",
      );
  } finally {
    await sql.end();
  }

  finalizar();
}

main().catch((e) => {
  console.error("Erro no gate:", e.message);
  process.exit(1);
});
