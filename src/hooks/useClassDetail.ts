"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Class, ClassMember, ClassTask } from "@/types/class";

interface UseClassDetailResult {
  classData: Class | null;
  members: ClassMember[];
  tasks: ClassTask[];
  isTeacher: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useClassDetail(classId: number): UseClassDetailResult {
  const [classData, setClassData] = useState<Class | null>(null);
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [tasks, setTasks] = useState<ClassTask[]>([]);
  const [isTeacher, setIsTeacher] = useState(false);
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
      // Busca turma
      const { data: cls, error: clsErr } = await supabase
        .from("classes")
        .select("id, teacher_id, name, invite_code, active, created_at")
        .eq("id", classId)
        .single();

      if (clsErr) throw new Error(clsErr.message);
      if (!cls) throw new Error("Turma não encontrada");

      const classRow = cls as Class;
      const teacher = classRow.teacher_id === user.id;

      // Busca membros via RPC (SECURITY DEFINER — bypassa RLS do users)
      const { data: membersJson, error: memErr } = await supabase.rpc("get_class_members", {
        p_class_id: classId,
      });

      if (memErr) throw new Error(memErr.message);

      const mappedMembers: ClassMember[] = ((membersJson as unknown as Record<string, unknown>[]) ?? []).map((m) => ({
        user_id: m.user_id as string,
        display_name: (m.display_name as string) ?? null,
        level: (m.level as number) ?? 1,
        puzzle_rating: (m.puzzle_rating as number) ?? 400,
        is_teacher: (m.is_teacher as boolean) ?? false,
        joined_at: m.joined_at as string,
      }));

      // Busca tarefas (RLS filtra: professor vê todas, aluno só ativas)
      const { data: tasksData, error: taskErr } = await supabase
        .from("class_tasks")
        .select("id, class_id, teacher_id, task_type, config_json, title, description, deadline, active, created_at")
        .eq("class_id", classId)
        .order("created_at", { ascending: false });

      if (taskErr) throw new Error(taskErr.message);

      requestAnimationFrame(() => {
        setClassData(classRow);
        setMembers(mappedMembers);
        setTasks((tasksData ?? []) as ClassTask[]);
        setIsTeacher(teacher);
        setError(null);
        setLoading(false);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar turma";
      requestAnimationFrame(() => {
        setError(msg);
        setLoading(false);
      });
    }
  }, [classId]);

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    load();
  }, [load]);

  return { classData, members, tasks, isTeacher, loading, error, refresh: load };
}
