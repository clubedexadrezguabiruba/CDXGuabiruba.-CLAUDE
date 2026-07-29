/**
 * Faxina dos SVG de saída (item 1.4 do plano).
 *
 * O que o SVGO faz por nós: corta casas decimais, remove metadado de editor,
 * junta paths e minifica o `<style>`. Num catálogo de 39 desenhos isso é a
 * diferença entre `public/items/` caber abaixo de 1 MB ou não.
 *
 * O QUE ELE NÃO PODE FAZER, e por isso a configuração não é a padrão:
 *
 *  - `inlineStyles` moveria as regras do `<style>` para atributos `fill=` nos
 *    elementos. Isso mataria o recolorir inteiro: a cor deixaria de vir de
 *    `var(--av-pele)` e passaria a estar pintada no desenho, que é exatamente
 *    o que o v4 existe para desfazer.
 *  - `removeViewBox` quebraria o escalonamento para os 4 tamanhos.
 *  - `cleanupIds` renomeia ids; a partir do Bloco 5 a composição concatena
 *    camadas num `<svg>` só, e id renomeado quebra referência entre elas.
 *  - `minifyStyles` mexeria nos nomes de classe, que são o contrato com a
 *    folha de estilo global.
 *
 * Uso: `otimizar(svg)` antes de gravar qualquer asset.
 */

import { optimize, type Config } from "svgo";

export const CONFIG: Config = {
  multipass: true,
  js2svg: { indent: 0, pretty: false },
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          // MEDIDO: com o default ligado, o SVGO apagou `.c-roupa`,
          // `.c-cabelo`, `.c-calca` e `.c-sapato` do <style> e escreveu
          // `style="fill:var(--av-sapato)"` no elemento. Funciona hoje e
          // inviabiliza o 5.7 amanhã, quando as regras sobem para a folha
          // global e o SVG passa a carregar só as variáveis.
          inlineStyles: false,
          // `removeViewBox` NÃO entra aqui: a partir do SVGO 4 ele saiu do
          // preset-default, e listá-lo faz a ferramenta avisar e ignorar.
          // O viewBox já é preservado, que é o que o escalonamento dos 4
          // tamanhos exige.
          cleanupIds: false,
          minifyStyles: false,
          // Sem isto o preset remove atributos que "parecem" default e leva
          // junto coisas de que o CSS global depende.
          //
          // `defaultAttrs: false` porque a sombra da roupa é `fill="#000000"`, e
          // preto é o VALOR INICIAL de `fill` — o plugin apagava o atributo. O
          // desenho continuava preto por herança do valor inicial, e é aí que
          // mora o risco: a partir do Bloco 5 as camadas são concatenadas num
          // `<svg>` só, e um `fill` em qualquer `<g>` ancestral repintaria a
          // sombra sem avisar. É a mesma classe de falha que o `conferirSvg`
          // existe para pegar. MEDIDO: manter o atributo custa 0 KB.
          removeUnknownsAndDefaults: { keepAriaAttrs: true, keepRoleAttr: true, defaultAttrs: false },
          // MEDIDO na arte recolorível: o sombreado é um `<g opacity>` por
          // nível, com várias sub-formas irmãs de atributos idênticos. O
          // `mergePaths` funde exatamente isso num `<path>` só — e aí
          // sub-formas de winding oposto se CANCELAM no fill-rule, trocando a
          // sombra por anéis de contorno no rosto. O ganho de bytes não paga.
          mergePaths: false,
        },
      },
    },
    // Comentário dentro do <style> é o defeito que custou tempo real: um
    // `/* ... <path> ... */` fez o navegador descartar em silêncio TODAS as
    // regras seguintes. Este plugin tira comentário do documento; o de dentro
    // do <style> quem pega é `conferirSvg`, porque lá o certo é falhar alto,
    // não limpar calado.
    "removeComments",
  ],
};

export function otimizar(svg: string): string {
  return optimize(svg, CONFIG).data;
}
