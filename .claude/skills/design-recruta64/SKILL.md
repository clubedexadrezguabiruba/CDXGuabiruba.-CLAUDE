---
name: design-recruta64
description: Regras visuais vinculantes da Academia 64. Use SEMPRE que for criar, redesenhar, estilizar ou revisar qualquer interface deste projeto — tela, componente, layout, cor, tipografia, animação, estado de vazio/erro, ou texto de UI. Também ao trazer tela gerada por v0.app/Gemini para o código.
---

# Design da Academia 64

**Leia `DESIGN.md` na raiz antes de desenhar.** Ele é a fonte; esta skill é só o
gatilho. Se for trabalho de produto e não só de aparência, leia `PRODUCT.md` também.
A lei tonal por trás dos dois é `docs/Academia64_Biblia_Tonal_v2.md`.

> O produto se chama **Academia 64** desde 2026-08-20. O nome desta skill continua
> `design-recruta64` porque é chave de invocação, não texto de aluno.

As regras abaixo são as que mais custam quando quebradas. Nenhuma delas se
descobre olhando o código atual — o app hoje está em Tailwind cru e **não** é
referência de estilo.

1. **A escada de títulos só significa título.** As seis cores vêm de
   `scripts/avatar/patentes.ts` (fonte única, medida por
   `npm run verify:paleta-patentes`): Aprendiz `#78833B` · Estudante `#384966` ·
   Analista `#3E8C81` · Estrategista `#3A55B5` · Mestre `#7A3168` · Grão-Mestre
   `#AEBCCE`. Usar uma delas por gosto apaga o único sinal de progressão do
   produto. E **`#C9B37E` é proibido** — reprovado pelo gate por 3° de matiz.
   Os tokens CSS e o arquivo mantêm o nome antigo (`patente-*`): são chave.

2. **O aluno escolhe DUAS cores no avatar: pele e cabelo. Mais nada recolore.**
   Traje, chapéu, rosto, óculos, pet, fundo, moldura — **cor final, assada no
   desenho** (emenda à D27, permanente). Isso proíbe seletor de cor para qualquer
   outro slot, coluna `avatar_*_color` nova, e `--av-*` nova no SVG (esta última
   tem trava: `svgContrato.ts` reprova). A barba não é exceção — ela é cabelo, e
   recolore com ele. Se um desenho novo "só funciona se der para escolher a cor",
   o desenho está errado, não a regra.

3. **Cinzel só em título de tela e de bloco.** Todo o resto é Inter. Cinzel em
   corpo, botão ou rótulo some no celular. Marfim `#FAF8F3` é o branco do
   produto, não `#FFFFFF`.

4. **375px é o alvo de projeto, não o caso degradado.** Coluna única que cresce,
   nunca grade de desktop que encolhe. Toque de 44px mínimo. Zero overflow
   horizontal. Em tela de prática, ver a posição e fazer o lance **sem rolar**.

5. **Vocabulário da Bíblia Tonal §7 é obrigatório** em título e bloco:
   Saguão, Trilhas, Desafios, Missões do Dia, Revisão da Partida, Quadro de Honra,
   Sequência de Presença, Insígnias, Guarda-roupa, Turmas, Sala de Duelos,
   Matrícula. A navegação principal fica em palavra clara — o tema entra dentro
   da tela, não no menu.
   **Banidas de texto de aluno:** campanha, patente, recruta, companhia, quartel,
   batalha, tropa, reino, "falha tática".

6. **Recompensa só depois do servidor.** XP, baú, level-up e insígnia são reação a
   um fato já concedido por RPC. Nunca animação otimista.

7. **Cor nunca sozinha.** Acerto, erro, bloqueado e concluído levam forma ou
   ícone junto. Produto de xadrez, para crianças; daltonismo é comum.

8. **Prestígio, nunca humilhação** no Quadro de Honra. E **nada de prova social
   fabricada** — não há depoimento, número de usuário nem prêmio. Só contas de
   teste existem.

9. **A direção é "Continuidade"** (decidida em 2026-07-31): navy `#0F1A2E` de
   comando, ouro `#C9A84C` raro, marfim `#FAF8F3` de fundo, Cinzel nos títulos.
   Separação por **fio de 1px tingido**, não por sombra — sombra difusa sobre
   marfim some em celular barato. `rounded-lg` padrão, `rounded-xl` em bloco.
   Superfície plana em repouso; `shadow-glow-gold` só em conquista.

   **Duas direções foram construídas, vistas e descartadas** — não as proponha de
   novo: *Kokeshi* (contorno preto de 2,5px e cor chapada — infantiliza e briga
   com o tabuleiro) e *Patentes* (a tela inteira muda de cor com o degrau — seis
   temas para manter; o nome é o da época em que foi comparada). O `#000000`
   pertence à arte do avatar, **não à interface**.

A referência viva da direção é `src/app/design-lab/VariantA.tsx`. O app atual
**não** é referência: está em Tailwind cru e é o débito a pagar.

## Para ver o que você construiu

O Playwright MCP está instalado. `npm run dev`, depois navegue até
`http://localhost:3000/dev/design` e tire screenshot **em 375px** antes de 1280px.

⚠️ **Nunca rode `npm run test:e2e` nem `npx playwright test`** — eles batem no
Supabase de **produção** e criam usuários reais. Estão bloqueados por `deny` em
`.claude/settings.json`, e o bloqueio é para ficar.
