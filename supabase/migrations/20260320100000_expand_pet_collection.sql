-- ============================================================
-- Migration: Expansão da Coleção de Pets — 30 Novos Pets
-- ============================================================
-- Adiciona 30 pets ao pool normal de baús, totalizando 37 pets.
-- IDs gerados automaticamente via IDENTITY.
-- Todos entram no pool comum — nenhum é exclusivo de conquista/streak.
-- ============================================================

-- ==================== COMMON (8 novos) ====================
-- Criaturas do Acampamento dos Recrutas

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Ratinho Tático', 'pet', 'common', '/items/pet/ratinho-tatico.png',
        'Rato curioso que fareja perigo no tabuleiro');

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Gatinho do Quartel', 'pet', 'common', '/items/pet/gatinho-quartel.png',
        'Gato listrado que cochila entre as peças no tabuleiro');

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Tartaruga Sentinela', 'pet', 'common', '/items/pet/tartaruga-sentinela.png',
        'Tartaruga com casco em padrão preto e branco');

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Pombo Mensageiro', 'pet', 'common', '/items/pet/pombo-mensageiro.png',
        'Pombo fiel que entrega bilhetes de campanha');

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Coelhinho Escudeiro', 'pet', 'common', '/items/pet/coelhinho-escudeiro.png',
        'Coelho com elmo de madeira e escudo de peão');

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Joaninha Escoteira', 'pet', 'common', '/items/pet/joaninha-escoteira.png',
        'Joaninha brilhante que explora o campo antes de cada lance');

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Sapo Saltador', 'pet', 'common', '/items/pet/sapo-saltador.png',
        'Sapo verde que pula de casa em casa como um cavalo');

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Esquilo Vigília', 'pet', 'common', '/items/pet/esquilo-vigilia.png',
        'Esquilo que vigia o campo do topo de uma torre');

-- ==================== RARE (8 novos) ====================
-- Criaturas da Vila dos Soldados e Fortaleza

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Falcão de Prata', 'pet', 'rare', '/items/pet/falcao-prata.png',
        'Falcão veloz que patrulha as diagonais como um bispo');

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Lobo da Fronteira', 'pet', 'rare', '/items/pet/lobo-fronteira.png',
        'Lobo cinzento que protege a retaguarda do exército');

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Corvo do Conselho', 'pet', 'rare', '/items/pet/corvo-conselho.png',
        'Corvo negro que sussurra táticas ao ouvido do comandante');

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Raposa Astuta', 'pet', 'rare', '/items/pet/raposa-astuta.png',
        'Raposa ágil especialista em emboscadas e gambitos');

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Caranguejo Muralha', 'pet', 'rare', '/items/pet/caranguejo-muralha.png',
        'Caranguejo com pinças em forma de torre que defende a base');

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Serpente de Jade', 'pet', 'rare', '/items/pet/serpente-jade.png',
        'Serpente elegante que desliza entre as casas silenciosamente');

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Borboleta Tática', 'pet', 'rare', '/items/pet/borboleta-tatica.png',
        'Borboleta com asas em padrão xadrez preto e branco');

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Cervo do Bosque', 'pet', 'rare', '/items/pet/cervo-bosque.png',
        'Cervo com chifres ramificados que lembram peças no tabuleiro');

-- ==================== EPIC (8 novos) ====================
-- Criaturas da Fortaleza dos Estrategistas e Cidade dos Generais

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Unicórnio de Ametista', 'pet', 'epic', '/items/pet/unicornio-ametista.png',
        'Unicórnio roxo que salta em L como um cavalo mágico');

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Tigre de Obsidiana', 'pet', 'epic', '/items/pet/tigre-obsidiana.png',
        'Tigre negro com olhos que brilham ao calcular variantes');

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Águia Imperial', 'pet', 'epic', '/items/pet/aguia-imperial.png',
        'Águia dourada com visão completa do campo de batalha');

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Polvo Arcano', 'pet', 'epic', '/items/pet/polvo-arcano.png',
        'Polvo com oito tentáculos que controlam oito casas ao redor');

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Leão de Safira', 'pet', 'epic', '/items/pet/leao-safira.png',
        'Leão azulado com juba cristalina que ruge antes do xeque');

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Loba Espectral', 'pet', 'epic', '/items/pet/loba-espectral.png',
        'Loba translúcida que aparece e desaparece entre as fileiras');

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Salamandra Flamejante', 'pet', 'epic', '/items/pet/salamandra-flamejante.png',
        'Salamandra de fogo que aquece as peças aliadas');

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Pégaso de Bronze', 'pet', 'epic', '/items/pet/pegaso-bronze.png',
        'Cavalo alado que voa pelo tabuleiro em jogadas decisivas');

-- ==================== LEGENDARY (6 novos) ====================
-- Criaturas da Cidadela dos Mestres

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Hidra do Trono', 'pet', 'legendary', '/items/pet/hidra-trono.png',
        'Hidra de três cabeças coroadas que guarda o rei');

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Quimera Real', 'pet', 'legendary', '/items/pet/quimera-real.png',
        'Criatura mística com corpo de leão, asas de águia e cauda de serpente');

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Esfinge dos Segredos', 'pet', 'legendary', '/items/pet/esfinge-segredos.png',
        'Esfinge que guarda os mistérios das aberturas ancestrais');

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Leviatã das Profundezas', 'pet', 'legendary', '/items/pet/leviata-profundezas.png',
        'Serpente marinha colossal com escamas que refletem o tabuleiro');

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Golem de Marfim', 'pet', 'legendary', '/items/pet/golem-marfim.png',
        'Guardião esculpido em marfim de peça ancestral com olhos de rubi');

INSERT INTO public.items (name, slot, rarity, image_url, description)
VALUES ('Basilisco Real', 'pet', 'legendary', '/items/pet/basilisco-real.png',
        'Serpente coroada com olhar que petrifica oponentes no tabuleiro');
