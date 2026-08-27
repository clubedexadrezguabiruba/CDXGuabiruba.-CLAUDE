/**
 * A ROTA DO EDITOR DE OCLUSÃO — **só de desenvolvimento**, e a trava é a primeira
 * linha de cada verbo.
 *
 * ---------------------------------------------------------------------------
 * POR QUE UMA ROTA DE SERVIDOR, E POR QUE ELA NÃO É PERIGOSA
 * ---------------------------------------------------------------------------
 *
 * O editor (`/dev/avatar-oclusao`) pinta a região que o chapéu esconde. Duas coisas
 * ele não consegue fazer sozinho no navegador:
 *
 *  1. **traçar** a região pintada — quem transforma máscara em `d` é o `potrace`,
 *     que é dependência de Node e mora na esteira. Reescrever um traçador em JS de
 *     navegador seria a segunda descrição de *"como uma máscara vira caminho"*, e é
 *     exatamente o tipo de divergência que este repositório persegue;
 *  2. **gravar** o PNG da correção ao lado da arte.
 *
 * ⚠️ **`NODE_ENV !== "development"` devolve 404 em todos os verbos**, antes de ler o
 * corpo. Não é "a rota não faz nada em produção": é a rota **não existir** lá. Um
 * endpoint que escreve arquivo no repositório não tem por que ser alcançável de
 * fora, e 404 não conta nem que ele exista.
 *
 * O caminho de escrita também é fechado: o `slug` é validado contra o catálogo de
 * chapéus em memória, então não há nome de arquivo vindo do cliente — nem para
 * subir de diretório, nem para inventar peça.
 */

import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { dirname } from "path";

import { NextResponse } from "next/server";

import {
  caminhoDaCorrecao,
  linhaDeOclusao,
  medirOclusao,
} from "../../../../../scripts/avatar/arte/oclusao-do-chapeu";
import { CHAPEUS_DA_ARTE } from "@/lib/avatar/estilo/chapeus-da-arte";

/** O `potrace` e o `sharp` são de Node — esta rota nunca roda em edge. */
export const runtime = "nodejs";
/** Ela lê e escreve arquivo do repositório: nada aqui pode ser pré-renderizado. */
export const dynamic = "force-dynamic";

const soEmDev = () => process.env.NODE_ENV !== "development";

/** O `slug` só existe se o catálogo o conhece — não há nome de arquivo do cliente. */
function pecaDo(slug: string | null) {
  if (!slug || !Object.prototype.hasOwnProperty.call(CHAPEUS_DA_ARTE, slug)) return null;
  return CHAPEUS_DA_ARTE[slug];
}

const svgDaPeca = (arte: string) => readFileSync(`public${arte}`, "utf-8");

/** `data:image/png;base64,...` -> Buffer, recusando qualquer outra coisa. */
function pngDoDataUri(uri: unknown): Buffer | null {
  if (typeof uri !== "string") return null;
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(uri);
  return m ? Buffer.from(m[1], "base64") : null;
}

/** GET — a correção que já existe no disco, se existe, e as medidas da peça. */
export async function GET(req: Request) {
  if (soEmDev()) return new NextResponse(null, { status: 404 });
  const slug = new URL(req.url).searchParams.get("slug");
  const peca = pecaDo(slug);
  if (!peca) return NextResponse.json({ erro: "slug fora do catálogo" }, { status: 400 });

  const arq = caminhoDaCorrecao(slug!);
  const tem = existsSync(arq);
  const o = await medirOclusao(svgDaPeca(peca.arte!), tem ? readFileSync(arq) : undefined);
  return NextResponse.json({
    correcao: tem ? `data:image/png;base64,${readFileSync(arq).toString("base64")}` : null,
    largura: o.w,
    altura: o.h,
    d: await linhaDeOclusao(o),
    mao: o.correcao,
  });
}

/**
 * POST — traça a região com a pincelada aplicada, e grava só se `salvar` vier.
 *
 * **A prévia passa pelo MESMO traçado que a esteira**, e é isso que a torna honesta:
 * o `d` que volta daqui é caractere a caractere o que `npm run arte:chapeus`
 * escreveria. Uma prévia aproximada faria o Doug julgar uma coisa e o produto
 * desenhar outra — o defeito nº 1 desta rota de arte.
 */
export async function POST(req: Request) {
  if (soEmDev()) return new NextResponse(null, { status: 404 });
  const corpo = (await req.json()) as { slug?: string; correcao?: unknown; salvar?: boolean };
  const peca = pecaDo(corpo.slug ?? null);
  if (!peca) return NextResponse.json({ erro: "slug fora do catálogo" }, { status: 400 });

  // `correcao: null` é legítimo e quer dizer "sem mão nenhuma" — é como o editor
  // pede a proposta limpa da máquina, e como ele apaga o que pintou.
  const png = corpo.correcao === null ? null : pngDoDataUri(corpo.correcao);
  if (corpo.correcao !== null && !png) {
    return NextResponse.json({ erro: "`correcao` precisa ser um data URI de PNG" }, { status: 400 });
  }

  const o = await medirOclusao(svgDaPeca(peca.arte!), png ?? undefined);
  const d = await linhaDeOclusao(o);

  if (corpo.salvar) {
    const arq = caminhoDaCorrecao(corpo.slug!);
    if (png) {
      mkdirSync(dirname(arq), { recursive: true });
      writeFileSync(arq, png);
    } else if (existsSync(arq)) {
      // Salvar sem pincelada APAGA a correção. É o botão "voltar para a máquina",
      // e ele tem de deixar o disco no estado em que estava antes de existir mão.
      unlinkSync(arq);
    }
  }

  return NextResponse.json({ d, mao: o.correcao, salvo: Boolean(corpo.salvar) });
}
