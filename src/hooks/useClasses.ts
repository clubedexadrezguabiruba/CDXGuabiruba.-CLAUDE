"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Class, ClassWithCount } from "@/types/class";

interface UseClassesResult {
  classes: (Class | ClassWithCount)[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useClasses(role: string): UseClassesResult {
  const [classes, setClasses] = useState<(Class | ClassWithCount)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const didLoad = useRef(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Não autenticado");
      setLoading(false);
      return;
    }

    try {
      if (role === "professor") {
        // Professor: turmas próprias com contagem de membros
        const { data, error: qErr } = await supabase
          .from("classes")
          .select("id, teacher_id, name, invite_code, active, created_at, class_members(count)")
          .eq("teacher_id", user.id)
          .order("created_at", { ascending: false });

        if (qErr) throw new Error(qErr.message);

        const mapped: ClassWithCount[] = (data ?? []).map((row) => ({
          id: row.id,
          teacher_id: row.teacher_id,
          name: row.name,
          invite_code: row.invite_code,
          active: row.active,
          created_at: row.created_at,
          member_count:
            Array.isArray(row.class_members) && row.class_members.length > 0
              ? (row.class_members[0] as { count: number }).count
              : 0,
        }));

        requestAnimationFrame(() => {
          setClasses(mapped);
          setError(null);
          setLoading(false);
        });
      } else {
        // Aluno: turmas em que é membro
        const { data: memberships, error: mErr } = await supabase
          .from("class_members")
          .select("class_id")
          .eq("user_id", user.id);

        if (mErr) throw new Error(mErr.message);

        const classIds = (memberships ?? []).map((m) => m.class_id);

        if (classIds.length === 0) {
          requestAnimationFrame(() => {
            setClasses([]);
            setError(null);
            setLoading(false);
          });
          return;
        }

        const { data, error: qErr } = await supabase
          .from("classes")
          .select("id, teacher_id, name, invite_code, active, created_at")
          .in("id", classIds)
          .order("created_at", { ascending: false });

        if (qErr) throw new Error(qErr.message);

        requestAnimationFrame(() => {
          setClasses((data ?? []) as Class[]);
          setError(null);
          setLoading(false);
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar turmas";
      requestAnimationFrame(() => {
        setError(msg);
        setLoading(false);
      });
    }
  }, [role]);

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    load();
  }, [load]);

  return { classes, loading, error, refresh: load };
}
