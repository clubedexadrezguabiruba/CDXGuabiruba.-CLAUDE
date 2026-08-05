import { updateSession } from "@/lib/supabase/proxy";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// `chess/` esta fora do matcher junto com os estaticos, e nao por descuido: e
// o livro de aberturas em `public/chess/`, dado CC0 do lichess-org, sem nada de
// usuario dentro. A lista de extensoes abaixo isenta imagem mas nao `.json`, e
// sem esta entrada o livro era servido ATRAVES do proxy de auth. Isso custava
// uma ida ao Supabase por download e, pior, tinha um modo de falha silencioso:
// cookie expirando na hora da pre-carga -> 307 para /login -> o fetch SEGUE o
// redirecionamento -> `resp.json()` recebe HTML e estoura -> o carregador
// devolve `null` -> a analise sai sem ajuste de abertura sem avisar ninguem.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|chess/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|ogg|ico)$).*)",
  ],
};
