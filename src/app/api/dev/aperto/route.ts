/**
 * A ROTA DA TABELA DE APERTO — **só de desenvolvimento**, como a da oclusão.
 *
 * O editor decide o aperto par a par, a olho, e a decisão tem de sobreviver a
 * fechar a aba. Quem grava é o servidor porque o arquivo mora no repositório, ao
 * lado da arte, e vira entrada da esteira.
 *
 * ⚠️ **`NODE_ENV !== "development"` devolve 404 em todos os verbos**, antes de ler o
 * corpo — a rota **não existe** em produção. E os dois nomes que entram são
 * validados contra os catálogos em memória: não há chave vinda do cliente que não
 * seja um par real do elenco.
 */

import { NextResponse } from "next/server";

import {
  APERTO_MAX,
  APERTO_MIN,
  arredondar,
  chaveDoPar,
  gravarAperto,
  lerAperto,
} from "../../../../../scripts/avatar/arte/aperto-do-cabelo";
import { CABELOS } from "@/lib/avatar/estilo/cabelo";
import { CHAPEUS_DA_ARTE } from "@/lib/avatar/estilo/chapeus-da-arte";

/** Lê e escreve arquivo do repositório: Node, e nada pré-renderizado. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const soEmDev = () => process.env.NODE_ENV !== "development";

const chapeuExiste = (s: unknown) =>
  typeof s === "string" && Object.prototype.hasOwnProperty.call(CHAPEUS_DA_ARTE, s);

const cabeloExiste = (s: unknown) =>
  typeof s === "string" &&
  Object.prototype.hasOwnProperty.call(CABELOS, s) &&
  Boolean((CABELOS as Record<string, { tonal?: unknown }>)[s].tonal);

/** GET — a tabela inteira, como está no disco. */
export function GET() {
  if (soEmDev()) return new NextResponse(null, { status: 404 });
  return NextResponse.json({ tabela: lerAperto() });
}

/**
 * POST — grava UM par e devolve a tabela inteira de volta.
 *
 * Devolver a tabela toda em vez de um "ok" é o que mantém a tela e o disco em fase:
 * o editor nunca supõe o que gravou, ele redesenha do que voltou.
 *
 * ⚠️ **`valor: 1` GRAVA, não apaga.** "Este par não precisa apertar" é uma decisão
 * tomada, e ela tem de ficar registrada — senão não há como distinguir dela um par
 * que ninguém abriu. Quem some com o 1 é o gerador do catálogo. Para desfazer uma
 * decisão, apaga-se a linha no arquivo.
 */
export async function POST(req: Request) {
  if (soEmDev()) return new NextResponse(null, { status: 404 });
  const corpo = (await req.json()) as { chapeu?: unknown; cabelo?: unknown; valor?: unknown };
  if (!chapeuExiste(corpo.chapeu)) {
    return NextResponse.json({ erro: "chapéu fora do catálogo" }, { status: 400 });
  }
  if (!cabeloExiste(corpo.cabelo)) {
    return NextResponse.json({ erro: "cabelo fora do elenco tonal" }, { status: 400 });
  }
  const valor = corpo.valor === undefined ? APERTO_MAX : corpo.valor;
  if (typeof valor !== "number" || !Number.isFinite(valor) || valor < APERTO_MIN || valor > APERTO_MAX) {
    return NextResponse.json(
      { erro: `\`valor\` precisa ser número entre ${APERTO_MIN} e ${APERTO_MAX}` },
      { status: 400 },
    );
  }

  const t = lerAperto();
  t[chaveDoPar(corpo.chapeu as string, corpo.cabelo as string)] = arredondar(valor);
  gravarAperto(t);
  return NextResponse.json({ tabela: lerAperto() });
}
