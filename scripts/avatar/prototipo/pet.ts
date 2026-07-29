/**
 * T0.13 — Peãozinho de Madeira em SVG animado por CSS, para comparar com o
 * APNG existente.
 *
 * O projeto já anima por CSS: o `character-root` faz o respiro do boneco com
 * transform. O idle de um pet é exatamente essa classe de movimento —
 * flutuar, inclinar, acenar, piscar. O que CSS não faz bem é animação com
 * deformação quadro a quadro.
 *
 * A primeira versão deste arquivo era uma peça de xadrez com dois pontos, e a
 * comparação ficou desonesta: personagem contra objeto, não formato contra
 * formato. Esta versão tem broto, braços e o mesmo tratamento de olho da
 * base, para o teste medir só o que devia medir.
 */

const MADEIRA_CLARA = "#C9954E";
const MADEIRA = "#A9743A";
const MADEIRA_ESCURA = "#8A5A2B";
const FOLHA = "#6E9B45";
const LINHA = "#241610";

export function peaozinho(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" class="pet-peao">
<style>
  .pet-peao .l     { stroke: ${LINHA}; stroke-width: 7; stroke-linejoin: round; }
  .pet-peao .m1    { fill: ${MADEIRA_CLARA}; }
  .pet-peao .m2    { fill: ${MADEIRA}; }
  .pet-peao .m3    { fill: ${MADEIRA_ESCURA}; }
  .pet-peao .folha { fill: ${FOLHA}; }
  /* Braço = duas passadas: contorno grosso escuro por baixo, madeira por
     cima. Um path sozinho nao tem como ter preenchimento E contorno quando a
     forma é uma linha. */
  .pet-peao .braco-l { stroke: ${LINHA};  stroke-width: 26; stroke-linecap: round; fill: none; }
  .pet-peao .braco   { stroke: ${MADEIRA}; stroke-width: 14; stroke-linecap: round; fill: none; }
  .pet-peao .tinta { fill: ${LINHA}; }
  .pet-peao .luz   { fill: #FFFFFF; }

  .pet-peao .flutua  { animation: peao-flutua 3.2s ease-in-out infinite; transform-origin: 100px 178px; }
  .pet-peao .acena   { animation: peao-acena 3.2s ease-in-out infinite;  transform-origin: 142px 120px; }
  .pet-peao .broto   { animation: peao-broto 3.2s ease-in-out infinite;  transform-origin: 104px 44px; }
  /* opacity: 0 no estado base, não só no keyframe. Se a animação não rodar
     (motor pausado, prefers-reduced-motion, screenshot), a pálpebra não pode
     ficar cobrindo o olho. */
  .pet-peao .palpebra{ opacity: 0; animation: peao-pisca 4.6s steps(1, end) infinite; }

  @keyframes peao-flutua {
    0%, 100% { transform: translateY(0)    rotate(-2.4deg); }
    50%      { transform: translateY(-9px) rotate(2.4deg); }
  }
  @keyframes peao-acena {
    0%, 100% { transform: rotate(-14deg); }
    50%      { transform: rotate(16deg); }
  }
  @keyframes peao-broto {
    0%, 100% { transform: rotate(6deg); }
    50%      { transform: rotate(-7deg); }
  }
  @keyframes peao-pisca {
    0%, 93%   { opacity: 0; }
    94%, 97%  { opacity: 1; }
    98%, 100% { opacity: 0; }
  }

  /* Acessibilidade: quem pede menos movimento recebe o pet parado. */
  @media (prefers-reduced-motion: reduce) {
    .pet-peao .flutua, .pet-peao .acena, .pet-peao .broto, .pet-peao .palpebra { animation: none; }
    .pet-peao .palpebra { opacity: 0; }
  }
</style>
<g class="flutua">
  <!-- broto na cabeça -->
  <g class="broto">
    <path class="l" fill="none" d="M 104 62 Q 102 48 106 38"/>
    <path class="folha l" d="M 106 40 Q 124 26 128 42 Q 116 54 106 40 Z"/>
  </g>

  <!-- braços: começam DENTRO do corpo (x 84 e 116, onde o tronco está em
       y=122) para o corpo cobrir a emenda. Começando em 62/138 ficavam
       soltos ao lado, lendo como riscos de movimento. -->
  <path class="braco-l" d="M 84 122 Q 60 132 56 154"/>
  <path class="braco"   d="M 84 122 Q 60 132 56 154"/>
  <g class="acena">
    <path class="braco-l" d="M 116 122 Q 142 118 150 96"/>
    <path class="braco"   d="M 116 122 Q 142 118 150 96"/>
  </g>

  <!-- base e corpo -->
  <ellipse class="m3 l" cx="100" cy="174" rx="50" ry="15"/>
  <path class="m2 l" d="M 64 170 L 72 144 Q 100 136 128 144 L 136 170 Q 100 180 64 170 Z"/>
  <path class="m1 l" d="M 78 142 Q 80 116 92 104 L 108 104 Q 120 116 122 142 Q 100 134 78 142 Z"/>
  <ellipse class="m2 l" cx="100" cy="102" rx="29" ry="9"/>

  <!-- cabeça -->
  <circle class="m1 l" cx="100" cy="74" r="30"/>
  <ellipse fill="#FFFFFF" opacity=".45" cx="87" cy="59" rx="9" ry="5.5"/>
  <ellipse fill="#FFFFFF" cx="89" cy="77" rx="6.6" ry="5.2"/>
  <ellipse fill="#FFFFFF" cx="111" cy="77" rx="6.6" ry="5.2"/>
  <ellipse fill="${LINHA}" cx="89" cy="77" rx="4.8" ry="5.6"/>
  <ellipse fill="${LINHA}" cx="111" cy="77" rx="4.8" ry="5.6"/>
  <path fill="none" stroke="${LINHA}" stroke-width="5" stroke-linecap="round" d="M 94 90 Q 100 95 106 90"/>
  <g class="palpebra" opacity="0">
    <ellipse fill="${MADEIRA_CLARA}" cx="89" cy="77" rx="7.6" ry="6.2"/>
    <ellipse fill="${MADEIRA_CLARA}" cx="111" cy="77" rx="7.6" ry="6.2"/>
  </g>
</g>
</svg>`;
}
