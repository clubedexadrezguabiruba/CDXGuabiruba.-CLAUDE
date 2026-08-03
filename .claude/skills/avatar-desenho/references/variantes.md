# O harness das variantes

## O rascunho

`.scratch/variantes.ts` — efêmero, fora do git, e é assim de propósito: variante não
vira catálogo sozinha.

```ts
import type { Variante } from "../scripts/avatar/estilo/variantes";
import type { Cabelo } from "../src/lib/avatar/estilo/cabelo";

const domada: Cabelo = { id: "curto", nome: "Domada", pontos: [ /* … */ ] };
const selvagem: Cabelo = { /* … */ };
const presa: Cabelo = { /* … */ };

export const VARIANTES: Variante[] = [
  { nome: "Domada",   eixo: "franja reta, volume nenhum",              cabelo: domada },
  { nome: "Selvagem", eixo: "recorte em festões, volume acima do crânio", cabelo: selvagem },
  { nome: "Presa",    eixo: "testa à mostra, massa atrás da cabeça",   cabelo: presa },
];
```

Para traje, troque `cabelo:` por `traje:`. Outro caminho de rascunho entra por
`VARIANTES=.scratch/outro.ts npx tsx scripts/avatar/estilo/variantes.ts`.

**Duas variantes** exigem o motivo escrito, e ele diz qual terceira foi descartada:

```ts
export const MOTIVO_DE_DUAS =
  "Um par de óculos tem uma forma e dois tamanhos. A terceira direção seria armação " +
  "redonda, e ela colide com o contorno circular dos olhos a 56 px.";
```

## Rodar

```
npm run avatar:variantes
```

Produz `.scratch/estilo/folha-variantes.png` e publica `public/dev/variantes.json`,
que a rota `/dev/avatar-variantes` lê.

**A rota não compõe nada** — ela mostra o SVG que o script já compôs. Se compusesse,
existiriam duas composições, uma medida pelo gate e outra mostrada ao Doug, livres
para divergir.

## As quatro reprovações

Todas saem com código 1, e as quatro foram provadas invertendo o dado:

| o que | reprova quando |
|---|---|
| **contagem** | menos de 3 variantes sem `MOTIVO_DE_DUAS` |
| **eixo repetido** | duas variantes com a mesma frase de eixo |
| **amarra** | folga, ancoragem, ponta, orçamento ou contrato estourados |
| **divergência falsa** | duas variantes com **< 5%** de pixels diferentes a 56 px |

A quarta é a que vale. **O eixo é prosa, e prosa se escreve bonito.** Duas variantes
que diferem em 0,22% dos pixels *são* a mesma direção, não importa o que as duas
frases prometeram — e foi exatamente esse o caso de teste que provou o gate: mover um
ponto em 2 unidades e chamar de "franja ainda mais reta e assentada".

## O selo

Seis caracteres desenhados no canto superior direito da folha, **nunca impressos no
terminal**. O relatório da Fase 4 começa citando o selo.

**O que ele prova, honestamente:** que a imagem foi **aberta**. Não prova que foi bem
julgada, e fingir o contrário seria o mesmo autoengano que ele combate. O que
justifica o mecanismo é que o custo de abrir a imagem é praticamente o custo de olhar
para ela — e o defeito do Bloco 2a.1 não foi julgar mal, foi que os três defeitos
**só aparecem renderizando**.

## O que a folha mostra, e em que ordem

Uma coluna por variante. De cima para baixo: nome, eixo, e os quatro tamanhos —
**56 px primeiro**, porque é o do ranking e é o que manda. Formas e bytes no rodapé.

A ordem não é decorativa: quem lê de cima para baixo lê a miniatura antes de se
apaixonar pelo desenho grande.

## O seletor

`/dev/avatar-variantes`, com `npm run dev` rodando.

Uma variante por vez, tamanho por controle deslizante de 56 a 560, quatro fundos
(claro, magenta, preto, branco), troca instantânea entre candidatas.

**Uma por vez, e não as três lado a lado, de propósito.** A folha já mostra as três
juntas — é lá que se compara. O que ela não mostra é como **uma** delas se sustenta
sozinha ocupando a tela, que é como o aluno vai ver o próprio boneco. Peça que só se
defende ao lado das concorrentes não é escolha: é a menos ruim de três.

E alternar **no mesmo pixel** revela diferença que lado a lado esconde.

## Promover a vencedora

1. mova a peça escolhida para o catálogo (`cabelo.ts` e o `ModeloCabelo`, ou o
   arquivo de trajes);
2. acrescente o teste correspondente em `__tests__/`;
3. rode `npm run avatar:folha-base` e confira o orçamento e a distinção contra as
   irmãs **já no catálogo** — a distinção do `avatar:variantes` era entre candidatas,
   não contra o elenco;
4. **apague `.scratch/variantes.ts`.** Rascunho que sobrevive vira fonte de verdade
   paralela;
5. se um defeito foi nomeado e corrigido, leve a correção generalizável para
   `references/leitura.md`. Sem isso a próxima peça repete o mesmo erro.
