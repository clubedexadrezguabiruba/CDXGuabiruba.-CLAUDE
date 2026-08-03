---
description: Investiga um bug seguindo a Regra de Evidência do projeto
---

Bug: $ARGUMENTS

Siga exatamente esta ordem, sem pular etapa:

1. **Reproduzir** — os passos concretos, executados de verdade. Se não conseguiu
   reproduzir, diga isso e pare aqui. Não siga em cima de suposição.
2. **Uma causa provável** — com arquivo+linha e/ou a query SQL. Uma só, a mais
   provável. Não liste hipóteses alternativas.
3. **Fix mínimo** — nada além do necessário para essa causa. Sem refactor de
   carona, sem melhoria adjacente, sem renomear nada de passagem.
4. **Gate** — um teste ou script de verificação que **falha antes** do fix e
   **passa depois**. Rode nos dois estados e me mostre as duas saídas reais.
5. **O que esta régua é incapaz de enxergar?** Antes de declarar verde, diga em
   uma linha o que o gate **não** mede. Confira também o que ele mede contra o
   que o docstring dele diz — os dois já divergiram aqui. Se o gate puder passar
   com o defeito presente, ele ainda não é um gate.

Regras:

- Não me diga que funcionou sem o passo 4 executado. Relatório não é verificação.
- Se o gate passar antes do fix, você diagnosticou errado — volte ao passo 2.
- **Verde por vacuidade conta como reprovação.** Gate que roda contra o alvo
  errado passa sem medir nada. Já aconteceu cinco vezes aqui: `conferirSvg`
  aprovando auto-trace, `--av-cabelo` congelado e nunca emitido (ele reprova
  propriedade a mais, nunca a menos), `avatar:garment` medindo máscaras do
  boneco antigo, o teto de bytes medindo a base enquanto o texto falava do
  composto, e a curva de XP rodando errada 4 meses porque a UI concordava com
  o bug. Ausência é o ponto cego mais comum: teste que só confere o que existe
  nunca vê o que sumiu.
- Se o fix implicar alterar uma migration já aplicada, pare e me diga: a saída é
  uma migration nova.
- Ao terminar, diga em uma linha o que era a causa e onde o gate mora.
