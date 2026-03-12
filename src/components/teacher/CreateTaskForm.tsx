"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PUZZLE_THEMES } from "@/lib/chess/themeMap";
import type { TaskType } from "@/types/class";

interface CreateTaskFormProps {
  classId: number;
  onCreated: () => void;
  onCancel: () => void;
}

interface LessonOption {
  id: number;
  title: string;
  trail: string;
}

interface BotOption {
  id: number;
  name: string;
  elo: number;
}

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  lesson: "Completar aula",
  puzzles_count: "Resolver puzzles (quantidade)",
  puzzles_theme: "Resolver puzzles (tema)",
  bot: "Derrotar bot",
  rush: "Completar rush",
};

export default function CreateTaskForm({ classId, onCreated, onCancel }: CreateTaskFormProps) {
  const [taskType, setTaskType] = useState<TaskType>("lesson");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Config fields
  const [lessonId, setLessonId] = useState<number>(0);
  const [botId, setBotId] = useState<number>(0);
  const [puzzleCount, setPuzzleCount] = useState<number>(10);
  const [puzzleTheme, setPuzzleTheme] = useState<string>("mateIn1");
  const [rushCount, setRushCount] = useState<number>(1);
  const [rushMode, setRushMode] = useState<string>("");

  // Options loaded from DB
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [bots, setBots] = useState<BotOption[]>([]);

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("lessons")
      .select("id, title, trail")
      .order("trail")
      .order("trail_order")
      .then(({ data }) => {
        if (data) setLessons(data as LessonOption[]);
        if (data && data.length > 0) setLessonId(data[0].id);
      });

    supabase
      .from("bots")
      .select("id, name, elo")
      .order("unlock_order")
      .then(({ data }) => {
        if (data) setBots(data as BotOption[]);
        if (data && data.length > 0) setBotId(data[0].id);
      });
  }, []);

  function buildConfig(): Record<string, unknown> {
    switch (taskType) {
      case "lesson":
        return { lesson_id: lessonId };
      case "puzzles_count":
        return { count: puzzleCount };
      case "puzzles_theme":
        return { theme: puzzleTheme, count: puzzleCount };
      case "bot":
        return { bot_id: botId };
      case "rush":
        return rushMode ? { count: rushCount, mode: rushMode } : { count: rushCount };
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 2) {
      setError("Titulo deve ter pelo menos 2 caracteres.");
      return;
    }

    if (taskType === "lesson" && !lessonId) {
      setError("Selecione uma aula.");
      return;
    }
    if (taskType === "bot" && !botId) {
      setError("Selecione um bot.");
      return;
    }
    if ((taskType === "puzzles_count" || taskType === "puzzles_theme") && puzzleCount < 1) {
      setError("Quantidade deve ser pelo menos 1.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: rpcErr } = await supabase.rpc("create_task", {
      p_class_id: classId,
      p_task_type: taskType,
      p_config_json: buildConfig(),
      p_title: trimmedTitle,
      p_description: description.trim(),
      p_deadline: deadline || null,
    });

    if (rpcErr) {
      setError(rpcErr.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    onCreated();
  }

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-zinc-900">Nova Tarefa</h3>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Tipo */}
        <div>
          <label className="text-sm font-medium text-zinc-700">Tipo</label>
          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value as TaskType)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {(Object.keys(TASK_TYPE_LABELS) as TaskType[]).map((t) => (
              <option key={t} value={t}>
                {TASK_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        {/* Config condicional */}
        {taskType === "lesson" && (
          <div>
            <label className="text-sm font-medium text-zinc-700">Aula</label>
            <select
              value={lessonId}
              onChange={(e) => setLessonId(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  [{l.trail}] {l.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {taskType === "bot" && (
          <div>
            <label className="text-sm font-medium text-zinc-700">Bot</label>
            <select
              value={botId}
              onChange={(e) => setBotId(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {bots.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.elo} ELO)
                </option>
              ))}
            </select>
          </div>
        )}

        {(taskType === "puzzles_count" || taskType === "puzzles_theme") && (
          <div>
            <label className="text-sm font-medium text-zinc-700">Quantidade de puzzles</label>
            <input
              type="number"
              value={puzzleCount}
              onChange={(e) => setPuzzleCount(Number(e.target.value))}
              min={1}
              max={100}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {taskType === "puzzles_theme" && (
          <div>
            <label className="text-sm font-medium text-zinc-700">Tema</label>
            <select
              value={puzzleTheme}
              onChange={(e) => setPuzzleTheme(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {PUZZLE_THEMES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {taskType === "rush" && (
          <>
            <div>
              <label className="text-sm font-medium text-zinc-700">Quantidade de runs</label>
              <input
                type="number"
                value={rushCount}
                onChange={(e) => setRushCount(Number(e.target.value))}
                min={1}
                max={20}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700">Modo (opcional)</label>
              <select
                value={rushMode}
                onChange={(e) => setRushMode(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Qualquer modo</option>
                <option value="3min">3 minutos</option>
                <option value="5min">5 minutos</option>
                <option value="resistencia">Resistencia</option>
              </select>
            </div>
          </>
        )}

        {/* Titulo */}
        <div>
          <label className="text-sm font-medium text-zinc-700">Titulo</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Completar aula de aberturas"
            maxLength={200}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Descricao */}
        <div>
          <label className="text-sm font-medium text-zinc-700">Descricao (opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Instrucoes adicionais..."
            maxLength={500}
            rows={2}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Prazo */}
        <div>
          <label className="text-sm font-medium text-zinc-700">Prazo (opcional)</label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border bg-white py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Criando..." : "Criar Tarefa"}
          </button>
        </div>
      </form>
    </div>
  );
}
