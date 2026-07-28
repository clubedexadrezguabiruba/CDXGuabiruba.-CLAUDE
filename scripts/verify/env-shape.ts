/**
 * Diagnóstico das variáveis de ambiente — roda no CI antes dos gates.
 *
 * Por que existe: o primeiro run do CI falhou com "Invalid supabaseUrl" e um
 * stack trace dentro do node_modules. Descobrir qual dos quatro secrets estava
 * errado exigiu abrir o Actions, copiar o log e voltar — duas vezes. Este passo
 * mostra de uma vez a FORMA de todos os quatro, então o log já diz qual está
 * errado sem ninguém precisar investigar.
 *
 * SEGURANÇA: nunca imprime valor. Só tamanho, prefixo curto e veredito. O
 * repositório é público e log de Actions é leitura para qualquer um. O prefixo
 * é limitado a 8 caracteres e omitido de tudo que pareça chave.
 *
 * Uso: npx tsx scripts/verify/env-shape.ts
 */

interface Check {
  nome: string;
  obrigatoria: boolean;
  valido: (v: string) => string | null; // null = ok, string = motivo do erro
  ehSegredo: boolean;
}

const CHECKS: Check[] = [
  {
    nome: "NEXT_PUBLIC_SUPABASE_URL",
    obrigatoria: true,
    ehSegredo: false,
    valido: (v) =>
      /^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/i.test(v)
        ? null
        : 'esperado https://<project-ref>.supabase.co, sem barra no fim',
  },
  {
    nome: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    obrigatoria: true,
    ehSegredo: true,
    valido: (v) =>
      v.startsWith("eyJ") || v.startsWith("sb_")
        ? null
        : 'esperado um JWT (começa com "eyJ") ou chave publicável ("sb_")',
  },
  {
    nome: "SUPABASE_SERVICE_ROLE_KEY",
    obrigatoria: true,
    ehSegredo: true,
    valido: (v) =>
      v.startsWith("eyJ") || v.startsWith("sb_")
        ? null
        : 'esperado um JWT (começa com "eyJ") ou chave secreta ("sb_")',
  },
  {
    nome: "SUPABASE_DB_URL",
    obrigatoria: true,
    ehSegredo: true,
    valido: (v) =>
      /^postgres(ql)?:\/\/.+@.+:\d+\/\w+/.test(v)
        ? null
        : "esperado postgresql://usuario:senha@host:porta/banco",
  },
];

let problemas = 0;

console.log("Conferindo variáveis de ambiente (forma apenas, nunca o valor):\n");

for (const c of CHECKS) {
  const bruto = process.env[c.nome];

  if (!bruto) {
    console.log(`  [FALTA] ${c.nome} — não definida`);
    if (c.obrigatoria) problemas++;
    continue;
  }

  const v = bruto.trim();
  const temAspas =
    (v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"));
  const limpo = temAspas ? v.slice(1, -1) : v;

  const detalhes = [`${limpo.length} chars`];
  if (!c.ehSegredo) detalhes.push(`começa "${limpo.slice(0, 8)}…"`);
  if (temAspas) detalhes.push("COM ASPAS em volta");
  if (bruto !== v) detalhes.push("com espaço/quebra de linha nas pontas");
  if (limpo.includes("=")) detalhes.push('contém "=" — colou o nome da variável junto?');

  const erro = c.valido(limpo);
  if (erro) {
    console.log(`  [ERRO]  ${c.nome} — ${detalhes.join(", ")}`);
    console.log(`          ${erro}`);
    problemas++;
  } else {
    console.log(`  [ok]    ${c.nome} — ${detalhes.join(", ")}`);
  }
}

// Detalhe da connection string. Usuário, host, porta e banco já aparecem em
// claro nas mensagens de erro do Postgres, então mostrá-los aqui não expõe nada
// novo — e é o que distingue "usuário errado" de "senha errada", que o
// 28P01 ("password authentication failed") sozinho não diz.
const dbUrlBruta = process.env.SUPABASE_DB_URL?.trim();
if (dbUrlBruta) {
  const semAspas =
    (dbUrlBruta.startsWith('"') && dbUrlBruta.endsWith('"')) ||
    (dbUrlBruta.startsWith("'") && dbUrlBruta.endsWith("'"))
      ? dbUrlBruta.slice(1, -1)
      : dbUrlBruta;

  try {
    const u = new URL(semAspas);
    const senha = decodeURIComponent(u.password);
    console.log("\nDetalhe da SUPABASE_DB_URL:");
    console.log(`  usuário : ${u.username}`);
    console.log(`  host    : ${u.hostname}`);
    console.log(`  porta   : ${u.port}`);
    console.log(`  banco   : ${u.pathname.replace("/", "")}`);
    console.log(`  senha   : ${senha.length} caracteres`);

    // Senha curta demais é truncamento, não escolha: o Supabase exige no mínimo
    // 8 caracteres, então nenhuma senha real cabe aqui. Sem esta checagem o
    // diagnóstico dizia "forma esperada" com uma senha de 5 caracteres — um
    // falso "tudo certo" que empurrava a descoberta para o 28P01 dois gates
    // adiante, sem dizer que o problema era a senha.
    if (senha.length < 8) {
      console.log(
        `  [ERRO] senha com ${senha.length} caracteres é curta demais para ser real.\n` +
          `         O Supabase exige no mínimo 8 — este valor foi truncado ao copiar.\n` +
          `         Recopie a connection string INTEIRA, sem editar.`
      );
      problemas++;
    }

    // O pooler exige usuário no formato postgres.<project-ref>, e o ref tem de
    // ser o mesmo do NEXT_PUBLIC_SUPABASE_URL. Divergência aqui é erro de cópia.
    const refDaUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
      .replace(/^https:\/\//i, "")
      .split(".")[0];
    const refDoUsuario = u.username.includes(".") ? u.username.split(".")[1] : null;

    if (u.hostname.includes("pooler") && !refDoUsuario) {
      console.log(
        `  [ERRO] host é do pooler, mas o usuário não tem o sufixo do projeto.\n` +
          `         esperado: postgres.${refDaUrl}`
      );
      problemas++;
    } else if (refDoUsuario && refDaUrl && refDoUsuario !== refDaUrl) {
      console.log(
        `  [ERRO] o projeto no usuário não bate com o da NEXT_PUBLIC_SUPABASE_URL.\n` +
          `         usuário aponta para "${refDoUsuario}", a URL para "${refDaUrl}"`
      );
      problemas++;
    }
  } catch {
    console.log("\n  [ERRO] SUPABASE_DB_URL não é uma URL analisável.");
    problemas++;
  }
}

if (problemas > 0) {
  console.log(
    `\n${problemas} variável(is) com problema. Corrija em ` +
      `GitHub → Settings → Secrets and variables → Actions.\n` +
      `Cole SÓ o valor: sem o nome da variável, sem aspas, sem espaço no fim.`
  );
  process.exit(1);
}

console.log("\nTodas as 4 variáveis estão com a forma esperada.");
