"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * O PERFIL QUE TODA TELA DO PRODUTO CARREGA — e ele deixou de trazer dois mortos.
 *
 * ⚠️ **`avatar_config` e `avatar_base` saíram em 2026-08-20, e é o achado D12.**
 * Eram as duas colunas da pilha v2: `avatar_config` guardava o cache dos 69 itens
 * que o Bloco B apagou (é `'{}'` em 100% das contas desde então) e `avatar_base`, o
 * caminho do PNG do boneco antigo, cujo componente (`AvatarDisplay`) não existe
 * desde o F.2. Nenhum arquivo de `src/` lia qualquer uma das duas — só as próprias
 * declarações daqui.
 *
 * Elas viajavam num `select` que este hook roda no dashboard, no perfil e em
 * Configurações. Tirá-las é o passo que faltava para as colunas poderem cair de
 * `users`: as três RPCs de ranking já pararam de citá-las no Bloco 6, e a
 * conferência 6 do `verify:perfil-publico` já registra que `avatar_config` pode
 * sair da matview.
 *
 * A identidade viva do avatar são `avatar_skin`, `avatar_cabelo`, `avatar_hair_color`
 * e os quatro slots de guarda-roupa — e este hook não as busca de propósito: quem
 * desenha o boneco lê da RPC de perfil, não daqui.
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  display_name: string | null;
  role: string;
  xp: number;
  level: number;
  puzzle_rating: number;
  puzzle_rd: number;
  puzzle_streak: number;
  puzzle_best_streak: number;
  sound_muted: boolean;
  premove_enabled: boolean;
  auto_queen: boolean;
  /**
   * `users.avatar_traje` — slug de `avatar_catalogo`, ou `null`.
   *
   * `null` **não** é "sem dado": é o macacão de treino, a ausência de peça, e é o
   * estado de todo aluno que ainda não abriu um baú nem equipou a Farda.
   *
   * Nenhuma tela lê isto hoje: as três que desenham o boneco inteiro — `/perfil`,
   * `/criar-personagem` e o `EditorDeAparencia` — recebem o slug por prop do
   * Server Component, que é o caminho certo (menos uma ida ao banco depois da
   * hidratação). Ele está aqui porque este hook é o retrato do aluno no cliente, e
   * a coluna existir no banco e faltar no retrato foi justamente a dívida que o
   * doc 21 registrou. Os outros três slots — `avatar_chapeu`, `avatar_rosto`,
   * `avatar_pet` — existem na mesma tabela desde a migration `20260811160000` e
   * entram aqui nos blocos que lhes derem arte. Eram quatro: `avatar_fundo` foi
   * **apagada** em 2026-08-13, quando o slot `fundo` morreu (achado G23).
   */
  avatar_traje: string | null;
  rush_3min_record: number;
  rush_5min_record: number;
  rush_resistencia_record: number;
  ranking_visible: boolean;
}

interface UseUserResult {
  authUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

export function useUser(): UseUserResult {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setAuthUser(user);

      if (user) {
        const { data } = await supabase
          .from("users")
          .select(
            "id, email, name, display_name, role, xp, level, puzzle_rating, puzzle_rd, puzzle_streak, puzzle_best_streak, sound_muted, premove_enabled, auto_queen, avatar_traje, rush_3min_record, rush_5min_record, rush_resistencia_record, ranking_visible"
          )
          .eq("id", user.id)
          .single();

        if (data) setProfile(data as UserProfile);
      }

      setLoading(false);
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      if (!session?.user) {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { authUser, profile, loading };
}
