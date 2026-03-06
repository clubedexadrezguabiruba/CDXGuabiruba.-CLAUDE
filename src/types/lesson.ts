// =============================================
// Tipos do sistema de aulas (Phase 5)
// =============================================

// --- Schema JSON de content_json ---

/** Conteúdo completo de uma aula armazenado em lessons.content_json */
export interface LessonContent {
  sections: LessonSection[];
  dim_kings?: boolean; // true = reis visualmente apagados (aula de outra peça)
}

/** Union discriminada por "type" */
export type LessonSection =
  | LessonTextSection
  | LessonDemoSection
  | LessonExerciseSection;

export interface LessonTextSection {
  type: "text";
  title?: string;
  body: string;
  fen?: string;
  orientation?: "white" | "black";
  highlights?: string[];
  arrows?: [string, string][];
}

export interface LessonDemoSection {
  type: "demo";
  title?: string;
  description?: string;
  fen: string;
  moves: string[];
  orientation?: "white" | "black";
  annotations?: Record<number, string>;
}

export interface LessonExerciseSection {
  type: "exercise";
  instruction: string;
  fen: string;
  expected_moves: string[];
  orientation?: "white" | "black";
  after_text?: string;
  hint?: string;
}

// --- Linhas do banco ---

export interface LessonRow {
  id: number;
  title: string;
  description: string;
  trail: string;
  trail_order: number;
  content_json: LessonContent;
  total_steps: number;
  created_at: string;
}

export interface LessonProgressRow {
  id: number;
  user_id: string;
  lesson_id: number;
  steps_completed: number;
  completed: boolean;
  started_at: string;
  completed_at: string | null;
  errors: number;
  hints_used: number;
  stars: number;
}

// --- Mapa de aulas (UI) ---

export type LessonStatus = "locked" | "available" | "in_progress" | "completed";

export interface LessonMapEntry {
  id: number;
  title: string;
  trail: string;
  trail_order: number;
  total_steps: number;
  status: LessonStatus;
  steps_completed: number;
  stars: number;
}

// --- Review Gate ---

export interface ReviewGateEntry {
  trail: string;
  passed: boolean;
  required: boolean;
  best_score: number;
}

// --- Config de trilhas ---

export interface TrailConfig {
  key: string;
  name: string;
  description: string;
  color: string;
  iconColor: string;
}

export const TRAILS: TrailConfig[] = [
  {
    key: "recruta",
    name: "Recruta",
    description: "Fundamentos (0-600)",
    color: "#22c55e",
    iconColor: "#16a34a",
  },
  {
    key: "soldado",
    name: "Soldado",
    description: "Intermediário (600-900)",
    color: "#3b82f6",
    iconColor: "#2563eb",
  },
];

// --- Resposta da RPC complete_lesson_step ---

export interface CompleteLessonStepResult {
  correct: boolean;
  steps_completed: number;
  total_steps: number;
  lesson_completed: boolean;
  stars: number | null;
  xp_gained: number;
  error?: string;
}

// --- Resposta da RPC submit_review_gate ---

export interface SubmitReviewGateResult {
  score: number;
  passed: boolean;
  required_score: number;
}
