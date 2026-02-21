import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  ArrowLeft,
  Crosshair,
  Target,
  Zap,
  GitBranch,
  Anchor,
  ArrowRight,
  Eye,
  Scan,
  Copy,
  Hand,
  CornerDownRight,
  Magnet,
  Shuffle,
  Flame,
  Lock,
  ArrowUpCircle,
  Flag,
  Footprints,
  Castle,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { PUZZLE_THEMES } from "@/lib/chess/themeMap";

const ICON_MAP: Record<string, LucideIcon> = {
  crosshair: Crosshair,
  target: Target,
  zap: Zap,
  "git-branch": GitBranch,
  anchor: Anchor,
  "arrow-right": ArrowRight,
  eye: Eye,
  scan: Scan,
  copy: Copy,
  hand: Hand,
  "corner-down-right": CornerDownRight,
  magnet: Magnet,
  shuffle: Shuffle,
  flame: Flame,
  lock: Lock,
  "arrow-up-circle": ArrowUpCircle,
  flag: Flag,
  footprints: Footprints,
  castle: Castle,
  shield: Shield,
};

export default async function CategoriasPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="flex items-center gap-2">
        <Link
          href="/puzzles"
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Puzzles
        </Link>
      </div>

      <h1 className="text-2xl font-bold">Categorias</h1>
      <p className="text-sm text-zinc-500">
        Pratique temas táticos específicos. Categorias não alteram seu rating.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {PUZZLE_THEMES.map((theme) => {
          const Icon = ICON_MAP[theme.icon];
          return (
            <Link
              key={theme.key}
              href={`/puzzles/categorias/${theme.key}`}
              className={`flex flex-col gap-3 rounded-xl border p-5 transition-colors ${theme.color}`}
            >
              <div className="flex items-center gap-3">
                {Icon && <Icon className={`h-8 w-8 ${theme.iconColor}`} />}
                <h3 className="text-lg font-semibold">{theme.name}</h3>
              </div>
              <p className="text-sm text-zinc-600">{theme.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
