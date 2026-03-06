-- ============================================================
-- FASE 5 — FIX: Corrigir FENs dos exercícios (reis faltando)
-- chess.js exige ambos os reis para calcular lances legais.
-- Text/Demo sections NÃO precisam de reis (Chessground aceita).
-- Apenas exercícios (interativos) precisam de reis válidos.
-- ============================================================

UPDATE public.lessons
SET content_json = '{
  "sections": [
    {
      "type": "text",
      "title": "A Torre",
      "body": "A torre é uma das **peças mais poderosas** do xadrez. Ela se move em linhas retas — para frente, para trás, para a esquerda e para a direita — quantas casas quiser, desde que o caminho esteja livre."
    },
    {
      "type": "text",
      "title": "Alcance da Torre",
      "body": "Veja como a torre em d4 pode se mover para qualquer casa na coluna d ou na fileira 4. Ela controla **14 casas** de uma vez!",
      "fen": "8/8/8/8/3R4/8/8/8 w - - 0 1",
      "orientation": "white",
      "highlights": ["d1","d2","d3","d5","d6","d7","d8","a4","b4","c4","e4","f4","g4","h4"],
      "arrows": [["d4","d8"],["d4","h4"]]
    },
    {
      "type": "demo",
      "title": "Captura com a Torre",
      "description": "A torre captura movendo-se para a casa da peça adversária. Veja a torre branca capturar o peão preto em a8.",
      "fen": "p7/8/8/8/8/8/8/R7 w - - 0 1",
      "moves": ["a1a8"],
      "orientation": "white",
      "annotations": {"1": "A torre viajou toda a coluna a para capturar o peão!"}
    },
    {
      "type": "exercise",
      "instruction": "Mova a torre para capturar o peão preto!",
      "fen": "7k/8/8/3p4/8/8/8/3R3K w - - 0 1",
      "expected_moves": ["d1d5"],
      "orientation": "white",
      "after_text": "Excelente! A torre capturou o peão movendo-se em linha reta pela coluna d.",
      "hint": "A torre se move em linha reta. O peão está na mesma coluna!"
    },
    {
      "type": "exercise",
      "instruction": "Mova a torre para dar xeque ao rei preto!",
      "fen": "4k3/8/8/8/8/8/8/R6K w - - 0 1",
      "expected_moves": ["a1a8","a1e1"],
      "orientation": "white",
      "after_text": "Xeque! A torre ataca o rei em linha reta. O rei precisa escapar!",
      "hint": "Coloque a torre na mesma fileira ou coluna do rei."
    },
    {
      "type": "exercise",
      "instruction": "Capture a peça preta que está desprotegida!",
      "fen": "7k/8/5n2/8/8/8/8/5R1K w - - 0 1",
      "expected_moves": ["f1f6"],
      "orientation": "white",
      "after_text": "Boa! O cavalo estava desprotegido e a torre o capturou pela coluna f."
    },
    {
      "type": "exercise",
      "instruction": "Mova a torre para proteger seu peão em d2 que está sendo atacado!",
      "fen": "7k/8/8/8/3b4/8/3P4/R6K w - - 0 1",
      "expected_moves": ["a1d1"],
      "orientation": "white",
      "after_text": "Perfeito! Agora se o bispo capturar o peão, a torre recaptura. A torre defende por trás!",
      "hint": "Coloque a torre atrás do peão, na mesma coluna."
    },
    {
      "type": "text",
      "title": "Resumo",
      "body": "Você aprendeu que a torre se move em **linhas retas** (fileiras e colunas), pode **capturar** peças adversárias no caminho, e pode **defender** peças aliadas posicionando-se na mesma linha. A torre é especialmente forte em **colunas abertas** (sem peões bloqueando)."
    }
  ]
}'::jsonb
WHERE trail = 'recruta' AND trail_order = 1;
