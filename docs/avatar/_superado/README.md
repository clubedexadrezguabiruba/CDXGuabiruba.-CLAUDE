# Superado — não vale como instrução

Nada nesta pasta é plano vigente. Os documentos foram movidos para cá em
2026-08-03 porque continuavam achaveis por busca com a mesma aparência de
autoridade dos vigentes, e os banners internos deles apontam para um sucessor
que **também** já foi superado (os 00–09 mandam ler o 10; o 10 caiu com o v4).

Ficam guardados como registro do porquê das decisões, não como receita.

**O que vale hoje:** `../15-plano-ate-pronto.md` é o plano de execução e vence
onde divergir de qualquer outro. As decisões e o racional estão em
`../12-avatar-v4-plano-completo.md`; o progresso é marcado em
`../14-backlog-execucao.md`.

| arquivo | o que era | superado por |
|---|---|---|
| `00-avatar-system-overview.md` | visão geral da v2: princípios e subsistemas; o hub que apontava para 01–09 | v4 (`../12`), 2026-07-29 |
| `01-avatar-domain-model.md` | modelo de domínio: body_family, slot, render_mode, anchor_profile, animation_mode | v4 (`../12`), 2026-07-29 |
| `02-avatar-data-model.md` | modelo de dados: schema preservado, config em TS, zero migration | v4 (`../12`), 2026-07-29 |
| `03-render-architecture.md` | arquitetura de render: character-root, render modes, asset resolver | v4 (`../12`), 2026-07-29 |
| `04-body-family-and-template-spec.md` | canvas, regiões e specs por slot da v2 (400×560) | v4 (`../12`), 2026-07-29 |
| `05-asset-generation-playbook.md` | playbook de geração de asset da v2 | v4 (`../12`) e `../16`, 2026-07-31 |
| `06-asset-processing-pipeline.md` | pipeline de processamento de asset da v2 | `../16-uniformes-runbook.md`, 2026-07-31 |
| `07-asset-validation-checklists.md` | checklists de validação de asset da v2 | `../13-checklist-de-verificacao.md`, 2026-07-29 |
| `08-animation-spec.md` | especificação de animação da v2 | v4 (`../12`), 2026-07-29 |
| `09-implementation-backlog.md` | backlog em 7 fases da v2; a Fase 6 (`dressed_base`) nunca deveria ser executada | `../14-backlog-execucao.md`, 2026-07-29 |
| `10-avatar-v3-definitive.md` | o plano v3, que por sua vez superou a v2 | v4 (`../12`), 2026-07-29 |
| `11-checklist-de-decisoes.md` | rascunho das perguntas em aberto antes do v4 | absorvido inteiro por `../12`, 2026-07-29 |

Além destes, a troca de estilo para **kokeshi** decidida em 2026-07-31 invalidou
a geometria de todos eles: o canvas, a pose e as proporções da v2/v3 não valem
mais. Ver `../15-plano-ate-pronto.md` §7.
