/**
 * GATE: banco do subsistema avatar / baús / patentes
 *
 * O QUE MUDOU NO BLOCO B (2026-08-10)
 * -----------------------------------
 * As quatro primeiras seções deste gate mediam o catálogo de itens: RPCs de
 * equipar, CHECK de slots, UNIQUE e FK de inventário, e policies de vazamento
 * entre colegas. **As três tabelas foram apagadas** — o Doug decidiu que o
 * avatar novo é novo (docs/avatar/20-troca-de-pilha-plano.md).
 *
 * Apagar as conferências junto seria o erro que o R1 já cometeu uma vez: um
 * gate que some é um gate que passa por vacuidade. Elas foram INVERTIDAS, no
 * mesmo truque do "Gate 6b" — o que antes era exigido por nome agora é
 * **exigido ausente**. Uma migration futura que recrie `items` ou `equip_item`
 * reprova aqui, em vez de ressuscitar a pilha v2 em silêncio.
 *
 * O QUE ESTE GATE TRAVA HOJE
 * --------------------------
 *  1. AUSÊNCIA (Bloco B) — as 3 tabelas de item, as 3 RPCs de item e as 4
 *     colunas de FK não voltaram.
 *  2. O QUE SOBREVIVEU — as RPCs de baú e ovo continuam de pé, e o baú não
 *     depende de item (isso quem prova a fundo é o verify:chest-pool).
 *  3. PATENTES (T0.17) — a régua vive em `title_tiers`. Cinco coisas travadas:
 *     (a) a régua é uma escada: tier contíguo e marco crescente.
 *     (b) `complete_lesson_step` continua chamando `recompute_user_title`.
 *     (c) todo usuário tem linha em `user_titles`. Foi a ausência dessa linha
 *         — e não a régua — que fez o `teacherdoug001` concluir a trilha
 *         inteira em 2026-07-29 e continuar "Aprendiz": o UPDATE antigo casava
 *         zero linhas e não reclamava.
 *     (d) a reconciliação está em dia.
 *     (e) **o princípio**: a patente vem de concluir uma TRILHA, e o marco em
 *         `lessons_required` é a contagem acumulada de aulas até a trilha que
 *         aquela patente fecha — medida em `lessons`, não digitada. Decisão do
 *         Doug em 2026-08-11, que fechou o achado T1.
 *
 *     A antiga conferência do uniforme ("uniforme só para patente alcançável")
 *     saiu no Bloco B junto com a coluna `title_tiers.outfit_item_id`. Ela
 *     impedia gastar arte em marco inalcançável; quando o uniforme voltar, por
 *     outro caminho, ela precisa voltar com ele.
 *
 *     **O caminho de volta foi construído no Bloco 1 do doc 21** (a tabela é
 *     `avatar_catalogo`, e o marco é `min_tier`), mas a trava **não entra aqui
 *     ainda**: com zero trajes semeados ela passaria por vacuidade, que é
 *     exatamente o defeito que ela existe para não ter. Ela chega junto com o
 *     primeiro traje, no Bloco 2. A dívida segue anotada, agora com endereço.
 *
 *  4. OS SLOTS (Bloco 1 do doc 21) — as duas tabelas do guarda-roupa existem, e
 *     **ninguém está vestindo peça a que não tem direito**. A FK garante que o
 *     slug existe; ela não sabe nada sobre marco nem sobre guarda-roupa. Um
 *     `min_level` corrigido para cima amanhã deixa quem já equipou vestindo o
 *     que a régua passou a negar — e nada acusa, porque `equipar_peca` só é
 *     consultada na hora de gravar.
 *
 * Uso: npm run verify:avatar-db
 */

import postgres from "postgres";
import { getDbUrl } from "../db-url";
import { PATENTES } from "../../avatar/patentes";

/** Apagadas no Bloco B. Se qualquer uma voltar, a pilha v2 está ressuscitando. */
const TABELAS_PROIBIDAS = ["items", "user_inventory", "user_equipped"];

