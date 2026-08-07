STATUS: RASCUNHO — não é fonte de verdade
Base factual: commit 59531326b028f82c4b1fa177222a56dccfb34df0
Objetivo: confrontar a autoridade de servidor prometida pelo doc 02 com o que o repositório de fato tem hoje
Bloqueado por: revisão do Doug/Fable

# Matriz de server-authority da Trilha 1

## Como ler

- Este documento confronta cada promessa do plano com evidência estática. `FATO — MIGRATION` prova intenção versionada, não produção. Nenhum `FATO — BANCO` foi originado.
- O contrato comum é `FATO — PLANO docs/curriculo/02-plano-tecnico-trilha1-v1.md:194-238`: `submission_id`, `UNIQUE`, relógio do banco, RLS, escrita direta revogada, `search_path` fixo e sorteio persistido.
- A cauda comum prometida é `FATO — PLANO docs/curriculo/02-plano-tecnico-trilha1-v1.md:249-265`: RPC própria, progresso de aula, evento de competência, missões diárias e recomputação de patente.
- `FATO — MIGRATION supabase/migrations/20260216180200_rls.sql:59-68,81-93`. Produção: não verificada. As migrations concedem INSERT direto em `user_puzzle_attempts` e INSERT/UPDATE direto em `user_lesson_progress`; portanto elas não provam o modelo “somente RPC” desejado. `EXIGE BANCO` para privilégios efetivos.

## 1. Lição interativa

**ESTADO — SÓ PLANO.** A casa tem o player, o tabuleiro e a RPC de exercício de um lance, mas não o tipo `interactive` nem o contrato de roteiro inteiro.

- **Client envia:** `NOVO` — `{lesson_id, section/step, move_number, move, submission_id}`; o navegador afirma somente o lance e a identidade da tentativa. `FATO — PLANO docs/curriculo/02-plano-tecnico-trilha1-v1.md:278-284`.
- **Servidor carrega:** `NOVO` — aula, seção, roteiro e lances aceitos de `content_json`; não aceitar roteiro ou gabarito enviado pelo client.
- **Servidor valida:** `FATO — PLANO docs/curriculo/02-plano-tecnico-trilha1-v1.md:278-281` — cada lance do aluno contra o roteiro. `FATO — CÓDIGO src/types/lesson.ts:13-17` — a união atual só contém texto, demo e exercício. Logo a promessa não está implementada.
- **Persistência:** `FATO — PLANO docs/curriculo/02-plano-tecnico-trilha1-v1.md:282-286` — reutilizar `user_lesson_progress` para erros/dicas e gravar evento de competência. `FATO — MIGRATION supabase/migrations/20260729120000_patente_por_marcos.sql:367-401`. Produção: não verificada. A RPC atual grava erros, dicas e avanço do exercício, não jogadas do roteiro nem competência.
- **Idempotência:** `NOVO` — `UNIQUE (user_id, submission_id)` na tentativa ou chave equivalente nomeada no contrato. O mecanismo atual usa monotonicidade de `steps_completed`, não recebe `submission_id` (`supabase/migrations/20260729120000_patente_por_marcos.sql:194-194,302-320`).
- **Relógio:** `NOVO` — data da tentativa pelo banco; refresh reinicia a seção por decisão do plano (`docs/curriculo/02-plano-tecnico-trilha1-v1.md:235-238`).
- **Progressão:** `PARCIAL` — `FATO — MIGRATION supabase/migrations/20260729120000_patente_por_marcos.sql:405-440`. Produção: não verificada. A RPC atual pode concluir aula, atualizar missão e patente; a nova superfície ainda não pode acionar essa cauda com segurança nem registrar competência/XP próprios.
- **Escrita direta:** `FATO — MIGRATION supabase/migrations/20260216180200_rls.sql:81-93`. Produção: não verificada. Há políticas de INSERT/UPDATE próprio em `user_lesson_progress`; o plano precisa decidir se as revoga ao passar toda progressão por RPC. `EXIGE BANCO` para o privilégio efetivo.
- **RPC:** `NOVO` — pública para `authenticated`, com `search_path` fixo; helper de concessão permanece privado. `FATO — CÓDIGO src/components/lessons/LessonViewer.tsx:573-579` — hoje o client chama somente `complete_lesson_step`.
- **Reuso real:** `FATO — CÓDIGO src/components/lessons/LessonViewer.tsx:551-579` e `src/components/chess/LessonBoard.tsx:17-45` — player, handler de lance e tabuleiro existem. `FATO — MIGRATION supabase/migrations/20260729120000_patente_por_marcos.sql:194-440`. Produção: não verificada — existe o molde da RPC e sua cauda.
- **Trabalho novo:** tipo `interactive`; execução de roteiro; tentativa/evento de competência; RPC irmã; contagem de seção avaliável; inclusão da RPC no gate da cauda.
- **Gate:** deve reprovar lance fora do roteiro, salto de jogada, retry com `submission_id` que duplica efeito, escrita direta de progresso e conclusão que omite missões/patente.
- **Piloto:** `DEPENDENTE DO PILOTO` — observar se a criança entende a resposta automática e lê a explicação do erro (`docs/curriculo/02-plano-tecnico-trilha1-v1.md:1047-1051`).
- **Decisão:** `DECISÃO` — persistir cada jogada ou só agregado de erros. Alternativa: histórico por jogada versus evento agregado; errar para o agregado elimina diagnóstico, errar para o detalhado aumenta schema e retenção antes de o piloto provar necessidade.

