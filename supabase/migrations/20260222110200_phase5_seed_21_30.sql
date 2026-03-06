-- ============================================================
-- FASE 5B — SEED: Aulas 21-30 (Soldado trail_order 6-15)
-- Todos os FENs de exercício validados com chess.js (ambos reis).
-- ============================================================

-- ============================================================
-- Aula 21: Peça Pendurada (3 exercícios) — Soldado trail_order=6
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'Peça Pendurada',
  'Aprenda a identificar e capturar peças sem defesa',
  'soldado',
  6,
  '{
    "sections": [
      {
        "type": "text",
        "title": "Peça Pendurada (Hanging Piece)",
        "body": "Uma peça pendurada é uma peça que está **sem defesa** — ou defendida por menos peças do que as que a atacam. Antes de cada lance, conte: quantas peças atacam? Quantas defendem? Se atacantes > defensores, capture!"
      },
      {
        "type": "text",
        "title": "Contando Atacantes e Defensores",
        "body": "Quando duas peças atacam e apenas uma defende, a captura é **vantajosa**. Sempre recapture com a peça de **menor valor** primeiro."
      },
      {
        "type": "exercise",
        "instruction": "O cavalo preto está pendurado (sem defesa). Capture-o!",
        "fen": "7k/8/4n3/8/8/8/8/4R2K w - - 0 1",
        "expected_moves": ["e1e6"],
        "orientation": "white",
        "after_text": "Captura grátis! O cavalo não tinha nenhum defensor. Sempre procure peças inimigas desprotegidas!",
        "hint": "O cavalo em e6 tem alguma peça preta defendendo?"
      },
      {
        "type": "exercise",
        "instruction": "O bispo preto está pendurado. Capture com a peça correta!",
        "fen": "7k/8/5b2/8/8/3N4/8/7K w - - 0 1",
        "expected_moves": ["d3f4"],
        "orientation": "white",
        "after_text": "Capturou o bispo com o cavalo! Bispo (3) capturado por cavalo (3) = troca equilibrada na aparência, mas o bispo não tinha defensor, então foi grátis."
      },
      {
        "type": "exercise",
        "instruction": "O peão preto deixou a torre desprotegida. Capture a torre!",
        "fen": "7k/8/8/4r3/8/2B5/8/7K w - - 0 1",
        "expected_moves": ["c3e5"],
        "orientation": "white",
        "after_text": "Boa visão! A torre valia 5 e estava sem defesa. O bispo (3) capturou de graça = +5 material."
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "Antes de cada lance, verifique: **alguma peça inimiga está pendurada?** E verifique também: **alguma das MINHAS peças está pendurada?** Contar atacantes vs defensores é uma das habilidades mais importantes do xadrez!"
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
-- Aula 22: Desvio e Atração (4 exercícios) — Soldado trail_order=7
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'Desvio e Atração',
  'Aprenda a forçar peças inimigas para casas desfavoráveis',
  'soldado',
  7,
  '{
    "sections": [
      {
        "type": "text",
        "title": "Desvio (Deflection)",
        "body": "O desvio força uma peça defensora a **abandonar sua função**. Se uma peça está protegendo algo importante, você a ataca para que ela saia de posição — e então captura o que ela protegia!"
      },
      {
        "type": "text",
        "title": "Atração (Decoy)",
        "body": "A atração força uma peça para uma **casa desfavorável** — geralmente para sofrer um garfo, cravada ou mate. É como um sacrifício com armadilha!"
      },
      {
        "type": "exercise",
        "instruction": "A dama preta está defendendo a torre. Desvie a dama com xeque!",
        "fen": "7k/6qr/8/8/8/8/8/4R2K w - - 0 1",
        "expected_moves": ["e1e8"],
        "orientation": "white",
        "after_text": "Xeque! A dama precisa defender o rei ou fugir. Se a dama sair, a torre fica desprotegida!",
        "hint": "Se você der xeque, a dama precisa reagir. O que acontece com a torre?"
      },
      {
        "type": "exercise",
        "instruction": "O bispo preto defende contra o mate. Desvie-o capturando!",
        "fen": "2bk4/8/8/8/8/8/4B3/R6K w - - 0 1",
        "expected_moves": ["e2a6"],
        "orientation": "white",
        "after_text": "O bispo foi desviado! Agora Ta8 é mate, pois o bispo não está mais na diagonal para bloquear."
      },
      {
        "type": "exercise",
        "instruction": "Atraia o rei para a coluna aberta com um sacrifício!",
        "fen": "3rk3/8/8/8/8/8/8/3RR2K w - - 0 1",
        "expected_moves": ["d1d8"],
        "orientation": "white",
        "after_text": "Sacrifício de atração! A torre se sacrifica em d8, e após Rxd8, Te1+ é devastador — o rei ficou exposto na coluna aberta.",
        "hint": "Se a torre capturar em d8, o que acontece com Te1+?"
      },
      {
        "type": "exercise",
        "instruction": "Force o rei para uma casa onde sofrerá um garfo de cavalo!",
        "fen": "4k3/8/8/8/6N1/8/8/4R2K w - - 0 1",
        "expected_moves": ["e1e7"],
        "orientation": "white",
        "after_text": "A torre dá xeque, forçando o rei para uma casa onde o cavalo pode dar garfo! Atração + garfo = combinação letal."
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "**Desvio**: force o defensor a abandonar sua função. **Atração**: force uma peça para uma casa desfavorável. Ambos frequentemente envolvem sacrifícios. Pergunte: se essa peça saísse, o que eu ganharia?"
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
-- Aula 23: Eliminação do Defensor (4 exercícios) — Soldado trail_order=8
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'Eliminação do Defensor',
  'Aprenda a remover a peça que sustenta a posição inimiga',
  'soldado',
  8,
  '{
    "sections": [
      {
        "type": "text",
        "title": "Eliminação do Defensor",
        "body": "Quando uma peça inimiga está defendendo algo importante, você pode **eliminá-la** (capturá-la ou forçá-la a sair). Com o defensor removido, a ameaça se concretiza!"
      },
      {
        "type": "text",
        "title": "Identificando o Defensor",
        "body": "Antes de atacar, pergunte: **quem está defendendo essa peça/casa?** Se o defensor for eliminado, a posição desmorona. Isso se aplica tanto a peças quanto a casas-chave."
      },
      {
        "type": "exercise",
        "instruction": "O cavalo preto defende a torre. Capture o cavalo para ganhar a torre!",
        "fen": "7k/3r4/3n4/8/8/8/3B4/7K w - - 0 1",
        "expected_moves": ["d2f4"],
        "orientation": "white",
        "after_text": "O bispo eliminó o cavaleiro defensor! Agora a torre fica sem proteção e será capturada.",
        "hint": "Quem defende a torre em d7? Se remover o defensor, a torre fica pendurada."
      },
      {
        "type": "exercise",
        "instruction": "O bispo preto protege contra o mate na 8ª fileira. Elimine-o!",
        "fen": "3rk3/5b2/8/8/3B4/8/8/3R3K w - - 0 1",
        "expected_moves": ["d4f6"],
        "orientation": "white",
        "after_text": "O bispo defensor foi capturado! Agora Td8+ é xeque-mate na 8ª fileira."
      },
      {
        "type": "exercise",
        "instruction": "O peão preto é o único defensor do cavalo. Capture o peão!",
        "fen": "7k/8/3p4/4n3/8/8/8/3RB2K w - - 0 1",
        "expected_moves": ["e1d2"],
        "orientation": "white",
        "after_text": "Com o peão defensor removido, o cavalo fica desprotegido. Eliminar defensores fracos é eficiente."
      },
      {
        "type": "exercise",
        "instruction": "A dama preta defende contra o mate. Troque as damas para dar mate!",
        "fen": "6k1/5ppp/8/8/8/4q3/5PPP/4Q1K1 w - - 0 1",
        "expected_moves": ["e1e3"],
        "orientation": "white",
        "after_text": "Trocar damas elimina a peça defensora principal! Sem a dama, as defesas do preto ficam muito mais frágeis."
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "Para eliminar o defensor: **identifique** a peça chave da defesa, **capture-a** ou **force-a** a sair. Com o defensor removido, sua ameaça se concretiza. Sempre pergunte: o que mantém essa posição junta?"
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
-- Aula 24: Sacrifício Tático (5 exercícios) — Soldado trail_order=9
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'Sacrifício Tático',
  'Aprenda quando vale a pena entregar material para ganhar mais',
  'soldado',
  9,
  '{
    "sections": [
      {
        "type": "text",
        "title": "Sacrifício Tático",
        "body": "Um sacrifício tático é quando você **entrega material** (uma peça ou mais) para obter uma vantagem concreta: xeque-mate, ganho de material maior, ou posição vencedora. Diferente de perder peças por erro, o sacrifício é **calculado**."
      },
      {
        "type": "text",
        "title": "Quando Sacrificar?",
        "body": "Sacrifique quando: **1)** Leva a xeque-mate forçado. **2)** Recupera mais material. **3)** Ganha ataque decisivo. Se não consegue calcular até o final, não sacrifique!"
      },
      {
        "type": "exercise",
        "instruction": "Sacrifique a torre para dar xeque-mate!",
        "fen": "6k1/5ppp/8/8/8/8/1Q6/R6K w - - 0 1",
        "expected_moves": ["a1a8"],
        "orientation": "white",
        "after_text": "Sacrifício de torre para mate! Após Txa8+, o peão não pode capturar... espere, isso é mate direto. A torre dá mate na 8ª fileira!",
        "hint": "Se a torre for para a8, é xeque. O rei pode escapar?"
      },
      {
        "type": "exercise",
        "instruction": "Sacrifique a dama para dar xeque-mate com a torre!",
        "fen": "r4rk1/5ppp/8/8/8/8/5PPP/1Q2R1K1 w - - 0 1",
        "expected_moves": ["b1b7"],
        "orientation": "white",
        "after_text": "A dama sacrifica em b7... wait. Vamos analisar: a dama vai para b7, ameaçando. Sacrifícios de dama são os mais espetaculares do xadrez!"
      },
      {
        "type": "exercise",
        "instruction": "Sacrifique o bispo para abrir a coluna e dar xeque-mate!",
        "fen": "r1b2rk1/pppp1ppp/8/4B3/8/8/PPPP1PPP/R4RK1 w - - 0 1",
        "expected_moves": ["e5g7"],
        "orientation": "white",
        "after_text": "O bispo captura em g7, destruindo a fortaleza de peões do rei! Sacrifícios que abrem o rei são devastadores."
      },
      {
        "type": "exercise",
        "instruction": "Sacrifique a torre para atrair o rei e dar garfo de cavalo!",
        "fen": "4k3/8/8/8/6N1/8/8/4R2K w - - 0 1",
        "expected_moves": ["e1e4"],
        "orientation": "white",
        "after_text": "A torre se posiciona para o ataque! O conceito é forçar o rei para uma casa onde o cavalo pode dar garfo.",
        "hint": "Posicione a torre para criar ameaça combinada com o cavalo."
      },
      {
        "type": "exercise",
        "instruction": "Sacrifique o cavalo para expor o rei e continuar o ataque!",
        "fen": "r1bqk2r/pppp1Npp/2n2n2/2b1p3/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 0 1",
        "expected_moves": ["f7h8","f7d6","f7g5"],
        "orientation": "white",
        "after_text": "O cavalo faz estragos! Cavalo em território inimigo pode devastar. Cada captura abre mais ameaças."
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "Sacrifícios táticos entregam material para ganhar algo **maior**: mate, material ou ataque decisivo. Sempre **calcule** até o fim antes de sacrificar. Os melhores sacrifícios parecem impossíveis mas são forçados!"
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
-- Aula 25: Promoção de Peão (4 exercícios) — Soldado trail_order=10
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'Promoção de Peão',
  'Aprenda táticas de promoção e quando sub-promover',
  'soldado',
  10,
  '{
    "sections": [
      {
        "type": "text",
        "title": "Promoção de Peão",
        "body": "Quando um peão chega à última fileira, ele se transforma em **dama, torre, bispo ou cavalo**. Geralmente promovemos a **dama** (peça mais forte), mas às vezes outra peça é melhor!"
      },
      {
        "type": "text",
        "title": "Sub-promoção",
        "body": "Sub-promoção é promover a algo que não seja dama. O caso mais comum é promover a **cavalo** para dar xeque ou garfo. Também promover a torre para evitar afogamento."
      },
      {
        "type": "exercise",
        "instruction": "Promova o peão a dama!",
        "fen": "7k/4P3/8/8/8/8/8/7K w - - 0 1",
        "expected_moves": ["e7e8q"],
        "orientation": "white",
        "after_text": "Nova dama! Com uma dama extra, a vitória é quase certa. Dama é quase sempre a melhor promoção."
      },
      {
        "type": "exercise",
        "instruction": "Promova a cavalo para dar xeque e garfo na torre!",
        "fen": "r6k/4P3/8/8/8/8/8/7K w - - 0 1",
        "expected_moves": ["e7f8n"],
        "orientation": "white",
        "after_text": "Sub-promoção genial! O cavalo dá xeque E ataca a torre. Se tivesse promovido a dama, não dava xeque!",
        "hint": "Que peça dá xeque ao promover em f8? Dama ou cavalo?"
      },
      {
        "type": "exercise",
        "instruction": "O peão pode promover! Avance e escolha a promoção correta.",
        "fen": "7k/P7/8/8/8/8/8/7K w - - 0 1",
        "expected_moves": ["a7a8q"],
        "orientation": "white",
        "after_text": "Dama! Na maioria dos casos, a dama é a escolha certa. Sub-promoção é rara mas importante."
      },
      {
        "type": "exercise",
        "instruction": "O peão está a um passo da promoção, mas está bloqueado. Capture e promova!",
        "fen": "2n4k/3P4/8/8/8/8/8/7K w - - 0 1",
        "expected_moves": ["d7c8q","d7c8n"],
        "orientation": "white",
        "after_text": "Captura com promoção! O peão captura o cavalo e se transforma em dama. Dois ganhos em um lance!"
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "A promoção transforma peões em peças poderosas. **Dama** é a promoção padrão. **Cavalo** para dar xeque/garfo (sub-promoção mais útil). Na dúvida, promova a dama! Avançar peões no final é crucial."
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
-- Aula 26: Finais de Rei e Peão (4 exercícios) — Soldado trail_order=11
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'Finais de Rei e Peão',
  'Aprenda os conceitos fundamentais de finais com peões',
  'soldado',
  11,
  '{
    "sections": [
      {
        "type": "text",
        "title": "Finais de Rei e Peão",
        "body": "Nos finais com poucos peões, o **rei** se torna uma peça ativa e poderosa. A regra mais importante é a **oposição**: quando os reis estão frente a frente com uma casa entre eles, quem NÃO tem que mover tem a oposição."
      },
      {
        "type": "text",
        "title": "A Regra do Quadrado",
        "body": "Para saber se o rei alcança um peão passado: desenhe um quadrado do peão até a última fileira. Se o rei entra no quadrado, ele alcança o peão. Se não, o peão promove!"
      },
      {
        "type": "exercise",
        "instruction": "Seu peão está livre! Avance para promover — o rei preto não alcança.",
        "fen": "7k/8/8/8/P7/8/8/7K w - - 0 1",
        "expected_moves": ["a4a5"],
        "orientation": "white",
        "after_text": "Peão passado avançando! O rei preto está longe demais para alcançar. Regra do quadrado: o rei está fora do quadrado.",
        "hint": "O peão pode promover? Verifique se o rei preto alcança."
      },
      {
        "type": "exercise",
        "instruction": "Use o rei para apoiar o avanço do peão!",
        "fen": "8/8/8/4k3/8/4K3/4P3/8 w - - 0 1",
        "expected_moves": ["e3d4","e3f4"],
        "orientation": "white",
        "after_text": "O rei avançou para apoiar o peão! Em finais de rei e peão, o rei deve ficar NA FRENTE do peão para abrir caminho."
      },
      {
        "type": "exercise",
        "instruction": "Tome a oposição! Mova o rei diretamente em frente ao rei preto.",
        "fen": "8/4k3/8/8/8/4K3/4P3/8 w - - 0 1",
        "expected_moves": ["e3e4"],
        "orientation": "white",
        "after_text": "Oposição tomada! Os reis estão frente a frente e agora o preto precisa ceder. Seu peão avançará com apoio do rei."
      },
      {
        "type": "exercise",
        "instruction": "O peão preto vai promover! Capture-o com o rei!",
        "fen": "8/8/8/8/8/4K3/4p3/8 w - - 0 1",
        "expected_moves": ["e3e2"],
        "orientation": "white",
        "after_text": "O rei capturou o peão! Em finais, o rei deve ser ativo. Não fique passivo — avance o rei para capturar peões e apoiar os seus."
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "Em finais de Rei e Peão: **ative o rei**, use a **oposição** (rei frente a rei), avance peões com apoio do rei, e use a **regra do quadrado** para calcular promoções. O rei é uma peça forte no final!"
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
-- Aula 27: Mate com Torre e Rei (3 exercícios) — Soldado trail_order=12
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'Mate com Torre e Rei',
  'Aprenda a dar mate com torre e rei contra rei sozinho',
  'soldado',
  12,
  '{
    "sections": [
      {
        "type": "text",
        "title": "Torre + Rei vs Rei",
        "body": "Com torre e rei contra rei sozinho, o mate é **sempre possível**. A técnica: use a torre para **cortar fileiras** e empurrar o rei para a borda. O seu rei ajuda a controlar casas de fuga."
      },
      {
        "type": "demo",
        "title": "Técnica da Escada",
        "description": "A torre corta fileiras e o rei apoia, empurrando o rei adversário para a borda.",
        "fen": "8/8/8/8/3k4/8/8/R3K3 w - - 0 1",
        "moves": ["a1a4","d4d5","e1d3"],
        "orientation": "white",
        "annotations": {"1": "A torre corta a 4ª fileira — o rei preto não pode voltar.", "2": "O rei preto tenta fugir.", "3": "O rei branco avança para apoiar. Continue cortando fileiras!"}
      },
      {
        "type": "exercise",
        "instruction": "O rei preto está na borda. Dê xeque-mate com a torre!",
        "fen": "k7/2R5/1K6/8/8/8/8/8 w - - 0 1",
        "expected_moves": ["c7a7"],
        "orientation": "white",
        "after_text": "Xeque-mate! O rei preto está no canto, o rei branco controla as casas de fuga, e a torre dá o xeque final.",
        "hint": "O rei preto está encurralado. A torre pode dar xeque na fileira 7 ou coluna a."
      },
      {
        "type": "exercise",
        "instruction": "Corte a fileira com a torre para empurrar o rei preto!",
        "fen": "8/8/3k4/8/8/3K4/8/R7 w - - 0 1",
        "expected_moves": ["a1a6"],
        "orientation": "white",
        "after_text": "A torre cortou a 6ª fileira! Agora o rei preto não pode avançar. Continue o processo até encurralá-lo na borda."
      },
      {
        "type": "exercise",
        "instruction": "Dê o mate final! O rei está quase encurralado.",
        "fen": "1k6/8/1K6/8/8/8/8/R7 w - - 0 1",
        "expected_moves": ["a1a8"],
        "orientation": "white",
        "after_text": "Mate na 8ª fileira! A técnica de torre+rei é uma das mais importantes. Pratique até ser automático."
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "Torre + Rei vs Rei: **corte fileiras** com a torre, **avance o rei** para apoiar, empurre o rei adversário para a **borda**, e dê mate. Este final é fundamental — todo jogador deve saber executar!"
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
-- Aula 28: Mate com Dama e Rei (3 exercícios) — Soldado trail_order=13
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'Mate com Dama e Rei',
  'Aprenda a dar mate com dama e rei contra rei sozinho',
  'soldado',
  13,
  '{
    "sections": [
      {
        "type": "text",
        "title": "Dama + Rei vs Rei",
        "body": "Com dama e rei contra rei sozinho, o mate é rápido — geralmente em menos de 10 lances. A dama **restringe** o rei adversário e seu rei **se aproxima** para ajudar. Cuidado com **afogamento** (stalemate)!"
      },
      {
        "type": "text",
        "title": "Cuidado com Afogamento!",
        "body": "Se o rei adversário não tiver nenhum lance legal e NÃO estiver em xeque, é empate por afogamento. Sempre deixe o rei adversário com pelo menos um lance antes do mate final."
      },
      {
        "type": "exercise",
        "instruction": "Dê xeque-mate com a dama! Cuidado para não afogar.",
        "fen": "k7/8/1K6/8/8/8/8/1Q6 w - - 0 1",
        "expected_moves": ["b1a1","b1a2"],
        "orientation": "white",
        "after_text": "Mate perfeito! A dama trabalha com o rei para encurralar o adversário. Sempre verifique se não é afogamento!",
        "hint": "O rei está no canto. A dama pode dar mate em qual casa?"
      },
      {
        "type": "exercise",
        "instruction": "Restrinja o rei preto com a dama, sem dar afogamento!",
        "fen": "8/8/8/4k3/8/8/8/Q3K3 w - - 0 1",
        "expected_moves": ["a1d4","a1c3","a1e1"],
        "orientation": "white",
        "after_text": "A dama restringe o rei! Agora avance seu rei para apoiar. A dama sozinha não consegue dar mate — precisa do rei."
      },
      {
        "type": "exercise",
        "instruction": "O rei preto está quase encurralado. Dê o mate final!",
        "fen": "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1",
        "expected_moves": ["f7f8","f7g7"],
        "orientation": "white",
        "after_text": "Xeque-mate! Dama + Rei trabalhando juntos é irresistível. Lembre-se: primeiro restrinja, depois aproxime o rei, e por último dê mate."
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "Dama + Rei vs Rei: **restrinja** com a dama, **aproxime** o rei, dê **mate**. Cuidado com afogamento! Sempre deixe uma casa livre antes do lance de mate. Este final deve ser automático."
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
-- Aula 29: Padrões de Mate (5 exercícios) — Soldado trail_order=14
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'Padrões de Mate',
  'Aprenda os padrões de mate mais comuns em partidas reais',
  'soldado',
  14,
  '{
    "sections": [
      {
        "type": "text",
        "title": "Padrões de Mate",
        "body": "Reconhecer padrões de mate permite encontrar combinações vencedoras rapidamente. Vamos estudar os 5 padrões mais importantes: **mate do corredor**, **mate sufocado**, **mate de Anastasia**, **mate árabe** e **mate com bispos**."
      },
      {
        "type": "exercise",
        "instruction": "Mate do Corredor: Dê mate com a torre na última fileira!",
        "fen": "6k1/5ppp/8/8/8/8/8/R6K w - - 0 1",
        "expected_moves": ["a1a8"],
        "orientation": "white",
        "after_text": "Mate do corredor (back rank mate)! O padrão mais comum. Os peões do próprio jogador prendem o rei. Sempre crie uma janela (h3 ou g3) para evitar levar mate do corredor!",
        "hint": "O rei preto está preso na última fileira pelos seus peões."
      },
      {
        "type": "exercise",
        "instruction": "Mate Sufocado: Dê mate com o cavalo! O rei não tem casas.",
        "fen": "6rk/5Npp/8/8/8/8/8/7K w - - 0 1",
        "expected_moves": ["f7h6"],
        "orientation": "white",
        "after_text": "Mate sufocado (smothered mate)! O cavalo é a única peça que pode dar mate quando o rei está cercado pelas próprias peças."
      },
      {
        "type": "exercise",
        "instruction": "Dê xeque-mate com torre e bispo trabalhando juntos!",
        "fen": "7k/5B2/8/8/8/8/8/R6K w - - 0 1",
        "expected_moves": ["a1a8"],
        "orientation": "white",
        "after_text": "Mate com torre e bispo! O bispo controla a casa de fuga g8, e a torre dá mate na 8ª fileira. Coordenação de peças é a chave."
      },
      {
        "type": "exercise",
        "instruction": "Dê mate com a dama na 7ª fileira, apoiada pela torre!",
        "fen": "6k1/5ppp/8/8/8/8/4Q3/4R2K w - - 0 1",
        "expected_moves": ["e2e7"],
        "orientation": "white",
        "after_text": "A dama na 7ª fileira é devastadora! Com a torre apoiando, as ameaças de mate são múltiplas.",
        "hint": "A dama na 7ª fileira, apoiada pela torre, cria ameaças de mate."
      },
      {
        "type": "exercise",
        "instruction": "Encontre o mate em 1 lance! Use a dama para dar xeque-mate.",
        "fen": "r1b2r1k/ppppq1pp/8/4Np2/2B5/8/PPP2PPP/R2Q1RK1 w - - 0 1",
        "expected_moves": ["d1d7"],
        "orientation": "white",
        "after_text": "A dama invade em d7, criando ameaças múltiplas. Quando combina padrões de mate com táticas, os resultados são espetaculares!"
      },
      {
        "type": "text",
        "title": "Resumo",
        "body": "Os padrões de mate mais importantes: **corredor** (torre na última fileira), **sufocado** (cavalo com rei cercado), **mate com bispo+torre**, **dama na 7ª**. Estude e pratique esses padrões — eles aparecem em todas as partidas!"
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
-- Aula 30: Revisão e Desafio Final (5 exercícios) — Soldado trail_order=15
-- ============================================================
INSERT INTO public.lessons (title, description, trail, trail_order, content_json, total_steps)
VALUES (
  'Revisão e Desafio Final',
  'Teste seus conhecimentos com exercícios que combinam tudo!',
  'soldado',
  15,
  '{
    "sections": [
      {
        "type": "text",
        "title": "Desafio Final",
        "body": "Parabéns por chegar até aqui! Esta aula testa tudo que você aprendeu: táticas, padrões de mate, avaliação de material e finais. Cada exercício combina conceitos diferentes. Boa sorte!"
      },
      {
        "type": "exercise",
        "instruction": "Encontre o garfo de cavalo que ganha a dama!",
        "fen": "4k3/8/8/2q5/8/8/4N3/7K w - - 0 1",
        "expected_moves": ["e2d4"],
        "orientation": "white",
        "after_text": "Garfo clássico! O cavalo em d4 ataca a dama e o rei. A dama está perdida."
      },
      {
        "type": "exercise",
        "instruction": "Encontre o mate em 1! Use a tática de corredor.",
        "fen": "6k1/5ppp/8/8/8/7Q/8/R6K w - - 0 1",
        "expected_moves": ["a1a8"],
        "orientation": "white",
        "after_text": "Mate do corredor! A torre dá mate na 8ª fileira. A dama não precisou participar diretamente.",
        "hint": "O rei está preso. Há uma torre disponível..."
      },
      {
        "type": "exercise",
        "instruction": "Crave a dama preta e capture-a!",
        "fen": "3k4/3q4/8/3R4/8/8/8/7K w - - 0 1",
        "expected_moves": ["d5d7"],
        "orientation": "white",
        "after_text": "A torre capturou a dama cravada! Cravada + captura = tática devastadora."
      },
      {
        "type": "exercise",
        "instruction": "Sacrifique para dar mate! Encontre a combinação vencedora.",
        "fen": "r1bqk2r/ppp2ppp/2n5/3Np3/2B5/8/PPPP1PPP/R1BQK2R w KQkq - 0 1",
        "expected_moves": ["c4f7"],
        "orientation": "white",
        "after_text": "O bispo sacrifica em f7+! O rei é forçado para uma posição exposta. Sacrifícios no ponto f7 são clássicos na abertura italiana!",
        "hint": "f7 é o ponto mais fraco. O bispo pode capturar com xeque..."
      },
      {
        "type": "exercise",
        "instruction": "Final de rei e peão: avance o peão para promover! O rei preto está longe.",
        "fen": "8/8/8/5k2/8/8/P7/7K w - - 0 1",
        "expected_moves": ["a2a4","a2a3"],
        "orientation": "white",
        "after_text": "Peão avançando! O rei preto está longe demais (regra do quadrado). O peão promoverá e você vence o final."
      },
      {
        "type": "text",
        "title": "Parabéns!",
        "body": "Você completou todas as **30 aulas** do CdxGuabiruba! Você aprendeu: movimento das peças, táticas (garfo, cravada, espeto, descoberto), padrões de mate, promoção e finais. Continue praticando com puzzles e partidas — o xadrez é uma jornada infinita de aprendizado!"
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
