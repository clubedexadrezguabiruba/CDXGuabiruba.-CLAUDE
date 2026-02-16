-- ============================================================
-- FASE 2 — SEED DATA (2.19)
-- 10 bots + achievements base + itens base + daily_missions pool
-- ============================================================

-- ============================================================
-- 10 BOTS (conforme Visão do Produto seção 7.2)
-- ============================================================
INSERT INTO public.bots (name, personality, elo, skill_level, depth, avatar_url, unlock_order, phrases_json) VALUES
(
  'Peãozinho', 'Distraído, erra muito, encoraja o aluno', 250, 0, 1,
  '/bots/peaozinho.png', 1,
  '{"pre_game":["Oi! Vamos jogar? Eu sou meio distraído...","Ah, uma partida! Tomara que eu lembre as regras!"],"during":["Hmm... era pra lá?","Ops, acho que errei de novo!","Você joga bem!"],"on_win":["Boa! Você me pegou fácil!","Parabéns! Eu nem vi esse lance!"],"on_loss":["Opa, ganhei! Mas foi sorte, hein!","Ih, parece que dessa vez eu acertei!"]}'
),
(
  'Torrinha', 'Tímido, joga devagar, comenta lances', 400, 1, 2,
  '/bots/torrinha.png', 2,
  '{"pre_game":["O-oi... posso jogar com você?","Vou tentar fazer meu melhor..."],"during":["Esse lance foi bom...","Hmm, deixa eu pensar...","Ui, cuidado com minha torre!"],"on_win":["Você jogou muito bem!","Foi uma partida legal!"],"on_loss":["D-desculpa... acho que ganhei...","Foi sem querer!"]}'
),
(
  'Cavalinho', 'Brincalhão, adora garfos', 550, 3, 3,
  '/bots/cavalinho.png', 3,
  '{"pre_game":["Vamos pular! Digo, jogar!","Cuidado com meus garfos! Hehe!"],"during":["Garfo! Garfo! Garfo!","Pula aqui, pula ali!","Haha, não me alcança!"],"on_win":["Boa! Me pegou no pulo!","Preciso pular mais rápido!"],"on_loss":["Garfo na cara! Hehe!","Pulei na casa certa!"]}'
),
(
  'Bispo Sábio', 'Calmo, filosófico, dá dicas', 700, 5, 4,
  '/bots/bispo-sabio.png', 4,
  '{"pre_game":["O xadrez é como a vida: cada lance conta.","Vamos pensar juntos nesta partida."],"during":["Observe as diagonais...","Paciência é uma virtude no xadrez.","Interessante lance..."],"on_win":["Sabedoria vem com a prática.","Excelente! Você aprendeu bem."],"on_loss":["A experiência é a melhor professora.","Continue estudando, jovem."]}'
),
(
  'Rainha Valente', 'Corajosa, joga agressivamente', 900, 7, 5,
  '/bots/rainha-valente.png', 5,
  '{"pre_game":["Preparado para batalha?","Eu não tenho medo de nada!"],"during":["Ataque! Ataque!","Vou te pegar!","Nada me para!"],"on_win":["Boa luta, guerreiro!","Você me venceu com honra!"],"on_loss":["A vitória é minha!","Sou a mais poderosa do tabuleiro!"]}'
),
(
  'Guardião', 'Defensivo, posicional', 1100, 9, 6,
  '/bots/guardiao.png', 6,
  '{"pre_game":["Minha defesa é impenetrável.","Tente me quebrar, se conseguir."],"during":["Defesa sólida.","Você não vai passar.","Protegendo o rei..."],"on_win":["Achei uma brecha na minha muralha!","Bem jogado, atacante."],"on_loss":["Muralha intacta.","Ninguém passa pelo Guardião."]}'
),
(
  'Estrategista', 'Frio, calculista', 1300, 11, 7,
  '/bots/estrategista.png', 7,
  '{"pre_game":["Já calculei 10 lances à frente.","Números não mentem."],"during":["Previsto.","Interessante, mas ineficiente.","Calculando..."],"on_win":["Erro no meu cálculo. Impressionante.","Variável imprevista. Parabéns."],"on_loss":["Conforme calculado.","Probabilidade de vitória: 100%."]}'
),
(
  'Mestre da Torre', 'Especialista em finais', 1500, 13, 8,
  '/bots/mestre-torre.png', 8,
  '{"pre_game":["O jogo de verdade começa no final.","Torres e peões... minha especialidade."],"during":["O final se aproxima...","Ativando a torre.","Peões são a alma do xadrez."],"on_win":["Belo final! Philidor ficaria orgulhoso.","Dominaste o final. Respeito."],"on_loss":["No final, a torre é rainha.","Técnica apurada vence sempre."]}'
),
(
  'General Sombrio', 'Intimidador, pressiona', 1700, 15, 9,
  '/bots/general-sombrio.png', 9,
  '{"pre_game":["Trema diante do General.","Não há misericórdia no tabuleiro."],"during":["Pressão.","Sente o aperto?","Sem saída."],"on_win":["Impossível... um mero aluno?","Você tem a coragem de um General."],"on_loss":["O General não perdoa.","Rendição aceita."]}'
),
(
  'Arquimago', 'Misterioso, joga quase perfeito', 1900, 17, 10,
  '/bots/arquimago.png', 10,
  '{"pre_game":["Os mistérios do tabuleiro se revelam a poucos.","Prepare-se para o desconhecido."],"during":["Magia...","Você vê, mas não compreende.","O tabuleiro fala comigo."],"on_win":["Impossível! Você quebrou meu feitiço!","Um prodígio... admirável."],"on_loss":["A magia prevalece.","Poucos sobrevivem ao Arquimago."]}'
);