## 2. Prática contra o motor

**ESTADO — SÓ PLANO.** Stockfish e tabuleiro existem no browser; posição, tentativa e avaliador autoritativo não.

- **Client envia:** `FATO — PLANO docs/curriculo/02-plano-tecnico-trilha1-v1.md:781-797` — somente `{attempt_id, pgn, submission_id}` ao avaliador D6.
- **Servidor carrega:** `NOVO` — FEN, objetivo, orçamento e critérios da tentativa persistida; o client não escolhe esses dados (`docs/curriculo/02-plano-tecnico-trilha1-v1.md:772-792`).
- **Servidor valida:** `NOVO` — replay legal do PGN, FEN inicial, objetivo e orçamento. `FATO — MIGRATION supabase/migrations/20260315100000_phase9_teacher_rpcs.sql:767-770`. Produção: não verificada. A esteira de bot hoje só exige PGN com dez caracteres; não reexecuta xadrez.
- **Persistência:** `NOVO` — `pratica_motor_attempts` com histórico de sucesso e fracasso (`docs/curriculo/02-plano-tecnico-trilha1-v1.md:312-314`). Estado parcial não é persistido.
- **Idempotência:** `NOVO` — `UNIQUE (user_id, submission_id)` e retorno do resultado já gravado.
- **Relógio:** banco decide data e duração total plausível; o relógio de jogo roda no client por exceção declarada (`docs/curriculo/02-plano-tecnico-trilha1-v1.md:207-215`).
- **Progressão:** `NOVO` — pode marcar competência como praticada e concluir seção/aula somente após avaliação; não há concessão atual para este formato.
- **Escrita direta:** tabela não existe. `NOVO` — RLS de leitura própria/professor e INSERT/UPDATE direto revogado; `EXIGE BANCO` após migration futura.
- **RPC:** `NOVO` — rota server-side autoritativa chama RPC privada de concessão, com EXECUTE revogado de `anon`, `authenticated` e `PUBLIC` (`docs/curriculo/02-plano-tecnico-trilha1-v1.md:1057-1065`).
- **Reuso real:** `FATO — CÓDIGO src/lib/chess/StockfishEngine.ts:97-115` — `setSkill` e `bestMove` existem. `FATO — CÓDIGO src/app/(main)/bots/[id]/BotGameClient.tsx:385-390,486-516` — o bot usa esses métodos e presets. Isso não é avaliação server-side.
- **Trabalho novo:** seção `engine_practice`; tentativa persistida; avaliador D6; rota autoritativa; RPC privada; eventos de competência e cauda de progresso.
- **Gate:** deve reprovar FEN trocada, PGN ilegal, objetivo não cumprido, orçamento excedido, duração impossível, chamada direta à concessão e retry duplicado.
- **Piloto:** `DEPENDENTE DO PILOTO` — medir Stockfish em celular simples e reduzir força/profundidade se necessário (`docs/curriculo/02-plano-tecnico-trilha1-v1.md:1125-1126`).
- **Decisão:** `DECISÃO` — confiança no adversário do PGN. Alternativa aceita: não provar que o outro lado era Stockfish; alternativa rejeitada por ora: motor no servidor/heurística. Custo de errar: evidência “praticada” pode ser burlada, enquanto endurecer gera custo ou falsos positivos (`docs/curriculo/02-plano-tecnico-trilha1-v1.md:800-817`).

