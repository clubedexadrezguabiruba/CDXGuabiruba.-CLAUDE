/**
 * GATE DO PERFIL PÚBLICO — o contrato do E.3 da troca de pilha.
 *
 * O QUE ELE EXISTE PARA IMPEDIR
 * -----------------------------
 * Quatro falhas, e nenhuma delas quebra o `apply`:
 *
 *  1. **O cache não carrega a identidade.** `user_public_profiles` é MATERIALIZED
 *     VIEW e `get_public_profile` lê só de lá. Sem as três colunas do Bloco C, a
 *     tela do colega não tem boneco nenhum para desenhar — e a falta aparece na
 *     tela, não no banco.
 *
 *  2. **O cabelo novo não chega ao colega.** Trocar de cabelo escreve em `users`;
 *     o perfil público lê da matview. Sem `refresh_public_profiles()` dentro de
 *     `update_avatar_identity`, o próprio `/perfil` mostra o cabelo novo (lê
 *     `users` direto) e o `/perfil/[userId]` mostra o antigo até alguém subir de
 *     nível. Duas telas do mesmo dado discordando em silêncio.
 *
 *  3. **O REVOKE que o CREATE desfaz.** O ALTER DEFAULT PRIVILEGES do schema
 *     `public` no Supabase concede TUDO a anon e authenticated: matview recriada
 *     NASCE legível pelo navegador. Matview não aceita RLS — o privilégio é a
 *     única defesa, e o que sai por ali é `display_name` CRU e a coluna
 *     `ranking_visible` (o opt-out do ranking). O aviso está escrito na migration
 *     20260806150000, endereçado a quem recriasse a view.
 *
 *  4. **A lição 2 do Bloco B.** plpgsql NÃO valida corpo contra esquema: uma RPC
 *     que lê da matview uma coluna que a matview perdeu compila, é aplicada, e
 *     quebra em runtime — na cara de quem abrir o ranking. Quatro funções leem
 *     `avatar_config` de lá.
 *
 *  5. **A peça equipada não atravessa o TypeScript.** Toda coluna de slot já chega
 *     à tela pela RPC, mas `page.tsx` faz `profile as PublicProfileData`: o cast
 *     descarta em silêncio a chave que o tipo não nomeia, e o aluno que equipou a
 *     Farda aparece de macacão para os colegas. Era o achado G21, e ele não tinha
 *     régua nenhuma — as conferências 1 a 6 medem banco × banco, e este furo é
 *     código × tela.
 *
 * AS CONFERÊNCIAS
 * ---------------
 *  1. As três colunas da identidade estão na matview.
 *  2. Os seis índices, com o UNIQUE em `user_id`. Não é enfeite: sem ele o
 *     `REFRESH ... CONCURRENTLY` recusa, e quem o chama é `grant_xp` a cada
 *     level-up — perder o índice quebra toda subida de nível do produto.
 *  3. Privilégio efetivo: anon e authenticated NÃO leem; `service_role` lê (é
 *     como os gates de fase 2 funcionam).
 *  4. `get_public_profile` chamada de verdade: devolve as três chaves novas e
 *     nenhuma das três mortas (`avatar_config`, `avatar_base`, `equipped_items`).
 *  5. O refresh, MEDIDO por comportamento: como o papel `authenticated`, gravar
 *     um cabelo livre por `update_avatar_identity` e exigir que
 *     `get_public_profile` devolva o cabelo NOVO na mesma hora. É a única prova
 *     que não depende de eu acreditar no corpo da função.
 *  6. Anti-regressão da lição 2: as 4 RPCs que leem a matview são CHAMADAS, e
 *     coluna legada ainda citada por função tem de continuar existindo na view.
 *  7. O colega vê o mesmo boneco que o aluno vê de si: toda prop de aparência que
 *     o próprio `/perfil` passa ao `<AvatarKokeshi>`, o `/perfil/[userId]` também
 *     passa — e para cada uma, a RPC devolve a coluna e `PublicProfileData` a
 *     declara. **Quem define o que é cobrado é a tela do próprio perfil**, não uma
 *     lista aqui: quando o chapéu entrar lá, esta conferência o cobra sozinha.
 *
 * COMO ELE NÃO SUJA A PRODUÇÃO
 * ----------------------------
 * Tudo roda dentro de UMA transação que termina em ROLLBACK, personificando um
 * usuário existente por `set_config('request.jwt.claims', ...)` — que é de onde
 * `auth.uid()` lê. Nem o cabelo, nem o tom de pele, nem o título sobrevivem.
 *
 * As conferências vivem em `conferir(db)`, que recebe o handle de fora, para que
 * o ensaio a seco de uma migration possa rodá-las **dentro da mesma transação em
 * que a migration foi aplicada**. Sem banco separado (D3), é o único jeito de
 * medir "passa depois" sem aplicar em produção — foi assim no Bloco C e no E.2.
 *
 * Uso: npm run verify:perfil-publico
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";
import type { Sql } from "postgres";
import { getDbUrl } from "../db-url";

/** A raiz do repositório, a partir de `scripts/verify/phase8/`. */
const RAIZ = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");

