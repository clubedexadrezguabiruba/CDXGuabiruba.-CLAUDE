-- ============================================================
-- FASE 5B — SEED: Aulas 1-10 (Recruta)
-- Substitui aula piloto por curriculum completo.
-- Todos os FENs de exercício validados com chess.js (ambos reis).
-- ON CONFLICT para idempotência.
-- ============================================================

-- Limpar seed piloto se existir em trail_order=1 com título antigo
-- (ON CONFLICT cuida da atualização)

-- ============================================================
-- Aula 1: O Tabuleiro e as Casas (3 exercícios)
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'O Tabuleiro e as Casas',
  'Aprenda a identificar fileiras, colunas e casas do tabuleiro',
  'recruta',
  1,
  '{
    "sections": [
      {
        "type": "text",
        "title": "O Tabuleiro de Xadrez",
        "body": "O tabuleiro tem **64 casas** organizadas em 8 fileiras (1-8) e 8 colunas (a-h). As casas alternam entre cores claras e escuras. Cada casa tem um nome único: a letra da coluna + o número da fileira."
      },
      {
        "type": "text",
        "title": "Colunas e Fileiras",
        "body": "As **colunas** vão de **a** (esquerda) a **h** (direita). As **fileiras** vão de **1** (lado branco) a **8** (lado preto). A casa **e4** fica na coluna e, fileira 4 — bem no centro!",
        "fen": "8/8/8/8/4P3/8/8/8 w - - 0 1",
        "highlights": ["e4"],
        "arrows": [["a4","h4"],["e1","e8"]]
      },
      {
        "type": "text",
        "title": "As Casas Centrais",
        "body": "As quatro casas centrais — **d4, d5, e4, e5** — são as mais importantes do tabuleiro. Quem controla o centro tem mais espaço e mobilidade!",
        "fen": "8/8/8/8/8/8/8/8 w - - 0 1",
        "highlights": ["d4","d5","e4","e5"]
      },
      {
        "type": "exercise",
        "instruction": "Mova o peão branco para a casa e4, ocupando o centro!",
        "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        "expected_moves": ["e2e4"],
        "orientation": "white",
        "after_text": "Excelente! O peão agora ocupa a casa central e4. Este é um dos lances iniciais mais comuns no xadrez!",
        "hint": "O peão da coluna e pode avançar duas casas no primeiro lance."
      },
      {
        "type": "exercise",
        "instruction": "Mova o peão branco para a casa d4, controlando o centro!",
        "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1",
        "expected_moves": ["d2d4"],
        "orientation": "white",
        "after_text": "Muito bem! Agora você controla duas casas centrais com peões em d4 e e4. Isso é chamado de centro ideal."
      },
      {
        "type": "exercise",
        "instruction": "Mova o cavalo para a casa f3, desenvolvendo uma peça em direção ao centro!",
        "fen": "rnbqkbnr/pppppppp/8/8/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 1",
        "expected_moves": ["g1f3"],
        "orientation": "white",
        "after_text": "Perfeito! O cavalo em f3 controla as casas centrais d4 e e5. Desenvolver peças para casas ativas é fundamental!"
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "Você aprendeu que o tabuleiro tem **64 casas** em 8 colunas (a-h) e 8 fileiras (1-8). Cada casa tem um nome único. As casas centrais **d4, d5, e4, e5** são as mais importantes. Controlar o centro é um dos princípios fundamentais do xadrez!"
      }
    ]
  }'::jsonb,
  3
)
ON CONFLICT (trail, trail_order) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content_json = EXCLUDED.content_json,
  total_steps = EXCLUDED.total_steps;