## 3. Quiz

**ESTADO — SÓ PLANO.** O painel e o molde de exercício existem; o tipo e a RPC de quiz não.

- **Client envia:** `NOVO` — `{lesson_id, section, choice, submission_id}`.
- **Servidor carrega:** `NOVO` — pergunta e gabarito do `content_json` da aula.
- **Servidor valida:** `FATO — PLANO docs/curriculo/02-plano-tecnico-trilha1-v1.md:332-334` — alternativa contra gabarito. `FATO — CÓDIGO src/types/lesson.ts:13-17` — `quiz` não integra a união atual.
- **Persistência:** `FATO — PLANO docs/curriculo/02-plano-tecnico-trilha1-v1.md:335-339` — progresso normal e evento de competência. Não há tentativa de quiz no código encontrado.
- **Idempotência:** `NOVO` — `submission_id` único; a RPC atual de passo não recebe essa chave.
- **Relógio:** banco data a tentativa. Para Vale ou Não Vale, timer por rodada fica no client e o servidor valida duração total plausível (`docs/curriculo/02-plano-tecnico-trilha1-v1.md:207-215,340-341`).
- **Progressão:** `NOVO` — acerto deve concluir seção e alimentar progresso/competência; erro só registra, sem conceder.
- **Escrita direta:** usaria `user_lesson_progress`, cujas políticas versionadas permitem escrita própria (`supabase/migrations/20260216180200_rls.sql:81-93`). Produção: não verificada. `EXIGE BANCO` e decisão de revogação.
- **RPC:** `NOVO` — irmã pública de `complete_lesson_step`, com `search_path` fixo e cauda comum.
- **Reuso real:** `FATO — CÓDIGO src/components/lessons/LessonViewer.tsx:573-625` — fluxo de envio, retorno correto e conclusão existe. `FATO — MIGRATION supabase/migrations/20260729120000_patente_por_marcos.sql:194-440`. Produção: não verificada — molde autoritativo de passo existe.
- **Trabalho novo:** tipo, UI de alternativas/explicações, RPC, tentativa/evento, timer total e gate da cauda.
- **Gate:** deve reprovar gabarito enviado pelo client, alternativa inválida, duração impossível no modo cronometrado, duplicação por retry e conclusão sem evento/cauda.
- **Piloto:** `DEPENDENTE DO PILOTO` — observar se lê alternativas ou chuta novamente (`docs/curriculo/02-plano-tecnico-trilha1-v1.md:1049-1051`).
- **Decisão:** `DECISÃO` — manter o modelo de confiança com gabarito legível no client ou endurecer depois. Alternativa: validação server-side com conteúdo ainda entregue ao browser; custo de errar para endurecimento precoce é complexidade sem reduzir leitura do bundle, e para confiança é burla assistida.

## 4. Mini-jogo

**ESTADO — SÓ PLANO.** Não há tipo `minigame`, núcleo comum, tabela de tentativas nem RPC; só peças de xadrez reaproveitáveis.

- **Client envia:** `NOVO` — `{attempt_id, ações mínimas/resultado observável, submission_id}`; nunca meta cumprida como verdade nua.
- **Servidor carrega:** `NOVO` — `game`, config, posição/pool e meta do `content_json`/catálogo.
- **Servidor valida:** `FATO — PLANO docs/curriculo/02-plano-tecnico-trilha1-v1.md:343-348,535-580` — núcleo comum valida meta por família; família C usa avaliador D6. Nada disso existe no código localizado.
- **Persistência:** `NOVO` — `minigame_tentativas`, rodada/config sorteada e evento de competência.
- **Idempotência:** `NOVO` — `UNIQUE (user_id, submission_id)`.
- **Relógio:** banco data tentativa; jogo cronometrado usa relógio client com validação server-side de duração total plausível.
- **Progressão:** `NOVO` — meta validada pode concluir seção/aula e marcar praticada ou consolidada conforme tema visível; não pode conceder patente diretamente.
- **Escrita direta:** tabela não existe. `NOVO` — RLS e escrita direta revogada; `EXIGE BANCO` após implementação.
- **RPC:** `NOVO` — pública para submissão; concessão interna privada nas famílias que passam pela rota D6.
- **Reuso real:** `FATO — CÓDIGO src/components/chess/LessonBoard.tsx:17-45` — tabuleiro de aula existe. `FATO — CÓDIGO src/lib/chess/StockfishEngine.ts:97-115` — engine browser existe para família C. Não há motor comum de mini-jogo.
- **Trabalho novo:** núcleo comum, três famílias, tipo da seção, tentativas, validações, integração de progresso/competência e gates.
- **Gate:** deve reprovar meta declarada pelo client sem replay, config adulterada, rodada fora da tentativa, tempo impossível, retry duplicado e chamada direta à concessão.
- **Piloto:** `DEPENDENTE DO PILOTO` — os balões e checklist são validação humana do piloto, não script (`docs/curriculo/02-plano-tecnico-trilha1-v1.md:580-604`).
- **Decisão:** `DECISÃO` — nível de histórico por toque versus por rodada. Alternativa: persistir só a rodada; custo de errar para granularidade alta é volume/complexidade, e para baixa é perder diagnóstico de usabilidade.