/** As três colunas da identidade kokeshi (Bloco C), que o E.3 levou à matview. */
const COLUNAS_IDENTIDADE = ["avatar_skin", "avatar_hair", "avatar_hair_color"] as const;

/** O que `get_public_profile` deixou de devolver no E.3 — os três da pilha v2. */
const CHAVES_MORTAS = ["avatar_config", "avatar_base", "equipped_items"] as const;

/** Os seis índices da matview. O primeiro é o que o REFRESH CONCURRENTLY exige. */
const INDICES = [
  "idx_public_profiles_user",
  "idx_public_profiles_rating",
  "idx_public_profiles_level",
  "idx_public_profiles_rush3",
  "idx_public_profiles_rush5",
  "idx_public_profiles_resistencia",
] as const;

/**
 * Colunas legadas que a matview só carrega porque alguma função ainda as lê.
 *
 * A conferência 6 se aposenta sozinha: no dia em que nenhuma função citar a
 * coluna, ela para de ser exigida na view. É mecanismo, não disciplina — nada
 * aqui precisa ser editado à mão quando o D30 reescrever as RPCs de ranking.
 */
const LEGADAS_NA_VIEW = ["avatar_config", "avatar_base"] as const;

/**
 * Prop de `<AvatarKokeshi>` → coluna que `get_public_profile` devolve.
 *
 * É a única lista escrita à mão da conferência 7, e ela é a **convenção de nome**,
 * não um inventário de peças: quem decide o que é cobrado é a tela do próprio
 * perfil, não este objeto. `fundo` e `pet` não entram porque não são props do
 * boneco — são componentes irmãos, fora do SVG (doc 21 §3.4).
 */
const PROP_PARA_COLUNA: Record<string, string> = {
  skin: "avatar_skin",
  hair: "avatar_hair",
  hairColor: "avatar_hair_color",
  traje: "avatar_traje",
  chapeu: "avatar_chapeu",
  rosto: "avatar_rosto",
};

const TELA_PROPRIA = "src/app/(main)/perfil/PerfilClient.tsx";
const TELA_PUBLICA = "src/app/(main)/perfil/[userId]/PublicProfileClient.tsx";
const TIPO_PUBLICO = "src/types/ranking.ts";

/**
 * As props que um arquivo passa a `<AvatarKokeshi>`, lidas do JSX.
 *
 * Regex e não parser de propósito: a pergunta é "o nome da prop aparece dentro da
 * tag?", e para isso o texto basta. Um `<AvatarKokeshi>` sem `/>` (com filhos)
 * escaparia — nenhum dos dois tem, e o `<AvatarCabeca>` das listas não é lido aqui.
 */