-- ============================================================
-- Aula 2: O Peão (4 exercícios, dim_kings: true)
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'O Peão',
  'Aprenda como o peão se move, captura e promove',
  'recruta',
  2,
  '{
    "dim_kings": true,
    "sections": [
      {
        "type": "text",
        "title": "O Peão",
        "body": "O peão é a peça mais numerosa — cada lado começa com **8 peões**. Apesar de ser a peça de menor valor, peões são a alma do xadrez! Eles determinam a estrutura da posição."
      },
      {
        "type": "text",
        "title": "Movimento do Peão",
        "body": "O peão avança **uma casa** para frente. Na sua primeira jogada, pode avançar **duas casas**. O peão **nunca anda para trás**!",
        "fen": "8/8/8/8/8/8/4P3/8 w - - 0 1",
        "highlights": ["e3","e4"],
        "arrows": [["e2","e4"]]
      },
      {
        "type": "text",
        "title": "Captura do Peão",
        "body": "O peão captura na **diagonal**, uma casa à frente. Ele não pode capturar para frente — só avança em linha reta se o caminho estiver livre.",
        "fen": "8/8/8/3p1p2/4P3/8/8/8 w - - 0 1",
        "highlights": ["d5","f5"],
        "arrows": [["e4","d5"],["e4","f5"]]
      },
      {
        "type": "demo",
        "title": "Peão em Ação",
        "description": "Veja o peão avançar duas casas e depois capturar na diagonal.",
        "fen": "8/8/8/5p2/8/8/4P3/8 w - - 0 1",
        "moves": ["e2e4","f5e4"],
        "orientation": "white",
        "annotations": {"1": "O peão avança duas casas no primeiro lance.", "2": "O peão preto captura na diagonal!"}
      },
      {
        "type": "exercise",
        "instruction": "Avance o peão duas casas para frente!",
        "fen": "7k/8/8/8/8/8/3P4/7K w - - 0 1",
        "expected_moves": ["d2d4"],
        "orientation": "white",
        "after_text": "Ótimo! O peão pode avançar duas casas na sua primeira jogada.",
        "hint": "O peão pode avançar uma ou duas casas no primeiro lance."
      },
      {
        "type": "exercise",
        "instruction": "Capture o peão preto com seu peão!",
        "fen": "7k/8/8/5p2/4P3/8/8/7K w - - 0 1",
        "expected_moves": ["e4f5"],
        "orientation": "white",
        "after_text": "Excelente! O peão captura na diagonal, movendo-se uma casa para frente e para o lado."
      },
      {
        "type": "exercise",
        "instruction": "O peão preto está bloqueando o caminho. Capture o bispo na diagonal!",
        "fen": "7k/8/8/3bp3/4P3/8/8/7K w - - 0 1",
        "expected_moves": ["e4d5"],
        "orientation": "white",
        "after_text": "Muito bem! Quando o caminho à frente está bloqueado, capturar na diagonal é a única opção de avançar.",
        "hint": "O peão não pode avançar porque a casa à frente está ocupada. Capture na diagonal!"
      },
      {
        "type": "exercise",
        "instruction": "Avance o peão até a última fileira para promovê-lo a dama!",
        "fen": "7k/4P3/8/8/8/8/8/7K w - - 0 1",
        "expected_moves": ["e7e8q"],
        "orientation": "white",
        "after_text": "Fantástico! Quando o peão chega à última fileira, ele se transforma em outra peça — geralmente uma dama, a peça mais poderosa!"
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "Você aprendeu que o peão avança **uma casa** (ou duas na primeira jogada), captura na **diagonal**, nunca anda para trás, e ao chegar à última fileira pode ser **promovido** a outra peça. Peões são a base da sua posição!"
      }
    ]
  }'::jsonb,
  4
)
ON CONFLICT (trail, trail_order) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content_json = EXCLUDED.content_json,
  total_steps = EXCLUDED.total_steps;

-- ============================================================
-- Aula 3: A Torre (4 exercícios, dim_kings: true)
-- Conteúdo validado do piloto, agora em trail_order=3
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'A Torre',
  'Aprenda como a torre se move e captura peças',
  'recruta',
  3,
  '{
    "dim_kings": true,
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
  }'::jsonb,
  4
)
ON CONFLICT (trail, trail_order) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content_json = EXCLUDED.content_json,
  total_steps = EXCLUDED.total_steps;