## 5. Bloco de puzzles dentro da aula

**ESTADO — PARCIAL.** A validação de lance, tentativa de puzzle, UI e revanche existem; faltam modo de aula, sorteio persistido e vínculo tentativa↔aula.

- **Client envia:** `FATO — CÓDIGO src/components/chess/PuzzleBoard.tsx:43-53` — o tabuleiro produz resultado da sequência. Para o contrato novo: `NOVO` — tentativa, puzzle da lista e lances, com `submission_id`; não envia denominador nem competência.
- **Servidor carrega:** `FATO — MIGRATION supabase/migrations/20260315100000_phase9_teacher_rpcs.sql:891-912`. Produção: não verificada — `puzzle_attempt` carrega solução do puzzle e compara todos os lances. `NOVO` — carregar também lista persistida, aula, tema×faixa e competência.
- **Servidor valida:** promessa de “cada lance pela esteira existente” é `PARCIAL`: a RPC compara a sequência completa, não pertencimento ao bloco (`supabase/migrations/20260315100000_phase9_teacher_rpcs.sql:908-912`). O modo de aula não está na lista aceita (`:872-874`).
- **Persistência:** `FATO — MIGRATION supabase/migrations/20260315100000_phase9_teacher_rpcs.sql:963-974`. Produção: não verificada — `user_puzzle_attempts` existe. `NOVO` — tentativa de bloco com lista sorteada, denominador e vínculo aula.
- **Idempotência:** `NOVO` — a assinatura atual não recebe `submission_id` (`:837-843`) e cada chamada insere nova tentativa; precisa de chave única por usuário/submissão.
- **Relógio:** `FATO — MIGRATION supabase/migrations/20260315100000_phase9_teacher_rpcs.sql:983-992`. Produção: não verificada — revanche usa `now()`. Bloco novo deve datar/sortear no banco.
- **Progressão:** `PARCIAL` — puzzle atual atualiza rating apenas em `rating` e missões fora de rush (`:914-947,1033-1036`), mas não conclui aula nem cria competência. O bloco só concede após lista completa validada.
- **Escrita direta:** `FATO — MIGRATION supabase/migrations/20260216180200_rls.sql:59-68`. Produção: não verificada — INSERT próprio está declarado. O contrato novo requer tentativa de bloco gravada somente por RPC; `EXIGE BANCO`.
- **RPC:** `FATO — CÓDIGO scripts/verify/security/verify-privileges.ts:149-172` — o gate espera `puzzle_attempt` pública para `authenticated`; o script exige `search_path` em todas as DEFINER (`:84-113`). `NOVO` — iniciar/retomar bloco e estender modo com vínculo validado.
- **Reuso real:** `FATO — CÓDIGO src/components/chess/PuzzleBoard.tsx:43-53`; `FATO — MIGRATION supabase/migrations/20260315100000_phase9_teacher_rpcs.sql:837-912,963-1036`. Produção: não verificada. `FATO — CÓDIGO scripts/verify/security/verify-puzzle-authority.ts:3-8` — existe gate contra call site que envia a solução do banco como resposta.
- **Trabalho novo:** RPC de iniciar/retomar, sorteio tema×faixa, tentativa persistida, modo de aula, vínculo aula/competência, conclusão da seção e cauda.
- **Gate:** deve reprovar puzzle fora da lista, denominador do client, novo sorteio no refresh, modo inválido, solução copiada pelo call site, escrita direta e retry duplicado.
- **Piloto:** nenhuma escolha de autoridade depende de criança; volume e faixa dependem do lastro/autoria, não do piloto.
- **Decisão:** `DECISÃO` — campo na tentativa versus tabela-ponte para vínculo aula (`docs/curriculo/02-plano-tecnico-trilha1-v1.md:368-371`). Custo de errar: campo simples pode não representar bloco/lista; ponte aumenta joins e escopo.