function propsDoKokeshi(caminho: string): Set<string> {
  const src = readFileSync(resolve(RAIZ, caminho), "utf8");
  const props = new Set<string>();
  for (const tag of src.matchAll(/<AvatarKokeshi\b([\s\S]*?)\/>/g)) {
    for (const p of tag[1].matchAll(/(\w+)\s*=\s*\{/g)) props.add(p[1]);
  }
  return props;
}

/**
 * Tira comentário de SQL antes de procurar citação no corpo.
 *
 * Lição 3 do Bloco B, repetida por dois gates depois dela: a migration do E.3
 * NOMEIA `avatar_config` e `refresh_public_profiles` em comentários para explicar
 * a decisão. Procurar no texto cru reprova pela explicação da mudança.
 */
function semComentario(sqlSrc: string): string {
  return sqlSrc.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/--[^\n]*/g, " ");
}

/**
 * Roda algo que PODE lançar, sem perder a transação.
 *
 * Exceção dentro de uma transação a aborta inteira: sem savepoint, a primeira
 * conferência que falha faz todas as seguintes falharem por "current transaction
 * is aborted" — e o relatório culparia o lugar errado. Sucesso é liberado (o
 * efeito precisa persistir até o fim de `conferir`); falha volta ao savepoint.
 */
async function tentar(db: Sql, marca: string, fn: () => Promise<unknown>): Promise<string | null> {
  await db.unsafe(`savepoint ${marca}`);
  try {
    await fn();
    await db.unsafe(`release savepoint ${marca}`);
    return null;
  } catch (e) {
    await db.unsafe(`rollback to savepoint ${marca}`);
    return e instanceof Error ? e.message : String(e);
  }
}

export interface Relatorio {
  passed: number;
  failed: number;
}