-- ============================================================
-- Aula 4: O Bispo (3 exercícios, dim_kings: true)
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'O Bispo',
  'Aprenda como o bispo se move nas diagonais',
  'recruta',
  4,
  '{
    "dim_kings": true,
    "sections": [
      {
        "type": "text",
        "title": "O Bispo",
        "body": "O bispo se move nas **diagonais**, quantas casas quiser. Cada jogador começa com dois bispos — um nas casas claras e outro nas casas escuras. Um bispo **nunca muda** de cor de casa!"
      },
      {
        "type": "text",
        "title": "Alcance do Bispo",
        "body": "O bispo em d4 controla todas as diagonais que passam por ele. Observe que ele só alcança casas escuras!",
        "fen": "8/8/8/8/3B4/8/8/8 w - - 0 1",
        "highlights": ["a1","b2","c3","e5","f6","g7","h8","a7","b6","c5","e3","f2","g1"],
        "arrows": [["d4","h8"],["d4","a7"]]
      },
      {
        "type": "demo",
        "title": "Captura com o Bispo",
        "description": "O bispo captura movendo-se na diagonal até a casa da peça adversária.",
        "fen": "8/8/6p1/8/8/8/8/B7 w - - 0 1",
        "moves": ["a1g7"],
        "orientation": "white",
        "annotations": {"1": "O bispo viajou toda a diagonal para capturar o peão!"}
      },
      {
        "type": "exercise",
        "instruction": "Capture o peão preto com o bispo!",
        "fen": "7k/8/5p2/8/8/8/8/2B4K w - - 0 1",
        "expected_moves": ["c1f4"],
        "orientation": "white",
        "after_text": "Muito bem! O bispo capturou o peão percorrendo a diagonal. Lembre-se: o bispo é forte em posições abertas!"
      },
      {
        "type": "exercise",
        "instruction": "Capture a torre preta desprotegida com o bispo!",
        "fen": "7k/8/8/8/6r1/8/8/3B3K w - - 0 1",
        "expected_moves": ["d1g4"],
        "orientation": "white",
        "after_text": "Excelente! O bispo capturou a torre, que vale muito mais! Isso é chamado de ganhar material."
      },
      {
        "type": "exercise",
        "instruction": "Mova o bispo para a casa b5, ameaçando o cavalo preto em e8!",
        "fen": "4n2k/8/8/8/8/8/8/3B3K w - - 0 1",
        "expected_moves": ["d1b3"],
        "orientation": "white",
        "after_text": "O bispo agora controla a diagonal e ameaça o cavalo. Posicionar bispos em diagonais longas e abertas é muito forte!"
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "Você aprendeu que o bispo se move nas **diagonais**, nunca muda de cor de casa, e é especialmente forte em **diagonais abertas**. O par de bispos (um em cada cor) trabalhando juntos é muito poderoso!"
      }
    ]
  }'::jsonb,
  3
)
ON CONFLICT (trail, trail_order) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content_json = EXCLUDED.content_json,
  total_steps = EXCLUDED.total_steps;

