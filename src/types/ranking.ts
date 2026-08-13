export interface RankingEntry {
  user_id: string;
  public_name: string;
  /**
   * A identidade do avatar kokeshi, como as RPCs de ranking a devolvem desde o
   * Bloco 6 (`20260811140000_bloco6_identidade_nas_listas.sql`): índice de paleta
   * e slug, a mesma língua das colunas do Bloco C e a mesma que `<AvatarCabeca>`
   * recebe. `avatar_hair` NULL é a careca — ausência de peça, não dado faltando.
   *
   * Saíram junto `avatar_config` (o cache de itens da pilha v2, cujos 69 itens o
   * Bloco B apagou) e `avatar_base`. **`avatar_base` fecha o achado G11**: ele
   * estava declarado aqui como campo obrigatório e **nenhuma** das três RPCs
   * jamais o devolveu — todo `entry.avatar_base` do produto teria sido
   * `undefined` num campo que o tipo prometia `string`.
   */
  avatar_skin: number;
  avatar_hair: string | null;
  avatar_hair_color: number;
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
   * que `<AvatarKokeshi>` recebe. `avatar_hair` NULL é a careca — ausência de
   * peça, não dado faltando.
   *
   * Saíram no E.3 `avatar_config`, `avatar_base` e `equipped_items`: os três da
   * pilha v2, e a RPC não os devolve mais.
   */
  avatar_skin: number;
  avatar_hair: string | null;
  avatar_hair_color: number;
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

