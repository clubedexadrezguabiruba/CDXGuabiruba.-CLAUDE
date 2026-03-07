-- ============================================================
-- MIGRAÇÃO: Novo canon dos bots (10 primeiros)
-- Adiciona colunas slug, epithet, stage, emoji
-- Substitui seeds antigos pelos 10 bots do novo canon
-- ============================================================

-- 1. Novas colunas
ALTER TABLE public.bots ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE public.bots ADD COLUMN IF NOT EXISTS epithet text;
ALTER TABLE public.bots ADD COLUMN IF NOT EXISTS stage text;
ALTER TABLE public.bots ADD COLUMN IF NOT EXISTS emoji text;

-- 2. Limpar bots antigos (banco dev-only)
DELETE FROM public.bots;

-- 3. Inserir 10 bots do novo canon
INSERT INTO public.bots (slug, name, personality, epithet, stage, emoji, elo, skill_level, depth, avatar_url, unlock_order, phrases_json) VALUES
(
  'leo', 'Léo', 'Acolhedor, comemora seus acertos e trata a partida como treino entre colegas.',
  'o Companheiro de Tenda', 'Acampamento dos Recrutas', '⚔', 250, 0, 1,
  '', 1,
  '{"pre_game":["Opa, não vi esse seu bispo aí. Boa leitura, recruta.","E aí, parceiro! Bora treinar?","Ainda tô aprendendo, mas vamos nessa!"],"during":["Opa, boa jogada!","Hmm, não vi essa peça ali...","Calma, deixa eu pensar...","Eita, minha dama ficou solta!"],"on_win":["Boa! Você me pegou fácil!","Parabéns, recruta! Mandou bem!"],"on_loss":["Opa, ganhei! Mas foi sorte, viu?","Hmm, acho que acertei sem querer!"]}'
),
(
  'skippy', 'Skippy', 'Ansioso e esforçado, quer provar valor mas se atrapalha no processo.',
  'o Magrinho', 'Acampamento dos Recrutas', '🛡', 400, 1, 2,
  '', 2,
  '{"pre_game":["A armadura tá pesada… e meu cavalo ficou solto de novo.","Dessa vez eu não vou derrubar a espada, prometo!","Vamos lá, eu treinei ontem à noite!"],"during":["Ai, empurrei o peão longe demais...","Espera, meu rei tá seguro?","Opa, esqueci de proteger!","Ih, parece que abri um buraco..."],"on_win":["Poxa, você me venceu mesmo? Boa!","Eu tentei, mas você foi melhor!"],"on_loss":["Funcionou! Não acredito que deu certo!","Eba, ganhei! Acho que tô melhorando!"]}'
),
(
  'tome', 'Tomé', 'Entusiasmado demais, técnica de menos. Sempre atacando.',
  'o Porta-Bandeira', 'Acampamento dos Recrutas', '🚩', 550, 2, 3,
  '', 3,
  '{"pre_game":["Para frente. A bandeira nunca recua.","Hoje o estandarte avança!","Não tem recuo nesta companhia!"],"during":["Avante! Avante!","Eu nunca recuo uma peça!","Atacar é a melhor defesa!","A bandeira não pode parar!"],"on_win":["Bela carga, recruta! Me derrubou!","Você avançou com firmeza. Respeito!"],"on_loss":["A bandeira segue em pé!","Quem não avança, não conquista!"]}'
),
(
  'sargento-pardo', 'Sargento Pardo', 'Firme e didático, cobra o básico com respeito.',
  'o Primeiro Teste', 'Acampamento dos Recrutas', '🎖', 700, 4, 4,
  '', 4,
  '{"pre_game":["Todo mestre já sentou nessa mesma mesa. Mostre sua base, soldado.","Recruta, aqui começa o teste de verdade.","Vamos ver se você aprendeu o básico."],"during":["Desenvolva suas peças, soldado.","Centro. Sempre o centro.","Atenção ao tabuleiro inteiro.","Não entregue peças de graça."],"on_win":["Aprovado, soldado. Pode seguir.","Base sólida. Parabéns."],"on_loss":["Revise os fundamentos, recruta.","A base não estava firme. Tente novamente."]}'
),
(
  'iris', 'Íris', 'Direta, rápida e sempre um passo adiante. Usa armadilhas de abertura.',
  'a Batedora', 'Vila dos Soldados', '🧭', 850, 6, 5,
  '', 5,
  '{"pre_game":["A informação é a melhor defesa. Eu já vi por onde você quer passar.","Olhos atentos, soldado. A trilha tem armadilhas.","Eu conheço cada atalho deste campo."],"during":["Cuidado com a ordem dos lances.","Eu já vi esse truque antes.","A abertura conta mais do que parece.","Preste atenção nos primeiros passos."],"on_win":["Bom olho, soldado. Me surpreendeu.","Você escapou das minhas armadilhas. Bem feito."],"on_loss":["A trilha era mais perigosa do que você pensava.","Informação é poder, soldado."]}'
),
(
  'breno', 'Breno', 'Trabalhador, paciente, difícil de abalar. Defesa sólida.',
  'o Ferreiro', 'Vila dos Soldados', '⚒', 1000, 8, 6,
  '', 6,
  '{"pre_game":["Uma boa defesa se faz no fogo e na paciência. Bata o quanto quiser.","A bigorna não reclama dos golpes.","Pode pressionar. Eu aguento."],"during":["Minha estrutura está firme.","Paciência vence pressa.","Bata mais forte, se conseguir.","Eu não me abalo fácil."],"on_win":["Você encontrou a rachadura na minha forja. Mérito seu.","Belo golpe. Nem toda defesa aguenta."],"on_loss":["A paciência venceu a pressa.","O ferro resiste quando bem forjado."]}'
),
(
  'silas', 'Silas', 'Calculista, gosta de linhas longas e ameaças invisíveis.',
  'o Arqueiro', 'Vila dos Soldados', '🏹', 1150, 10, 7,
  '', 7,
  '{"pre_game":["Nem toda ameaça vem de frente. Algumas já cruzam o tabuleiro inteiro.","Da minha torre eu vejo tudo.","Linhas longas, mira precisa."],"during":["Cuidado com as diagonais.","Uma cravada pode mudar tudo.","Você não viu meu bispo ali, viu?","Pressão à distância."],"on_win":["Boa mira, soldado. Me acertou.","Você aprendeu a olhar longe. Respeito."],"on_loss":["A flecha já estava no ar.","Quem não vê a diagonal, cai nela."]}'
),
(
  'capita-lucia', 'Capitã Lúcia', 'Exigente, firme e precisa. Jogo clássico e central.',
  'a Disciplina', 'Vila dos Soldados', '🌟', 1300, 12, 8,
  '', 8,
  '{"pre_game":["Menos impulso, soldado. O campo exige leitura, não pressa.","Disciplina vence talento sem preparo.","Mostre-me princípios, não truques."],"during":["Sem improvisos, soldado.","Centralize. Desenvolva. Proteja.","Esse lance foi precipitado.","Princípios corretos, sempre."],"on_win":["Disciplina nota dez, soldado. Aprovado.","Você jogou com método. Parabéns."],"on_loss":["Faltou disciplina, soldado.","Princípios ignorados, resultado previsível."]}'
),
(
  'cassio', 'Cássio', 'Acadêmico, trata teoria como linguagem nobre. Alta precisão na abertura.',
  'o Estudioso', 'Fortaleza dos Estrategistas', '📜', 1450, 13, 9,
  '', 9,
  '{"pre_game":["A abertura é uma promessa. Veja se consegue honrá-la.","Os pergaminhos dizem muito sobre sua próxima jogada.","Teoria não é luxo. É fundamento."],"during":["Esse lance não está nos livros.","Variante interessante, mas imprecisa.","A teoria recomenda outra coisa.","Estude mais, aspirante."],"on_win":["Você trouxe algo que os livros não previram. Impressionante.","Belo repertório. Mérito acadêmico."],"on_loss":["A teoria prevalece.","Os clássicos não falham, aspirante."]}'
),
(
  'helena', 'Helena', 'Visionária, pensa em casas, espaço e rotas. Jogo posicional puro.',
  'a Cartógrafa', 'Fortaleza dos Estrategistas', '🗺', 1600, 14, 10,
  '', 10,
  '{"pre_game":["Não olhe apenas para as peças. Olhe para o chão que elas conquistam.","O mapa do tabuleiro muda a cada lance.","Espaço é poder, aspirante."],"during":["Você está perdendo território.","Casa a casa, o cerco se fecha.","Mobilidade restrita. Cuidado.","O espaço conta mais que as peças."],"on_win":["Você redesenhou o mapa. Bela conquista.","Controle territorial impecável. Parabéns."],"on_loss":["O território era meu desde o início.","Quem domina o espaço, domina o jogo."]}'
);