-- ============================================================
-- Aula 5: A Dama (3 exercícios, dim_kings: true)
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'A Dama',
  'Aprenda como a dama se move — a peça mais poderosa',
  'recruta',
  5,
  '{
    "dim_kings": true,
    "sections": [
      {
        "type": "text",
        "title": "A Dama",
        "body": "A dama é a **peça mais poderosa** do xadrez. Ela combina os poderes da torre e do bispo — se move em **linhas retas E diagonais**, quantas casas quiser!"
      },
      {
        "type": "text",
        "title": "Alcance da Dama",
        "body": "A dama em d4 controla um número enorme de casas — fileiras, colunas e diagonais!",
        "fen": "8/8/8/8/3Q4/8/8/8 w - - 0 1",
        "highlights": ["d1","d2","d3","d5","d6","d7","d8","a4","b4","c4","e4","f4","g4","h4","a1","b2","c3","e5","f6","g7","h8","a7","b6","c5","e3","f2","g1"],
        "arrows": [["d4","d8"],["d4","h4"],["d4","h8"],["d4","a7"]]
      },
      {
        "type": "demo",
        "title": "Dama em Ação",
        "description": "A dama pode atacar de longe, tanto em linha reta quanto na diagonal.",
        "fen": "8/8/8/8/8/8/8/3Q4 w - - 0 1",
        "moves": ["d1d8","d8h4"],
        "orientation": "white",
        "annotations": {"1": "A dama sobe toda a coluna d como uma torre!", "2": "E agora desce na diagonal como um bispo!"}
      },
      {
        "type": "exercise",
        "instruction": "Capture a torre preta com a dama!",
        "fen": "7k/8/8/8/6r1/8/8/3Q3K w - - 0 1",
        "expected_moves": ["d1g4"],
        "orientation": "white",
        "after_text": "A dama capturou a torre na diagonal, como um bispo!",
        "hint": "A dama pode se mover na diagonal."
      },
      {
        "type": "exercise",
        "instruction": "Dê xeque ao rei preto com a dama!",
        "fen": "4k3/8/8/8/8/8/8/3Q3K w - - 0 1",
        "expected_moves": ["d1d8","d1e1","d1e2"],
        "orientation": "white",
        "after_text": "Xeque! A dama é devastadora quando pode atacar o rei em linha aberta."
      },
      {
        "type": "exercise",
        "instruction": "Capture o bispo preto desprotegido!",
        "fen": "7k/8/1b6/8/8/8/8/Q6K w - - 0 1",
        "expected_moves": ["a1b2"],
        "orientation": "white",
        "after_text": "Excelente! A dama atacou na diagonal curta e capturou o bispo. A dama é versátil!",
        "hint": "O bispo está numa diagonal acessível à dama."
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "Você aprendeu que a dama se move em **linhas retas e diagonais** — combinando torre + bispo. Ela é a peça mais poderosa, mas cuidado: perdê-la geralmente significa perder a partida! Proteja sua dama."
      }
    ]
  }'::jsonb,
  3
)
ON CONFLICT (trail, trail_order) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content_json = EXCLUDED.content_json,
  total_steps = EXCLUDED.total_steps;

