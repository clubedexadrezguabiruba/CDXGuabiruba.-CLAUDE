# Blocos prontos para colar

> Este arquivo é para **abrir, copiar e fechar** — não para ler. O porquê de cada
> coisa está em [claude-code-guia.md](claude-code-guia.md).
>
> Cada bloco tem uma linha de *quando usar* e o texto colável logo abaixo. Onde
> aparecer `<assim>`, troque pelo seu caso.

---

## Antes: o que já é automático

Desde que existe o `~/.claude/CLAUDE.md`, eu faço estas coisas sozinho em toda
sessão nova. **Não cole nada disso** — já acontece:

- Sugerir modo, contexto e esforço ao abrir tarefa nova e substancial
- Nunca reabrir imagem já descrita; pedir folha de contato em vez de imagens soltas
- Propor pontos de parada antes de execução longa
- Devolver uma pergunta quando um "sim" seu merecer mais que um "sim"
- Declarar pendência e risco sem você perguntar

O que sobrou aqui são as alavancas que continuam **suas**: os comandos de barra,
que só você pode digitar, e as exigências que dependem do caso.

---

## 1. Ponto de retorno

**Quando:** antes de qualquer plano grande, e sempre que houver muita coisa mexida
sem commit. Foi este bloco que gerou o commit `1403143`.

```
Antes do plano: quero um ponto de retorno.

1. Roda typecheck, lint, test e build — nessa ordem, para no primeiro que falhar.
2. Me diz o resultado de cada um.
3. Depois disso, commita como checkpoint, mesmo que algo esteja vermelho — se
   estiver, usa prefixo "wip:" e diz na mensagem o que ficou quebrado.
4. Me diz o que ficou de fora do commit e por quê.
```

---

## 2. Plan mode com exigências

**Quando:** ao abrir um bloco de trabalho grande. Plan mode sozinho te dá um
documento; as exigências é que decidem se ele presta.

```
Entra em plan mode e escreve o plano de <o que falta>.

Três exigências:

1. O GATE VEM PRIMEIRO, não por último. O plano começa por provar que a
   verificação REPROVA o estado anterior — commit <hash> ou a condição antiga.
   Se ela não reprovar, a verificação não vale nada e o resto do plano muda.

2. OS RISCOS QUE VOCÊ DECLAROU entram no plano com resposta, não como aviso.

3. BLOCOS COM PARADA. Divide em blocos e para ao fim de cada um com o número
   medido. Não quero uma execução longa inteira para eu aprovar no fim.
```

> A exigência 1 é a que mais paga. Verificação feita no fim vira carimbo: você já
> está convencido. Feita no começo, tem chance real de derrubar a premissa. É a
> Regra de Evidência do `CLAUDE.md` — o gate **falha antes** e passa depois.

---

## 3. As três perguntas antes de aprovar um plano

**Quando:** o plano apareceu e você sentiu vontade de escrever "sim". Dois minutos.

```
Antes de eu aprovar, responde três coisas:

1. O que neste plano toca em arquivo que já estava funcionando?
2. Se este plano estiver errado, como eu descubro — e em qual passo?
3. O que você vai medir para dizer que terminou?
```

Se a resposta da 2 for "no fim, olhando o resultado", o plano está fraco: devia
ter uma medição que quebra cedo.

---

## 4. `/compact` dirigido

**Quando:** o assunto continua, mas a conversa ficou longa. Comando de barra —
digite direto, eu não vejo.

Rodada de arte:

```
/compact guarde as decisões de cor e composição, os números medidos e os gates
que falharam. descarte as imagens já analisadas e as saídas que já passaram.
```

Depuração:

```
/compact guarde a causa medida, o arquivo e a linha, e o que já foi descartado
como hipótese. descarte os dumps de busca e os testes que passaram.
```

Geral:

```
/compact guarde as decisões tomadas e o que ficou pendente. descarte leitura de
arquivo e saída de comando que não sustentam nenhuma decisão.
```

---

## 5. Reabrir limpo

**Quando:** o estado importante já está em disco — um plano em arquivo, um commit
com mensagem boa. **Só então.** Mesa cheia é o que mais degrada sessão longa, mas
limpar antes de o estado estar salvo é perder trabalho.

```
/clear
```

E abra a sessão nova com:

```
Lê o plano em <caminho> e o commit <hash> (git show --stat e a mensagem inteira).
Esses dois têm todo o estado. Executa o primeiro bloco e para.
```

---

## 6. Rodada de nova patente

**Quando:** for gerar mais um uniforme. Faltam 5.

```
Vamos fazer o uniforme de <patente>.

1. Lê docs/avatar/16-uniformes-runbook.md antes de qualquer coisa — o processo de
   ponta a ponta, a tabela de matiz e as três camadas do asset.
2. Confere contra as §7, §7b e §7c de docs/avatar/15-plano-ate-pronto.md. Em
   conflito com outros docs, o 15 vence.
3. Roda npm run avatar:garment e npm run avatar:proveniencia. Para cada gate que
   reprovar, diz o que a reprovação significa segundo o runbook — não contorna
   o gate.
4. Uma folha de contato só, com a peça nos quatro fundos e os closes dos vãos.
5. No fim, marca a tarefa em docs/avatar/14-backlog-execucao.md.
```

---

## Em vez de dizer X, diga Y

| Em vez de | Diga |
|---|---|
| "tente de novo" | "ainda tem `<o quê>` em `<onde>`" |
| "não ficou bom" | "o problema é `<isto>`; `<aquilo>` está certo" |
| "verifique" | "roda typecheck, lint, test e build e me diz o que falhou" |
| "prossiga" (sem ter lido) | as três perguntas do bloco 3 |
| colar saída de terminal | "roda `<comando>` e me diz o que falhou" |
| "onde está `<coisa>`?" | "usa um subagente pra achar `<coisa>` e me traz só a conclusão" |

A primeira linha é a que mais aparece nas suas sessões. "Tente de novo" sem
informação nova me faz repetir o mesmo erro com outra roupagem — eu sei que você
não gostou, mas não sei do quê.
