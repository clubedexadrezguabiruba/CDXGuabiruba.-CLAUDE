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
  avatar_config: Record<string, unknown>;
  avatar_base: string;
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
  equipped_items: EquippedItem[];
}

export interface PublicAchievement {
  key: string;
  title: string;
  icon: string | null;
  description: string;
  unlocked_at: string;
}

export interface EquippedItem {
  slot: string;
  item_name: string;
  rarity: string;
  image_url: string | null;
}