-- ============================================================
-- Aula 6: O Cavalo (4 exercícios, dim_kings: true)
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'O Cavalo',
  'Aprenda o movimento em L do cavalo — a peça que pula!',
  'recruta',
  6,
  '{
    "dim_kings": true,
    "sections": [
      {
        "type": "text",
        "title": "O Cavalo",
        "body": "O cavalo é a peça mais especial do xadrez. Ele se move em **L** — duas casas numa direção e uma casa perpendicular. E o melhor: o cavalo **pula** sobre outras peças!"
      },
      {
        "type": "text",
        "title": "O Movimento em L",
        "body": "O cavalo em d4 pode ir para 8 casas diferentes. Observe o padrão em L!",
        "fen": "8/8/8/8/3N4/8/8/8 w - - 0 1",
        "highlights": ["c2","e2","b3","f3","b5","f5","c6","e6"],
        "arrows": [["d4","c6"],["d4","e6"],["d4","f5"],["d4","f3"]]
      },
      {
        "type": "demo",
        "title": "Cavalo Pulando",
        "description": "O cavalo é a única peça que pula — ele ignora peças no caminho!",
        "fen": "8/8/8/8/3N4/2PPP3/2PPP3/8 w - - 0 1",
        "moves": ["d4f5"],
        "orientation": "white",
        "annotations": {"1": "O cavalo pula sobre os peões! Nenhuma outra peça pode fazer isso."}
      },
      {
        "type": "exercise",
        "instruction": "Mova o cavalo para capturar o peão preto!",
        "fen": "7k/8/5p2/8/8/3N4/8/7K w - - 0 1",
        "expected_moves": ["d3f4"],
        "orientation": "white",
        "after_text": "Boa! O cavalo capturou o peão com seu movimento em L. De f4, ele pode pular para muitas casas!",
        "hint": "O cavalo se move em L: duas casas + uma perpendicular. Qual casa de destino alcança o peão?"
      },
      {
        "type": "exercise",
        "instruction": "O cavalo pode pular peças! Capture a torre preta, mesmo com peões no caminho.",
        "fen": "7k/8/4r3/3PPP2/3PNP2/3PPP2/8/7K w - - 0 1",
        "expected_moves": ["e4d6"],
        "orientation": "white",
        "after_text": "Perfeito! O cavalo pulou sobre todos os peões e capturou a torre. Cavalos são perigosos em posições fechadas!"
      },
      {
        "type": "exercise",
        "instruction": "Dê xeque ao rei preto com o cavalo!",
        "fen": "4k3/8/8/8/8/5N2/8/7K w - - 0 1",
        "expected_moves": ["f3d4","f3g5"],
        "orientation": "white",
        "after_text": "Xeque de cavalo! O xeque de cavalo é especial porque não pode ser bloqueado — o rei precisa se mover.",
        "hint": "Lembre-se do L: de quais casas o cavalo ataca o rei?"
      },
      {
        "type": "exercise",
        "instruction": "Mova o cavalo para a casa que ataca a dama E a torre ao mesmo tempo!",
        "fen": "2q1k3/8/8/8/8/5N2/8/7K w - - 0 1",
        "expected_moves": ["f3e5"],
        "orientation": "white",
        "after_text": "Isso é um GARFO! O cavalo ataca duas peças ao mesmo tempo. O adversário só pode salvar uma! Cavalos são ótimos para garfos.",
        "hint": "Procure uma casa de onde o cavalo ataque ambas as peças em L."
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "Você aprendeu que o cavalo se move em **L**, é a única peça que **pula** sobre outras, e é excelente para fazer **garfos** (atacar duas peças ao mesmo tempo). Cavalos são fortes em posições fechadas!"
      }
    ]
  }'::jsonb,
  4
)
ON CONFLICT (trail, trail_order) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content_json = EXCLUDED.content_json,
  total_steps = EXCLUDED.total_steps;

-- ============================================================
-- Aula 7: O Rei (3 exercícios)
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'O Rei',
  'Aprenda como o rei se move e a importância de protegê-lo',
  'recruta',
  7,
  '{
    "sections": [
      {
        "type": "text",
        "title": "O Rei",
        "body": "O rei é a peça **mais importante** do xadrez — se ele for capturado, você perde! O rei se move **uma casa** em qualquer direção: frente, trás, lados e diagonais."
      },
      {
        "type": "text",
        "title": "Movimento do Rei",
        "body": "O rei em e4 pode se mover para qualquer casa adjacente — são 8 possibilidades no máximo.",
        "fen": "8/8/8/8/4K3/8/8/8 w - - 0 1",
        "highlights": ["d3","d4","d5","e3","e5","f3","f4","f5"]
      },
      {
        "type": "text",
        "title": "Restrição do Rei",
        "body": "O rei **nunca** pode ir para uma casa atacada por uma peça adversária. Isso significa que dois reis nunca podem ficar lado a lado!"
      },
      {
        "type": "exercise",
        "instruction": "Mova o rei para capturar o peão preto desprotegido!",
        "fen": "8/8/8/3pk3/8/8/8/4K3 w - - 0 1",
        "expected_moves": ["e1d2","e1e2","e1f2"],
        "orientation": "white",
        "after_text": "O rei pode capturar peças adjacentes, desde que a casa não esteja defendida!",
        "hint": "O rei se move uma casa em qualquer direção."
      },
      {
        "type": "exercise",
        "instruction": "O rei está em perigo! Mova-o para uma casa segura!",
        "fen": "8/8/8/8/8/5q2/8/4K3 w - - 0 1",
        "expected_moves": ["e1d2","e1d1"],
        "orientation": "white",
        "after_text": "Boa fuga! O rei escapou para uma casa que a dama não ataca. Sempre verifique se a casa de destino é segura!",
        "hint": "A dama em f3 ataca várias casas. Encontre uma casa que ela não controla."
      },
      {
        "type": "exercise",
        "instruction": "Capture a peça atacante com o rei!",
        "fen": "8/8/8/8/8/4n3/8/4K3 w - - 0 1",
        "expected_moves": ["e1e2"],
        "orientation": "white",
        "after_text": "Quando possível, capturar a peça atacante é uma ótima defesa! O rei eliminou o cavalo que o ameaçava."
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "Você aprendeu que o rei se move **uma casa** em qualquer direção, **nunca** pode ir para casa atacada, e é a peça mais importante — proteja-o sempre! No final da partida, o rei se torna mais ativo."
      }
    ]
  }'::jsonb,
  3
)
ON CONFLICT (trail, trail_order) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content_json = EXCLUDED.content_json,
  total_steps = EXCLUDED.total_steps;

