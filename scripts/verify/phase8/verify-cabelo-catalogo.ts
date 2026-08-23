/**
 * GATE: o cabelo como PEÇA DE BAÚ — a negação medida do slot.
 *
 * ⚠️ O NOME DO SCRIPT É LEGADO, e ficar é decisão — precedente escrito em
 * `verify-chest-pool.ts:3-8`, aqui com um motivo a mais: **migrations já
 * aplicadas citam `verify:cabelo-catalogo` em `COMMENT ON FUNCTION`, e migration
 * aplicada não se edita.** O caminho e o nome npm ficam para não espalhar churn
 * por package.json, verify:all e o painel a cada troca de contrato.
 *
 * O QUE ELE MEDIA ATÉ 2026-08-23, E POR QUE MUDOU
 * -----------------------------------------------
 * Ele nasceu no Bloco C medindo a gramática antiga do cabelo: tabela própria
 * (`avatar_hair_catalog`), escada de NÍVEL, e `update_avatar_identity` como dona
 * da coluna. Nada disso existe mais — o cabelo virou peça de `avatar_catalogo`,
 * com raridade e posse, e quem veste é `equipar_peca`.
 *
 * Das quatro conferências antigas:
 *
 *   1. slugs banco × código  → **fundiu-se em `verify:catalogo-slots`**, que já
 *      compara os dois sentidos slot a slot iterando `SLOTS`. Só sobrevive aqui a
 *      asserção da CARECA, que é sobre este slot e sobre nenhum outro.
 *   2. a escada de nível     → **morreu**: não há mais escada.
 *   3. colunas e faixa       → **FICA VERBATIM**, e é o motivo de este arquivo não
 *      ter sido apagado. Ela é a **única** amarra do repositório que liga
 *      `PELE.length` / `CABELO.length` de `palette.ts` ao `CHECK BETWEEN 0 AND 7`
 *      das colunas. Apagar o arquivo a apagaria em silêncio, e cor nova em
 *      `palette.ts` sem migration passaria a reprovar só em produção.
 *   4. a negação medida      → **fica, com o objeto trocado**: era nível contra
 *      `update_avatar_identity`, virou POSSE contra `equipar_peca`.
 *
 * A CARECA NÃO ENTRA NA COMPARAÇÃO, e isso é o desenho, não uma exceção
 * ---------------------------------------------------------------------
 * Careca é `avatar_cabelo IS NULL`: ausência de peça. Não é linha do catálogo e
 * não é modelo do código, então as duas listas podem ser comparadas byte a byte,
 * sem lista de exceções dos dois lados. O gate cobra ativamente que ela NÃO
 * apareça no banco — nem como `careca`, nem como `cabelo-careca`.
 *
 * A NEGAÇÃO É CONTRA A PEÇA REAL, NUNCA CONTRA FIXTURE
 * ----------------------------------------------------
 * E ela tem **controle positivo**: gate que só nega passa por vacuidade no dia em
 * que a RPC negar tudo. As quatro medidas, dentro de transação com ROLLBACK,
 * personificando `authenticated`:
 *
 *   (a) SEM a linha no guarda-roupa, `equipar_peca('cabelo', <legendary>)` é
 *       NEGADO, com a mensagem literal "você ainda não tem a peça";
 *   (b) COM a linha, o MESMO slug é ACEITO e a coluna passa a valê-lo — é o
 *       controle positivo, e é ele que prova que (a) mede alguma coisa;
 *   (c) `equipar_peca('cabelo', null)` é aceito: a careca é a única coisa que não
 *       mudou de natureza nesta virada;
 *   (d) ⭐ `update_avatar_identity` NÃO PODE ALTERAR `avatar_cabelo`. A RPC de
 *       identidade era a dona da coluna e tinha de parar de ser porta dos fundos
 *       do guarda-roupa. Aqui isso é medido por ASSINATURA — a antiga, de três
 *       parâmetros, tem de estar morta — e por EFEITO: chamar a nova e reler.
 *
 * COMO ELE NÃO SUJA A PRODUÇÃO
 * ----------------------------
 * A seção 4 roda dentro de UMA transação que termina em ROLLBACK. Nada sobrevive:
 * nem a linha do guarda-roupa que ela concede, nem o avatar.
 *
 * Uso: npm run verify:cabelo-catalogo
 */

