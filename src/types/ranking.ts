export interface RankingEntry {
  user_id: string;
  public_name: string;
  /**
   * A identidade do avatar kokeshi, como as RPCs de ranking a devolvem desde o
   * Bloco 6 (`20260811140000_bloco6_identidade_nas_listas.sql`): índice de paleta
   * e slug, a mesma língua das colunas do Bloco C e a mesma que `<AvatarCabeca>`
   * recebe. `avatar_cabelo` NULL é a careca — ausência de peça, não dado faltando.
   *
   * Saíram junto `avatar_config` (o cache de itens da pilha v2, cujos 69 itens o
   * Bloco B apagou) e `avatar_base`. **`avatar_base` fecha o achado G11**: ele
   * estava declarado aqui como campo obrigatório e **nenhuma** das três RPCs
   * jamais o devolveu — todo `entry.avatar_base` do produto teria sido
   * `undefined` num campo que o tipo prometia `string`.
   */
  avatar_skin: number;
  avatar_cabelo: string | null;
  avatar_hair_color: number;
  /**
   * As duas peças que o RECORTE DE CABEÇA mostra — `null` é ausência de peça.
   *
   * As RPCs de lista as servem desde o Bloco 1 (`20260811160000`), por decisão
   * explícita: *"a lista mostra a CABEÇA"*. Aqui elas faltavam, e `as RankingEntry`
   * descartava as duas em silêncio — o achado **G22**, que é o G21 em quatro telas.
   * Invisível enquanto os catálogos de chapéu e rosto estão vazios; visível no dia
   * da primeira peça, que é tarde demais para descobrir.
   *
   * Traje **não** entra: ele não aparece no recorte de cabeça. Fundo e pet também
   * não — são componentes irmãos, fora do SVG (doc 21 §3.4).
   *
   * A conferência 5 de `verify:identidade-nas-listas` cobra este tipo a partir do
   * que `<AvatarCabeca>` repassa ao SVG, então quem mexer no componente move a
   * exigência junto.
   */
  avatar_chapeu: string | null;
  avatar_rosto: string | null;
  /** `users.avatar_oculos` — slot próprio desde 2026-08-27. Convive com a barba. */
  avatar_oculos: string | null;
  level: number;
  metric_value: number;
  title: string;
  /**
   * O NÚMERO da patente, que a `<MolduraPatente>` mapeia para cor. Desde o B2 da
   * moldura (`20260813120000_b2_moldura_estrutural.sql`).
   *
   * Vai como número, e não como nome, porque a moldura indexa a paleta pelo tier:
   * derivar a cor de `title` seria uma segunda tabela de patentes em TypeScript, e
   * o banco tem **8 tiers** contra as 6 cores de `scripts/avatar/patentes.ts`
   * (achado D11) — os nomes já não são mapa confiável.
   *
   * `0` é Aprendiz, que é degrau real e não ausência de dado.
   */
  achieved_tier: number;
  position: number;
  is_teacher?: boolean;
}

export interface RankingData {
  entries: RankingEntry[];
  my_rank: RankingEntry | null;
  is_hidden: boolean;
}

export type RankingType = "rating" | "rush_3min" | "rush_5min" | "level";

export interface PublicProfileData {
  public_name: string;
  /**
   * A identidade do avatar kokeshi, como `get_public_profile` a devolve desde o
   * E.3: índice de paleta e slug, a mesma língua das colunas do Bloco C e a mesma
   * que `<AvatarKokeshi>` recebe. `avatar_cabelo` NULL é a careca — ausência de
   * peça, não dado faltando.
   *
   * Saíram no E.3 `avatar_config`, `avatar_base` e `equipped_items`: os três da
   * pilha v2, e a RPC não os devolve mais.
   */
  avatar_skin: number;
  avatar_cabelo: string | null;
  avatar_hair_color: number;
  /**
   * `users.avatar_traje` — o slug da peça equipada, `null` para o macacão de treino.
   *
   * **Ele sempre chegou; o que faltava era declará-lo.** A matview carrega os cinco
   * slugs de equipar desde o Bloco 1 (`20260811160000`) e `get_public_profile` os
   * devolve desde então — mas `page.tsx` faz `profile as PublicProfileData`, e um
   * cast descarta em silêncio toda chave que o tipo não nomeia. Era o achado G21: o
   * colega via o aluno de macacão porque o TypeScript jogava a farda fora na
   * fronteira, não porque o banco não a tivesse mandado.
   *
   * Os outros slugs da RPC entram quando alguma tela os desenhar. A conferência 7
   * de `verify:perfil-publico` cobra este tipo a partir do que o próprio `/perfil`
   * passa ao boneco, então o dia em que uma peça nova chegar lá ela reprova aqui
   * sozinha — **e foi exatamente o que aconteceu com o `rosto` em 2026-08-23**,
   * quando a vitrine passou a vestir aquele slot. O gate reprovou com "o aluno se
   * vê com a peça e aparece sem ela para os colegas", que é o único lugar onde a
   * peça tem plateia.
   *
   * Sobram de fora `chapeu` e `pet`, que ainda não têm arte. Eram mais um: `fundo`
   * foi apagado em 2026-08-13, e a RPC não o devolve.
   */
  avatar_traje: string | null;
  /** `users.avatar_rosto` — barba, bigode. `null` é rosto limpo. */
  avatar_rosto: string | null;
  /** `users.avatar_oculos` — slot próprio desde 2026-08-27. Convive com a barba. */
  avatar_oculos: string | null;
  level: number;
  xp: number;
  puzzle_rating: number;
  rush_3min_record: number;
  rush_5min_record: number;
  rush_resistencia_record: number;
  title: string;
  /** O número da patente, para a moldura do palco de 104 px. Ver `RankingEntry`. */
  achieved_tier: number;
  current_streak: number;
  member_since: string;
  bots_defeated: number;
  lessons_completed: number;
  achievements_count: number;
  achievements: PublicAchievement[];
}

export interface PublicAchievement {
  key: string;
  title: string;
  icon: string | null;
  description: string;
  unlocked_at: string;
}

