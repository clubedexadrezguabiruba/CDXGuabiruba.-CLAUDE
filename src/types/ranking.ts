export interface RankingEntry {
  user_id: string;
  public_name: string;
  avatar_config: Record<string, unknown>;
  avatar_base: string;
  level: number;
  metric_value: number;
  title: string;
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