/** Idem, para as funções do inventário. */
const RPCS_PROIBIDAS = ["equip_item", "unequip_slot", "_create_specific_pet_egg"];

/** Colunas de FK que apontavam para `items` em tabelas que sobreviveram. */
const COLUNAS_PROIBIDAS: [string, string][] = [
  ["user_chests", "item_id"],
  ["user_eggs", "pet_item_id"],
  ["achievements", "reward_item_id"],
  ["title_tiers", "outfit_item_id"],
];

/** O que sobrou de pé e precisa continuar existindo. */
const RPCS_ESPERADAS = [
  "claim_chest",
  "update_avatar_base",
  "get_eggs",
  "hatch_egg",
  "_create_random_pet_egg",
  // Bloco 1 do doc 21: a única via de escrita das 5 colunas de equipar.
  "equipar_peca",
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

async function main() {
  const sql = postgres(getDbUrl(), { connect_timeout: 30 });

  console.log("========================================");
  console.log("GATE: banco do avatar");
  console.log("========================================");

  try {
    // --- 1. O que o Bloco B apagou não voltou ---
    console.log("\n1. A pilha v2 não ressuscitou");

    for (const tabela of TABELAS_PROIBIDAS) {
      const [{ existe }] = await sql<{ existe: boolean }[]>`
        select to_regclass(${"public." + tabela}) is not null as existe`;
      if (existe) {
        nok(
          `tabela ${tabela} existe de novo`,
          "foi apagada no Bloco B; recriá-la traz de volta o catálogo do avatar v2",
        );
      } else {
        ok(`tabela ${tabela} ausente (correto)`);
      }
    }

    const fnsProibidas = await sql<{ proname: string }[]>`
      select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='public' and p.prokind='f' and p.proname = any(${RPCS_PROIBIDAS})`;
    const voltaram = new Set(fnsProibidas.map((f) => f.proname));
    for (const nome of RPCS_PROIBIDAS) {
      if (voltaram.has(nome)) {
        nok(`RPC ${nome} existe de novo`, "foi dropada no Bloco B junto com as tabelas de item");
      } else {
        ok(`RPC ${nome} ausente (correto)`);
      }
    }

    const colunas = await sql<{ table_name: string; column_name: string }[]>`
      select table_name, column_name from information_schema.columns
      where table_schema='public'`;
    const temColuna = new Set(colunas.map((c) => `${c.table_name}.${c.column_name}`));
    for (const [tabela, coluna] of COLUNAS_PROIBIDAS) {
      if (temColuna.has(`${tabela}.${coluna}`)) {
        nok(
          `coluna ${tabela}.${coluna} existe de novo`,
          "era FK para items; foi dropada no Bloco B",
        );
      } else {
        ok(`coluna ${tabela}.${coluna} ausente (correto)`);
      }
    }

    // Nenhuma função pode citar as colunas apagadas. Esta conferência nasceu de
    // um erro real: a primeira versão do Bloco B dropou `user_chests.item_id` e
    // `user_eggs.pet_item_id` deixando `claim_chest` e `_create_random_pet_egg`
    // ainda referenciando as duas. Não quebra no `apply` — plpgsql não valida
    // corpo contra esquema — quebra em runtime, na hora em que uma criança abre
    // um baú. É o tipo de falha que só um gate acha.
    const todasFns = await sql<{ proname: string; def: string }[]>`
      select p.proname, pg_get_functiondef(p.oid) as def
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='public' and p.prokind='f'`;

    const COLUNAS_MORTAS = [
      /\bitem_id\b/,
      /\bpet_item_id\b/,
      /\breward_item_id\b/,
      /\boutfit_item_id\b/,
    ];

    /**
     * Comentário não executa, e as próprias migrations do Bloco B explicam nos
     * comentários QUAIS colunas saíram — citando os nomes. Sem esta limpeza o
     * gate reprova por causa da documentação do conserto, que foi o que
     * aconteceu na primeira rodada.
     */
    const semComentarios = (def: string) =>
      def
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/--[^\n]*/g, " ");

    const citando = todasFns.filter((f) =>
      COLUNAS_MORTAS.some((re) => re.test(semComentarios(f.def))),
    );

    if (citando.length > 0) {
      nok(
        `${citando.length} função(ões) ainda citam colunas que o Bloco B apagou`,
        `${citando.map((f) => f.proname).join(", ")} — quebram em runtime, não no apply`,
      );
    } else {
      ok("nenhuma função cita as colunas apagadas");
    }

    // --- 2. O que sobreviveu continua de pé ---
    console.log("\n2. Baús e ovos continuam existindo");

    const fns = await sql<{ proname: string }[]>`
      select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='public' and p.prokind='f' and p.proname = any(${RPCS_ESPERADAS})`;
    const presentes = new Set(fns.map((f) => f.proname));
    for (const nome of RPCS_ESPERADAS) {
      if (presentes.has(nome)) ok(`${nome} existe`);
      else nok(`${nome} não existe`, "RPC que o Bloco B devia ter preservado sumiu do banco");
    }

    // O UNIQUE de user_chests sustenta a idempotência da concessão de baú, e
    // sobreviveu ao Bloco B porque não tinha nada a ver com item.
    const cons = await sql<{ tabela: string; def: string }[]>`
      select rel.relname as tabela, pg_get_constraintdef(con.oid) as def
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace n on n.oid = rel.relnamespace
      where n.nspname='public' and con.contype='u' and rel.relname='user_chests'`;

    if (cons.some((c) => c.def.startsWith("UNIQUE (user_id, source_type, source_id)"))) {
      ok("user_chests: UNIQUE (user_id, source_type, source_id)");
    } else {
      nok(
        "user_chests sem UNIQUE (user_id, source_type, source_id)",
        "sem ele o mesmo evento gera baús repetidos",
      );
    }

    const policies = await sql<{ tablename: string; policyname: string }[]>`
      select tablename, policyname from pg_policies where schemaname='public'`;
    if (policies.some((p) => p.tablename === "user_chests" && p.policyname === "user_chests_select_own")) {
      ok('policy "user_chests_select_own" presente');
    } else {
      nok('policy "user_chests_select_own" ausente', "o aluno não veria os próprios baús");
    }

    // --- 3. Patentes (T0.17) ---
    console.log("\n3. Patentes: régua e reconciliação");

    const [{ existe }] = await sql<{ existe: boolean }[]>`
      select to_regclass('public.title_tiers') is not null as existe`;

    const tiers = existe
      ? await sql<{ tier: number; title: string; level_name: string | null; lessons_required: number }[]>`
          select tier, title, level_name, lessons_required
          from title_tiers order by tier`
      : [];

    if (!existe) {
      nok(
        "tabela title_tiers não existe",
        "a régua da patente ainda está hard-coded dentro de complete_lesson_step — aplicar 20260729120000_patente_por_marcos.sql",
      );
    } else if (tiers.length === 0) {
      nok("title_tiers vazia", "sem régua, recompute_user_title não concede nada");
    } else {
      ok(`title_tiers com ${tiers.length} patentes`);

      // (a) A régua precisa ser uma escada: tier contíguo desde 0 e marco
      //     estritamente crescente. Um marco fora de ordem torna a patente
      //     do meio inalcançável sem ninguém perceber.
      const contigua = tiers.every((t, i) => t.tier === i);
      if (!contigua) {
        nok("tiers não são contíguos a partir de 0", `tiers: ${tiers.map((t) => t.tier).join(", ")}`);
      } else {
        ok("tiers contíguos a partir de 0");
      }

      const crescente = tiers.every((t, i) => i === 0 || t.lessons_required > tiers[i - 1].lessons_required);
      if (!crescente) {
        nok(
          "lessons_required não é estritamente crescente",
          `marcos: ${tiers.map((t) => t.lessons_required).join(", ")} — patente do meio fica inalcançável`,
        );
      } else {
        ok(`marcos crescentes: ${tiers.map((t) => t.lessons_required).join(" → ")}`);
      }

      // (a2) O NOME do degrau tem de ser o mesmo nos dois donos: `title_tiers`
      //      no banco e `PATENTES` em scripts/avatar/patentes.ts.
      //
      //      Esta conferência nasceu em 2026-08-23, e nasceu de uma lacuna
      //      registrada: `src/components/ui/Badge.tsx` casa o título por
      //      STRING contra a régua, e nenhum gate comparava as duas pontas. O
      //      resultado medido foi a Badge perder o ponto de cor em silêncio
      //      entre o Bloco 1 e a migration da virada — ninguém viu porque
      //      nada media. O comentário da coluna `title_tiers.title` já mandava
      //      "renomear aqui exige renomear em patentes.ts na mesma janela";
      //      mandar em comentário não reprova nada.
      //
      //      Só os tiers que a régua conhece entram: ela tem 6 linhas (1 a 6),
      //      porque Calouro e Lenda não têm cor própria e ficam fora dela de
      //      propósito. Os dois degraus sem cor não são conferidos aqui.
      const divergentes = PATENTES.flatMap((p) => {
        const noBanco = tiers.find((t) => t.tier === p.tier);
        if (!noBanco) return [`tier ${p.tier} existe na régua e não no banco`];
        if (noBanco.title !== p.patente) {
          return [`tier ${p.tier}: banco diz "${noBanco.title}", régua diz "${p.patente}"`];
        }
        return [];
      });

      if (divergentes.length > 0) {
        nok(
          `nome do título diverge entre banco e régua em ${divergentes.length} degrau(s)`,
          `${divergentes.join(" · ")} — a Badge casa por string, então o degrau divergente perde o ponto de cor em silêncio`,
        );
      } else {
        ok(`nome do título casa com scripts/avatar/patentes.ts nos ${PATENTES.length} degraus com cor`);
      }

      // (b) A wiring. Se alguém reescrever complete_lesson_step a partir de
      //     migration antiga, a chamada some e a patente volta a morrer em
      //     silêncio — que é exatamente o que aconteceu com a curva de XP.
      const defLesson = await sql<{ def: string }[]>`
        select pg_get_functiondef(p.oid) as def
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname='public' and p.prokind='f' and p.proname='complete_lesson_step'`;

      if (defLesson.length === 0) {
        nok("complete_lesson_step não existe", "é ela que dispara a reconciliação da patente");
      } else if (!defLesson[0].def.includes("recompute_user_title")) {
        nok(
          "complete_lesson_step não chama recompute_user_title",
          "concluir aula deixou de reconciliar a patente — provável recolagem de corpo antigo",
        );
      } else {
        ok("complete_lesson_step chama recompute_user_title");
      }

      // (c) Todo usuário tem linha. É o defeito original: sem linha, o UPDATE
      //     casa zero e a patente evapora sem erro.
      const semLinha = await sql<{ display_name: string }[]>`
        select u.display_name from users u
        left join user_titles t on t.user_id = u.id
        where t.user_id is null`;

      if (semLinha.length > 0) {
        nok(
          `${semLinha.length} usuário(s) sem linha em user_titles`,
          `${semLinha.map((u) => u.display_name).join(", ")} — a concessão de patente falharia em silêncio para eles`,
        );
      } else {
        ok("todo usuário tem linha em user_titles");
      }

      // (d) Reconciliação em dia: ninguém abaixo do que já conquistou.
      const atrasados = await sql<{ display_name: string; current_title: string; concluidas: number; devido: string }[]>`
        with progresso as (
          select u.id, u.display_name, t.current_title,
                 (select count(*) from user_lesson_progress p where p.user_id = u.id and p.completed) as concluidas
          from users u join user_titles t on t.user_id = u.id
        )
        select p.display_name, p.current_title, p.concluidas,
               (select tt.title from title_tiers tt
                where tt.lessons_required <= p.concluidas order by tt.tier desc limit 1) as devido
        from progresso p
        where p.current_title is distinct from
              (select tt.title from title_tiers tt
               where tt.lessons_required <= p.concluidas order by tt.tier desc limit 1)`;

      if (atrasados.length > 0) {
        nok(
          `${atrasados.length} usuário(s) com patente desatualizada`,
          atrasados
            .map((a) => `${a.display_name}: ${a.concluidas} aulas, tem "${a.current_title}", devia ter "${a.devido}"`)
            .join(" | "),
        );
      } else {
        ok("nenhum usuário abaixo da patente que a contagem de aulas lhe dá");
      }

      // (e) O PRINCÍPIO: a patente vem de concluir uma TRILHA.
      //
      //     Decisão do Doug em 2026-08-11, que fechou o achado T1. Até então a
      //     relação entre patente e trilha era coincidência posicional — o
      //     marco 15 batia com o fim da `recruta` porque alguém digitou 15, não
      //     porque algo conferisse. A migration 20260811120000 fez a relação
      //     virar coluna (`title_tiers.trail`); aqui ela vira trava.
      //
      //     O que isto impede, concretamente: o currículo vai trocar a T1 de 15
      //     para 26 aulas. No dia em que essas aulas entrarem sem o UPDATE em
      //     `lessons_required`, o marco cai no meio da trilha seguinte e a
      //     promoção deixa de coincidir com terminar alguma coisa. É o B0.5 do
      //     plano técnico deixando de depender de alguém lembrar.
      const [{ temTrail }] = await sql<{ temTrail: boolean }[]>`
        select exists (
          select 1 from information_schema.columns
          where table_schema='public' and table_name='title_tiers' and column_name='trail'
        ) as "temTrail"`;

      if (!temTrail) {
        nok(
          "title_tiers não tem a coluna trail",
          "a patente vem de concluir uma trilha (decisão de 2026-08-11), mas nada amarra tier a trilha — " +
            "aplicar supabase/migrations/20260811120000_t1_patente_por_trilha.sql",
        );
      } else {
        // O acumulado é dirigido pelo próprio `tier`: nenhuma lista de trilhas
        // copiada aqui dentro. Código carregando premissa sobre o conteúdo é a
        // doença que criou o T1.
        const escada = await sql<
          {
            tier: number;
            title: string;
            trail: string | null;
            lessons_required: number;
            aulas_da_trilha: number;
            acumulado: number;
          }[]
        >`
          select t.tier, t.title, t.trail, t.lessons_required,
                 (select count(*)::int from lessons l where l.trail = t.trail) as aulas_da_trilha,
                 (select count(*)::int from lessons l
                    join title_tiers t2 on t2.trail = l.trail
                   where t2.tier <= t.tier) as acumulado
          from title_tiers t
          order by t.tier`;

        const semTrilha = escada.filter((t) => t.tier > 0 && !t.trail);
        const baseComTrilha = escada.filter((t) => t.tier === 0 && t.trail);
        const duplicadas = escada
          .filter((t) => t.trail)
          .filter((t, i, arr) => arr.findIndex((o) => o.trail === t.trail) !== i);

        if (semTrilha.length > 0) {
          nok(
            `${semTrilha.length} patente(s) sem trilha`,
            `${semTrilha.map((t) => t.title).join(", ")} — patente que ninguém sabe como se ganha`,
          );
        } else if (baseComTrilha.length > 0) {
          nok("o tier 0 tem trilha", "a base não fecha trilha nenhuma; todo aluno começa nela");
        } else if (duplicadas.length > 0) {
          nok(
            "duas patentes fecham a mesma trilha",
            duplicadas.map((t) => `${t.title} → ${t.trail}`).join(", "),
          );
        } else {
          ok("toda patente fecha exatamente uma trilha");
        }

        // Conteúdo sem patente: uma trilha nova em `lessons` que nenhum tier
        // fecha. O aluno terminaria a trilha e não ganharia nada.
        const orfas = await sql<{ trail: string; aulas: number }[]>`
          select l.trail, count(*)::int as aulas
          from lessons l
          where not exists (select 1 from title_tiers t where t.trail = l.trail)
          group by l.trail order by l.trail`;

        if (orfas.length > 0) {
          nok(
            `${orfas.length} trilha(s) em lessons sem patente correspondente`,
            `${orfas.map((o) => `${o.trail} (${o.aulas} aulas)`).join(", ")} — ` +
              "terminar essas trilhas não promove ninguém",
          );
        } else {
          ok("toda trilha com aula no banco tem patente que a fecha");
        }

        // O coração da trava: o marco é a contagem acumulada, medida.
        const comConteudo = escada.filter((t) => t.tier > 0 && t.aulas_da_trilha > 0);
        const fora = comConteudo.filter((t) => t.lessons_required !== t.acumulado);

        if (comConteudo.length === 0) {
          nok(
            "nenhuma trilha do banco tem aula",
            "sem conteúdo não há como medir se o marco é fronteira de trilha",
          );
        } else if (fora.length > 0) {
          nok(
            `${fora.length} marco(s) não caem na fronteira da trilha`,
            fora
              .map(
                (t) =>
                  `${t.title} fecha a trilha "${t.trail}"; o acumulado até ela é ${t.acumulado} aulas, ` +
                  `e o marco está em ${t.lessons_required}`,
              )
              .join(" | ") +
              " — a promoção deixou de coincidir com terminar uma trilha (ver B0.5 do plano técnico do currículo)",
          );
        } else {
          ok(
            "marcos batem com as fronteiras de trilha: " +
              comConteudo.map((t) => `${t.title}=${t.lessons_required} (${t.trail})`).join(", "),
          );
        }

        const semConteudo = escada.filter((t) => t.tier > 0 && t.aulas_da_trilha === 0);
        console.log(
          `  [INFO] ${comConteudo.length} de ${escada.length - 1} patentes alcançáveis; as outras ` +
            `${semConteudo.length} esperam conteúdo (${semConteudo.map((t) => `${t.title}/${t.trail}`).join(", ") || "nenhuma"}).\n` +
            "         O marco delas é placeholder e não é conferido — trilha sem aula não tem\n" +
            "         fronteira para medir. Ele passa a ser cobrado no dia em que a trilha ganhar\n" +
            "         a primeira aula.\n" +
            "         A trava de 'uniforme só para patente alcançável' saiu com a coluna\n" +
            "         title_tiers.outfit_item_id no Bloco B, e precisa voltar com o uniforme.",
        );
      }
    }

    // --- 4. Os slots do guarda-roupa (Bloco 1 do doc 21) ---
    console.log("\n4. Slots: as tabelas existem e ninguém veste o que não pode");

    const [{ temCatalogo }] = await sql<{ temCatalogo: boolean }[]>`
      select to_regclass('public.avatar_catalogo') is not null as "temCatalogo"`;
    const [{ temGuardaRoupa }] = await sql<{ temGuardaRoupa: boolean }[]>`
      select to_regclass('public.avatar_guarda_roupa') is not null as "temGuardaRoupa"`;

    if (!temCatalogo || !temGuardaRoupa) {
      nok(
        "as tabelas do guarda-roupa não existem",
        "aplicar supabase/migrations/20260811160000_bloco1_fundacao_dos_slots.sql — quem confere o " +
          "conteúdo delas é npm run verify:catalogo-slots",
      );
    } else {
      ok("avatar_catalogo e avatar_guarda_roupa existem");

      // O direito é conferido por `equipar_peca` NA HORA DE GRAVAR, e mais
      // nunca. Isso deixa uma janela silenciosa: subir o `min_level` de uma peça
      // (ou tirar uma linha do guarda-roupa) não desveste ninguém. A FK não
      // enxerga isso — ela só sabe que o slug existe.
      //
      // O `replace(coluna,'avatar_','')` é o que amarra coluna a slot sem lista
      // copiada aqui dentro: código carregando premissa sobre o conteúdo é a
      // doença que criou o T1.
      const indevidos = await sql<
        { display_name: string; coluna: string; slug: string; motivo: string }[]
      >`
        with equipado as (
          select u.id, u.display_name, u.level, v.coluna, v.slug
          from public.users u
          cross join lateral (values
            ('avatar_traje',  u.avatar_traje),
            ('avatar_chapeu', u.avatar_chapeu),
            ('avatar_rosto',  u.avatar_rosto),
            ('avatar_pet',    u.avatar_pet),
            -- Uma linha, e nada mais: o replace(coluna,'avatar_','') logo abaixo
            -- traduz avatar_cabelo -> cabelo sozinho. É o dividendo do renome de
            -- 2026-08-23: com o nome antigo (avatar_hair) seria preciso um mapa
            -- escrito aqui. Sem crase no comentário -- ela fecha o template
            -- literal do TypeScript, e o arquivo deixa de compilar.
            ('avatar_cabelo', u.avatar_cabelo)
          ) as v(coluna, slug)
          where v.slug is not null
        ),
        julgado as (
          select e.display_name, e.coluna, e.slug,
                 case
                   when c.slug is null
                     then 'slug que não está no catálogo'
                   when c.slot <> replace(e.coluna, 'avatar_', '')
                     then 'peça do slot ' || c.slot || ' gravada na coluna ' || e.coluna
                   when c.origem = 'marco_nivel' and e.level < c.min_level
                     then 'exige nível ' || c.min_level || ', e o aluno está no ' || e.level
                   when c.origem = 'marco_patente'
                        and coalesce(t.achieved_tier, 0) < c.min_tier
                     then 'exige patente ' || c.min_tier || ', e o aluno está na ' ||
                          coalesce(t.achieved_tier, 0)
                   when c.origem = 'bau' and not exists (
                          select 1 from public.avatar_guarda_roupa g
                          where g.user_id = e.id and g.slug = e.slug)
                     then 'peça de baú sem linha no guarda-roupa'
                 end as motivo
          from equipado e
          left join public.avatar_catalogo c on c.slug = e.slug
          left join public.user_titles t on t.user_id = e.id
        )
        select * from julgado where motivo is not null`;

      const [{ n: equipadas }] = await sql<{ n: number }[]>`
        select count(*)::int as n from public.users
        where avatar_traje is not null or avatar_chapeu is not null
           or avatar_rosto is not null or avatar_pet    is not null`;

      if (indevidos.length > 0) {
        nok(
          `${indevidos.length} peça(s) equipada(s) sem direito`,
          indevidos
            .map((i) => `${i.display_name} · ${i.coluna}=${i.slug}: ${i.motivo}`)
            .join(" | ") +
            " — equipar_peca confere na gravação e nunca mais; mudar a régua depois não desveste ninguém",
        );
      } else {
        ok(
          `nenhuma peça equipada sem direito (${equipadas} usuário(s) com alguma peça vestida)`,
        );
      }
    }
  } finally {
    await sql.end();
  }

  console.log("\n========================================");
  console.log(`RESULTADO: ${passed} passed | ${failed} failed`);
  console.log("========================================");
  if (failed > 0) process.exit(1);
  console.log("\nGate de banco do avatar: OK");
}

main().catch((e) => {
  console.error("Erro no gate:", e.message);
  process.exit(1);
});
