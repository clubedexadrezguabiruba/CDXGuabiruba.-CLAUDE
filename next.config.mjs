/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * `sharp` e `potrace` NÃO se empacotam — são resolvidos em tempo de execução.
   *
   * Os dois entram no servidor pela rota `/api/dev/oclusao`, que reusa a esteira de
   * arte em vez de reimplementar o traçado no navegador. Empacotados pelo Turbopack
   * eles quebram com **`TypeError: Right-hand side of 'instanceof' is not callable`**
   * — o `sharp` é módulo NATIVO e o `potrace` é CJS, e os dois fazem
   * `x instanceof Buffer` internamente; depois do empacotamento o lado direito vira
   * objeto de namespace, que não é chamável.
   *
   * ⚠️ **O `next build` compila sem reclamar.** O defeito é de EXECUÇÃO: a rota
   * respondia 500 em toda chamada, e como o cliente ignorava o GET em silêncio a
   * tela abria com a linha ausente — o chapéu parecia funcionar e o cabelo escapava.
   * Pego em 2026-08-25, no log do `next dev`, não no build.
   */
  serverExternalPackages: ["sharp", "potrace"],
};

export default nextConfig;
