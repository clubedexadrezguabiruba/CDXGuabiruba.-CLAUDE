/**
 * O PRÓXIMO TÍTULO — o degrau seguinte da escada, e se ele pode ser prometido.
 *
 * POR QUE ESTE ARQUIVO EXISTE
 *
 * A escada de títulos é a espinha aspiracional da Academia, e até 2026-08-23 o
 * aluno **não a via**: nenhuma tela dizia para onde ele estava indo. Havia duas
 * barras de progresso no produto (XP até o próximo nível, dias até o próximo
 * marco de sequência) e nenhuma para a única progressão que a Bíblia chama de
 * "reconhecimento público de estudo feito". Era a lacuna G3 da revisão temática.
 *
 * A LEI DO RITMO (Bíblia Tonal v2 §12.9) diz como mostrar, e é ela que este
 * módulo implementa:
 *
 *   - o destino é SEMPRE nomeado — o aluno sabe para qual título estuda;
 *   - a contagem só aparece na RETA FINAL. "Faltam 26" não é meta para um aluno
 *     de 7 anos; é muro. Perto do fim, o mesmo número vira sprint;
 *   - a progressão é lenta de propósito (26 aulas ≈ um semestre), e ritmo lento
 *     cobra que o destino seja visível: lento **e** invisível não é escola, é o
 *     aluno remando sem ver a margem.
 *
 * A TRAVA, E POR QUE ELA É A PARTE IMPORTANTE
 *
 * O banco tem 30 das 126 aulas planejadas: as trilhas 3 a 7 existem no CHECK de
 * `lessons.trail` **sem uma aula sequer**. Prometer "faltam 4 aulas para
 * Analista" numa trilha vazia é pior do que não prometer nada — o aluno vai
 * atrás e encontra o vácuo.
 *
 * Por isso o estado `sem-conteudo`: o título continua nomeado (saber que a
 * escada segue é o que a torna aspiracional), mas **nenhum número é mostrado** e
 * a tela diz que a trilha ainda vai abrir. A promessa some sozinha no dia em que
 * a trilha ganhar a primeira aula — sem ninguém precisar lembrar de destravar.
 */

/** Quantas aulas antes do título a contagem aparece. Fora disso, só o destino. */
export const RETA_FINAL = 5;

/** Uma linha de `title_tiers` — só o que decide o próximo título. */
export interface DegrauDaEscada {
  tier: number;
  title: string;
  /** A trilha que este degrau fecha. `null` só no tier 0, que não fecha nada. */
  trail: string | null;
  /** Contagem ACUMULADA de aulas até este degrau. */
  lessons_required: number;
}

export type ProximoTitulo =
  /** Há degrau acima, e a trilha dele tem aula: pode prometer. */
  | { estado: "nomeado"; titulo: string; trilha: string; faltam: number | null }
  /** Há degrau acima, mas a trilha dele está vazia: nomeia sem prometer prazo. */
  | { estado: "sem-conteudo"; titulo: string }
  /** O aluno está no topo da escada. Não há o que prometer. */
  | { estado: "topo" };

/**
 * @param tierAtual        `user_titles.achieved_tier`
 * @param escada           as linhas de `title_tiers` (ordem não importa)
 * @param aulasConcluidas  quantas aulas o aluno já concluiu, no total
 * @param aulasPorTrilha   quantas aulas EXISTEM no banco em cada trilha
 */
export function proximoTitulo(
  tierAtual: number,
  escada: readonly DegrauDaEscada[],
  aulasConcluidas: number,
  aulasPorTrilha: ReadonlyMap<string, number>,
): ProximoTitulo {
  const proximo = escada.find((d) => d.tier === tierAtual + 1);

  // Sem degrau acima — o aluno chegou ao topo, ou a régua não tem a linha.
  // Os dois casos se tratam igual: não há promessa a fazer.
  if (!proximo) return { estado: "topo" };

  // Um degrau > 0 sempre fecha uma trilha; `trail` nulo aqui é régua quebrada,
  // e régua quebrada não vira promessa ao aluno.
  if (!proximo.trail) return { estado: "sem-conteudo", titulo: proximo.title };

  const aulasDaTrilha = aulasPorTrilha.get(proximo.trail) ?? 0;
  if (aulasDaTrilha === 0) {
    return { estado: "sem-conteudo", titulo: proximo.title };
  }

  // `lessons_required` é acumulado, e `aulasConcluidas` também é o total do
  // aluno — a subtração é direta. Nunca negativa: quem já fez as aulas e não
  // subiu está preso no Desafio Final da trilha, não em aula faltando.
  const faltam = Math.max(0, proximo.lessons_required - aulasConcluidas);

  return {
    estado: "nomeado",
    titulo: proximo.title,
    trilha: proximo.trail,
    // A reta final é a única janela em que o número ajuda mais do que assusta.
    faltam: faltam <= RETA_FINAL ? faltam : null,
  };
}

/**
 * A frase da faixa do Saguão. Fica junto da regra para o texto não derivar da
 * lei em outro arquivo — foi assim que "Insígnias" e "Conquistas" passaram
 * meses convivendo.
 */
export function fraseDoProximoTitulo(p: ProximoTitulo): string | null {
  switch (p.estado) {
    case "topo":
      return null;
    case "sem-conteudo":
      return `A seguir: ${p.titulo}. A trilha dele ainda vai abrir.`;
    case "nomeado":
      if (p.faltam === null) return `Você estuda para ${p.titulo}.`;
      if (p.faltam === 0) return `Falta o Desafio Final para você virar ${p.titulo}.`;
      if (p.faltam === 1) return `Falta 1 aula para você virar ${p.titulo}.`;
      return `Faltam ${p.faltam} aulas para você virar ${p.titulo}.`;
  }
}
