# Pedido de arte — ÓCULOS (a armação, sem lente)

**A divisão de trabalho, e ela é técnica, não gosto.** A armação vem do Gemini; a
**lente translúcida vem do código**, depois. Não é preferência: a esteira apaga todo
pixel de peça que cair dentro da cápsula do olho (`barba-para-formas.ts:532`,
`naCapsulaDoOlho`), e se o desenho encostar nela o gate 2b reprova com *aresta nua*.
Uma armação com lente pintada chega ao boneco mutilada. Sem lente, ela passa inteira —
e a lente entra no compositor, que desenha fora da esteira e por isso pode ser
translúcida de verdade, reagindo à pele que o aluno escolheu.

**A base que sobe para o Gemini:** `scripts/avatar/arte/base-oficial.png`.
Nunca `base-barba-campo.png` — ele é diagnóstico, e as marcas dele seriam copiadas.

---

## O bloco colável

> Desenhe uma **armação de óculos** sobre este boneco, sem mudar o boneco em pixel
> nenhum.
>
> **Sem lente.** Os dois olhos ficam **totalmente à mostra**, sobre a pele, sem nada
> por cima — nem véu, nem brilho, nem reflexo. Só a armação.
>
> **O aro nunca encosta no olho.** Deixe uma faixa de pele visível entre o aro e cada
> olho, em volta inteira. Aro colado no olho é reprovação.
>
> **Todas as linhas da armação em azul escuro `#0000C8`** — contorno e detalhe. O preto
> fica só para o boneco que já estava lá.
>
> **O estilo.** Kokeshi: formas fechadas, contorno contínuo, mesma espessura do
> contorno do boneco. Sem sombra projetada, sem gradiente, sem fundo. A peça tem
> variação de luz por dentro — a luz acompanha a forma, não são tons chapados.
>
> **O espaço.** A barra de cima pode encostar na sobrancelha. O aro de baixo tem de
> parar **bem acima da boca** — a boca fica livre, sem tolerância. Nas laterais a
> armação pode passar um pouco da cabeça.
>
> **Não faça:** haste (este boneco não tem orelha), lente, sombra da peça no rosto,
> texto.

---

## Por que cada linha está aí

| linha | a razão, medida |
|---|---|
| sem lente | `naCapsulaDoOlho` apaga; o gate 2b reprova a aresta que o recorte cria |
| aro não encosta no olho | mesmo motivo — encostar é o que cria a aresta nua |
| linhas em azul `#0000C8` | *peça = o que difere da base*, e **preto sobre preto difere ~0**. A armação é escura e vai cruzar o contorno da cabeça; em preto, o cruzamento vira furo. Medido na trancada v10: a figurinha caiu de 5 536 px para 32 com o azul |
| a boca livre | doc 24 §3 — 0 px de tinta na boca, sem tolerância |
| sem haste | decisão do Doug (doc 21 §2c) e o boneco não tem orelha (doc 23 §7.2) |
| pode passar da cabeça | a peça de rosto fica fora de todo clip; a janela de 32 px dá 80 u de folga por lado |

## O envelope, em unidades internas

```
cabeça            x  75,2 → 439,2      y  45,5 → 347,2
olho esquerdo     cx 212,5  cy 233,5   38 × 83, cápsula
olho direito      cx 367,5  cy 230,5   (3 u mais alto — é o giro, de propósito)
topo da sobrancelha  y 162,5
a boca               y 298,8
```

Três faixas, e são o orçamento inteiro do aro:

| faixa | u | a 32 px |
|---|---|---|
| sobrancelha → topo do olho | 26,5 | 1,6 px |
| o olho | 86 | 5,3 px |
| base do olho → boca | 23,8 | 1,5 px |

**A 32 px, 1 px = 16,4 unidades.** O contorno do boneco (12 u) mede 0,73 px ali. Uma
armação de fio fino não existe nesse tamanho — ela precisa de massa, e a massa cabe
em cima (a barra), não embaixo.

## O que falta no código quando a arte chegar

1. **`COR_MIOLO` é fixo em `var(--av-cabelo, #262626)`** (`barba-para-formas.ts:454`).
   A armação não recolore — precisa de cor própria. É um parâmetro, não um refactor.
2. **A peça sai com 2 formas** (contorno + miolo); o óculos precisa de **3** — a lente
   translúcida por cima. Onde ela entra: `rostos.ts:168`.
3. **A cor da lente ainda não está decidida.** Branco a 30% foi medido e falha: o olho
   fica L77 fixo nas 8 peles e na pele 8 fica *mais claro que o rosto*. Um véu que
   **escurece** não tem esse defeito — preto sob preto continua preto. Decide-se
   medindo, com a armação já no lugar.
