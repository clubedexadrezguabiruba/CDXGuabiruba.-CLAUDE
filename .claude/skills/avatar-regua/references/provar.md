# Como um número passa de "eu medi" para "está provado"

Três mecanismos. Nenhum é opcional, e os três já pegaram defeito real neste projeto.

---

## 1. Conferência cruzada — duas réguas independentes

Meça a mesma grandeza em **duas fontes diferentes, por caminhos diferentes**, e
imprima a discordância.

Resultado que autorizou o pipeline inteiro:

| grandeza | line-art | PNG | discordância |
|---|---|---|---|
| meia-largura da cabeça | 182,0 | 182,4 | **0,4** |
| meia-largura do tronco | 137,4 | 137,3 | **0,1** |
| espessura do traço | 11,9 | 11,2 | 0,7 |

**Duas medições independentes que concordam em décimo de unidade não estão as duas
erradas do mesmo jeito.** É o único argumento que existe para tratar um trace — que é
um redesenho — como fonte de geometria.

Se a conferência abrir, o trace não serve. Descobrir isso custa uma rodada; descobrir
depois que a tabela dele virou a silhueta de 14 trajes custa o bloco inteiro.

---

## 2. Inverter o dado até o teste ficar vermelho

Um teste verde não prova nada sozinho. Quebre o dado de propósito e confira que ele
reprova — e **mostre as duas saídas**.

Foi assim que as amarras do cabelo foram validadas:

| inversão | antes | depois | piso |
|---|---|---|---|
| franja 40 u mais baixa | folga 26,7 | **−13,3** | 24 |
| coque subido 40 u | ancoragem 15,3 | **0,0** | 10 |
| ponta da franja em `t` 0,1 | fora da silhueta | **dentro** | — |

E o `avatar:variantes`, quando foi escrito, foi provado assim nos quatro caminhos:
duas variantes sem motivo → 1; dois eixos iguais → 1; folga estourada → 1; duas
variantes com 0,22% de diferença a 56 px → 1.

**Se você não conseguiu fazer o gate ficar vermelho, você não sabe o que ele mede.**

---

## 3. As fixtures que TÊM de reprovar

O `avatar:pose` carrega quatro fixtures, e cada uma reprova num marco diferente:

- cabeça 10% estreita → o **perfil externo** pega, os marcos não;
- silhueta certa com pose errada → os **marcos** pegam (4 deles), e o perfil externo
  **passa, como tem de passar**;
- rosto chapado sem faceta esquerda → **5 marcos de volume**, e o perfil passa;
- dois `ns` iguais com clips diferentes → **unicidade de id**.

Elas reusam `pathCabeca()` e `pathTronco()` de propósito: assim têm a silhueta exata
e só o defeito que se quer isolar, provando **qual gate enxerga o quê**. Um gate que
reprova as quatro fixtures não está mais rigoroso — está medindo grosso.

Uma fixture perdeu objeto quando as orelhas saíram da arte, e foi **removida** em vez
de substituída: *"substituí-la por outra sem um defeito real por trás seria teatro"*.
Esse gate já teve uma fixture assim.

---

## As três formas de gate vazio, todas pagas neste projeto

**1. Verde por vacuidade.** O `avatar:garment` deriva as máscaras do macacão da base
antiga e mede tornozelo, bota, gola e mãos. O kokeshi não tem nenhum dos quatro:
rodá-lo mede contra o nada e **fica verde**. Antes de confiar num gate herdado,
pergunte *o que exatamente ele conta, e esse objeto ainda existe?*

**2. Vermelho ignorado.** O `verify:avatar-assets` ficou vermelho **por meses** sem
ninguém saber. Teto que não reprova não é teto; e alarme que ninguém lê é o mesmo que
alarme que não toca.

**3. Régua que reprova o que não é defeito.** A primeira versão do `avatar:curvatura`
reprovava os cinco cabelos por causa do canto do retângulo de fechamento — que o
`clipPath` come — e o tronco por causa do ombro, que a cabeça cobre. Uma régua que
reprova a base aprovada ensina a ignorar o vermelho tão rápido quanto o caso 2. A
correção foi cada alvo declarar **o que dele aparece**, e a estatística sair só dali.

---

## Duas famílias de defeito silencioso que este projeto conhece

**O docstring que descreve intenção como se fosse código.** O `palette.ts` afirmou
durante um bloco inteiro que `--av-cabelo` era lido "também pela sobrancelha". A arte
nunca fez isso. Ninguém notou porque não havia cabelo para contradizer — a divergência
só apareceria quando os 8 tons entrassem, e aí seriam 5 modelos para refazer. É a
mesma família do `UPDATE` sem `UPSERT` e da curva de XP revertida.

**O contrato que só confere um lado.** O `conferirSvg` reprova custom property **a
mais**, nunca **a menos**. Foi assim que `--av-cabelo` ficou congelada em
`PROPRIEDADES` desde o Bloco 1 e **nunca foi emitida** — dois blocos de código
concordando sobre um nome que um deles não escrevia. Quando escrever contrato,
pergunte de qual lado ele é cego.

---

## O ratchet: teto de regressão

Nem todo teto tem folga. O da base careca é **exato**, comparado com `!==` e não `>`:
19 formas e 7 418 bytes. Ela não pode crescer *nem encolher* sem alguém mudar o
número de propósito, e a mudança aparece no diff.

Isso existe porque a folga vira orçamento na cabeça de quem lê. Os 262 bytes que
sobravam do teto antigo nunca foram orçamento de nada — eram o resto de uma conta —
e mesmo assim viraram argumento em duas discussões.