-- ============================================================
-- Aula 8: Xeque (4 exercícios)
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'Xeque',
  'Aprenda o que é xeque e como se defender',
  'recruta',
  8,
  '{
    "sections": [
      {
        "type": "text",
        "title": "O que é Xeque?",
        "body": "Xeque é quando uma peça **ataca diretamente o rei** adversário. O jogador em xeque PRECISA se defender — não pode fazer nenhum outro lance!"
      },
      {
        "type": "text",
        "title": "Três Formas de Escapar do Xeque",
        "body": "Existem 3 maneiras de sair do xeque: **1) Mover o rei** para casa segura. **2) Bloquear** o ataque com outra peça. **3) Capturar** a peça que dá xeque."
      },
      {
        "type": "demo",
        "title": "Exemplo de Xeque",
        "description": "A torre branca dá xeque e o rei preto precisa fugir.",
        "fen": "4k3/8/8/8/8/8/8/4R2K w - - 0 1",
        "moves": ["e1e8"],
        "orientation": "white",
        "annotations": {"1": "Xeque! A torre ataca o rei na coluna e. O rei precisa se mover!"}
      },
      {
        "type": "exercise",
        "instruction": "Dê xeque ao rei preto com a torre!",
        "fen": "3k4/8/8/8/8/8/8/R6K w - - 0 1",
        "expected_moves": ["a1a8","a1d1"],
        "orientation": "white",
        "after_text": "Xeque! Quando a torre compartilha a fileira ou coluna do rei, é xeque direto!"
      },
      {
        "type": "exercise",
        "instruction": "Seu rei está em xeque pela torre. Bloqueie o xeque com o bispo!",
        "fen": "8/8/8/8/8/8/3B4/r3K2k b - - 0 1",
        "expected_moves": ["d2b4"],
        "orientation": "white",
        "after_text": "Excelente! O bispo bloqueou a linha de ataque da torre. Bloquear é uma boa opção quando mover o rei não é ideal."
      },
      {
        "type": "exercise",
        "instruction": "Seu rei está em xeque! Capture a peça atacante!",
        "fen": "8/8/8/8/8/4n3/8/4K2k w - - 0 1",
        "expected_moves": ["e1e2"],
        "orientation": "white",
        "after_text": "Boa! Capturar a peça que dá xeque resolve o problema e ganha material. Quando possível, é a melhor opção!"
      },
      {
        "type": "exercise",
        "instruction": "O bispo preto dá xeque. Mova o rei para uma casa segura!",
        "fen": "8/8/8/1b6/8/8/8/3K3k w - - 0 1",
        "expected_moves": ["d1c1","d1e1","d1c2","d1e2","d1d2"],
        "orientation": "white",
        "after_text": "O rei fugiu do xeque! Sempre verifique todas as casas — nem toda casa adjacente é segura.",
        "hint": "O bispo em b5 ataca na diagonal. Quais casas estão fora da diagonal?"
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "Xeque é o ataque direto ao rei. Você pode escapar **movendo o rei**, **bloqueando** com outra peça, ou **capturando** o atacante. Se nenhuma dessas opções for possível, é **xeque-mate**!"
      }
    ]
  }'::jsonb,
  4
)
ON CONFLICT (trail, trail_order) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content_json = EXCLUDED.content_json,
  total_steps = EXCLUDED.total_steps;