## 6. Bloco de revisão espaçada

**ESTADO — PARCIAL.** A revanche individual tem fila e relógio de banco; não há fila por bloco, tentativa persistida, régua 1→3→7 completa nem nó autoritativo.

- **Client envia:** `NOVO` — `{attempt_id, item_id, resposta, submission_id}`; nunca vencimento, estágio, lista ou denominador.
- **Servidor carrega:** `FATO — MIGRATION supabase/migrations/20260220130000_revanche_progress_sum.sql:38-60`. Produção: não verificada — `get_revanche_due` carrega pendências próprias ordenadas por vencimento. `NOVO` — itens elegíveis, nó, lista persistida e competência.
- **Servidor valida:** `PARCIAL` — puzzle em revanche é validado pela solução do banco; exercício revisável ainda precisa de comparação autoritativa. Montagem 30–45, próximo nó e bloco que não reabre são só plano (`docs/curriculo/02-plano-tecnico-trilha1-v1.md:408-440`).
- **Persistência:** `FATO — MIGRATION supabase/migrations/20260315100000_phase9_teacher_rpcs.sql:976-1029`. Produção: não verificada — `puzzle_revanche_queue` persiste estágio individual. `NOVO` — `revisao_itens`, `revisao_blocos` e tentativa/lista do bloco.
- **Idempotência:** `PARCIAL` — a fila faz upsert por usuário+puzzle (`:983-997`), mas submissões não têm `submission_id` e o bloco não existe.
- **Relógio:** `FATO — MIGRATION supabase/migrations/20260315100000_phase9_teacher_rpcs.sql:1000-1022`. Produção: não verificada — usa `now()`, porém a régua vigente é imediato→1d→3d e resolução no terceiro acerto; o plano exige 1→3→7.
- **Progressão:** `NOVO` — bloco concluído marca consolidação e libera o Desafio; fila atual não conclui seção/aula nem concede patente.
- **Escrita direta:** `FATO — MIGRATION supabase/migrations/20260216180200_rls.sql:238-247`. Produção: não verificada — INSERT/UPDATE próprio na revanche. Novas tabelas devem revogar escrita direta; `EXIGE BANCO`.
- **RPC:** `PARCIAL` — `get_revanche_due` e `puzzle_attempt(mode='revanche')` existem como RPCs públicas; iniciar/retomar/concluir bloco e resposta de exercício são `NOVO`.
- **Reuso real:** `FATO — MIGRATION supabase/migrations/20260220130000_revanche_progress_sum.sql:9-60` e `supabase/migrations/20260315100000_phase9_teacher_rpcs.sql:976-1029`. Produção: não verificada — agenda, ordenação e graduação individual existem; teto 45 e fila por bloco não.
- **Trabalho novo:** elegibilidade declarada, tabelas de item/bloco/tentativa, régua 1→3→7, montagem 45, exercício revisável, consolidação e treino corretivo.
- **Gate:** deve reprovar relógio do client, item não vencido/não elegível, lista mutável, mais de 45, reabertura de bloco, erro que reaparece no mesmo nó, escrita direta e retry duplicado.
- **Piloto:** `DEPENDENTE DO PILOTO` — tamanho e compreensão do nó podem exigir ajuste; contrato de autoridade e relógio não dependem do piloto.
- **Decisão:** `DECISÃO` — menos de 30 abre curto (plano atual) versus bloquear até acumular. Custo de bloquear é travar criança em dia; custo de abrir é amostra pequena e menor estabilidade pedagógica.

## 7. Duelo com missão

**ESTADO — PARCIAL.** Partida, Stockfish, bot Léo e `bot_result` existem; missão, replay e concessão autoritativa não.