export async function conferir(db: Sql): Promise<Relatorio> {
  let passed = 0;
  let failed = 0;

  const ok = (msg: string) => {
    console.log(`  [PASS] ${msg}`);
    passed++;
  };
  const nok = (msg: string, detalhe: string) => {
    console.log(`  [FAIL] ${msg}`);
    console.log(`         ${detalhe}`);
    failed++;
  };
  const info = (msg: string) => console.log(`  [INFO] ${msg}`);

  // --- 1. A matview carrega a identidade nova ---
  console.log("\n1. As três colunas da identidade estão na matview");

  const [{ existe: temView }] = await db<{ existe: boolean }[]>`
    select to_regclass('public.user_public_profiles') is not null as existe`;

  if (!temView) {
    nok(
      "a matview user_public_profiles não existe",
      "sem ela o ranking inteiro e o perfil público caem — aplicar a migration do E.3",
    );
    return { passed, failed };
  }

  const colunas = await db<{ attname: string }[]>`
    select attname from pg_attribute
    where attrelid = 'public.user_public_profiles'::regclass
      and attnum > 0 and not attisdropped
    order by attnum`;
  const nomes = new Set(colunas.map((c) => c.attname));

  for (const col of COLUNAS_IDENTIDADE) {
    if (nomes.has(col)) ok(`user_public_profiles.${col} existe`);
    else
      nok(
        `user_public_profiles.${col} não existe`,
        "get_public_profile lê SÓ da matview — sem a coluna, a tela do colega não tem boneco para desenhar",
      );
  }
  info(`a matview tem ${colunas.length} colunas: ${colunas.map((c) => c.attname).join(", ")}`);

  // --- 2. Os seis índices, e o UNIQUE que o REFRESH CONCURRENTLY exige ---
  console.log("\n2. Os índices (o UNIQUE em user_id é condição do refresh)");

  const idx = await db<{ indexname: string; indexdef: string }[]>`
    select indexname, indexdef from pg_indexes
    where schemaname='public' and tablename='user_public_profiles'`;
  const porNome = new Map(idx.map((i) => [i.indexname, i.indexdef]));

  for (const nome of INDICES) {
    if (porNome.has(nome)) ok(`índice ${nome} recriado`);
    else
      nok(
        `índice ${nome} não existe`,
        "recriar a matview derruba todos os índices; o CREATE INDEX tem de vir junto",
      );
  }

  const unico = porNome.get("idx_public_profiles_user");
  if (unico && /CREATE UNIQUE INDEX/i.test(unico)) {
    ok("idx_public_profiles_user é UNIQUE");
  } else {
    nok(
      "idx_public_profiles_user não é UNIQUE",
      "sem índice único o REFRESH MATERIALIZED VIEW CONCURRENTLY recusa — e quem o chama é grant_xp a cada level-up, então TODA subida de nível quebraria",
    );
  }

  // --- 3. O privilégio, que é a única defesa de uma matview ---
  console.log("\n3. O privilégio (matview não aceita RLS)");

  const esperado: [string, boolean, string][] = [
    ["anon", false, "a chave anon viaja no pacote do navegador: leitura aqui contorna mask_display_name e o opt-out de ranking_visible"],
    ["authenticated", false, "qualquer aluno logado leria display_name cru de todos os colegas, inclusive de quem pediu para não aparecer"],
    ["service_role", true, "é como scripts/verify/phase2/validate-phase2.ts e os gates leem o banco"],
  ];

  for (const [papel, deveLer, porque] of esperado) {
    const [{ pode }] = await db<{ pode: boolean }[]>`
      select has_table_privilege(${papel}, 'public.user_public_profiles', 'SELECT') as pode`;
    if (pode === deveLer) {
      ok(`${papel} ${deveLer ? "lê" : "NÃO lê"} a matview direto`);
    } else {
      nok(
        `${papel} ${pode ? "LÊ" : "não lê"} a matview direto, e não deveria`,
        porque +
          (pode
            ? " — o REVOKE tem de vir junto do CREATE: o privilégio default do Supabase volta"
            : ""),
      );
    }
  }

  // --- 4. get_public_profile, chamada de verdade ---
  console.log("\n4. get_public_profile devolve a identidade nova e nada da v2");

  const [cobaia] = await db<{ id: string; email: string; level: number; role: string }[]>`
    select id, email, level, role from public.users
    where role in ('aluno','professor')
    order by created_at limit 1`;

  if (!cobaia) {
    nok("nenhum aluno ou professor no banco", "a matview filtra por role — sem linha não há perfil a medir");
    return { passed, failed };
  }
  info(`cobaia: ${cobaia.email} (${cobaia.role}, nível ${cobaia.level})`);

  const [{ p: perfilAntes }] = await db<{ p: Record<string, unknown> | null }[]>`
    select public.get_public_profile(${cobaia.id}) as p`;

  if (!perfilAntes) {
    nok(
      "get_public_profile devolveu NULL para um usuário que está na matview",
      "a matview pode estar desatualizada (nunca refrescada) ou a RPC não achou a linha",
    );
    return { passed, failed };
  }

  for (const chave of COLUNAS_IDENTIDADE) {
    if (chave in perfilAntes) ok(`get_public_profile devolve '${chave}'`);
    else
      nok(
        `get_public_profile não devolve '${chave}'`,
        "é o que /perfil/[userId] passa ao <AvatarKokeshi>; sem a chave a tela não tem o que desenhar",
      );
  }

  for (const chave of CHAVES_MORTAS) {
    if (chave in perfilAntes) {
      nok(
        `get_public_profile ainda devolve '${chave}'`,
        "campo da pilha v2 sem leitor nenhum em src/ — devolvê-lo é prometer dado que não existe mais",
      );
    } else {
      ok(`get_public_profile não devolve mais '${chave}'`);
    }
  }

  // Índice, não hex: é o contrato do E.1 e o do Bloco C. Devolver '#E9B183' aqui
  // criaria a segunda cópia da paleta que as duas decisões recusaram.
  const skin = perfilAntes["avatar_skin"];
  const cor = perfilAntes["avatar_hair_color"];
  if (typeof skin === "number" && typeof cor === "number") {
    ok(`avatar_skin e avatar_hair_color viajam como número (${skin} / ${cor}), não hex`);
  } else {
    nok(
      `avatar_skin e avatar_hair_color não são número (${JSON.stringify(skin)} / ${JSON.stringify(cor)})`,
      "as colunas guardam índice de paleta; hex aqui é uma segunda descrição da paleta de palette.ts",
    );
  }

  // --- 5. O refresh, medido por comportamento ---
  console.log("\n5. Trocar de cabelo chega ao perfil público NA HORA (papel authenticated)");

  const livres = await db<{ slug: string; min_level: number }[]>`
    select slug, min_level from public.avatar_hair_catalog
    where min_level <= ${cobaia.level} order by min_level, slug`;

  const hairAntes = (perfilAntes["avatar_hair"] as string | null) ?? null;
  const alvo = livres.find((l) => l.slug !== hairAntes);

  if (!alvo) {
    nok(
      "nenhum cabelo alcançável e diferente do atual para medir a troca",
      `a cobaia está no nível ${cobaia.level} e o catálogo não oferece outro slug — sem troca, a conferência passaria por vacuidade`,
    );
  } else {
    const skinAlvo = skin === 5 ? 4 : 5;
    const corAlvo = cor === 3 ? 2 : 3;

    await db`select set_config('request.jwt.claims', ${JSON.stringify({
      sub: cobaia.id,
      role: "authenticated",
    })}, true)`;
    await db`set local role authenticated`;

    const erroGravacao = await tentar(db, "sp_identidade", () =>
      db`select public.update_avatar_identity(${skinAlvo}, ${alvo.slug}, ${corAlvo})`,
    );

    let perfilDepois: Record<string, unknown> | null = null;
    if (!erroGravacao) {
      const [linha] = await db<{ p: Record<string, unknown> | null }[]>`
        select public.get_public_profile(${cobaia.id}) as p`;
      perfilDepois = linha.p;
    }

    await db`reset role`;

    if (erroGravacao) {
      nok(
        `update_avatar_identity('${alvo.slug}') falhou como authenticated`,
        erroGravacao,
      );
    } else if (!perfilDepois) {
      nok("get_public_profile devolveu NULL depois da gravação", "o refresh pode ter apagado a linha da matview");
    } else {
      const hairDepois = (perfilDepois["avatar_hair"] as string | null) ?? null;
      if (hairDepois === alvo.slug) {
        ok(
          `o perfil público passou de ${hairAntes === null ? "careca" : `"${hairAntes}"`} ` +
            `para "${alvo.slug}" sem nenhum refresh manual`,
        );
      } else {
        nok(
          `o perfil público continua em ${hairDepois === null ? "careca" : `"${hairDepois}"`} depois de gravar "${alvo.slug}"`,
          "update_avatar_identity não chama refresh_public_profiles(): o /perfil do aluno mostraria o cabelo novo e o /perfil/[userId] dos colegas o antigo, até alguém subir de nível",
        );
      }

      const skinDepois = perfilDepois["avatar_skin"];
      const corDepois = perfilDepois["avatar_hair_color"];
      if (skinDepois === skinAlvo && corDepois === corAlvo) {
        ok(`pele e cor também chegaram (${skinAlvo} / ${corAlvo})`);
      } else {
        nok(
          `pele/cor não chegaram: esperado ${skinAlvo}/${corAlvo}, veio ${JSON.stringify(skinDepois)}/${JSON.stringify(corDepois)}`,
          "as três colunas viajam pelo mesmo refresh; duas certas e uma errada é a view carregando coluna velha",
        );
      }
    }
  }

  // Anti-regressão barata sobre o corpo, ao lado da prova comportamental: a
  // chamada pode passar por sorte (view recém-refrescada por outro caminho na
  // mesma transação); o PERFORM escrito é o mecanismo.
  const [rpc] = await db<{ def: string }[]>`
    select pg_get_functiondef(p.oid) as def from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname='public' and p.proname='update_avatar_identity'`;
  if (rpc && /refresh_public_profiles\s*\(/.test(semComentario(rpc.def))) {
    ok("update_avatar_identity chama refresh_public_profiles() no corpo");
  } else {
    nok(
      "update_avatar_identity não chama refresh_public_profiles() no corpo",
      "sem a chamada, a matview só é atualizada quando alguém sobe de nível",
    );
  }

  // --- 6. A lição 2 do Bloco B: quem lê da matview não pode ler coluna ausente ---
  console.log("\n6. Ninguém lê da matview uma coluna que ela não tem");

  const leitoras = await db<{ proname: string; def: string }[]>`
    select p.proname, pg_get_functiondef(p.oid) as def
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname='public' and p.prokind='f'
      and pg_get_functiondef(p.oid) ilike '%user_public_profiles%'
      and p.proname <> 'refresh_public_profiles'
    order by p.proname`;

  info(`funções que leem a matview: ${leitoras.map((l) => l.proname).join(", ")}`);

  for (const legada of LEGADAS_NA_VIEW) {
    const citam = leitoras
      .filter((l) => new RegExp(`\\b${legada}\\b`).test(semComentario(l.def)))
      .map((l) => l.proname);

    if (citam.length === 0) {
      // Estado de chegada de toda coluna legada: ninguém a cita, e a view não a
      // carrega. É onde `avatar_base` chegou no E.3.
      if (nomes.has(legada)) {
        info(
          `${legada} segue na matview sem nenhuma leitora — pode sair na próxima migration que a recriar`,
        );
      } else {
        ok(`${legada} saiu da matview, e nenhuma função a lê de lá`);
      }
      continue;
    }
    if (nomes.has(legada)) {
      ok(`${legada} segue na matview, e ${citam.length} leitora(s) a citam: ${citam.join(", ")}`);
    } else {
      nok(
        `${legada} saiu da matview e ${citam.length} função(ões) ainda a leem: ${citam.join(", ")}`,
        "plpgsql não valida corpo contra esquema: isto aplica sem erro e quebra em runtime, na cara de quem abrir o ranking — é a lição 2 do Bloco B",
      );
    }
  }

  // A prova que não depende de eu ler corpo nenhum: CHAMAR as leitoras. Uma
  // função que lê coluna ausente compila, é aplicada e só quebra aqui.
  const chamadas: { rotulo: string; quem: string; run: () => Promise<unknown> }[] = [
    {
      rotulo: "get_ranking('rating', 5)",
      quem: cobaia.id,
      run: () => db`select public.get_ranking('rating', 5)`,
    },
    {
      rotulo: "get_ranking_with_position('level', 5)",
      quem: cobaia.id,
      run: () => db`select public.get_ranking_with_position('level', 5)`,
    },
    {
      rotulo: "recompute_user_title(cobaia)",
      quem: cobaia.id,
      run: () => db`select public.recompute_user_title(${cobaia.id})`,
    },
  ];

  // get_class_ranking exige turma, e personifica quem é membro dela: uma recusa
  // por autorização não diz nada sobre coluna, que é o que esta seção mede.
  const [turma] = await db<{ class_id: string; user_id: string }[]>`
    select class_id, user_id from public.class_members limit 1`;
  if (turma) {
    chamadas.push({
      rotulo: `get_class_ranking(turma ${turma.class_id}, 'rating', 5)`,
      quem: turma.user_id,
      run: () => db`select public.get_class_ranking(${turma.class_id}::bigint, 'rating', 5)`,
    });
  } else {
    info("nenhuma turma com membro no banco — get_class_ranking não pôde ser chamada");
  }

  let n = 0;
  for (const { rotulo, quem, run } of chamadas) {
    await db`select set_config('request.jwt.claims', ${JSON.stringify({
      sub: quem,
      role: "authenticated",
    })}, true)`;
    const erro = await tentar(db, `sp_leitora_${n++}`, run);
    if (erro === null) {
      ok(`${rotulo} executou sem erro`);
    } else {
      nok(
        `${rotulo} quebrou`,
        erro + " — coluna que a matview perdeu, lida por uma função que ninguém recompilou",
      );
    }
  }

  // --- 7. O colega vê o mesmo boneco que o aluno vê de si (achado G21) ---
  console.log("\n7. A tela do colega desenha o mesmo boneco que a do próprio aluno");

  const propsProprias = propsDoKokeshi(TELA_PROPRIA);
  const propsPublicas = propsDoKokeshi(TELA_PUBLICA);
  const tipoPublico = readFileSync(resolve(RAIZ, TIPO_PUBLICO), "utf8");

  // O que é cobrado sai da tela do PRÓPRIO perfil, não de uma lista aqui: no dia
  // em que o chapéu entrar lá, esta conferência passa a cobrá-lo do perfil público
  // sozinha. É o mesmo mecanismo da conferência 6 — nada aqui se edita à mão.
  const aparencia = [...propsProprias].filter((p) => p in PROP_PARA_COLUNA).sort();
  info(`o próprio /perfil passa ao <AvatarKokeshi>: ${aparencia.join(", ")}`);

  for (const prop of aparencia) {
    const coluna = PROP_PARA_COLUNA[prop];

    if (!propsPublicas.has(prop)) {
      nok(
        `/perfil/[userId] não passa '${prop}' ao <AvatarKokeshi>, e o próprio /perfil passa`,
        `o aluno se vê com a peça e aparece sem ela para os colegas — que é o único lugar onde ela tem plateia. ${TELA_PUBLICA}`,
      );
      continue;
    }
    if (!(coluna in perfilAntes)) {
      nok(
        `a tela passa '${prop}', mas get_public_profile não devolve '${coluna}'`,
        "a prop chegaria undefined em toda visita: a matview precisa da coluna e a RPC precisa devolvê-la",
      );
      continue;
    }
    if (!new RegExp(`\\b${coluna}\\b`).test(tipoPublico)) {
      nok(
        `${coluna} não está declarada em PublicProfileData`,
        `page.tsx faz \`profile as PublicProfileData\` — o cast descarta em silêncio a chave que a RPC mandou. ${TIPO_PUBLICO}`,
      );
      continue;
    }
    ok(`'${prop}' vai à tela do colega, a RPC devolve '${coluna}' e o tipo o declara`);
  }

  return { passed, failed };
}

class Rollback extends Error {}

async function main() {
  const sql = postgres(getDbUrl(), { connect_timeout: 30 });

  console.log("========================================");
  console.log("GATE: o perfil público carrega o kokeshi (E.3)");
  console.log("========================================");

  let rel: Relatorio = { passed: 0, failed: 0 };

  try {
    try {
      await sql.begin(async (tx) => {
        rel = await conferir(tx as unknown as Sql);
        throw new Rollback();
      });
    } catch (e) {
      if (!(e instanceof Rollback)) throw e;
    }
  } finally {
    await sql.end();
  }

  console.log("\n========================================");
  console.log(`RESULTADO: ${rel.passed} passed | ${rel.failed} failed`);
  console.log("========================================");
  if (rel.failed > 0) process.exit(1);
  console.log("\nGate do perfil público: OK");
}

// `conferir` é importada pelo ensaio a seco; sem esta guarda, importar o módulo
// dispararia o gate inteiro como efeito colateral.
const executadoDireto =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (executadoDireto) {
  main().catch((e) => {
    console.error("Erro no gate:", e.message);
    process.exit(1);
  });
}