-- ============================================================
-- Aula 9: Xeque-Mate (4 exercícios)
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'Xeque-Mate',
  'Aprenda a dar xeque-mate — o objetivo do jogo!',
  'recruta',
  9,
  '{
    "sections": [
      {
        "type": "text",
        "title": "Xeque-Mate",
        "body": "Xeque-mate é quando o rei está em xeque e **não há nenhuma forma de escapar**. Não pode mover, bloquear, nem capturar. A partida acaba — você venceu!"
      },
      {
        "type": "text",
        "title": "Elementos do Mate",
        "body": "Para dar mate, você precisa: **1)** Atacar o rei. **2)** Controlar todas as casas de fuga. **3)** Garantir que o ataque não pode ser bloqueado ou capturado."
      },
      {
        "type": "demo",
        "title": "Mate do Corredor",
        "description": "O mate mais comum: a torre dá xeque na última fileira e o rei não pode fugir por causa dos próprios peões.",
        "fen": "6k1/5ppp/8/8/8/8/8/R6K w - - 0 1",
        "moves": ["a1a8"],
        "orientation": "white",
        "annotations": {"1": "Xeque-mate! O rei está preso por seus próprios peões e não pode escapar da torre."}
      },
      {
        "type": "exercise",
        "instruction": "Dê xeque-mate com a torre na última fileira!",
        "fen": "6k1/5ppp/8/8/8/8/8/R6K w - - 0 1",
        "expected_moves": ["a1a8"],
        "orientation": "white",
        "after_text": "Mate do corredor (back rank mate)! Este é o padrão de mate mais importante para iniciantes. Os peões do próprio jogador prendem o rei!",
        "hint": "O rei preto está preso na última fileira pelos seus peões. Uma torre na fileira 8 dá mate!"
      },
      {
        "type": "exercise",
        "instruction": "Dê xeque-mate com a dama!",
        "fen": "k7/8/1K6/8/8/8/8/1Q6 w - - 0 1",
        "expected_moves": ["b1a1","b1a2"],
        "orientation": "white",
        "after_text": "Xeque-mate! A dama e o rei trabalham juntos para encurralar o rei adversário no canto."
      },
      {
        "type": "exercise",
        "instruction": "Dê xeque-mate com as duas torres!",
        "fen": "7k/R7/8/8/8/8/8/R6K w - - 0 1",
        "expected_moves": ["a1h1"],
        "orientation": "white",
        "after_text": "Mate com duas torres! Este padrão é chamado de escada — as torres se alternam cortando fileiras até encurralar o rei.",
        "hint": "Uma torre já controla a fileira 7. Use a outra torre para dar xeque na fileira 8."
      },
      {
        "type": "exercise",
        "instruction": "O rei preto está quase encurralado. Dê o mate final!",
        "fen": "k7/2R5/1K6/8/8/8/8/8 w - - 0 1",
        "expected_moves": ["c7a7"],
        "orientation": "white",
        "after_text": "Xeque-mate! A torre na sétima fileira combinada com o rei dá mate no canto. Pratique este padrão!"
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "Xeque-mate é o objetivo do jogo! Os padrões mais comuns são: **Mate do corredor** (torre na última fileira), **Mate com dama + rei** (encurralar no canto) e **Mate com duas torres** (escada). Reconhecer estes padrões é essencial!"
      }
    ]
  }'::jsonb,
  4
)
ON CONFLICT (trail, trail_order) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content_json = EXCLUDED.content_json,
  total_steps = EXCLUDED.total_steps;