-- ============================================================
-- ACHIEVEMENTS BASE (conforme Visão do Produto seção 8.4)
-- ============================================================
INSERT INTO public.achievements (key, title, description, condition_type, condition_value, reward_xp, icon) VALUES
-- Bots
('defeat_first_bot', 'Primeira Vitória', 'Derrote seu primeiro bot', 'bots_defeated', 1, 100, 'sword'),
('defeat_5_bots', 'Caçador de Bots', 'Derrote 5 bots diferentes', 'bots_defeated_unique', 5, 300, 'target'),
('defeat_all_10_bots', 'Mestre dos Bots', 'Derrote todos os 10 bots', 'bots_defeated_unique', 10, 1000, 'crown'),
-- Puzzles
('solve_100_puzzles', 'Centurião', 'Resolva 100 puzzles', 'puzzles_solved', 100, 200, 'puzzle'),
('solve_500_puzzles', 'Mestre dos Puzzles', 'Resolva 500 puzzles', 'puzzles_solved', 500, 500, 'brain'),
('rating_800', 'Rating 800', 'Alcance rating 800 em puzzles', 'rating_reached', 800, 200, 'trending-up'),
('rating_1200', 'Rating 1200', 'Alcance rating 1200 em puzzles', 'rating_reached', 1200, 500, 'zap'),
('streak_10_rating', 'Imparável', 'Streak de 10 no Modo Rating', 'puzzle_streak', 10, 200, 'flame'),
-- Aulas
('complete_10_lessons', 'Estudioso', 'Complete 10 aulas', 'lessons_completed', 10, 300, 'book-open'),
('complete_30_lessons', 'Erudito', 'Complete todas as 30 aulas (v1)', 'lessons_completed', 30, 1000, 'graduation-cap'),
-- Rush
('rush_15_correct', 'Rush Relâmpago', 'Puzzle Rush: 15+ acertos', 'rush_score', 15, 300, 'zap'),
-- Níveis
('reach_level_10', 'Nível 10', 'Alcance nível 10', 'level_reached', 10, 100, 'star'),
('reach_level_25', 'Nível 25', 'Alcance nível 25', 'level_reached', 25, 250, 'star'),
('reach_level_50', 'Nível 50', 'Alcance nível 50', 'level_reached', 50, 500, 'award'),
-- Streak de dias
('streak_7_days', 'Uma Semana!', 'Alcance streak de 7 dias', 'day_streak', 7, 200, 'flame'),
('streak_14_days', 'Duas Semanas!', 'Alcance streak de 14 dias', 'day_streak', 14, 300, 'flame'),
('streak_30_days', 'Um Mês!', 'Alcance streak de 30 dias', 'day_streak', 30, 500, 'flame');