import postgres from "postgres";
import { getDbUrl } from "../db-url";
import { CATALOGO } from "../../../src/lib/avatar/catalogo";
import { CABELO, PELE } from "../../../src/lib/avatar/palette";

/**
 * As três colunas da identidade kokeshi, e o que cada uma indexa.
 *
 * `avatar_hair` virou `avatar_cabelo` em 2026-08-23 — as outras duas não mudaram,
 * e é por isso que elas são as duas cores da emenda à D27: o que o aluno escolhe,
 * e que não é peça.
 */
const COLUNAS: { nome: string; tipo: string; paleta?: number }[] = [
  { nome: "avatar_skin", tipo: "smallint", paleta: PELE.length },
  { nome: "avatar_cabelo", tipo: "text" },
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
  console.log("\nGate do cabelo como peça de baú: OK");
  process.exit(0);
}

async function main() {
  const sql = postgres(getDbUrl(), { connect_timeout: 30 });

  console.log("========================================");
  console.log("GATE: o cabelo como peça de baú");
  console.log("========================================");

  try {
    // --- 1. A CARECA, e só ela ---
    //
    // A comparação de slugs banco × código saiu daqui: `verify:catalogo-slots`
    // faz os dois sentidos, slot a slot, iterando SLOTS. O que fica é a asserção
    // que é DESTE slot: careca não é peça.
    console.log("\n1. A careca não é linha do catálogo");

    const noBanco = await sql<{ slug: string }[]>`
      select slug from public.avatar_catalogo where slot = 'cabelo' order by slug`;
    const slugs = new Set(noBanco.map((l) => l.slug));

    // As duas grafias: a do código antigo (`careca`) e a que o prefixo criaria
    // (`cabelo-careca`). Semear qualquer uma quebra a comparação exata do outro
    // gate, e transforma ausência de peça em peça.
    const carecas = ["careca", "cabelo-careca"].filter((c) => slugs.has(c));
    if (carecas.length > 0) {
      nok(
        `a careca foi semeada no catálogo: ${carecas.join(", ")}`,
        "careca é avatar_cabelo IS NULL — ausência de peça, não peça. Como linha, ela " +
          "obriga as duas listas de verify:catalogo-slots a discordarem de propósito",
      );
    } else {
      ok("a careca não é linha do catálogo (é avatar_cabelo IS NULL)");
    }

    if (slugs.size === 0) {
      nok(
        "nenhuma peça de cabelo no catálogo",
        "a migration 20260823110000 não foi aplicada, ou o slot foi esvaziado",
      );
      return finalizar();
    }
    info(`${slugs.size} peça(s) de cabelo: ${[...slugs].join(" · ")}`);

    // O código tem de saber desenhar todas — é o que permite escolher a cobaia
    // do teste de negação lá embaixo sem inventar slug.
    const noCodigo = new Set(CATALOGO.cabelo);
    const orfas = [...slugs].filter((s) => !noCodigo.has(s));
    if (orfas.length > 0) {
      info(
        `${orfas.length} slug(s) que o código não desenha: ${orfas.join(", ")} — ` +
          "quem reprova por isso é verify:catalogo-slots, não este gate",
      );
    }

    // --- 2. As colunas e a faixa do CHECK ---
    //
    // ⚠️ ESTA CONFERÊNCIA É A RAZÃO DE ESTE ARQUIVO EXISTIR. Era a nº 3 e ficou
    // VERBATIM: é a ÚNICA amarra do repositório que liga PELE.length e
    // CABELO.length de `palette.ts` ao CHECK das colunas. Sem ela, acrescentar
    // uma cor de cabelo em `palette.ts` e esquecer a migration só reprovaria em
    // produção, no primeiro aluno que escolhesse a cor nova.
    console.log("\n2. As três colunas de users, e a faixa contra a paleta do código");

    const cols = await sql<{ column_name: string; data_type: string; udt_name: string }[]>`
      select column_name, data_type, udt_name
      from information_schema.columns
      where table_schema='public' and table_name='users'`;
    const porNome = new Map(cols.map((c) => [c.column_name, c]));

    for (const col of COLUNAS) {
      const achada = porNome.get(col.nome);
      if (!achada) {
        nok(
          `users.${col.nome} não existe`,
          col.nome === "avatar_cabelo"
            ? "renomeada de avatar_hair em 20260823110000 — a migration não foi aplicada"
            : "coluna do Bloco C — a migration não foi aplicada",
        );
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

    // A FK trocou de alvo junto com a coluna: era avatar_hair_catalog, que deixou
    // de existir. Sem ela, um UPDATE grava slug que não existe e o compositor
    // recebe lixo.
    const fk = await sql<{ def: string }[]>`
      select pg_get_constraintdef(con.oid) as def
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace n on n.oid = rel.relnamespace
      where n.nspname='public' and rel.relname='users' and con.contype='f'
        and pg_get_constraintdef(con.oid) ilike '%avatar_cabelo%'`;

    if (fk.length === 0) {
      nok(
        "users.avatar_cabelo sem FK para avatar_catalogo",
        "sem ela, um UPDATE grava slug que não existe e o compositor recebe lixo",
      );
    } else if (!fk[0].def.includes("avatar_catalogo")) {
      nok(
        `users.avatar_cabelo aponta para o alvo errado: ${fk[0].def}`,
        "desde 2026-08-23 o cabelo é peça de avatar_catalogo — avatar_hair_catalog não existe mais",
      );
    } else {
      ok("users.avatar_cabelo referencia avatar_catalogo");
    }

    // A tabela antiga tem de estar MORTA. Se ela voltar, voltam as duas
    // gramáticas — e com elas o segundo guarda-roupa que a FK torna impossível.
    const [{ existe: sobrou }] = await sql<{ existe: boolean }[]>`
      select to_regclass('public.avatar_hair_catalog') is not null as existe`;
    if (sobrou) {
      nok(
        "avatar_hair_catalog ainda existe",
        "ela foi apagada em 20260823110000; ressuscitá-la recria as duas gramáticas",
      );
    } else {
      ok("avatar_hair_catalog não existe mais (a segunda gramática morreu)");
    }

    // --- 3. A negação, medida como o papel authenticated ---
    console.log("\n3. Quem veste é o servidor (transação revertida, papel authenticated)");

    const assinaturas = await sql<{ f: string }[]>`
      select p.oid::regprocedure::text as f
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='public' and p.proname='update_avatar_identity'`;

    // ⭐ A porta dos fundos fechada, medida por ASSINATURA. O Postgres sobrecarrega
    // por assinatura: se a de 3 parâmetros continuasse viva, ela continuaria
    // gravando avatar_cabelo sem passar pela conferência de posse — e o PostgREST
    // ficaria ambíguo entre as duas.
    const antiga = assinaturas.find((a) => a.f.includes("integer,text,integer"));
    if (antiga) {
      nok(
        `a assinatura antiga de update_avatar_identity continua viva: ${antiga.f}`,
        "ela grava o cabelo sem cobrar posse — é a porta dos fundos do guarda-roupa, " +
          "e deixa o PostgREST ambíguo entre as duas",
      );
    } else {
      ok("a assinatura antiga de update_avatar_identity (3 parâmetros) está morta");
    }

    const [{ podeEquipar }] = await sql<{ podeEquipar: boolean }[]>`
      select has_function_privilege(
        'authenticated', 'public.equipar_peca(text, text)', 'EXECUTE') as "podeEquipar"`;
    if (podeEquipar) ok("equipar_peca é executável por authenticated");
    else nok("authenticated não pode executar equipar_peca", "o browser não conseguiria vestir nada");

    const [cobaia] = await sql<{ id: string; email: string }[]>`
      select id, email from users order by created_at limit 1`;
    if (!cobaia) {
      nok("nenhum usuário no banco", "a simulação precisa de uma conta para personificar");
      return finalizar();
    }

    // A peça da negação é a MAIS RARA do slot, e é escolhida do banco — nunca
    // escrita aqui. Fixture seria uma segunda lista para discordar do catálogo.
    const ordem = { legendary: 0, epic: 1, rare: 2, common: 3 } as Record<string, number>;
    const pecas = await sql<{ slug: string; raridade: string; inicial: boolean }[]>`
      select slug, raridade, inicial from public.avatar_catalogo where slot = 'cabelo'`;
    const alvo = [...pecas]
      .filter((p) => !p.inicial)
      .sort((a, b) => (ordem[a.raridade] ?? 9) - (ordem[b.raridade] ?? 9))[0];

    if (!alvo) {
      nok(
        "todas as peças de cabelo são iniciais",
        "sem peça que o aluno NÃO tenha de saída, não há negação a provar",
      );
      return finalizar();
    }

    console.log(
      `   personificando ${cobaia.email}; a peça medida é ${alvo.slug} (${alvo.raridade}) ` +
        `(nada é gravado: ROLLBACK ao final)`,
    );

    const r = {
      negouSemPosse: false,
      msgSemPosse: "",
      aceitouComPosse: false,
      gravouComPosse: null as string | null,
      aceitouCareca: false,
      identidadeMexeuNoCabelo: null as boolean | null,
      erro: null as string | null,
    };

    // O papel de volta é CAPTURADO, nunca `reset role`: dentro da transação o
    // `reset` não devolveu o dono (medido: "permission denied for table users"),
    // e o gate reprovava por defeito próprio. A simulação precisa alternar de
    // papel porque conceder a peça é ato de servidor e vesti-la é ato de aluno.
    const [{ dono }] = await sql<{ dono: string }[]>`select current_user as dono`;

    try {
      await sql.begin(async (tx) => {
        const virar = (papel: string) => tx.unsafe(`set local role ${papel}`);

        // Ponto de partida limpo: sem a peça, e sem nada vestido no slot.
        await tx`delete from public.avatar_guarda_roupa
                 where user_id = ${cobaia.id} and slug = ${alvo.slug}`;
        await tx`update public.users set avatar_cabelo = null where id = ${cobaia.id}`;

        await tx`select set_config('request.jwt.claims', ${JSON.stringify({
          sub: cobaia.id,
          role: "authenticated",
        })}, true)`;
        await virar("authenticated");

        // (a) SEM a linha no guarda-roupa — tem de ser NEGADO
        try {
          await tx.savepoint(async (sp) => {
            await sp`select public.equipar_peca('cabelo', ${alvo.slug})`;
          });
        } catch (e) {
          r.negouSemPosse = true;
          r.msgSemPosse = e instanceof Error ? e.message : String(e);
        }

        // (c) careca — NULL é ausência de peça, sempre livre
        try {
          await tx.savepoint(async (sp) => {
            await sp`select public.equipar_peca('cabelo', null)`;
          });
          r.aceitouCareca = true;
        } catch (e) {
          r.erro ??= e instanceof Error ? e.message : String(e);
        }

        // (d) ⭐ a RPC de identidade NÃO altera o cabelo — medido por EFEITO.
        // Vestimos algo primeiro (via dono, fora da régua), chamamos a RPC e
        // relemos: se a coluna mudou, ela continua sendo porta dos fundos.
        await virar(dono);
        await tx`insert into public.avatar_guarda_roupa (user_id, slug, fonte)
                 values (${cobaia.id}, ${alvo.slug}, 'bau')
                 on conflict do nothing`;
        await tx`update public.users set avatar_cabelo = ${alvo.slug} where id = ${cobaia.id}`;
        await virar("authenticated");

        try {
          await tx.savepoint(async (sp) => {
            await sp`select public.update_avatar_identity(3, 4)`;
          });
          const [u] = await tx<{ cabelo: string | null }[]>`
            select avatar_cabelo as cabelo from public.users where id = ${cobaia.id}`;
          r.identidadeMexeuNoCabelo = u?.cabelo !== alvo.slug;
        } catch (e) {
          r.erro ??= e instanceof Error ? e.message : String(e);
        }

        // (b) COM a linha, a MESMA peça é aceita — o CONTROLE POSITIVO.
        // Sem ele, um gate que só nega passa por vacuidade no dia em que a RPC
        // negar tudo. Despir é ato de aluno (equipar_peca com NULL), então isto
        // roda como authenticated de propósito: se despir falhasse, o controle
        // mediria uma peça que já estava vestida.
        await tx`select public.equipar_peca('cabelo', null)`;
        try {
          await tx.savepoint(async (sp) => {
            await sp`select public.equipar_peca('cabelo', ${alvo.slug})`;
          });
          r.aceitouComPosse = true;
          const [u] = await tx<{ cabelo: string | null }[]>`
            select avatar_cabelo as cabelo from public.users where id = ${cobaia.id}`;
          r.gravouComPosse = u?.cabelo ?? null;
        } catch (e) {
          r.erro ??= e instanceof Error ? e.message : String(e);
        }

        await virar(dono);
        throw new Rollback();
      });
    } catch (e) {
      if (!(e instanceof Rollback)) r.erro ??= e instanceof Error ? e.message : String(e);
    }

    if (r.erro) {
      nok("a simulação quebrou", r.erro);
      return finalizar();
    }

    // (a) A negação, e a MENSAGEM LITERAL. O texto importa: é o que o e2e ataca
    // pelo DOM e o que a criança lê no bloco de erro da vitrine.
    if (r.negouSemPosse && /ainda não tem a peça/i.test(r.msgSemPosse)) {
      ok(`vestir "${alvo.slug}" SEM a linha no guarda-roupa foi NEGADO pelo servidor`);
      info(`mensagem do servidor: ${r.msgSemPosse.trim()}`);
    } else if (r.negouSemPosse) {
      nok(
        `vestir "${alvo.slug}" sem posse foi negado, mas com outra mensagem`,
        `esperado "você ainda não tem a peça"; veio: ${r.msgSemPosse.trim()}`,
      );
    } else {
      nok(
        `vestir "${alvo.slug}" SEM a linha no guarda-roupa foi ACEITO`,
        "o baú deixou de ser a única porta: um rpc() no devtools veste a peça mais " +
          "rara do slot sem nunca a ter ganhado",
      );
    }

    // (b) O controle positivo.
    if (r.aceitouComPosse && r.gravouComPosse === alvo.slug) {
      ok(`vestir "${alvo.slug}" COM a linha foi aceito e a coluna passou a valê-lo`);
    } else {
      nok(
        `vestir "${alvo.slug}" COM a linha não persistiu`,
        `gravado: ${JSON.stringify(r.gravouComPosse)} — sem este controle, a negação ` +
          "acima passaria por vacuidade se a RPC negasse tudo",
      );
    }

    // (c) A careca.
    if (r.aceitouCareca) ok("careca (avatar_cabelo NULL) foi aceita");
    else
      nok(
        "careca foi negada",
        "NULL é ausência de peça, sempre livre — é a única coisa que não mudou de " +
          "natureza quando o cabelo virou peça de baú",
      );

    // (d) ⭐ A porta dos fundos, medida por efeito.
    if (r.identidadeMexeuNoCabelo === false) {
      ok("update_avatar_identity NÃO alterou avatar_cabelo — a porta dos fundos está fechada");
    } else if (r.identidadeMexeuNoCabelo === true) {
      nok(
        "update_avatar_identity ALTEROU avatar_cabelo",
        "a RPC de identidade voltou a ser dona da coluna — ela grava sem cobrar posse, " +
          "e um rpc() no devtools contorna o guarda-roupa inteiro",
      );
    } else {
      nok("não deu para medir o efeito de update_avatar_identity", "a chamada não completou");
    }
  } finally {
    await sql.end();
  }

  finalizar();
}

main().catch((e) => {
  console.error("Erro no gate:", e.message);
  process.exit(1);
});