- **Client envia:** `FATO — PLANO docs/curriculo/02-plano-tecnico-trilha1-v1.md:781-797` — `{attempt_id, pgn, submission_id}`. `FATO — CÓDIGO src/app/(main)/bots/[id]/BotGameClient.tsx:246-261` — hoje envia bot, resultado, PGN e tempo, sem submission id.
- **Servidor carrega:** `FATO — MIGRATION supabase/migrations/20260315100000_phase9_teacher_rpcs.sql:761-765`. Produção: não verificada — carrega bot. `NOVO` — missão, FEN/objetivo/orçamento e critérios do lance 10.
- **Servidor valida:** `FATO — MIGRATION supabase/migrations/20260315100000_phase9_teacher_rpcs.sql:757-769`. Produção: não verificada — valida enum, bot e comprimento do PGN. `NOVO` — replay, três critérios no lance 10 e vitória.
- **Persistência:** `FATO — MIGRATION supabase/migrations/20260315100000_phase9_teacher_rpcs.sql:796-806`. Produção: não verificada — grava partida/first win. `NOVO` — catálogo `duelo_missoes` e histórico `duelo_missao_resultados` com critérios e referência.
- **Idempotência:** `PARCIAL` — first win usa `ON CONFLICT DO NOTHING`, mas resultado comum depende de rate limit de 30 s (`:786-806`), não de `submission_id`.
- **Relógio:** banco decide `played_at`/data e rate limit (`:786-793`); tempo enviado pelo client não deve decidir missão sozinho.
- **Progressão:** `PARCIAL` — bot atual atualiza missões diárias e first win, mas explicitamente não concede XP (`:820-823`). Missão nova pode marcar competência consolidada e progresso só após replay.
- **Escrita direta:** `FATO — MIGRATION supabase/migrations/20260216180200_rls.sql:104-114`. Produção: não verificada — a tabela de resultados tem política de INSERT próprio; a tabela nova deve negar escrita direta. `EXIGE BANCO`.
- **RPC:** atual `bot_result` é pública. `NOVO` — rota D6 e RPC privada de concessão da missão, com EXECUTE revogado.
- **Reuso real:** `FATO — CÓDIGO src/app/(main)/bots/[id]/BotGameClient.tsx:230-281` — tela gera PGN e chama `bot_result`. `FATO — MIGRATION supabase/migrations/20260315100000_phase9_teacher_rpcs.sql:739-833`. Produção: não verificada — partida e mural/first win existem. A missão não.
- **Trabalho novo:** catálogo/histórico, painel, captura do estado no lance 10, avaliador D6, rota, RPC privada, competência e vínculo à aula.
- **Gate:** deve reprovar resultado declarado incompatível com PGN, critério não cumprido, bot/missão adulterado, chamada pública da concessão, retry duplicado e PGN apenas “longo”.
- **Piloto:** `DEPENDENTE DO PILOTO` — legibilidade do painel e feedback do lance 10; autoridade do replay não depende dele.
- **Decisão:** `DECISÃO` — preservar `bot_result` para os outros nove bots e registrar missão em esteira paralela (plano atual) versus unificar. Custo de unificar é regressão ampla; custo de separar é consistência transacional entre duas referências.

## 8. Desafio Final

**ESTADO — PARCIAL.** Há review gate de 10 exercícios e corte 7, mas o desenho novo exige tentativa persistida de 12, blueprint, corte 10 e críticas.