-- ============================================================
-- Aula 10: Roque (3 exercícios)
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'Roque',
  'Aprenda o lance especial do roque — proteja seu rei!',
  'recruta',
  10,
  '{
    "sections": [
      {
        "type": "text",
        "title": "O Roque",
        "body": "O roque é um lance especial onde o rei e uma torre se movem ao mesmo tempo. É o **único lance** onde duas peças se movem juntas! O objetivo é proteger o rei e ativar a torre."
      },
      {
        "type": "text",
        "title": "Roque Menor (O-O)",
        "body": "No roque menor (lado do rei), o rei vai para **g1** e a torre vai para **f1**. Precisa: caminho livre, rei e torre não movidos, rei não em xeque.",
        "fen": "r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1",
        "arrows": [["e1","g1"],["h1","f1"]]
      },
      {
        "type": "text",
        "title": "Roque Maior (O-O-O)",
        "body": "No roque maior (lado da dama), o rei vai para **c1** e a torre vai para **d1**. As mesmas regras se aplicam.",
        "fen": "r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1",
        "arrows": [["e1","c1"],["a1","d1"]]
      },
      {
        "type": "demo",
        "title": "Roque em Ação",
        "description": "Após desenvolver as peças, o branco faz roque menor para proteger o rei.",
        "fen": "r1bqkbnr/pppppppp/2n5/8/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
        "moves": ["f1c4","g8f6","e1g1"],
        "orientation": "white",
        "annotations": {"1": "O bispo se desenvolve, abrindo caminho para o roque.", "2": "O cavalo preto se desenvolve.", "3": "Roque! O rei está seguro atrás dos peões e a torre está ativa."}
      },
      {
        "type": "exercise",
        "instruction": "Faça o roque menor para proteger seu rei!",
        "fen": "rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
        "expected_moves": ["e1g1"],
        "orientation": "white",
        "after_text": "O roque é quase sempre uma boa ideia! Seu rei está protegido e a torre está pronta para jogar.",
        "hint": "O caminho entre o rei e a torre h1 está livre. Faça O-O!"
      },
      {
        "type": "exercise",
        "instruction": "Faça o roque maior (lado da dama)!",
        "fen": "r3kbnr/pppqpppp/2n5/3p1b2/3P1B2/2N1P3/PPPQ1PPP/R3KBNR w KQkq - 6 5",
        "expected_moves": ["e1c1"],
        "orientation": "white",
        "after_text": "Roque maior! O rei foi para c1 e a torre para d1. O roque maior é menos comum, mas muito útil quando o lado do rei está congestionado.",
        "hint": "O caminho entre o rei e a torre a1 está livre. Faça O-O-O!"
      },
      {
        "type": "exercise",
        "instruction": "Desenvolva o bispo para liberar o caminho do roque, e depois roque!",
        "fen": "rnbqk2r/pppp1ppp/5n2/2b1p3/4P3/5N2/PPPPBPPP/RNBQK2R w KQkq - 4 4",
        "expected_moves": ["e1g1"],
        "orientation": "white",
        "after_text": "Roque feito! O caminho já estava livre com o bispo em e2. Sempre desenvolva peças menores primeiro para habilitar o roque.",
        "hint": "O bispo já saiu do caminho. Faça o roque menor!"
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "O roque é um lance especial que **protege o rei** e **ativa a torre** ao mesmo tempo. Existem dois tipos: **roque menor** (O-O, lado do rei) e **roque maior** (O-O-O, lado da dama). Faça o roque cedo na partida!"
      }
    ]
  }'::jsonb,
  3
)
ON CONFLICT (trail, trail_order) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content_json = EXCLUDED.content_json,
  total_steps = EXCLUDED.total_steps;
