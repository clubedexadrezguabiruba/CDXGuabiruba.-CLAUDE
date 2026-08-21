/**
 * GATE DA IDENTIDADE NAS LISTAS — o contrato do Bloco 6.
 *
 * O QUE ELE EXISTE PARA IMPEDIR
 * -----------------------------
 * O aluno monta o boneco e ele **some** na tela seguinte. A metade de baixo dessa
 * falha é uma RPC que não devolve a identidade — e nenhuma das formas dela quebra
 * nada visível do lado do banco:
 *
 *  1. **A RPC devolve o campo morto.** `avatar_config` é o cache de itens da pilha
 *     v2, cujos 69 itens o Bloco B apagou. Uma RPC que ainda o serve não erra: ela
 *     entrega `{}` para sempre, e a tela desenha o círculo de iniciais achando que
 *     o aluno não tem avatar.
 *
 *  2. **Uma irmã fica para trás.** São TRÊS RPCs de ranking lendo a mesma matview.
 *     Trocar duas e esquecer a terceira é a divergência silenciosa que o cabeçalho
 *     de `verify-no-duplicate-rpc.ts` documenta ter custado quatro meses de curva
 *     de XP errada.
 *
 *  3. **O mural fica de fora.** Ele é a única das cinco telas que não tinha RPC
 *     nenhuma: lia `class_feed` direto do navegador. `get_class_feed` é nova, e
 *     função nova nasce **executável por PUBLIC** no Postgres — o mesmo descuido
 *     que a migration 20260806150000 pegou na matview.
 *
 *  4. **A autorização se perde na cópia.** `get_class_feed` foi moldada em
 *     `get_class_ranking` e é `SECURITY DEFINER`: ela passa por cima da RLS de
 *     `class_feed` E da de `users`. Se a checagem de pertencimento não estiver
 *     lá, qualquer aluno logado lê o mural — e o nome — de qualquer turma.
 *
 *  5. **A moldura fica meio muda.** Desde 2026-08-13 a patente aparece como um anel
 *     em volta do avatar, e ela lê `achieved_tier`. A falha aqui não quebra tela
 *     nenhuma: sem a chave, o componente desenha o anel do tier 0, e o ranking
 *     inteiro passa a dizer que ninguém foi promovido. É a mesma forma da falha 1 —
 *     dado ausente que a interface aceita em silêncio.
 *
 *  6. **A peça chega ao navegador e morre na fronteira do TypeScript.** É a metade
 *     de CIMA da falha, e ela não tem nada a ver com o banco: a RPC devolve
 *     `avatar_chapeu`, o tipo da lista não declara a chave, e `as RankingEntry`
 *     a descarta em silêncio. O aluno equipa a peça, se vê com ela no `/perfil`, e
 *     continua de cabeça pelada no ranking. Foi o achado G21 no perfil público e o
 *     G22 aqui — mesmo defeito, cinco telas.
 *
 * AS CINCO CONFERÊNCIAS
 * ---------------------
 *  1. As RPCs de ranking, CHAMADAS de verdade, devolvem as colunas da
 *     identidade **mais `achieved_tier` como número**, e nenhuma das duas mortas.
 *     Chamar em vez de ler o corpo é o que pega a lição 2 do Bloco B: plpgsql não
 *     valida corpo contra esquema.
 *  2. `get_class_feed` existe, e devolve as três colunas da identidade, o
 *     `achieved_tier` e mais `display_name`, `event_data` e `created_at` — as
 *     chaves que `MuralClient` lê.
 *  3. O privilégio de `get_class_feed`: `anon` NÃO executa, `authenticated` executa.
 *  4. A autorização, MEDIDA por comportamento: personificar um usuário que **não**
 *     é da turma e exigir que a chamada seja recusada. É a única prova que não
 *     depende de eu acreditar no corpo da função.
 *  5. **O caminho de volta, do banco até a tela** (G22): toda prop de aparência que
 *     `<AvatarCabeca>` repassa ao SVG é declarada no tipo da lista e passada pelas
 *     cinco telas que o desenham. A lista do que é cobrado sai do **componente**, não
 *     deste arquivo — o dia em que o chapéu entrar no recorte, as cinco telas passam
 *     a ser cobradas por ele sem ninguém editar o gate.
 *
 * COMO ELE NÃO SUJA A PRODUÇÃO
 * ----------------------------
 * Igual ao `verify:perfil-publico`: tudo dentro de UMA transação que termina em
 * ROLLBACK, personificando usuários existentes por `set_config('request.jwt.claims')`
 * — que é de onde `auth.uid()` lê. Nada é escrito; as conferências são só leitura.
 *
 * `conferir(db)` recebe o handle de fora para que o ensaio a seco de uma migration
 * possa rodá-la dentro da mesma transação em que a migration foi aplicada. Sem
 * banco separado (achado D3), é o único jeito de medir "passa depois" sem aplicar
 * em produção.
 *
 * Uso: npm run verify:identidade-nas-listas
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";
import type { Sql } from "postgres";
import { getDbUrl } from "../db-url";

const RAIZ = resolve(fileURLToPath(import.meta.url), "../../../..");

/**
 * Prop de `<AvatarCabeca>` → coluna que as RPCs de lista devolvem.
 *
 * É a **convenção de nome**, não um inventário de peças: quem decide o que é
 * cobrado é o componente, logo abaixo. `traje` está aqui sem ser desenhado hoje
 * pelo recorte — se alguém um dia o repassar ao SVG da cabeça, o gate já sabe qual
 * coluna exigir. `fundo` e `pet` ficam de fora porque não são props do boneco: são
 * componentes irmãos, fora do SVG (doc 21 §3.4).
 */