- **Client envia:** `FATO — CÓDIGO src/components/lessons/ReviewGate.tsx:174-190` — hoje envia trilha e lista inteira `{lesson_id, step_index, move}`. `NOVO` — deve enviar `attempt_id`, respostas a itens já sorteados e `submission_id`, não a seleção/denominador.
- **Servidor carrega:** `FATO — MIGRATION supabase/migrations/20260222100000_phase5_lessons.sql:397-428`. Produção: não verificada — hoje carrega aula/exercício e gabarito para cada item escolhido pelo client. `NOVO` — blueprint, lista persistida, competências críticas e pool por categoria.
- **Servidor valida:** `FATO — MIGRATION supabase/migrations/20260222100000_phase5_lessons.sql:392-435`. Produção: não verificada — compara lances e calcula score, mas o client controla quantidade/denominador e itens; corte é 7. O contrato 12/10/críticas não existe.
- **Persistência:** `FATO — MIGRATION supabase/migrations/20260222100000_phase5_lessons.sql:437-443`. Produção: não verificada — guarda apenas melhor score por usuário/trilha. `NOVO` — histórico, sorteio/lista, respostas, competências e corretivo.
- **Idempotência:** `PARCIAL` — upsert por usuário/trilha impede múltiplas linhas, mas sobrescreve tentativa e não deduplica submissão; `submission_id` é `NOVO`.
- **Relógio:** tentativa atual usa `now()` (`:437-443`). Sorteio/abandono/retry novo também devem usar relógio do banco.
- **Progressão:** `PARCIAL` — aprovação atual influencia desbloqueio, mas não implementa corte 10/12, críticas ou treino corretivo. Não deve conceder aula, XP, missão ou patente a partir de score/denominador do client.
- **Escrita direta:** `FATO — MIGRATION supabase/migrations/20260222100000_phase5_lessons.sql:18-39`. Produção: não verificada — tabela de tentativas tem RLS de SELECT próprio/professor e não declara INSERT direto nesse trecho; escrita ocorre pela RPC. `EXIGE BANCO` para grants efetivos.
- **RPC:** `FATO — MIGRATION supabase/migrations/20260222100000_phase5_lessons.sql:351-451`. Produção: não verificada — `submit_review_gate` é SECURITY DEFINER. `FATO — CÓDIGO scripts/verify/phase5/verify-lessons.ts:138-143` — gate só cobra existência. Nova iniciar/retomar/submeter é `NOVO`.
- **Reuso real:** `FATO — CÓDIGO src/components/lessons/ReviewGate.tsx:174-209`; `FATO — MIGRATION supabase/migrations/20260222100000_phase5_lessons.sql:351-451`. Produção: não verificada — UI, comparação autoritativa e persistência de aprovação existem, mas a tentativa é controlada pelo client.
- **Trabalho novo:** pool 60, blueprint 12, tentativa persistida, corte 10, competências críticas, histórico, corretivo, retry com posições diferentes e gates de lastro/autoridade.
- **Gate:** deve reprovar lista/denominador do client, categoria faltante, item fora da tentativa, crítica errada com aprovação, score 9 aprovado, refresh que resorteia, retry duplicado e escrita direta.
- **Piloto:** `DEPENDENTE DO PILOTO` — treino corretivo e experiência de retry podem mudar após observação; blueprint, corte e autoridade são requisitos prévios.
- **Decisão:** `DECISÃO` — origem de abertura e defesa/empate no pool (livros versus banco quando houver lastro). Custo de errar: pool sem lastro ou bloqueio de autoria; a decisão está remetida ao B0.3 (`docs/curriculo/02-plano-tecnico-trilha1-v1.md:641-641,1285-1286`).

## 9. Conclusão de aula e recompensa (transversal)

**ESTADO — PARCIAL.** A cauda existe para `complete_lesson_step`; não existe contrato que obrigue as futuras RPCs irmãs a usá-la nem gate que as enumere.

