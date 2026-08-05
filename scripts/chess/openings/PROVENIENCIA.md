# Proveniência dos TSVs de abertura

De onde vieram estes cinco arquivos, e o que muda se eles mudarem.

## Fonte

| | |
|---|---|
| Repositório | [`lichess-org/chess-openings`](https://github.com/lichess-org/chess-openings) |
| Commit | `4b8622759e7ae6f93f011cc6c83a3823401ab45e` |
| Data do commit | 2026-08-04 |
| Obtido em | 2026-08-04 |
| Licença | **CC0-1.0** (domínio público — sem exigência de atribuição, mas fica registrada) |
| Arquivos | `a.tsv`, `b.tsv`, `c.tsv`, `d.tsv`, `e.tsv` — os 5 volumes do código ECO |
| Tamanho | ~388 KB, 3.810 linhas de dados |

Baixados de `https://raw.githubusercontent.com/lichess-org/chess-openings/master/<volume>.tsv`.

## Formato

TSV com cabeçalho `eco	name	pgn`, fim de linha LF:

```
B90	Sicilian Defense: Najdorf Variation	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6
```

## Por que estão commitados em vez de baixados no build

Baixar em tempo de build tornaria o CI dependente da rede e do upstream: um dia
o livro tem 3.810 linhas, no outro tem 3.812, e a precisão que a criança vê muda
sem ninguém ter tocado no código. Com o dado dentro do repositório, trocar de
versão é um commit com diff — e o `livro-manifesto.json` fixa o SHA-256 de cada
arquivo, então **deriva silenciosa não existe**: ou o hash bate, ou
`npm run verify:aberturas` reprova.

## O que esta base É e o que ela NÃO É

É uma base de **nomenclatura**: ela nomeia o que aparece em partidas reais,
inclusive o que ninguém deveria jogar. Ela contém o Mate do Louco
(`Barnes Opening: Fool's Mate`) e o Bongcloud (`1. e4 e5 2. Ke2`).

Ela **não** é uma lista de lances aprovados. Duas travas cuidam disso, e as duas
vivem fora deste diretório:

1. **O motor.** Lance de livro nunca vence Erro Grave — o Stockfish avalia toda
   posição e é o curador em tempo real.
2. **`scripts/chess/linhas-vetadas.ts`.** As piadas de nível *erro*, que não
   chegam a Erro Grave e passariam pela primeira trava.

## Como atualizar

1. Baixar os 5 TSVs do commit novo para este diretório.
2. Anotar o commit em `FONTE` (`scripts/chess/gerar-livro-aberturas.ts`) e nesta
   tabela.
3. `npm run aberturas:gerar` — ele **falha** se aparecer família de abertura sem
   tradução em `familias-pt.ts`, ou se um nome de `linhas-vetadas.ts` tiver
   sumido do TSV.
4. `npm run verify:aberturas` — e olhar as contagens: elas mudaram porque o
   upstream mudou, e a mudança fica no diff do manifesto.