-- ============================================================
-- ITENS BASE (~50 itens, distribuídos por slot e raridade)
-- ============================================================

-- Cabeça (head) — 8 itens
INSERT INTO public.items (name, slot, rarity, image_url, description) VALUES
('Boné de Peão', 'head', 'common', '/items/head/bone-peao.png', 'Um boné simples com um peão bordado'),
('Bandana Tática', 'head', 'common', '/items/head/bandana-tatica.png', 'Bandana para pensar melhor'),
('Elmo de Cavaleiro', 'head', 'rare', '/items/head/elmo-cavaleiro.png', 'Elmo brilhante de cavaleiro'),
('Óculos de Estrategista', 'head', 'rare', '/items/head/oculos-estrategista.png', 'Óculos que revelam as diagonais'),
('Tiara da Rainha', 'head', 'epic', '/items/head/tiara-rainha.png', 'Tiara cravejada de cristais'),
('Coroa Sombria', 'head', 'epic', '/items/head/coroa-sombria.png', 'Coroa misteriosa com aura escura'),
('Coroa do Rei Dourado', 'head', 'legendary', '/items/head/coroa-rei-dourado.png', 'A lendária coroa de ouro puro'),
('Capuz do Arquimago', 'head', 'legendary', '/items/head/capuz-arquimago.png', 'Capuz que brilha com sabedoria ancestral');

-- Roupa (outfit) — 8 itens
INSERT INTO public.items (name, slot, rarity, image_url, description) VALUES
('Uniforme de Aprendiz', 'outfit', 'common', '/items/outfit/uniforme-aprendiz.png', 'Uniforme básico de aprendiz de xadrez'),
('Camiseta do Clube', 'outfit', 'common', '/items/outfit/camiseta-clube.png', 'Camiseta oficial do CdxGuabiruba'),
('Túnica Azul', 'outfit', 'rare', '/items/outfit/tunica-azul.png', 'Túnica elegante em tom azul royal'),
('Armadura Leve', 'outfit', 'rare', '/items/outfit/armadura-leve.png', 'Armadura de treinamento'),
('Veste de Mago', 'outfit', 'epic', '/items/outfit/veste-mago.png', 'Veste encantada com runas de xadrez'),
('Armadura Real', 'outfit', 'epic', '/items/outfit/armadura-real.png', 'Armadura digna da guarda real'),
('Manto Lendário', 'outfit', 'legendary', '/items/outfit/manto-lendario.png', 'Manto que brilha com a aura de mil partidas'),
('Armadura do Grande Mestre', 'outfit', 'legendary', '/items/outfit/armadura-gm.png', 'Armadura forjada nas chamas da sabedoria');

-- Mão (hand) — 8 itens
INSERT INTO public.items (name, slot, rarity, image_url, description) VALUES
('Peão de Madeira', 'hand', 'common', '/items/hand/peao-madeira.png', 'Um peão de madeira para dar sorte'),
('Relógio Simples', 'hand', 'common', '/items/hand/relogio-simples.png', 'Relógio de xadrez portátil'),
('Espada-Peão', 'hand', 'rare', '/items/hand/espada-peao.png', 'Espada em forma de peão'),
('Escudo de Torre', 'hand', 'rare', '/items/hand/escudo-torre.png', 'Escudo sólido como uma torre'),
('Cetro da Rainha', 'hand', 'epic', '/items/hand/cetro-rainha.png', 'Cetro poderoso da rainha'),
('Livro dos Gambitos', 'hand', 'epic', '/items/hand/livro-gambitos.png', 'Livro antigo com todos os gambitos'),
('Cetro do Rei', 'hand', 'legendary', '/items/hand/cetro-rei.png', 'Cetro dourado com poder absoluto'),
('Orbe de Sabedoria', 'hand', 'legendary', '/items/hand/orbe-sabedoria.png', 'Orbe que brilha com o conhecimento de mil mestres');