- **Client envia:** `FATO — CÓDIGO src/components/lessons/LessonViewer.tsx:573-579` — hoje envia aula, índice, lance e dica. Para novas superfícies, client envia somente tentativa/resposta e `submission_id`; nunca `completed`, XP, missão, competência ou patente.
- **Servidor carrega:** `FATO — MIGRATION supabase/migrations/20260729120000_patente_por_marcos.sql:194-273`. Produção: não verificada — carrega usuário, aula, desbloqueio e progresso. Cada irmã deve carregar o estado autoritativo da sua tentativa e aula.
- **Servidor valida:** `FATO — MIGRATION supabase/migrations/20260729120000_patente_por_marcos.sql:224-405`. Produção: não verificada — passo válido, desbloqueio, sequência e gabarito. Não há validação transversal das novas seções.
- **Persistência:** `FATO — MIGRATION supabase/migrations/20260729120000_patente_por_marcos.sql:367-423`. Produção: não verificada — upsert de progresso, erros/dicas, conclusão e `completed_at=now()`. Eventos de competência são `NOVO`.
- **Idempotência:** `PARCIAL` — passos já resolvidos retornam sem novo efeito (`:302-320`), e recomputação de patente é descrita como idempotente (`:115-185`); não existe `submission_id` para tentativas nem garantia comum nas RPCs futuras.
- **Relógio:** `FATO — MIGRATION supabase/migrations/20260729120000_patente_por_marcos.sql:420-424`. Produção: não verificada — conclusão usa `now()` do banco.
- **Progressão:** `FATO — MIGRATION supabase/migrations/20260729120000_patente_por_marcos.sql:405-440`. Produção: não verificada — conclusão chama missões e patente. XP retornado é zero nesta versão (`:446-453`); concessões adicionais devem permanecer server-side, idempotentes e transacionais.
- **Escrita direta:** `FATO — MIGRATION supabase/migrations/20260216180200_rls.sql:81-93`. Produção: não verificada — INSERT/UPDATE próprio ainda aparece versionado para progresso. O plano exige escrita direta revogada em progresso/competência (`docs/curriculo/02-plano-tecnico-trilha1-v1.md:216-224`). `EXIGE BANCO`.
- **RPC:** `FATO — CÓDIGO scripts/verify/security/verify-privileges.ts:149-172` — gate espera `complete_lesson_step` pública. `FATO — MIGRATION supabase/migrations/20260729120000_patente_por_marcos.sql:182-185`. Produção: não verificada — `recompute_user_title` é privada. As irmãs públicas e seus helpers privados são `NOVO`.
- **Reuso real:** `FATO — MIGRATION supabase/migrations/20260729120000_patente_por_marcos.sql:194-453`. Produção: não verificada — cauda de progresso/missão/patente existe. `FATO — CÓDIGO scripts/verify/phase8/verify-avatar-db.ts:245-261` — o gate vigia apenas `complete_lesson_step`, confirmando a lacuna descrita pelo plano.
- **Trabalho novo:** serviço/contrato comum sem abstração prematura, eventos de competência, lista explícita de RPCs conclusoras no gate, `submission_id` uniforme e revisão dos privilégios de escrita direta.
- **Gate:** deve enumerar toda RPC que conclui seção/aula e reprovar se faltar progresso atômico, evento de competência, `check_daily_missions`, `recompute_user_title`, `search_path`, idempotência ou revogação dos helpers.
- **Piloto:** nenhuma decisão de server-authority depende de criança; métricas e pesos pedagógicos de competência podem ser `DEPENDENTE DO PILOTO`.
- **Decisão:** `DECISÃO` — uma função privada única de conclusão versus cauda repetida nas RPCs irmãs. Alternativa única reduz divergência mas concentra privilégios; repetição reduz acoplamento mas já escapou do gate. Custo de errar é concessão dupla ou superfície sem missão/patente.

## Síntese do confronto

| Superfície | Estado | Promessa que se sustenta | Lacuna de autoridade dominante |
|---|---|---|---|
| Lição interativa | SÓ PLANO | player, tabuleiro e molde de passo | roteiro/tentativa/RPC não existem |
| Prática contra o motor | SÓ PLANO | Stockfish browser e tabuleiro | replay D6 e concessão privada não existem |
| Quiz | SÓ PLANO | fluxo de passo e painel | tipo, tentativa e RPC não existem |
| Mini-jogo | SÓ PLANO | tabuleiro/engine por composição | núcleo, persistência e validação não existem |
| Bloco de puzzles | PARCIAL | solução carregada pelo servidor, tentativa e revanche | lista sorteada/vínculo aula/idempotência não existem |
| Revisão espaçada | PARCIAL | fila individual, ordenação e `now()` | bloco persistido e régua 1→3→7 não existem |
| Duelo com missão | PARCIAL | bot, PGN e resultado persistido | PGN não é reexecutado; missão não existe |
| Desafio Final | PARCIAL | comparação server-side e tentativa agregada | client escolhe lista/denominador; blueprint novo não existe |
| Conclusão/recompensa | PARCIAL | cauda atual de aula/missão/patente | futuras RPCs não estão cobertas por contrato/gate |

## Contagem por rótulo

- `FATO — CÓDIGO`: 18 ocorrências.
- `FATO — MIGRATION`: 37 ocorrências; todas qualificadas como produção não verificada no bloco ou na frase aplicável.
- `FATO — PLANO`: 10 ocorrências.
- `NOVO`: 61 ocorrências.
- `DECISÃO`: 12 ocorrências (inclui as menções explicativas além dos nove campos obrigatórios).
- `DEPENDENTE DO PILOTO`: 8 ocorrências.
- `EXIGE BANCO`: 10 ocorrências.
- `FATO — BANCO`: 0 fatos originados; a única ocorrência anterior desta expressão declara justamente que nenhum foi originado.

As contagens são inventário textual deste rascunho, não medida de cobertura de produção.
