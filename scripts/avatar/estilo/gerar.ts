/**
 * ARTE DE FORA: pede ao Gemini um cabelo DESENHADO SOBRE a base aprovada.
 *
 * Escrito no Bloco 2a.5, depois de o Doug reprovar os cinco cabelos do 2a.1
 * ("tudo muito quadrado, sem toque humano"). A causa raiz está no próprio
 * `cabelo.ts`, linha 28: *"estes números são desenhados, não medidos"*. Este
 * script é a metade de ENTRADA da correção — ele produz o PNG de onde a régua
 * (`.scratch/estilo/franja.ts`) extrai os números.
 *
 * ---------------------------------------------------------------------------
 * O QUE ESTE SCRIPT NÃO FAZ, E POR QUE ISSO É ESTRUTURAL
 * ---------------------------------------------------------------------------
 *
 * Ele **não** produz asset. O PNG que sai daqui é referência e morre em
 * `.scratch/`, fora do git.
 *
 * O tipo `Cabelo` (`cabelo.ts:118`) tem quatro campos e **nenhum é um path**:
 * um cabelo é uma polilinha `{t, y}` mais laços de pontos. O `d: string` foi
 * removido de propósito — "dado guardado como dado é dado que o gate consegue
 * medir". Vetorizar este PNG na Adobe devolveria `d="M…C…"`, que **não
 * compila**. Não é o orçamento que barra a vetorização; é o typecheck.
 *
 * ---------------------------------------------------------------------------
 * POR QUE O GERADOR PODE ERRAR O CRÂNIO E AINDA ASSIM SERVIR
 * ---------------------------------------------------------------------------
 *
 * A §2.2 do `docs/avatar/16-uniformes-runbook.md` registra, de duas rodadas
 * perdidas, que *o gerador redesenha em vez de editar, e isso não se corrige com
 * prompt melhor*. Para uniforme aquilo é fatal: a silhueta **é** o produto.
 *
 * Para cabelo, não. A franja é guardada em `t` = fração da largura da cabeça
 * *naquela altura*, lida de `bordasEm(y)`, e a régua normaliza pela caixa da
 * cabeça medida **na mesma imagem gerada**. Um crânio alguns por cento diferente
 * sai na divisão. O que **não** sobrevive é personagem novo — outra proporção,
 * outra pose —, e é isso que o número impresso no fim existe para pegar.
 *
 * ---------------------------------------------------------------------------
 * O MATIZ DO CABELO É INSTRUMENTO DE MEDIÇÃO, NÃO ESCOLHA DE ARTE
 * ---------------------------------------------------------------------------
 *
 * O pedido exige o cabelo em **verde-azulado chapado**, ~177° de matiz. Não é
 * gosto e não é a cor final (pela emenda à D27 o cabelo recolore em runtime, a
 * partir de `CABELO` em `palette.ts`). É a regra 10 da §7b — *pele e pano em
 * matizes distantes* — usada ao contrário: com a pele em 17–29° e o cabelo em
 * ~177°, segmentar vira um teste de matiz exato, em vez de heurística de
 * luminância que confunde cabelo escuro com o contorno preto de 12 unidades.
 *
 * E são **dois** tons do mesmo matiz, não um: a fronteira entre eles é a
 * polilinha de sombra que o campo `Cabelo.sombra` passou a aceitar. Pedir um tom
 * só faria a sombra continuar sendo o degrau constante de 22 unidades, que é a
 * causa 4 da reprovação.
 *
 * ---------------------------------------------------------------------------
 * COMO RODAR
 * ---------------------------------------------------------------------------
 *
 *   npx tsx scripts/avatar/estilo/gerar.ts --modelos       # o que dá para pedir
 *   npx tsx scripts/avatar/estilo/gerar.ts --listar        # modelos da API
 *   npx tsx scripts/avatar/estilo/gerar.ts curto           # 1 imagem
 *   npx tsx scripts/avatar/estilo/gerar.ts cacheado 3      # 3 imagens
 *   npx tsx scripts/avatar/estilo/gerar.ts curto 2 --api=gemini-3-pro-image
 *
 * O `--api=` existe porque a conta enxerga um flash e um pro, e qual dos dois
 * desenha melhor uma franja é pergunta de medição, não de suposição. O sufixo
 * do arquivo salvo carrega o modelo, para duas rodadas não se sobrescreverem.
 *
 * Precisa de `GEMINI_API_KEY` em `process.env` ou no `.env.local` (chave grátis
 * no Google AI Studio). Sem ela o script sai com instrução, não com stack.
 */

import { execFileSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import sharp from "sharp";

const HOST = "https://generativelanguage.googleapis.com";
const POLLI = "https://image.pollinations.ai/prompt";

/** A ordem em que os modelos de imagem são tentados. O primeiro que existir vence. */
const CANDIDATOS = [
  "gemini-3.1-flash-image",
  "gemini-2.5-flash-image",
  "gemini-2.5-flash-image-preview",
  "gemini-2.0-flash-preview-image-generation",
];

const REFERENCIA = "scripts/avatar/fonte/estilo-kokeshi/referencia-base.png";
const SAIDA = ".scratch/estilo/gerado";

/**
 * A referência é REDUZIDA antes de subir, e o número saiu de um 429.
 *
 * A `referencia-base.png` tem 2038², e um pedido só com ela estourou a cota de
 * *tokens de entrada por minuto* do plano grátis — a imagem é quase toda a conta.
 * A 1024 o custo cai ~4×, e a perda é nenhuma para o que se está pedindo: o
 * gerador copia proporção, pose e enquadramento, e nenhum dos três precisa de
 * 2038 px. A resolução que importa é a da **saída**, que é dele.
 *
 * Isto NÃO é a régua. Toda medição continua acontecendo sobre o PNG que ele
 * devolve, carregado no tamanho original por `carregarPng` (raster.ts).
 */
const LADO_REFERENCIA = 1024;

/* ------------------------------------------------------------------ */
/* A chave                                                             */
/* ------------------------------------------------------------------ */

/**
 * `process.env` primeiro (é como o CI daria), `.env.local` depois.
 *
 * Mesma ordem de precedência do `scripts/verify/db-url.ts`, e a varredura de
 * linha é a mesma — o `.env.local` deste projeto tem linha solta sem `CHAVE=`,
 * então `loadEnv()` não expõe tudo.
 */
/** Os nomes aceitos, na ordem. O segundo é o que a doc do Google usa em metade dos exemplos. */
const NOMES_DA_CHAVE = ["GEMINI_API_KEY", "GOOGLE_API_KEY"];

/** O token do Pollinations, que é o provedor SEM custo. Ver `POR QUE DOIS PROVEDORES`. */
const NOME_DO_TOKEN_POLLI = "POLLINATIONS_TOKEN";

/**
 * O formato de uma chave do AI Studio: `AQ.` nas novas, `AIza` nas antigas.
 *
 * Serve para aceitar a chave em **linha solta, sem `NOME=`** — que não é
 * tolerância inventada aqui: é a convenção que este `.env.local` já tem. A
 * connection string do Postgres mora nele exatamente assim, e o
 * `scripts/verify/db-url.ts` a acha varrendo por `postgres://` pelo mesmo motivo.
 * Um arquivo com duas convenções é um arquivo em que a segunda chave colada vai
 * parar na forma errada, e o sintoma é "não encontrada" com o valor visível na
 * tela.
 */
const FORMATO_DA_CHAVE = /^(AQ\.[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{30,})$/;

/** Toda linha `NOME=valor` do `.env.local`, mais as linhas soltas que parecem chave. */
function lerEnvLocal(): { nomeados: Map<string, string>; soltas: string[] } {
  const nomeados = new Map<string, string>();
  const soltas: string[] = [];
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return { nomeados, soltas };

  // `﻿` é o BOM que um editor do Windows põe na primeira linha; sem tirá-lo o
  // nome da primeira variável nunca casa, e o sintoma é "não encontrada" com o
  // arquivo visivelmente correto na tela.
  const bruto = readFileSync(envPath, "utf-8").replace(/^﻿/, "");
  for (const linha of bruto.split(/\r?\n/)) {
    const t = linha.trim();
    if (!t || t.startsWith("#")) continue;
    const m = t.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/);
    if (m) nomeados.set(m[1], semAspas(m[2].trim()));
    else soltas.push(t);
  }
  return { nomeados, soltas };
}

/** Um segredo por nome: `process.env` primeiro (é como o CI daria), `.env.local` depois. */
function doEnv(nome: string): string | undefined {
  const v = process.env[nome]?.trim();
  if (v) return semAspas(v);
  return lerEnvLocal().nomeados.get(nome);
}

function chave(): string {
  for (const nome of NOMES_DA_CHAVE) {
    const v = doEnv(nome);
    if (v) return v;
  }

  const envPath = resolve(process.cwd(), ".env.local");
  const { nomeados, soltas } = lerEnvLocal();
  for (const t of soltas) if (FORMATO_DA_CHAVE.test(t)) return t;
  const vistos = [...nomeados.keys()];

  console.error(
    `Chave não encontrada. Procurei por ${NOMES_DA_CHAVE.join(" ou ")}.\n\n` +
      (existsSync(envPath)
        ? `Nomes que o .env.local tem hoje (só os nomes, nunca os valores):\n` +
          `  ${vistos.join("\n  ") || "(nenhuma linha no formato NOME=valor)"}\n\n`
        : `Não existe .env.local em ${envPath}\n\n`) +
      "  1. Pegue uma chave grátis em https://aistudio.google.com/apikey\n" +
      "  2. Acrescente ao .env.local, na raiz do projeto, SEM aspas:\n\n" +
      "       GEMINI_API_KEY=AQ.xxxxxxxx\n\n" +
      "O .env.local não vai para o git. Nada mais precisa mudar."
  );
  process.exit(1);
}

function semAspas(v: string): string {
  const aspado =
    (v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"));
  return aspado ? v.slice(1, -1) : v;
}

/* ------------------------------------------------------------------ */
/* O pedido                                                            */
/* ------------------------------------------------------------------ */

/**
 * O preâmbulo, comum a todo pedido de cabelo.
 *
 * Cada bloco aqui paga uma rodada já perdida, e as referências são ao
 * `docs/avatar/15-plano-ate-pronto.md`:
 *
 *  - "EDITE a imagem anexada" é a §2 do runbook. Sem ela o gerador desenha
 *    outro personagem, e aconteceu duas vezes;
 *  - a frase de pose é a **regra 15b da §7b**, literal. O plano já disse
 *    "levemente em 3/4" e o Bloco 1 respondeu "frontal simétrica"; nenhuma das
 *    duas descreve a referência, e a assimetria é medida (`GIRO`);
 *  - "sem textura" é a **regra 11**: trama invisível no PNG vira regiões
 *    esfarrapadas do tamanho do tronco quando alguém traça;
 *  - "legível a 56 px" é a régua do ranking, e a mesma do gate de distinção.
 */
const PREAMBULO = `EDITE a imagem anexada. Não desenhe um personagem novo, não redesenhe o boneco, não mude o enquadramento.

O QUE FICA EXATAMENTE IGUAL, pixel a pixel:
- o rosto inteiro: olhos, sobrancelhas, boca, e a posição de cada um;
- o formato e o tamanho da cabeça;
- o tronco, a cor da pele, a proporção entre cabeça e corpo;
- a pose, o enquadramento e o fundo transparente;
- a espessura do contorno preto.

A PROPORÇÃO É A TRAVA MAIS IMPORTANTE. A altura da cabeça dividida pela altura do tronco tem de continuar sendo a mesma da imagem anexada. Se você redesenhar o boneco com a cabeça menor, o corpo mais alto, ou o rosto mais estreito, a imagem inteira é descartada — mesmo que o cabelo esteja bonito. Não é estilo: é medida.

A POSE, que já está certa na imagem e não pode mudar: pose quase frontal, com um giro mínimo para a direita da imagem; há um plano lateral mais escuro só na borda direita da cabeça e do tronco; os olhos ficam ligeiramente à direita do centro da cabeça, com o direito um pouco mais alto.

O QUE VOCÊ ACRESCENTA: só o cabelo. Nada mais.

COMO O CABELO TEM DE SER PINTADO — isto é obrigatório e não é escolha de arte:
- exatamente DUAS cores chapadas, sem gradiente, sem textura, sem brilho, sem granulação:
    corpo do cabelo:  #19C7C0  (verde-azulado claro)
    sombra do cabelo: #0E7C78  (verde-azulado escuro)
- a sombra é uma faixa contínua junto à raiz e por baixo da franja, e ela ACOMPANHA a forma do cabelo: mais grossa onde a mecha é mais grossa, mais fina onde a mecha afina. Nunca uma faixa de espessura constante;
- contorno preto sólido em volta de toda a massa do cabelo, da mesma espessura do contorno que já está no boneco;
- nenhuma linha fina interna, nenhum fio desenhado, nenhum risco de detalhe: a esta escala eles somem e viram sujeira.

VOLUME — e é aqui que a versão anterior falhou:
O cabelo PODE e DEVE criar uma silhueta própria em volta do crânio. Ele não é tinta pintada dentro da cabeça; é uma massa com forma, que passa do contorno do crânio. Esse volume tem de ler como CABELO, e nunca como chapéu, capacete, boina, pluma, orelha, ou objeto solto colado ao lado da cabeça.

A FRANJA nunca é uma linha horizontal. Ela tem mechas de comprimentos diferentes, com pontas visíveis e recortes entre elas. Mas deixa a testa livre: nenhuma mecha encosta nas sobrancelhas nem passa por cima delas — os dois lados precisam de uma faixa de pele visível entre o cabelo e a sobrancelha.

LEGIBILIDADE: o desenho tem de continuar reconhecível reduzido a 56 pixels de altura. Forma grande e recorte claro contra o fundo; nada que dependa de detalhe pequeno.`;

/**
 * O que muda de um pedido para o outro: **a massa e o recorte**, nunca o estilo.
 *
 * ---------------------------------------------------------------------------
 * TRÊS PEDIDOS PARA O `curto`, E O MOTIVO É UM GATE QUE REPROVOU
 * ---------------------------------------------------------------------------
 *
 * A primeira rodada gerou o mesmo pedido duas vezes e mediu **1,34% de pixels
 * diferentes a 56 px**, contra piso de 5%. O `avatar:variantes` reprovou com a
 * frase certa: *"os eixos prometem direções distintas e os desenhos são a mesma.
 * Prosa não é divergência."*
 *
 * **Gerar N vezes o mesmo pedido não produz variantes — produz a mesma peça com
 * ruído.** A divergência tem de estar no pedido, e a Fase 2 da skill
 * `avatar-desenho` diz isso com todas as letras: três direções com eixo nomeado,
 * declaradas **antes** de qualquer código. Nomear o eixo depois, olhando o que
 * saiu, é justificar em vez de explorar.
 *
 * Os três eixos abaixo divergem em **para onde a massa vai** — lateral e
 * assimétrica, vertical, ou uniformemente redonda. Vetores de expansão diferentes
 * não conseguem ocupar os mesmos pixels, que é o que resolve o gate (a) por
 * construção em vez de por sorte. A `tigela` é, de propósito, a que eu não
 * escolheria primeiro: a Fase 2 exige uma assim.
 */
const MODELOS: Record<string, string> = {
  "curto-domada": `O MODELO: cabelo CURTO E PENTEADO PARA UM LADO.

A MASSA VAI PARA OS LADOS, e é assimétrica. Há uma risca lateral clara: o cabelo é repartido perto de uma das têmporas, e a franja atravessa a testa na diagonal, mais comprida do lado da risca e mais curta do outro. O cabelo abraça o crânio — passa dele em cerca de 4% da largura da cabeça de cada lado, e quase nada acima da coroa (2%).

ONDE TERMINA: o ponto mais baixo fica acima da linha dos olhos pelos lados. Nada de mecha descendo ao lado do rosto.

A borda de baixo da franja é uma diagonal com dois ou três degraus — mechas de comprimentos diferentes —, nunca uma reta e nunca um arco simétrico.

Lê como: cabelo penteado, arrumado.`,

  "curto-espetada": `O MODELO: cabelo CURTO E ESPETADO PARA CIMA.

A MASSA VAI PARA CIMA. Acima da coroa há tufos pontiagudos que sobem cerca de 15% da largura da cabeça; pelos lados o cabelo é colado, passando do crânio só uns 2%. É o oposto do modelo penteado: lá a massa é lateral, aqui é vertical.

ONDE TERMINA: a franja é CURTA e ALTA — ela deixa boa parte da testa à mostra, terminando bem acima das sobrancelhas. Nada desce ao lado do rosto.

Os tufos do alto têm alturas desiguais, três ou quatro, com vãos entre eles. Eles são grossos na base e afinam para a ponta, mas nenhum é mais fino que um quinto da largura da cabeça — ponta fina demais some quando a imagem é reduzida.

Lê como: cabelo espetado, arrepiado.`,

  "curto-tigela": `O MODELO: cabelo CURTO EM CUIA, redondo e fechado.

A MASSA É UNIFORME E REDONDA. O contorno externo do cabelo é praticamente um arco de círculo que envolve a cabeça toda por igual: passa do crânio cerca de 11% da largura de cada lado e cerca de 9% acima da coroa, sem tufo, sem risca, sem ponta voando. É simétrico, ao contrário do modelo penteado.

ONDE TERMINA: a borda de baixo é um arco raso e contínuo que cruza a testa acima das sobrancelhas e desce pelos lados até a altura dos olhos. Não passa dali.

O recorte é RASO: a borda de baixo ondula pouco, com quatro ou cinco ondas curtas e regulares. Este modelo se identifica pela massa redonda, não pelo recorte.

Lê como: corte de cuia, tigela.`,

  curto: `O MODELO: cabelo CURTO.

ONDE O CABELO TERMINA — e esta é a trava que a rodada anterior estourou. O ponto mais baixo do cabelo, em qualquer lugar da imagem, fica ACIMA DA LINHA DOS OLHOS pelos lados e nunca passa da metade da altura da cabeça. Nada de mecha descendo ao lado do rosto, nada de cortina lateral, nada que chegue ao queixo ou ao ombro. Foi medido: a versão anterior desceu até abaixo do queixo e ficou com 28,6% de largura extra, quando o alvo é 3 a 5%.

Volume discreto mas real: a massa passa da silhueta do crânio em cerca de 3% da largura da cabeça de cada lado, nas têmporas, e cerca de 3% acima da coroa. Não é um capacete colado — as laterais têm um leve inchaço no alto e afinam para baixo.

A franja cobre a testa em mechas de alturas desiguais, com duas ou três pontas mais compridas e recortes rasos entre elas. O contorno de baixo da franja sobe e desce visivelmente ao longo da testa; ele nunca é reto.`,

  cacheado: `O MODELO: cabelo CACHEADO, volumoso.

ONDE O CABELO TERMINA: o ponto mais baixo fica na altura da boca, nunca abaixo do queixo, e nunca encosta no ombro.

A massa passa da silhueta do crânio em cerca de 13% da largura da cabeça de cada lado e cerca de 11% acima da coroa. É o mais volumoso do elenco, e o volume é o que o identifica a 56 pixels.

O contorno externo da massa é feito de festões arredondados de tamanhos DESIGUAIS — cachos grandes e pequenos alternados, nunca uma sequência regular de bolinhas iguais, que leria como uma nuvem ou como uma renda.

A franja também é ondulada, com cachos que descem em alturas diferentes sobre a testa.`,
};

/* ------------------------------------------------------------------ */
/* A chamada                                                           */
/* ------------------------------------------------------------------ */

type Parte = {
  text?: string;
  inlineData?: { mimeType?: string; data?: string };
  inline_data?: { mime_type?: string; data?: string };
};

async function listarModelos(k: string): Promise<string[]> {
  const r = await fetch(`${HOST}/v1beta/models?pageSize=200`, {
    headers: { "x-goog-api-key": k },
  });
  if (!r.ok) {
    console.error(`Falha ao listar modelos: HTTP ${r.status}\n${await r.text()}`);
    process.exit(1);
  }
  const j = (await r.json()) as { models?: { name?: string }[] };
  return (j.models ?? [])
    .map((m) => (m.name ?? "").replace(/^models\//, ""))
    .filter(Boolean);
}

/**
 * O primeiro dos `CANDIDATOS` que a conta enxerga.
 *
 * A lista existe porque o nome do modelo de imagem já mudou três vezes e o
 * script não pode morrer por causa disso — o erro seria "HTTP 404" a
 * quilômetros da causa. Se nenhum bater, imprime o que a conta tem.
 */
async function escolherModelo(k: string): Promise<string> {
  const disponiveis = await listarModelos(k);
  for (const c of CANDIDATOS) if (disponiveis.includes(c)) return c;

  const comImagem = disponiveis.filter((m) => m.includes("image"));
  console.error(
    `Nenhum dos modelos de imagem conhecidos está disponível nesta chave.\n` +
      `Tentados: ${CANDIDATOS.join(", ")}\n` +
      `Com "image" no nome, nesta conta: ${comImagem.join(", ") || "(nenhum)"}\n` +
      `Acrescente o nome certo a CANDIDATOS, no topo deste arquivo.`
  );
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* Pollinations — o provedor sem custo                                 */
/* ------------------------------------------------------------------ */

/**
 * POR QUE DOIS PROVEDORES, e por que o Pollinations é o primeiro.
 *
 * Medido em 2026-08-03, com chave nova do AI Studio: os **seis** modelos de
 * imagem do Gemini respondem `limit: 0` no plano grátis. Não é cota gasta — é a
 * geração de imagem não existir no tier gratuito. Ligar cobrança resolve e custa
 * centavos por imagem, mas isso é decisão do Doug, não pressuposto do script.
 *
 * O Pollinations expõe o **FLUX.1 Kontext** (`model=kontext`), que é um editor de
 * imagem de verdade — a mesma família que os serviços pagos vendem —, no tier
 * **Seed**: cadastro grátis em auth.pollinations.ai, sem cartão, uma requisição a
 * cada 5 segundos.
 *
 * A diferença de forma entre os dois: o Gemini recebe a referência em base64 no
 * corpo; o Pollinations recebe uma **URL pública**. Aqui isso não expõe nada de
 * novo — o repositório é público e a `referencia-base.png` já está no `origin`,
 * então a URL é a mesma que qualquer pessoa já podia abrir. `urlDaReferencia()`
 * confere isso antes de mandar, em vez de supor.
 */
function urlDaReferencia(): string {
  const git = (...a: string[]) => execFileSync("git", a, { encoding: "utf-8" }).trim();
  const remoto = git("remote", "get-url", "origin")
    .replace(/^git@github\.com:/, "https://github.com/")
    .replace(/\.git$/, "");
  const dono = remoto.replace(/^https:\/\/github\.com\//, "");
  const ramo = git("rev-parse", "--abbrev-ref", "HEAD");
  return `https://raw.githubusercontent.com/${dono}/${ramo}/${REFERENCIA}`;
}

/**
 * A referência precisa estar EMPURRADA, e o 404 tem de aparecer aqui.
 *
 * O `image=` do Pollinations é uma URL: se ela não resolver, o serviço não
 * reclama de referência faltando — ele gera do zero, e volta um personagem
 * qualquer. O defeito apareceria três blocos depois, como "a régua não achou a
 * cabeça". Uma requisição HEAD custa nada e transforma isso numa mensagem.
 */
async function conferirReferenciaPublica(url: string) {
  const r = await fetch(url, { method: "HEAD" });
  if (r.ok) return;
  console.error(
    `A referência não está acessível publicamente:\n  ${url}\n  HTTP ${r.status}\n\n` +
      `O Pollinations recebe a referência por URL, não por upload. Sem ela ele\n` +
      `desenha um personagem do zero — e o erro só apareceria na régua.\n\n` +
      `Conserto: \`git push\` do ramo atual, ou use o provedor gemini (--provedor=gemini).`
  );
  process.exit(1);
}

async function gerarPolli(
  token: string,
  prompt: string,
  refUrl: string,
  semente: number
): Promise<{ b64: string; texto: string }> {
  const q = new URLSearchParams({
    model: "kontext",
    image: refUrl,
    width: "1024",
    height: "1024",
    nologo: "true",
    // Sem semente explícita o serviço fixa 42, e três "variantes" voltariam
    // idênticas — divergência falsa é a reprovação nº 3 do `avatar:variantes`.
    seed: String(semente),
  });
  const r = await fetch(`${POLLI}/${encodeURIComponent(prompt)}?${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    console.error(`HTTP ${r.status} do Pollinations:\n${(await r.text()).slice(0, 600)}`);
    process.exit(1);
  }
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.subarray(0, 4).toString("hex") !== "89504e47") {
    console.error(`A resposta não é PNG:\n${buf.toString("utf-8").slice(0, 400)}`);
    process.exit(1);
  }
  return { b64: buf.toString("base64"), texto: "" };
}

/* ------------------------------------------------------------------ */

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * A cota do plano grátis é por MINUTO, e o servidor diz quanto esperar.
 *
 * O limite que morde aqui é `GenerateContentInputTokensPerModelPerMinute`, e a
 * imagem de referência é quase toda a conta — daí a redução a `LADO_REFERENCIA`.
 * Mesmo reduzida, uma sequência de pedidos enche a janela. O 429 traz um
 * `RetryInfo.retryDelay`; obedecer a ele é mais barato e mais honesto que um
 * backoff inventado, e evita o script morrer no meio de uma rodada de 3 imagens.
 */
async function comCota(f: () => Promise<Response>, tentativas = 3): Promise<Response> {
  for (let i = 1; ; i++) {
    const r = await f();
    if (r.status !== 429 || i >= tentativas) return r;
    const corpo = await r.text();

    // `limit: 0` NÃO é janela cheia — é o modelo não existir neste plano. Esperar
    // 57 segundos três vezes por uma porta que nunca abre foi como este ramo
    // nasceu: o `gemini-3.1-flash-image` devolve `limit: 0` no plano grátis.
    if (/limit:\s*0\b/.test(corpo)) {
      console.error(
        `Este modelo não tem cota grátis (a API respondeu "limit: 0").\n` +
          `Não é janela cheia: esperar não resolve. Ou é chave paga, ou é outro modelo.\n` +
          `Tente:  npx tsx scripts/avatar/estilo/gerar.ts <slug> 1 --api=gemini-2.5-flash-image`
      );
      process.exit(1);
    }

    const s = Number(corpo.match(/"retryDelay":\s*"(\d+)s"/)?.[1] ?? 30);
    console.log(`   cota cheia; o servidor pediu ${s}s (tentativa ${i}/${tentativas})`);
    await dormir((s + 3) * 1000);
  }
}

async function gerar(k: string, modeloApi: string, prompt: string, refB64: string) {
  const r = await comCota(() =>
    fetch(`${HOST}/v1beta/models/${modeloApi}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": k, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "image/png", data: refB64 } },
            ],
          },
        ],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    })
  );

  if (!r.ok) {
    const corpo = await r.text();
    console.error(`HTTP ${r.status} de ${modeloApi}:\n${corpo.slice(0, 800)}`);
    if (r.status === 429) {
      console.error(
        "\nCota estourada mesmo depois de esperar. O plano grátis tem limite por\n" +
          "minuto E por dia. Se for o diário, só amanhã ou chave paga."
      );
    }
    process.exit(1);
  }

  const j = (await r.json()) as {
    candidates?: { content?: { parts?: Parte[] } }[];
  };
  const partes = j.candidates?.[0]?.content?.parts ?? [];
  const img = partes.find((p) => p.inlineData?.data || p.inline_data?.data);
  const texto = partes.map((p) => p.text).filter(Boolean).join(" ").trim();

  if (!img) {
    console.error(
      `A resposta não trouxe imagem.` + (texto ? `\nO modelo disse: ${texto}` : "")
    );
    process.exit(1);
  }
  return {
    b64: (img.inlineData?.data ?? img.inline_data?.data)!,
    texto,
  };
}

/* ------------------------------------------------------------------ */
/* Salvar, e a medida de fumaça                                        */
/* ------------------------------------------------------------------ */

/** Faixa de matiz do verde-azulado que o pedido exige, em graus. */
const MATIZ_CABELO: [number, number] = [155, 200];

function matiz(r: number, g: number, b: number): number {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  if (d === 0) return -1; // cinza puro não tem matiz
  let h: number;
  if (mx === r) h = ((g - b) / d) % 6;
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

/**
 * Achata sobre branco ANTES de salvar, e a ordem importa.
 *
 * `carregarPng` (raster.ts) faz `removeAlpha()` sem `flatten`, e o docstring
 * dele diz por quê: as referências deste projeto não têm canal alfa. Uma
 * imagem do gerador pode ter, e aí `removeAlpha` deixaria o RGB de baixo — que
 * num PNG transparente é PRETO. A régua leria a imagem inteira como contorno.
 * Achatar aqui mantém `raster.ts` intacto e a régua honesta.
 */
async function salvar(b64: string, destino: string) {
  const bruto = Buffer.from(b64, "base64");
  const png = await sharp(bruto).flatten({ background: "#FFFFFF" }).png().toBuffer();
  writeFileSync(destino, png);

  const { data, info } = await sharp(png)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let comCabelo = 0;
  const total = info.width * info.height;
  for (let i = 0; i < data.length; i += info.channels) {
    const h = matiz(data[i], data[i + 1], data[i + 2]);
    if (h >= MATIZ_CABELO[0] && h <= MATIZ_CABELO[1]) comCabelo++;
  }
  return {
    w: info.width,
    h: info.height,
    bytes: png.length,
    pctCabelo: (100 * comCabelo) / total,
  };
}

/* ------------------------------------------------------------------ */

/** O caminho do Pollinations: referência por URL pública, imagem por HTTP GET. */
async function gerarComPollinations(token: string, args: string[], _b: string[]) {
  const slug = args[0];
  const n = Number(args[1] ?? 1);
  if (!slug || !MODELOS[slug]) {
    console.error(`Uso: npm run avatar:gerar -- <${Object.keys(MODELOS).join("|")}> [n]`);
    process.exit(1);
  }

  const refUrl = urlDaReferencia();
  await conferirReferenciaPublica(refUrl);
  mkdirSync(SAIDA, { recursive: true });

  const prompt = `${PREAMBULO}\n\n${MODELOS[slug]}`;
  console.log(`provedor:   pollinations / kontext (FLUX.1 Kontext)`);
  console.log(`referência: ${refUrl}`);
  console.log("");

  for (let i = 1; i <= n; i++) {
    // Semente derivada do índice, não sorteada: duas rodadas do mesmo pedido têm
    // de dar as mesmas imagens, senão nenhuma crítica é reprodutível.
    const { b64 } = await gerarPolli(token, prompt, refUrl, 1000 + i);
    const destino = `${SAIDA}/${slug}-kontext-${i}.png`;
    const m = await salvar(b64, destino);
    console.log(
      `${destino}  ${m.w}x${m.h}  ${(m.bytes / 1024).toFixed(0)} KB  ` +
        `matiz de cabelo: ${m.pctCabelo.toFixed(2)}% do quadro`
    );
    if (i < n) await dormir(6000); // o tier Seed é 1 requisição a cada 5s
  }

  console.log(
    "\nO % de matiz de cabelo é a medida de fumaça: 0,00% significa que o gerador\n" +
      "ignorou a cor pedida, e aí a régua não tem como segmentar. Regere — não\n" +
      "melhore o prompt (runbook §2.2, armadilha 3)."
  );
}

async function main() {
  const todos = process.argv.slice(2);
  const pedido = todos.find((a) => a.startsWith("--api="))?.slice(6);
  const provPedido = todos.find((a) => a.startsWith("--provedor="))?.slice(11);
  const args = todos.filter((a) => !a.startsWith("--"));
  const bandeiras = todos.filter((a) => a.startsWith("--") && !a.includes("="));

  if (bandeiras.includes("--modelos")) {
    console.log(`Modelos de cabelo com pedido escrito: ${Object.keys(MODELOS).join(", ")}`);
    return;
  }

  // O MESMO texto que a API recebe, num arquivo para colar à mão. Uma fonte só:
  // um prompt copiado para um doc é um prompt que diverge do que o script manda, e
  // aí ninguém sabe qual gerou a arte que está na tela.
  if (bandeiras.includes("--prompt")) {
    const md =
      `# Pedido de cabelo — para colar no AI Studio\n\n` +
      `> **Gerado por \`npm run avatar:gerar -- --prompt\`.** Não edite aqui: edite\n` +
      `> \`PREAMBULO\`/\`MODELOS\` em \`scripts/avatar/estilo/gerar.ts\` e rode de novo.\n` +
      `> Prompt copiado à mão é prompt que diverge do que o script manda.\n\n` +
      `## Como usar\n\n` +
      `1. Abra <https://aistudio.google.com> e escolha um modelo de imagem\n` +
      `2. **Anexe** \`${REFERENCIA}\`\n` +
      `3. Cole o pedido do modelo que quiser, abaixo\n` +
      `4. Salve o PNG em \`.scratch/estilo/gerado/<modelo>-<n>.png\`\n` +
      `5. Me avise — eu meço com \`npx tsx .scratch/estilo/franja.ts <arquivo>\`\n\n` +
      `**Gere 3 de cada**, com o mesmo pedido. Variação entre gerações é o que\n` +
      `alimenta as três direções que o \`avatar:variantes\` exige — e ele reprova se\n` +
      `duas não se distinguirem a 56 px.\n\n` +
      Object.entries(MODELOS)
        .map(([slug, m]) => `---\n\n## ${slug}\n\n\`\`\`\n${PREAMBULO}\n\n${m}\n\`\`\`\n`)
        .join("\n");
    const destino = ".scratch/estilo/PROMPT-CABELO.md";
    mkdirSync(SAIDA, { recursive: true });
    writeFileSync(destino, md);
    console.log(`${destino}  (${Object.keys(MODELOS).length} pedidos)`);
    return;
  }

  // O Pollinations vem primeiro quando o token existe: ele é o que não custa.
  const tokenPolli = doEnv(NOME_DO_TOKEN_POLLI);
  const provedor = provPedido ?? (tokenPolli ? "pollinations" : "gemini");

  if (provedor === "pollinations") {
    if (!tokenPolli) {
      console.error(
        `${NOME_DO_TOKEN_POLLI} não encontrado.\n\n` +
          "  1. Cadastro grátis, sem cartão, em https://auth.pollinations.ai\n" +
          "  2. Copie o token e acrescente ao .env.local:\n\n" +
          `       ${NOME_DO_TOKEN_POLLI}=<o token>\n\n` +
          "O tier Seed dá uma requisição a cada 5s e inclui o modelo `kontext`,\n" +
          "que é o FLUX.1 Kontext — edição de imagem de verdade, sobre a referência."
      );
      process.exit(1);
    }
    await gerarComPollinations(tokenPolli, args, bandeiras);
    return;
  }

  const k = chave();

  if (bandeiras.includes("--listar")) {
    const ms = await listarModelos(k);
    console.log(ms.filter((m) => m.includes("image")).join("\n") || "(nenhum com image)");
    return;
  }

  // Qual modelo esta chave REALMENTE alcança. Existe porque `models.list` mente
  // por omissão: ele lista tudo que a API oferece, não o que o seu plano paga. O
  // `gemini-3.1-flash-image` aparece na lista e responde `limit: 0`.
  if (bandeiras.includes("--sondar")) {
    const px = await sharp({
      create: { width: 64, height: 64, channels: 3, background: "#FFFFFF" },
    })
      .png()
      .toBuffer();
    const b64 = px.toString("base64");
    for (const m of await listarModelos(k)) {
      if (!m.includes("image") || m.startsWith("imagen")) continue;
      const r = await fetch(`${HOST}/v1beta/models/${m}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": k, "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: "Paint this square red." },
                { inline_data: { mime_type: "image/png", data: b64 } },
              ],
            },
          ],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
      });
      const corpo = r.ok ? "" : await r.text();
      const zero = /limit:\s*0\b/.test(corpo);
      console.log(
        `${r.ok ? "OK    " : `HTTP ${r.status}`}  ${m}` +
          (zero ? "   (limit: 0 — fora do plano grátis)" : "")
      );
    }
    return;
  }

  const slug = args[0];
  const n = Number(args[1] ?? 1);
  if (!slug || !MODELOS[slug]) {
    console.error(
      `Uso: tsx scripts/avatar/estilo/gerar.ts <${Object.keys(MODELOS).join("|")}> [n]`
    );
    process.exit(1);
  }

  if (!existsSync(REFERENCIA)) {
    console.error(`Referência não encontrada: ${REFERENCIA}`);
    process.exit(1);
  }
  const refPng = await sharp(readFileSync(REFERENCIA))
    .resize({
      width: LADO_REFERENCIA,
      height: LADO_REFERENCIA,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();
  const refB64 = refPng.toString("base64");
  mkdirSync(SAIDA, { recursive: true });

  const modeloApi = pedido ?? (await escolherModelo(k));
  const prompt = `${PREAMBULO}\n\n${MODELOS[slug]}`;
  console.log(`modelo da API: ${modeloApi}`);
  console.log(
    `referência:    ${REFERENCIA} → ${LADO_REFERENCIA}px, ${(refPng.length / 1024).toFixed(0)} KB`
  );
  console.log("");

  for (let i = 1; i <= n; i++) {
    const { b64, texto } = await gerar(k, modeloApi, prompt, refB64);
    const destino = `${SAIDA}/${slug}-${modeloApi}-${i}.png`;
    const m = await salvar(b64, destino);
    console.log(
      `${destino}  ${m.w}x${m.h}  ${(m.bytes / 1024).toFixed(0)} KB  ` +
        `matiz de cabelo: ${m.pctCabelo.toFixed(2)}% do quadro`
    );
    if (texto) console.log(`   o modelo disse: ${texto.slice(0, 160)}`);
  }

  console.log(
    "\nO % de matiz de cabelo é a medida de fumaça: 0,00% significa que o gerador\n" +
      "ignorou a cor pedida, e aí a régua não tem como segmentar. Regere — não\n" +
      "melhore o prompt (runbook §2.2, armadilha 3)."
  );
}

main();
