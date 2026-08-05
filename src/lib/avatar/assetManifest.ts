/**
 * ARQUIVO GERADO — NÃO EDITAR À MÃO.
 *
 * Gerado por `npm run avatar:manifest` a partir de `public/items/`.
 * O `prebuild` roda `--check` e quebra o build se este arquivo divergir
 * do disco, para que nenhum asset entre ou saia sem o manifesto saber.
 *
 * Por que o manifesto existe: ver o cabeçalho de scripts/avatar/gen-manifest.ts.
 */

/** Todo asset presente em public/items/, como caminho web. */
export const AVATAR_ASSETS: readonly string[] = [
  "/items/base/avatar-base-female.png",
  "/items/base/avatar-base-male.png",
  "/items/base/avatar-base-neutro.svg",
  "/items/base/avatar-base-sem-traje.svg",
  "/items/bg/biblioteca.png",
  "/items/bg/castelo.png",
  "/items/bg/ceu-estrelado.png",
  "/items/bg/dimensao-xadrez.png",
  "/items/bg/parque.png",
  "/items/bg/sala-aula.png",
  "/items/bg/tabuleiro-gigante.png",
  "/items/bg/torneio.png",
  "/items/frame/ancestral.png",
  "/items/frame/bronze.png",
  "/items/frame/cinza.png",
  "/items/frame/cristal.png",
  "/items/frame/diamante.png",
  "/items/frame/madeira.png",
  "/items/frame/ouro.png",
  "/items/frame/prata.png",
  "/items/head/bandana-tatica-swap-female.png",
  "/items/head/bandana-tatica-swap-male.png",
  "/items/head/bandana-tatica.png",
  "/items/head/bone-peao.png",
  "/items/head/capuz-arquimago.png",
  "/items/head/coroa-rei-dourado.png",
  "/items/head/coroa-sombria.png",
  "/items/head/elmo-cavaleiro.png",
  "/items/head/oculos-estrategista.png",
  "/items/head/tiara-rainha.png",
  "/items/outfit/armadura-gm.png",
  "/items/outfit/armadura-leve.png",
  "/items/outfit/armadura-real.png",
  "/items/outfit/camiseta-clube-male-master.png",
  "/items/outfit/camiseta-clube-male.png",
  "/items/outfit/camiseta-clube.png",
  "/items/outfit/manto-lendario.png",
  "/items/outfit/tunica-azul.png",
  "/items/outfit/uniforme-aprendiz.png",
  "/items/outfit/veste-mago.png",
  "/items/pet/cavalo-bronze.png",
  "/items/pet/coruja-sabia.png",
  "/items/pet/dragao-cristal.png",
  "/items/pet/fenix-dourada.png",
  "/items/pet/grifo-ancestral.png",
  "/items/pet/peaozinho-madeira-animated.png",
  "/items/pet/peaozinho-madeira.png",
  "/items/pet/rei-espectral.png",
];

const CONJUNTO: ReadonlySet<string> = new Set(AVATAR_ASSETS);

/** true se o arquivo existe em public/items/. Consulta O(1), sem I/O. */
export function assetExiste(caminho: string | null | undefined): boolean {
  if (!caminho) return false;
  return CONJUNTO.has(caminho);
}