-- Fundo (background) — 8 itens
INSERT INTO public.items (name, slot, rarity, image_url, description) VALUES
('Sala de Aula', 'background', 'common', '/items/bg/sala-aula.png', 'Uma sala de aula aconchegante'),
('Parque', 'background', 'common', '/items/bg/parque.png', 'Mesa de xadrez no parque'),
('Biblioteca Antiga', 'background', 'rare', '/items/bg/biblioteca.png', 'Biblioteca repleta de livros de xadrez'),
('Torneio', 'background', 'rare', '/items/bg/torneio.png', 'Salão de um grande torneio'),
('Castelo Medieval', 'background', 'epic', '/items/bg/castelo.png', 'Interior de um castelo imponente'),
('Tabuleiro Gigante', 'background', 'epic', '/items/bg/tabuleiro-gigante.png', 'Um tabuleiro gigante mágico'),
('Céu Estrelado', 'background', 'legendary', '/items/bg/ceu-estrelado.png', 'Xadrez entre as estrelas'),
('Dimensão Xadrez', 'background', 'legendary', '/items/bg/dimensao-xadrez.png', 'Uma dimensão onde tudo é xadrez');

-- Moldura (frame) — 8 itens
INSERT INTO public.items (name, slot, rarity, image_url, description) VALUES
('Moldura de Madeira', 'frame', 'common', '/items/frame/madeira.png', 'Moldura simples de madeira'),
('Moldura Cinza', 'frame', 'common', '/items/frame/cinza.png', 'Moldura em tom cinza elegante'),
('Moldura de Bronze', 'frame', 'rare', '/items/frame/bronze.png', 'Moldura de bronze reluzente'),
('Moldura de Prata', 'frame', 'rare', '/items/frame/prata.png', 'Moldura prateada refinada'),
('Moldura de Ouro', 'frame', 'epic', '/items/frame/ouro.png', 'Moldura dourada imponente'),
('Moldura de Cristal', 'frame', 'epic', '/items/frame/cristal.png', 'Moldura de cristal brilhante'),
('Moldura de Diamante', 'frame', 'legendary', '/items/frame/diamante.png', 'Moldura de diamante cintilante'),
('Moldura Ancestral', 'frame', 'legendary', '/items/frame/ancestral.png', 'Moldura lendária com runas antigas');

-- Pets — 7 itens (conforme Visão do Produto seção 9.4)
INSERT INTO public.items (name, slot, rarity, image_url, description) VALUES
('Peãozinho de Madeira', 'pet', 'common', '/items/pet/peaozinho-madeira.png', 'Peão simpático que segue o aluno'),
('Cavalo de Bronze', 'pet', 'rare', '/items/pet/cavalo-bronze.png', 'Cavalo em miniatura que galopa ao lado'),
('Coruja Sábia', 'pet', 'rare', '/items/pet/coruja-sabia.png', 'Coruja com óculos que pousa no ombro'),
('Dragão de Cristal', 'pet', 'epic', '/items/pet/dragao-cristal.png', 'Pequeno dragão translúcido que voa ao redor'),
('Fênix Dourada', 'pet', 'epic', '/items/pet/fenix-dourada.png', 'Fênix brilhante com trilha de faíscas'),
('Rei Espectral', 'pet', 'legendary', '/items/pet/rei-espectral.png', 'Fantasma de rei com coroa flutuante'),
('Grifo Ancestral', 'pet', 'legendary', '/items/pet/grifo-ancestral.png', 'Grifo majestoso com armadura dourada');
