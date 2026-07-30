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

Regras:

- Não me diga que funcionou sem o passo 4 executado. Relatório não é verificação.
- Se o gate passar antes do fix, você diagnosticou errado — volte ao passo 2.
- Se o fix implicar alterar uma migration já aplicada, pare e me diga: a saída é
  uma migration nova.
- Ao terminar, diga em uma linha o que era a causa e onde o gate mora.