const PROP_PARA_COLUNA: Record<string, string> = {
  skin: "avatar_skin",
  hair: "avatar_hair",
  hairColor: "avatar_hair_color",
  traje: "avatar_traje",
  chapeu: "avatar_chapeu",
  rosto: "avatar_rosto",
};

const COMPONENTE_CABECA = "src/components/avatar/AvatarCabeca.tsx";

/**
 * As props de aparência que `<AvatarCabeca>` REPASSA ao SVG, lidas do componente.
 *
 * É a âncora deste gate, e o motivo de ele não ter lista de slots escrita à mão.
 * O que a lista tem de entregar não é uma opinião deste arquivo: é o que o próprio
 * componente enfia no `svgDoAluno`. No dia em que uma peça nova entrar ali — ou
 * sair —, as cinco telas passam a ser cobradas por ela sozinhas.
 *
 * É o mesmo mecanismo da conferência 7 de `verify:perfil-publico`, que nasceu do
 * G21 e cuja lição foi: a peça se perde entre o banco e a tela, não dentro do banco.
 *
 * Regex e não parser de propósito — a pergunta é "o nome aparece dentro da chamada?",
 * e para isso o texto basta.
 */
function propsDaCabeca(): string[] {
  const src = readFileSync(resolve(RAIZ, COMPONENTE_CABECA), "utf8");
  const chamada = src.match(/svgDoAluno\(\{([\s\S]*?)\}/);
  if (!chamada) {
    throw new Error(
      `não achei a chamada de svgDoAluno em ${COMPONENTE_CABECA} — ` +
        "o gate inteiro pende dela; se o componente mudou de forma, esta leitura muda junto",
    );
  }
  return [...chamada[1].matchAll(/(\w+)/g)]
    .map((m) => m[1])
    .filter((nome) => nome in PROP_PARA_COLUNA)
    .sort();
}

/** As props acima, traduzidas para o nome da coluna que a RPC tem de devolver. */
const PROPS_DA_CABECA = propsDaCabeca();
const COLUNAS_IDENTIDADE = PROPS_DA_CABECA.map((p) => PROP_PARA_COLUNA[p]!);

/**
 * As cinco telas que desenham o recorte de cabeça, e de onde cada uma tira o dado.
 *
 * `design-lab/Primitivos.tsx` fica de fora de propósito: ele passa literais para
 * mostrar a moldura, não vem de RPC nenhuma, e cobrá-lo seria pedir que a bancada
 * de design carregasse o guarda-roupa inteiro.
 */
const CONSUMIDORES: { arquivo: string; rotulo: string; tipo?: string }[] = [
  {
    arquivo: "src/app/(main)/dashboard/page.tsx",
    rotulo: "Quadro de Honra",
    tipo: "src/types/ranking.ts",
  },
  {
    arquivo: "src/app/(main)/ranking/RankingClient.tsx",
    rotulo: "ranking global",
    tipo: "src/types/ranking.ts",
  },
  {
    arquivo: "src/app/(main)/turmas/[id]/ranking/ClassRankingClient.tsx",
    rotulo: "ranking de turma",
    tipo: "src/types/ranking.ts",
  },
  {
    arquivo: "src/app/(main)/turmas/[id]/mural/MuralClient.tsx",
    rotulo: "mural",
    tipo: "src/types/class.ts",
  },
  // A navbar não tem tipo compartilhado: ela faz o próprio SELECT em `users`, com
  // um tipo escrito na função. Por isso a coluna é cobrada no texto do SELECT — é
  // ali que a chave deixa de existir, um degrau antes do cast.
  { arquivo: "src/app/(main)/layout.tsx", rotulo: "navbar" },
];

/**
 * O NÚMERO da patente, que a `<MolduraPatente>` mapeia para cor.
 *
 * Entrou no B2 da moldura (2026-08-13). É cobrado ao lado da identidade, e não
 * dentro dela, porque responde outra pergunta: a identidade diz **quem o boneco é**,
 * o tier diz **em que degrau o aluno está**. As duas viajam juntas porque as cinco
 * telas de lista desenham as duas coisas no mesmo elemento — o recorte de cabeça
 * dentro do anel de patente.
 *
 * **Por que o NÚMERO e não o nome.** A view já manda `title` ("Aprendiz"). Derivar a
 * cor do nome no cliente seria uma segunda tabela de patentes escrita em
 * TypeScript, discordando de `scripts/avatar/patentes.ts` no dia em que alguém
 * renomear um degrau — e o banco tem **8 tiers** contra as 6 cores da paleta
 * (achado D11), então os nomes já não são um mapa confiável.
 */
const COLUNA_MOLDURA = "achieved_tier";

/** O que as RPCs de ranking deixaram de devolver no Bloco 6 — os dois da pilha v2. */
const CHAVES_MORTAS = ["avatar_config", "avatar_base"] as const;

/** O que `MuralClient` lê de cada linha do feed, além da identidade. */
const CHAVES_DO_MURAL = [
  "id",
  "class_id",
  "user_id",
  "event_type",
  "event_data",
  "created_at",
  "display_name",
] as const;

/**
 * Roda algo que PODE lançar, sem perder a transação.
 *
 * Exceção dentro de uma transação a aborta inteira: sem savepoint, a primeira
 * conferência que falha faz todas as seguintes falharem por "current transaction
 * is aborted" — e o relatório culparia o lugar errado.
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

/** Personifica um usuário — é de onde `auth.uid()` lê dentro das RPCs. */
async function comoUsuario(db: Sql, userId: string): Promise<void> {
  await db`select set_config('request.jwt.claims', ${JSON.stringify({
    sub: userId,
    role: "authenticated",
  })}, true)`;
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

  const [cobaia] = await db<{ id: string; email: string; role: string }[]>`
    select id, email, role from public.users
    where role in ('aluno','professor')
    order by created_at limit 1`;

  if (!cobaia) {
    nok(
      "nenhum aluno ou professor no banco",
      "as RPCs de ranking leem da matview, que filtra por role — sem linha não há o que medir",
    );
    return { passed, failed };
  }
  info(`cobaia: ${cobaia.email} (${cobaia.role})`);

  // --- 1. As três RPCs de ranking, chamadas de verdade -----------------------
  console.log("\n1. As RPCs de ranking devolvem a identidade nova e nada da v2");

  await comoUsuario(db, cobaia.id);

  /** Devolve a primeira linha de uma resposta de ranking, seja qual for a forma. */
  const primeiraEntrada = (payload: unknown): Record<string, unknown> | null => {
    if (Array.isArray(payload)) return (payload[0] as Record<string, unknown>) ?? null;
    if (payload && typeof payload === "object") {
      const entries = (payload as { entries?: unknown }).entries;
      if (Array.isArray(entries)) return (entries[0] as Record<string, unknown>) ?? null;
    }
    return null;
  };

  const rankings: { rotulo: string; run: () => Promise<{ r: unknown }[]> }[] = [
    {
      rotulo: "get_ranking_with_position('rating', 5)",
      run: () => db<{ r: unknown }[]>`select public.get_ranking_with_position('rating', 5) as r`,
    },
    {
      rotulo: "get_ranking('rating', 5)",
      run: () => db<{ r: unknown }[]>`select public.get_ranking('rating', 5) as r`,
    },
  ];

  // get_class_ranking exige turma e personifica quem é membro dela: uma recusa por
  // autorização não diria nada sobre coluna, que é o que esta seção mede.
  const [turma] = await db<{ class_id: string; user_id: string }[]>`
    select class_id, user_id from public.class_members limit 1`;

  if (turma) {
    rankings.push({
      rotulo: `get_class_ranking(turma ${turma.class_id}, 'rating', 5)`,
      run: async () => {
        await comoUsuario(db, turma.user_id);
        return db<{ r: unknown }[]>`select public.get_class_ranking(${turma.class_id}::bigint, 'rating', 5) as r`;
      },
    });
  } else {
    info("nenhuma turma com membro no banco — get_class_ranking não pôde ser medida");
  }

  let n = 0;
  for (const { rotulo, run } of rankings) {
    let payload: unknown = null;
    const erro = await tentar(db, `sp_rank_${n++}`, async () => {
      const [linha] = await run();
      payload = linha.r;
    });

    if (erro !== null) {
      nok(
        `${rotulo} quebrou`,
        erro +
          " — coluna que a matview não tem, lida por uma função que ninguém recompilou (lição 2 do Bloco B)",
      );
      continue;
    }

    const entrada = primeiraEntrada(payload);
    if (!entrada) {
      // Ranking vazio não é falha de contrato — mas também não prova nada, e um
      // gate que passa por vacuidade é pior que gate nenhum.
      nok(
        `${rotulo} devolveu lista vazia`,
        "sem nenhuma entrada não há chave para conferir; a conferência passaria por vacuidade",
      );
      continue;
    }

    for (const chave of COLUNAS_IDENTIDADE) {
      if (chave in entrada) ok(`${rotulo} devolve '${chave}'`);
      else
        nok(
          `${rotulo} não devolve '${chave}'`,
          "é o que a lista passa ao <AvatarCabeca>; sem a chave a tela cai no círculo de iniciais",
        );
    }

    // A moldura, e a falha dela é silenciosa de um jeito próprio: sem a chave o
    // componente não quebra, ele desenha o anel do tier 0 em todo mundo — e o
    // ranking passa a dizer que a turma inteira é Calouro.
    const tier = entrada[COLUNA_MOLDURA];
    if (!(COLUNA_MOLDURA in entrada)) {
      nok(
        `${rotulo} não devolve '${COLUNA_MOLDURA}'`,
        "é o que a <MolduraPatente> lê; sem a chave toda a lista sai com o anel do tier 0 — " +
          "não quebra nada, e diz que ninguém foi promovido",
      );
    } else if (typeof tier !== "number") {
      nok(
        `${rotulo}: '${COLUNA_MOLDURA}' não é número (${JSON.stringify(tier)})`,
        "a moldura indexa a paleta pelo tier; o nome da patente não serve — o banco tem 8 tiers " +
          "contra as 6 cores de scripts/avatar/patentes.ts (achado D11)",
      );
    } else if (!Number.isInteger(tier) || tier < 0) {
      nok(
        `${rotulo}: '${COLUNA_MOLDURA}' fora da escada (${tier})`,
        "tier é índice inteiro da escada de títulos, a partir de 0 (Calouro)",
      );
    } else {
      ok(`${rotulo} devolve '${COLUNA_MOLDURA}' como número (${tier})`);
    }

    for (const chave of CHAVES_MORTAS) {
      if (chave in entrada)
        nok(
          `${rotulo} ainda devolve '${chave}'`,
          "campo da pilha v2 sem leitor nenhum em src/ — devolvê-lo é prometer dado que o Bloco B apagou",
        );
      else ok(`${rotulo} não devolve mais '${chave}'`);
    }

    const skin = entrada["avatar_skin"];
    const cor = entrada["avatar_hair_color"];
    if (typeof skin === "number" && typeof cor === "number") {
      ok(`${rotulo}: pele e cor viajam como número (${skin} / ${cor}), não hex`);
    } else {
      nok(
        `${rotulo}: pele/cor não são número (${JSON.stringify(skin)} / ${JSON.stringify(cor)})`,
        "as colunas guardam índice de paleta; hex aqui é uma segunda cópia de palette.ts",
      );
    }
  }

  // --- 2. get_class_feed devolve o que o mural lê ---------------------------
  console.log("\n2. get_class_feed devolve a identidade e as chaves do mural");

  const [existeFeed] = await db<{ existe: boolean }[]>`
    select exists(
      select 1 from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
      where ns.nspname = 'public' and p.proname = 'get_class_feed'
    ) as existe`;

  if (!existeFeed.existe) {
    nok(
      "get_class_feed não existe",
      "sem ela o mural não tem caminho até a identidade: users tem RLS e a matview teve o SELECT revogado de authenticated (20260806150000)",
    );
  } else if (!turma) {
    info("nenhuma turma com membro no banco — get_class_feed não pôde ser chamada");
  } else {
    await comoUsuario(db, turma.user_id);

    let feed: unknown = null;
    const erroFeed = await tentar(db, "sp_feed", async () => {
      const [linha] = await db<{ r: unknown }[]>`
        select public.get_class_feed(${turma.class_id}::bigint, 50) as r`;
      feed = linha.r;
    });

    if (erroFeed !== null) {
      nok(`get_class_feed(turma ${turma.class_id}) quebrou para um MEMBRO`, erroFeed);
    } else {
      ok(`get_class_feed executou para um membro da turma ${turma.class_id}`);

      const linhas = Array.isArray(feed) ? (feed as Record<string, unknown>[]) : [];
      if (linhas.length === 0) {
        // O mural pode estar legitimamente vazio numa turma nova. Aqui a forma se
        // confere pelo tipo de retorno da função, que é o que resta de mensurável.
        info(
          `o mural da turma ${turma.class_id} está vazio — as chaves não puderam ser conferidas nesta turma`,
        );
        const [{ existe: temEvento }] = await db<{ existe: boolean }[]>`
          select exists(select 1 from public.class_feed) as existe`;
        if (temEvento) {
          nok(
            "há eventos em class_feed, mas nenhum na turma medida",
            "a conferência das chaves passaria por vacuidade; escolher uma turma COM evento é o conserto",
          );
        } else {
          info("class_feed está vazia no banco inteiro — nada a conferir, e nada a esconder");
        }
      } else {
        const linha = linhas[0]!;
        for (const chave of [...CHAVES_DO_MURAL, ...COLUNAS_IDENTIDADE, COLUNA_MOLDURA]) {
          if (chave in linha) ok(`get_class_feed devolve '${chave}'`);
          else
            nok(
              `get_class_feed não devolve '${chave}'`,
              "MuralClient lê essa chave de cada evento (src/app/(main)/turmas/[id]/mural/MuralClient.tsx)",
            );
        }
      }
    }
  }

  // --- 3. O privilégio: função nova nasce executável por PUBLIC -------------
  console.log("\n3. O privilégio de get_class_feed");

  if (existeFeed.existe) {
    const esperado: [string, boolean, string][] = [
      [
        "anon",
        false,
        "a chave anon viaja no pacote do navegador; a função é SECURITY DEFINER e passa por cima da RLS de class_feed e de users",
      ],
      ["authenticated", true, "é o papel de todo aluno logado — sem isto o mural não abre para ninguém"],
    ];

    for (const [papel, devePoder, porque] of esperado) {
      const [{ pode }] = await db<{ pode: boolean }[]>`
        select has_function_privilege(${papel}, 'public.get_class_feed(bigint, integer)', 'EXECUTE') as pode`;
      if (pode === devePoder) {
        ok(`${papel} ${devePoder ? "executa" : "NÃO executa"} get_class_feed`);
      } else {
        nok(
          `${papel} ${pode ? "EXECUTA" : "não executa"} get_class_feed, e não deveria`,
          porque +
            (pode ? " — o REVOKE de PUBLIC tem de vir junto do CREATE: função nova nasce liberada" : ""),
        );
      }
    }
  }

  // --- 4. A autorização, medida por comportamento --------------------------
  console.log("\n4. Quem não é da turma é recusado (SECURITY DEFINER sem RLS embaixo)");

  if (!existeFeed.existe || !turma) {
    info("sem get_class_feed ou sem turma — a autorização não pôde ser medida");
  } else {
    const [forasteiro] = await db<{ id: string; email: string }[]>`
      select u.id, u.email from public.users u
      where u.role in ('aluno','professor')
        and not exists (
          select 1 from public.class_members cm
          where cm.class_id = ${turma.class_id}::bigint and cm.user_id = u.id)
        and not exists (
          select 1 from public.classes c
          where c.id = ${turma.class_id}::bigint and c.teacher_id = u.id)
      limit 1`;

    if (!forasteiro) {
      info(
        `todo usuário do banco pertence à turma ${turma.class_id} — não há forasteiro para medir a recusa`,
      );
    } else {
      await comoUsuario(db, forasteiro.id);
      const erroForasteiro = await tentar(
        db,
        "sp_forasteiro",
        () => db`select public.get_class_feed(${turma.class_id}::bigint, 5)`,
      );

      if (erroForasteiro === null) {
        nok(
          `${forasteiro.email} NÃO é da turma ${turma.class_id} e mesmo assim leu o mural dela`,
          "a checagem de pertencimento é a única defesa: SECURITY DEFINER ignora a RLS de class_feed e a de users",
        );
      } else {
        ok(`quem não é da turma é recusado ("${erroForasteiro.split("\n")[0]}")`);
      }
    }
  }

  // --- 5. Do banco até a tela: o cast não pode comer a peça (achado G22) ----
  console.log("\n5. As cinco telas passam ao boneco o que o componente desenha");

  info(`<AvatarCabeca> repassa ao SVG: ${PROPS_DA_CABECA.join(", ")}`);

  for (const { arquivo, rotulo, tipo } of CONSUMIDORES) {
    const src = readFileSync(resolve(RAIZ, arquivo), "utf8");

    const passadas = new Set<string>();
    for (const tag of src.matchAll(/<AvatarCabeca\b([\s\S]*?)\/>/g)) {
      for (const p of tag[1].matchAll(/(\w+)\s*=\s*\{/g)) passadas.add(p[1]);
    }

    if (passadas.size === 0) {
      nok(
        `${rotulo}: não achei nenhum <AvatarCabeca …/> em ${arquivo}`,
        "ou a tela deixou de desenhar o boneco — e sai desta lista — ou a tag ganhou filhos e a leitura precisa mudar",
      );
      continue;
    }

    // A tela tem de IMPORTAR o tipo que esta tabela diz que ela usa, e isto não é
    // zelo: o `/dashboard` mantinha um `RankingEntry` local, cópia à mão do
    // original sem as chaves que ele ganhou depois. Sem esta conferência, as linhas
    // abaixo aprovariam a tela lendo um arquivo que ela não importa — o gate
    // passaria verde sobre o defeito que existe para pegar. Quem pegou foi o `tsc`,
    // e gate que depende do próximo comando não é gate.
    if (tipo) {
      const modulo = tipo.replace(/^src\//, "@/").replace(/\.ts$/, "");
      // `from "…"`, e não o nome solto no texto: o tipo local que este gate existe
      // para pegar trazia, no comentário dele, a linha "Ver `src/types/ranking.ts`".
      // Procurar o nome cru aprovaria a tela pela citação de onde o original mora —
      // que é precisamente o arquivo que ela NÃO estava usando.
      const importa = new RegExp(`from\\s*["']${modulo.replace("/", "\\/")}["']`).test(src);
      if (!importa) {
        nok(
          `${rotulo} não importa '${modulo}'`,
          `esta tabela diz que ela usa o tipo de ${tipo}; se ela declara o próprio, a cópia envelhece calada e as conferências abaixo medem o arquivo errado. ${arquivo}`,
        );
        continue;
      }
      ok(`${rotulo} importa o tipo de '${modulo}' em vez de reescrevê-lo`);
    }

    for (const prop of PROPS_DA_CABECA) {
      const coluna = PROP_PARA_COLUNA[prop]!;

      if (!passadas.has(prop)) {
        nok(
          `${rotulo} não passa '${prop}' ao <AvatarCabeca>`,
          `o componente repassa essa prop ao SVG, então o boneco sai sem a peça nesta tela. ${arquivo}`,
        );
        continue;
      }

      // O tipo é o degrau onde a chave morre calada: a RPC mandou, o cast
      // descartou. Sem tipo compartilhado (a navbar), o degrau é o SELECT — a
      // chave nem chega a sair do banco.
      const fonte = tipo ?? arquivo;
      const texto = tipo ? readFileSync(resolve(RAIZ, tipo), "utf8") : src;
      const alvo = tipo
        ? texto
        : (texto.match(/\.select\(\s*[\s\S]*?\)/)?.[0] ?? "");

      if (!new RegExp(`\\b${coluna}\\b`).test(alvo)) {
        nok(
          `${rotulo}: '${prop}' vai à tag, mas '${coluna}' não está em ${fonte}`,
          tipo
            ? `\`as ${tipo.includes("class") ? "FeedEvent" : "RankingEntry"}\` descarta em silêncio toda chave que o tipo não nomeia — a peça chega do banco e morre na fronteira (achado G21/G22)`
            : "a navbar faz o próprio SELECT; coluna fora dele nem sai do banco",
        );
        continue;
      }

      ok(`${rotulo}: '${prop}' vai à tag e '${coluna}' está em ${fonte}`);
    }
  }

  await db`reset role`;
  return { passed, failed };
}

class Rollback extends Error {}

async function main() {
  const sql = postgres(getDbUrl(), { connect_timeout: 30 });

  console.log("========================================");
  console.log("GATE: a identidade chega às listas (Bloco 6)");
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
  console.log("\nGate da identidade nas listas: OK");
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
