# Stockfish WASM — Assets

> Este doc já foi uma lista de pendências ("baixar os binários"). Não é mais: os
> assets existem e são gerados automaticamente. Fica como registro de **como**
> funciona e do que **não** fazer.

## Estado atual

`public/stockfish/` é populado pelo `postinstall`, não versionado:

```
public/stockfish/
├── stockfish.js      20 KB    loader/wrapper UCI
└── stockfish.wasm    7,3 MB   engine compilada
```

Está em `.gitignore` de propósito — 7,3 MB de binário que o `npm install`
reproduz.

## De onde vêm

Do pacote npm **`stockfish@18.0.5`** (dependência direta), variante
**lite-single**. O script `scripts/setup-stockfish.ts` roda no `postinstall` e
apenas **copia** de `node_modules/stockfish/bin`, renomeando:

| origem | destino |
|---|---|
| `stockfish-18-lite-single.js` | `public/stockfish/stockfish.js` |
| `stockfish-18-lite-single.wasm` | `public/stockfish/stockfish.wasm` |

Nada é baixado da rede — por isso o passo é barato e não é ponto de flakiness em
CI. Para regenerar à mão: `npm run setup:stockfish`.

## Como é carregado

`src/lib/chess/StockfishEngine.ts:17` faz `new Worker("/stockfish/stockfish.js")`
e conversa por UCI via `postMessage`, com interface baseada em Promise. Roda
**inteiramente no browser** — nunca no servidor. A força por bot é configurada por
comandos UCI (profundidade/skill), não por binários diferentes.

## O que não fazer

- **Não adicionar config de webpack/WASM no `next.config.mjs`.** Arquivos em
  `/public` são servidos estaticamente; não passam pelo bundler.
- **Não versionar os binários.** O `postinstall` os produz.
- **Não trocar a variante sem medir.** `lite-single` é single-threaded de
  propósito: as variantes multi-thread exigem `SharedArrayBuffer`, que por sua vez
  exige headers COOP/COEP em toda a aplicação.
