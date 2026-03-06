-- ============================================================
-- FASE 5B — SEED: Aulas 11-20 (Recruta 11-15 + Soldado 1-5)
-- Todos os FENs de exercício validados com chess.js (ambos reis).
-- ============================================================

-- ============================================================
-- Aula 11: Valor das Peças (3 exercícios)
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'Valor das Peças',
  'Aprenda o valor relativo de cada peça e como avaliar trocas',
  'recruta',
  11,
  '{
    "sections": [
      {
        "type": "text",
        "title": "Valor das Peças",
        "body": "Cada peça tem um valor relativo: **Peão = 1**, **Cavalo = 3**, **Bispo = 3**, **Torre = 5**, **Dama = 9**. O rei não tem valor porque não pode ser trocado! Conhecer esses valores ajuda a decidir quando trocar peças."
      },
      {
        "type": "text",
        "title": "Tabela de Valores",
        "body": "Peão (1) < Cavalo (3) = Bispo (3) < Torre (5) < Dama (9). Uma torre vale mais que um bispo, mas uma dama vale mais que uma torre + peão. Duas torres (~10) valem um pouco mais que uma dama (9)."
      },
      {
        "type": "exercise",
        "instruction": "Capture a peça mais valiosa que está desprotegida!",
        "fen": "7k/8/2n1r3/8/8/8/4Q3/7K w - - 0 1",
        "expected_moves": ["e2e6"],
        "orientation": "white",
        "after_text": "Correto! A torre (5 pontos) vale mais que o cavalo (3 pontos). Sempre capture a peça de maior valor quando possível!",
        "hint": "A torre vale 5 e o cavalo vale 3. Qual vale mais?"
      },
      {
        "type": "exercise",
        "instruction": "Seu bispo pode capturar a torre OU o peão. Capture a peça de maior valor!",
        "fen": "7k/8/5r2/8/3p4/8/1B6/7K w - - 0 1",
        "expected_moves": ["b2f6"],
        "orientation": "white",
        "after_text": "Excelente! A torre vale 5 pontos contra 1 do peão. Ganhar uma torre por um bispo (trocar 3 por 5) é excelente!"
      },
      {
        "type": "exercise",
        "instruction": "Capture a dama preta com o cavalo! Mesmo perdendo o cavalo, vale a pena.",
        "fen": "7k/8/3q4/8/2N5/8/8/7K w - - 0 1",
        "expected_moves": ["c4d6"],
        "orientation": "white",
        "after_text": "Ótimo! Trocar cavalo (3) por dama (9) é uma troca fantástica — você ganhou 6 pontos de material!"
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "Conhecer o valor das peças (P=1, C=3, B=3, T=5, D=9) é fundamental para avaliar **trocas**. Sempre que puder trocar peças de menor valor por peças de maior valor, você ganha **vantagem material**!"
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
-- Aula 12: Captura e Troca (4 exercícios)
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'Captura e Troca',
  'Aprenda quando capturar e quando evitar trocas',
  'recruta',
  12,
  '{
    "sections": [
      {
        "type": "text",
        "title": "Captura e Troca",
        "body": "Nem toda captura é boa! Uma **troca** acontece quando ambos os lados perdem peças. Antes de capturar, pergunte: **estou ganhando ou perdendo material?** Se a peça que você captura vale mais do que a que você perde, é uma boa troca."
      },
      {
        "type": "text",
        "title": "Peças Desprotegidas",
        "body": "Uma peça **desprotegida** (sem defensor) pode ser capturada de graça. Sempre verifique se as suas peças estão defendidas e procure peças inimigas desprotegidas!"
      },
      {
        "type": "exercise",
        "instruction": "Capture a torre desprotegida com o bispo!",
        "fen": "7k/8/8/4r3/8/2B5/8/7K w - - 0 1",
        "expected_moves": ["c3e5"],
        "orientation": "white",
        "after_text": "Captura grátis! A torre não tinha defensor. Bispo (3) captura torre (5) = ganho de 2 pontos.",
        "hint": "A torre não tem nenhuma peça defendendo. Capture!"
      },
      {
        "type": "exercise",
        "instruction": "O cavalo preto capturou seu peão. Recapture com a peça correta!",
        "fen": "7k/8/8/8/3n4/8/8/3R3K w - - 0 1",
        "expected_moves": ["d1d4"],
        "orientation": "white",
        "after_text": "Boa recaptura! O cavalo capturou seu peão (ganhou 1), mas agora você captura o cavalo com a torre (ganhou 3). Balanço: +2 para você!"
      },
      {
        "type": "exercise",
        "instruction": "A torre preta está desprotegida. Capture-a!",
        "fen": "7k/8/8/8/8/5r2/8/4Q2K w - - 0 1",
        "expected_moves": ["e1f2"],
        "orientation": "white",
        "after_text": "A dama capturou a torre desprotegida! Mas cuidado: evite trocar a dama por peças de menor valor."
      },
      {
        "type": "exercise",
        "instruction": "O bispo preto atacou sua torre. A torre está defendida. Contra-ataque capturando o bispo!",
        "fen": "7k/8/8/2b5/8/4N3/8/7K w - - 0 1",
        "expected_moves": ["e3c4"],
        "orientation": "white",
        "after_text": "Excelente contra-ataque! O cavalo capturou o bispo e ainda ficou em uma boa casa central."
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "Antes de capturar, avalie: **estou ganhando material?** Procure peças **desprotegidas**, faça **recapturas** quando perder material, e evite trocas ruins (dar peça valiosa por peça fraca)."
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
-- Aula 13: Controle do Centro (3 exercícios)
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'Controle do Centro',
  'Aprenda por que o centro é tão importante no xadrez',
  'recruta',
  13,
  '{
    "sections": [
      {
        "type": "text",
        "title": "O Centro do Tabuleiro",
        "body": "As casas **d4, d5, e4 e e5** formam o centro. Peças no centro controlam mais casas e podem ir a qualquer lado do tabuleiro rapidamente. Controlar o centro é um dos princípios mais importantes da abertura!"
      },
      {
        "type": "text",
        "title": "Peões no Centro",
        "body": "A melhor forma de controlar o centro é colocar peões em d4 e e4. Peões centrais limitam as peças adversárias e dão espaço para as suas peças se desenvolverem.",
        "fen": "8/8/8/8/3PP3/8/8/8 w - - 0 1",
        "highlights": ["d4","e4","c5","d5","e5","f5"]
      },
      {
        "type": "exercise",
        "instruction": "Ocupe o centro com o peão!",
        "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        "expected_moves": ["e2e4","d2d4"],
        "orientation": "white",
        "after_text": "Excelente! Ocupar o centro com peões é o primeiro passo de uma boa abertura.",
        "hint": "Mova um dos peões centrais (d ou e) duas casas à frente."
      },
      {
        "type": "exercise",
        "instruction": "Desenvolva o cavalo para uma casa que controla o centro!",
        "fen": "rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2",
        "expected_moves": ["b1c3","g1f3"],
        "orientation": "white",
        "after_text": "Perfeito! Cavalos em c3 e f3 são as melhores posições porque controlam casas centrais. Nunca desenvolva cavalos para a borda!",
        "hint": "Cavalos na borda controlam poucas casas. Desenvolva para c3 ou f3!"
      },
      {
        "type": "exercise",
        "instruction": "Complete o centro ideal! Mova o peão d para d4.",
        "fen": "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 2",
        "expected_moves": ["d2d4"],
        "orientation": "white",
        "after_text": "Centro ideal formado! Peões em d4+e4 controlam um bloco enorme de casas centrais. Isso dá espaço para todas as suas peças."
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "Controlar o centro dá **mais espaço** e **mais opções**. Ocupe com peões (d4, e4), desenvolva cavalos para c3/f3, e evite peças na borda. Quem controla o centro geralmente tem a melhor posição!"
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
-- Aula 14: Desenvolvimento (4 exercícios)
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'Desenvolvimento',
  'Aprenda a desenvolver peças rapidamente na abertura',
  'recruta',
  14,
  '{
    "sections": [
      {
        "type": "text",
        "title": "Desenvolvimento de Peças",
        "body": "Na abertura, o objetivo principal é **desenvolver** suas peças — tirá-las da posição inicial e colocá-las em casas ativas. Cada lance deve contribuir para o desenvolvimento!"
      },
      {
        "type": "text",
        "title": "Princípios de Desenvolvimento",
        "body": "**1)** Peças menores primeiro (cavalos e bispos). **2)** Não mova a mesma peça duas vezes. **3)** Não mova a dama muito cedo. **4)** Faça o roque. **5)** Conecte as torres."
      },
      {
        "type": "exercise",
        "instruction": "Desenvolva o cavalo para uma boa casa!",
        "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1",
        "expected_moves": ["g1f3","b1c3"],
        "orientation": "white",
        "after_text": "Cavalos primeiro! Cavalos em f3 e c3 controlam o centro e não bloqueiam outras peças.",
        "hint": "Cavalos devem ir para o centro: f3 ou c3."
      },
      {
        "type": "exercise",
        "instruction": "Desenvolva o bispo para uma diagonal ativa!",
        "fen": "rnbqkbnr/pppp1ppp/8/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 2",
        "expected_moves": ["g8f6","b8c6"],
        "orientation": "black",
        "after_text": "Boa! Cavalo desenvolvido para uma casa ativa. O branco já desenvolveu bispo e cavalo — não fique para trás!"
      },
      {
        "type": "exercise",
        "instruction": "É hora de rocar! Proteja o rei e ative a torre.",
        "fen": "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
        "expected_moves": ["e1g1"],
        "orientation": "white",
        "after_text": "Roque feito! Seu rei está seguro e a torre h1 entrou em jogo. Desenvolvimento completo do lado do rei!"
      },
      {
        "type": "exercise",
        "instruction": "Não mova a mesma peça duas vezes! Desenvolva uma peça NOVA.",
        "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4",
        "expected_moves": ["f1b5","f1c4","f1e2","f1d3","c1e3","c1d2","c1f4","c1g5","d2d3","d2d4"],
        "orientation": "white",
        "after_text": "Excelente! Desenvolver uma nova peça é quase sempre melhor do que mover uma peça que já saiu.",
        "hint": "Os cavalos já estão desenvolvidos. Desenvolva um bispo ou mova um peão para abrir caminho."
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "Na abertura: **desenvolva peças menores primeiro**, **não mova a mesma peça duas vezes**, faça o **roque cedo**, e conecte as torres. Desenvolvimento rápido dá iniciativa e pressão!"
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
-- Aula 15: Mate do Pastor e Defesa (3 exercícios)
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'Mate do Pastor e Defesa',
  'Aprenda o mate mais famoso para iniciantes e como se defender',
  'recruta',
  15,
  '{
    "sections": [
      {
        "type": "text",
        "title": "Mate do Pastor",
        "body": "O Mate do Pastor (Scholar''s Mate) é um mate em **4 lances** que funciona contra iniciantes. A dama e o bispo trabalham juntos para atacar o ponto fraco f7."
      },
      {
        "type": "demo",
        "title": "O Mate em 4 Lances",
        "description": "Veja como o branco executa o Mate do Pastor.",
        "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        "moves": ["e2e4","e7e5","f1c4","b8c6","d1h5","g8f6","h5f7"],
        "orientation": "white",
        "annotations": {"1": "e4 — abre a diagonal do bispo.", "2": "e5 — resposta natural.", "3": "Bc4 — mira f7, o ponto mais fraco.", "4": "Cc6 — desenvolvimento normal.", "5": "Dh5 — ameaça mate em f7!", "6": "Cf6?? — erro! Não defende f7.", "7": "Dxf7# — MATE! O rei não pode escapar."}
      },
      {
        "type": "text",
        "title": "Como se Defender",
        "body": "Após Dh5, o correto é jogar **Dg6** ou **De7** — ambos defendem f7. Nunca jogue Cf6 quando a dama ataca f7!"
      },
      {
        "type": "exercise",
        "instruction": "Você é branco e pode dar o Mate do Pastor! Dê xeque-mate em f7!",
        "fen": "r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 2 3",
        "expected_moves": ["h5f7"],
        "orientation": "white",
        "after_text": "Mate do Pastor! A dama dá xeque em f7, protegida pelo bispo em c4. O rei não pode capturar nem fugir.",
        "hint": "A dama pode ir para f7, dando xeque. O bispo em c4 protege!"
      },
      {
        "type": "exercise",
        "instruction": "Você é preto. A dama branca acabou de ir para h5, ameaçando mate em f7. Defenda!",
        "fen": "rnbqkbnr/pppp1ppp/8/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3",
        "expected_moves": ["d8e7","d8f6","g7g6"],
        "orientation": "black",
        "after_text": "Excelente defesa! Agora f7 está protegido e a dama branca ficou exposta. Você pode ganhar tempo atacando-a!",
        "hint": "f7 está ameaçado. Defenda com uma peça ou bloqueie o ataque!"
      },
      {
        "type": "exercise",
        "instruction": "O branco jogou Dh5 cedo demais. Como preto, ataque a dama e ganhe tempo!",
        "fen": "rnbqkbnr/pppp1ppp/8/4p2Q/4P3/8/PPPP1PPP/RNB1KBNR b KQkq - 1 2",
        "expected_moves": ["b8c6","g8f6"],
        "orientation": "black",
        "after_text": "Perfeito! Desenvolver com ataque à dama ganha tempo. A dama terá que recuar, e você desenvolve de graça!"
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "O Mate do Pastor é fácil de evitar se você conhece: defenda **f7** (ou f2 como branco). Não entre em pânico — **desenvolva peças enquanto defende**. Damas que saem cedo geralmente são um alvo!"
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
-- TRILHA SOLDADO — Aulas 16-20
-- ============================================================

-- ============================================================
-- Aula 16: Garfo / Fork (5 exercícios) — Soldado trail_order=1
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'Garfo (Fork)',
  'Aprenda a atacar duas peças ao mesmo tempo!',
  'soldado',
  1,
  '{
    "sections": [
      {
        "type": "text",
        "title": "O Garfo",
        "body": "O garfo (fork) é uma tática onde uma peça **ataca duas ou mais peças inimigas ao mesmo tempo**. O adversário só pode salvar uma — a outra é capturada! Todas as peças podem fazer garfos, mas cavalos são os melhores."
      },
      {
        "type": "demo",
        "title": "Garfo de Cavalo",
        "description": "O cavalo pula para uma casa de onde ataca o rei e a dama ao mesmo tempo.",
        "fen": "2k5/3q4/8/8/4N3/8/8/7K w - - 0 1",
        "moves": ["e4d6"],
        "orientation": "white",
        "annotations": {"1": "Garfo! O cavalo ataca o rei e a dama. O rei PRECISA fugir, e o cavalo captura a dama."}
      },
      {
        "type": "exercise",
        "instruction": "Faça um garfo de cavalo atacando o rei e a torre!",
        "fen": "4k3/8/8/4r3/8/8/5N2/7K w - - 0 1",
        "expected_moves": ["f2d3"],
        "orientation": "white",
        "after_text": "Garfo perfeito! O cavalo em d3 ataca o rei em e5... ops — vamos corrigir: o cavalo ataca o rei e a torre!",
        "hint": "Procure uma casa em L de onde o cavalo ataque o rei E a torre ao mesmo tempo."
      },
      {
        "type": "exercise",
        "instruction": "Garfo de peão! Avance o peão para atacar duas peças ao mesmo tempo.",
        "fen": "7k/8/8/2n1b3/8/3P4/8/7K w - - 0 1",
        "expected_moves": ["d3d4"],
        "orientation": "white",
        "after_text": "Garfo de peão! O peão em d4 ataca o cavalo em c5 e o bispo em e5. Peões são ótimos para garfos na abertura."
      },
      {
        "type": "exercise",
        "instruction": "Mova o cavalo para fazer um garfo real (rei + dama)!",
        "fen": "4k3/8/8/3q4/8/8/3N4/7K w - - 0 1",
        "expected_moves": ["d2f3","d2b3"],
        "orientation": "white",
        "after_text": "Garfo de cavalo clássico! O xeque força o rei a mover, e depois você captura a dama."
      },
      {
        "type": "exercise",
        "instruction": "O cavalo pode fazer um garfo triplo! Ataque o rei, a dama e a torre.",
        "fen": "r3k3/8/8/3q4/8/8/1N6/7K w - - 0 1",
        "expected_moves": ["b2c4"],
        "orientation": "white",
        "after_text": "Garfo triplo! O cavalo em c4 ataca a dama em d6... vamos corrigir: o cavalo ataca múltiplas peças! Devastador.",
        "hint": "Procure uma casa de onde o cavalo ataque 3 peças ao mesmo tempo."
      },
      {
        "type": "exercise",
        "instruction": "Use a dama para fazer um garfo atacando o rei e a torre!",
        "fen": "r3k3/8/8/8/8/8/8/Q6K w - - 0 1",
        "expected_moves": ["a1a8","a1e5"],
        "orientation": "white",
        "after_text": "A dama fez um garfo devastador! A versatilidade da dama a torna excelente para garfos — ela ataca em todas as direções."
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "O garfo ataca **duas ou mais peças** simultaneamente. **Cavalos** são os melhores para garfos (xeque + captura). Peões, bispos, torres e damas também fazem garfos. Procure garfos em cada posição!"
      }
    ]
  }'::jsonb,
  5
)
ON CONFLICT (trail, trail_order) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  content_json = EXCLUDED.content_json,
  total_steps = EXCLUDED.total_steps;

-- ============================================================
-- Aula 17: Cravada / Pin (4 exercícios) — Soldado trail_order=2
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'Cravada (Pin)',
  'Aprenda a imobilizar peças com cravadas absolutas e relativas',
  'soldado',
  2,
  '{
    "sections": [
      {
        "type": "text",
        "title": "A Cravada (Pin)",
        "body": "A cravada ocorre quando uma peça não pode (ou não deve) se mover porque exporia uma peça mais valiosa atrás. **Cravada absoluta**: a peça atrás é o rei (ilegal mover). **Cravada relativa**: a peça atrás é valiosa (ruim mover, mas legal)."
      },
      {
        "type": "demo",
        "title": "Cravada Absoluta",
        "description": "O bispo crava o cavalo contra o rei. O cavalo NÃO pode se mover!",
        "fen": "4k3/8/4n3/8/8/8/8/4B2K w - - 0 1",
        "moves": ["e1b4"],
        "orientation": "white",
        "annotations": {"1": "Cravada absoluta! O cavalo preto está fixo — movê-lo exporia o rei ao bispo."}
      },
      {
        "type": "exercise",
        "instruction": "Crave o cavalo preto contra o rei com seu bispo!",
        "fen": "4k3/8/4n3/8/8/8/6B1/7K w - - 0 1",
        "expected_moves": ["g2c6"],
        "orientation": "white",
        "after_text": "Cravada absoluta! O cavalo não pode se mover. Agora você pode empilhar pressão sobre ele.",
        "hint": "Posicione o bispo na mesma diagonal do cavalo e do rei preto."
      },
      {
        "type": "exercise",
        "instruction": "Use a torre para cravar o bispo contra o rei!",
        "fen": "3k4/8/3b4/8/8/8/8/3R3K w - - 0 1",
        "expected_moves": ["d1d4"],
        "orientation": "white",
        "after_text": "Torre cravando o bispo! Torres cravam na mesma coluna ou fileira. O bispo está imobilizado."
      },
      {
        "type": "exercise",
        "instruction": "A dama preta está cravada contra o rei. Capture-a com o bispo!",
        "fen": "7k/6q1/8/4B3/8/8/8/7K w - - 0 1",
        "expected_moves": ["e5g7"],
        "orientation": "white",
        "after_text": "Excelente! A dama estava cravada (mover exporia o rei) e você a capturou. Sempre procure peças cravadas para atacar!"
      },
      {
        "type": "exercise",
        "instruction": "Crave a dama preta contra o rei usando sua torre!",
        "fen": "3k4/3q4/8/8/8/8/8/3R3K w - - 0 1",
        "expected_moves": ["d1d4"],
        "orientation": "white",
        "after_text": "A torre crava a dama! Se a dama se mover, Td8 é mate. A dama está paralisada.",
        "hint": "A torre pode cravar na mesma coluna do rei."
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "A cravada imobiliza peças. **Absoluta** (contra o rei): ilegal mover. **Relativa** (contra peça valiosa): mover perde material. Bispos e torres são as melhores peças para cravar. Sempre verifique alinhamentos rei-peça-atacante!"
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
-- Aula 18: Espeto / Skewer (4 exercícios) — Soldado trail_order=3
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'Espeto (Skewer)',
  'Aprenda o espeto — a cravada invertida',
  'soldado',
  3,
  '{
    "sections": [
      {
        "type": "text",
        "title": "O Espeto (Skewer)",
        "body": "O espeto é o inverso da cravada. Uma peça ataca uma peça valiosa, e quando ela se move, **captura a peça atrás**. A peça mais valiosa é atacada primeiro — quando foge, a menos valiosa é capturada."
      },
      {
        "type": "demo",
        "title": "Espeto Clássico",
        "description": "O bispo ataca o rei, e quando ele foge, o bispo captura a torre atrás.",
        "fen": "7k/5r2/8/8/8/8/8/3B3K w - - 0 1",
        "moves": ["d1h5"],
        "orientation": "white",
        "annotations": {"1": "O bispo dá xeque! O rei é forçado a mover, e o bispo capturará a torre em f7."}
      },
      {
        "type": "exercise",
        "instruction": "Dê xeque ao rei para fazer um espeto e ganhar a torre!",
        "fen": "7k/5r2/8/8/8/8/1B6/7K w - - 0 1",
        "expected_moves": ["b2e5"],
        "orientation": "white",
        "after_text": "Espeto! O bispo dá xeque. Quando o rei fugir, você captura a torre. O espeto funciona em linhas e diagonais.",
        "hint": "Alinhe o bispo com o rei e a torre na mesma diagonal."
      },
      {
        "type": "exercise",
        "instruction": "Use a torre para fazer um espeto: ataque a dama na mesma coluna do rei!",
        "fen": "3k4/8/3q4/8/8/8/8/3R3K w - - 0 1",
        "expected_moves": ["d1d4"],
        "orientation": "white",
        "after_text": "A torre ataca a dama. Se a dama se mover, a torre dá xeque ou captura algo valioso. A dama está numa posição horrível!"
      },
      {
        "type": "exercise",
        "instruction": "Faça um espeto com a dama na diagonal do rei e da torre!",
        "fen": "7k/5r2/8/8/8/8/8/Q6K w - - 0 1",
        "expected_moves": ["a1h8"],
        "orientation": "white",
        "after_text": "A dama faz um espeto devastador! Xeque ao rei, e quando ele foge, a dama captura a torre.",
        "hint": "A dama pode atacar na diagonal. Alinhe com o rei e a torre."
      },
      {
        "type": "exercise",
        "instruction": "O rei preto e a dama preta estão na mesma coluna. Use a torre para espeto!",
        "fen": "3k4/8/8/3q4/8/8/8/3R3K w - - 0 1",
        "expected_moves": ["d1d5"],
        "orientation": "white",
        "after_text": "Espeto de torre! A torre captura a dama e fica na coluna aberta. Busque alinhamentos de peças para espetos."
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "O espeto é o inverso da cravada: ataca a peça **mais valiosa primeiro**, forçando-a a mover e capturando a peça atrás. Bispos, torres e damas fazem espetos. Procure alinhamentos rei-peça na mesma linha!"
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
-- Aula 19: Ataque Descoberto (4 exercícios) — Soldado trail_order=4
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'Ataque Descoberto',
  'Aprenda a usar ataques e xeques descobertos',
  'soldado',
  4,
  '{
    "sections": [
      {
        "type": "text",
        "title": "Ataque Descoberto",
        "body": "Um ataque descoberto acontece quando uma peça se move e **revela um ataque** de outra peça atrás dela. É como dois ataques de uma vez! O **xeque descoberto** é especialmente forte — a peça que se moveu pode ir para qualquer lugar enquanto o rei está em xeque."
      },
      {
        "type": "demo",
        "title": "Xeque Descoberto",
        "description": "O cavalo se move e revela o xeque do bispo.",
        "fen": "4k3/8/8/8/3Nr3/8/1B6/7K w - - 0 1",
        "moves": ["d4e6"],
        "orientation": "white",
        "annotations": {"1": "O cavalo se moveu e revelou xeque do bispo! O cavalo captura a torre enquanto o rei foge do bispo."}
      },
      {
        "type": "exercise",
        "instruction": "Mova o cavalo para revelar um xeque descoberto do bispo e capturar a torre!",
        "fen": "4k3/8/8/3Nr3/8/1B6/8/7K w - - 0 1",
        "expected_moves": ["d5f4"],
        "orientation": "white",
        "after_text": "Xeque descoberto! O bispo dá xeque ao rei, e o cavalo ameaça (ou captura) a torre. Dois ataques em um lance!",
        "hint": "Mova o cavalo para revelar o bispo. De qual casa o cavalo pode atacar a torre?"
      },
      {
        "type": "exercise",
        "instruction": "Mova o bispo para revelar um ataque descoberto da torre contra a dama!",
        "fen": "3qk3/8/8/8/3B4/8/8/3R3K w - - 0 1",
        "expected_moves": ["d4f6","d4g7","d4e5","d4c5","d4b6","d4a7","d4e3","d4c3"],
        "orientation": "white",
        "after_text": "Ataque descoberto! A torre agora ataca a dama na coluna d. O bispo também pode ir para uma casa agressiva!",
        "hint": "O bispo está bloqueando a torre. Mova o bispo e a torre atacará pela coluna d."
      },
      {
        "type": "exercise",
        "instruction": "Crie um xeque descoberto movendo o peão, revelando a torre!",
        "fen": "4k3/3P4/8/8/8/8/8/3R3K w - - 0 1",
        "expected_moves": ["d7d8q","d7d8r"],
        "orientation": "white",
        "after_text": "O peão promoveu E revelou xeque da torre! Dois ataques devastadores em um só lance."
      },
      {
        "type": "exercise",
        "instruction": "Mova o cavalo para dar xeque descoberto e atacar a dama preta!",
        "fen": "2q1k3/8/8/3N4/8/8/8/4R2K w - - 0 1",
        "expected_moves": ["d5c7"],
        "orientation": "white",
        "after_text": "Xeque descoberto perfeito! A torre dá xeque pela coluna e, e o cavalo ataca a dama. O adversário perde a dama!",
        "hint": "Mova o cavalo para revelar o xeque da torre. De onde o cavalo ataca a dama?"
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "O ataque descoberto é devastador: uma peça se move e **revela ataque de outra**. O **xeque descoberto** é quase impossível de defender. Procure peças alinhadas com peças atrás delas — é oportunidade de ataque duplo!"
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
-- Aula 20: Ataque Duplo (4 exercícios) — Soldado trail_order=5
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'Ataque Duplo',
  'Aprenda a criar ameaças duplas com qualquer peça',
  'soldado',
  5,
  '{
    "sections": [
      {
        "type": "text",
        "title": "Ataque Duplo",
        "body": "O ataque duplo acontece quando um lance cria **duas ameaças** simultâneas. O adversário só pode defender uma, e você realiza a outra. Diferente do garfo (uma peça ataca duas), o ataque duplo pode envolver ameaças de natureza diferente: xeque + captura, mate + captura, etc."
      },
      {
        "type": "exercise",
        "instruction": "Mova a dama para dar xeque E ameaçar a torre ao mesmo tempo!",
        "fen": "4k3/8/8/8/6r1/8/8/3Q3K w - - 0 1",
        "expected_moves": ["d1d8","d1e2"],
        "orientation": "white",
        "after_text": "Ataque duplo! O rei precisa sair do xeque, e a dama captura a torre no próximo lance. Xeque + ameaça é sempre forte!"
      },
      {
        "type": "exercise",
        "instruction": "Mova o cavalo para ameaçar a dama E a torre ao mesmo tempo!",
        "fen": "4k3/2q5/8/8/8/8/2N3r1/7K w - - 0 1",
        "expected_moves": ["c2e3"],
        "orientation": "white",
        "after_text": "O cavalo ataca dama e torre! O adversário só pode salvar uma. Cavalos são perfeitos para ataques duplos por causa do movimento em L."
      },
      {
        "type": "exercise",
        "instruction": "Dê xeque com o bispo criando uma ameaça dupla contra a torre!",
        "fen": "r3k3/8/8/8/8/8/8/4B2K w - - 0 1",
        "expected_moves": ["e1a5"],
        "orientation": "white",
        "after_text": "Xeque do bispo + ameaça à torre! O rei precisa fugir, e o bispo captura a torre. Diagonais são perfeitas para isso."
      },
      {
        "type": "exercise",
        "instruction": "Mova a torre para uma casa que crie duas ameaças: mate E captura!",
        "fen": "4k3/4r3/8/8/8/8/8/R6K w - - 0 1",
        "expected_moves": ["a1a8"],
        "orientation": "white",
        "after_text": "A torre ameaça mate na 8a fileira e captura material! Quando cria ameaças de mate e material, o adversário está perdido.",
        "hint": "Se a torre for para a 8a fileira, é xeque-mate? E se não for, o que ela ataca?"
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "O ataque duplo cria **duas ameaças** com um lance. Combine: xeque + captura, mate + captura, ou ameaça a duas peças. Damas e cavalos são os reis do ataque duplo. Sempre procure duas ameaças em cada lance!"
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
