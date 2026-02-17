# Stockfish WASM — Status dos Assets

## Estado atual
- `public/stockfish/` existe mas está **vazio** (0 arquivos).
- Nenhum arquivo .wasm, .js ou .worker presente.
- next.config.mjs **não precisa** de config de webpack para WASM em /public (assets estáticos servidos diretamente).

## O que é necessário
Baixar os binários do Stockfish WASM e colocar em `public/stockfish/`:

```
public/stockfish/
├── stockfish.js          # Loader/wrapper
├── stockfish.wasm        # Engine compilado
└── stockfish.worker.js   # Web Worker (se aplicável)
```

Fonte recomendada: https://github.com/nicfv/Stockfish (build WASM do Stockfish oficial)
ou https://github.com/nicfv/stockfish.wasm

## Como será carregado
- Via `new Worker('/stockfish/stockfish.worker.js')` ou `fetch('/stockfish/stockfish.wasm')`
- Roda inteiramente no browser (nunca no servidor)
- Deve respeitar profundidade/skill por bot (configurado via UCI commands)

## Quando implementar
- Fase 6 do Roadmap (Bots) — não bloqueia Fase 4 (Puzzles)
- Não alterar next.config.mjs até ter os assets e testar loading real
