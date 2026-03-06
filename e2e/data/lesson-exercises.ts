/**
 * Dados de exercícios das 30 aulas — extraídos diretamente do DB.
 * Usados pela suite data-driven e2e/aulas-exercicios.spec.ts.
 *
 * from/to = primeiro lance aceito de cada exercício.
 * orientation = orientação do tabuleiro (white/black).
 */

export interface ExerciseTestData {
  from: string;
  to: string;
  orientation: "white" | "black";
}

export interface LessonTestData {
  lessonNumber: number; // display 1-30
  id: number; // DB ID
  title: string;
  trail: "recruta" | "soldado";
  clicksToExercise: number; // clicks on "next" to reach first exercise
  exercises: ExerciseTestData[];
}

// ============================================================
// Recruta (15 aulas)
// ============================================================

const RECRUTA: LessonTestData[] = [
  {
    lessonNumber: 1,
    id: 1,
    title: "O Tabuleiro e as Casas",
    trail: "recruta",
    clicksToExercise: 3,
    exercises: [
      { from: "e2", to: "e4", orientation: "white" },
      { from: "d2", to: "d4", orientation: "white" },
      { from: "g1", to: "f3", orientation: "white" },
    ],
  },
  {
    lessonNumber: 2,
    id: 3,
    title: "O Peão",
    trail: "recruta",
    clicksToExercise: 4,
    exercises: [
      { from: "d2", to: "d4", orientation: "white" },
      { from: "e4", to: "f5", orientation: "white" },
      { from: "e4", to: "d5", orientation: "white" },
      { from: "e7", to: "e8", orientation: "white" }, // promoção auto-queen
    ],
  },
  {
    lessonNumber: 3,
    id: 4,
    title: "A Torre",
    trail: "recruta",
    clicksToExercise: 3,
    exercises: [
      { from: "d1", to: "d5", orientation: "white" },
      { from: "a1", to: "a8", orientation: "white" },
      { from: "f1", to: "f6", orientation: "white" },
      { from: "a1", to: "d1", orientation: "white" },
    ],
  },
  {
    lessonNumber: 4,
    id: 5,
    title: "O Bispo",
    trail: "recruta",
    clicksToExercise: 3,
    exercises: [
      { from: "c1", to: "f4", orientation: "white" },
      { from: "d1", to: "g4", orientation: "white" },
      { from: "d1", to: "b3", orientation: "white" },
    ],
  },
  {
    lessonNumber: 5,
    id: 6,
    title: "A Dama",
    trail: "recruta",
    clicksToExercise: 3,
    exercises: [
      { from: "d1", to: "g4", orientation: "white" },
      { from: "d1", to: "d8", orientation: "white" },
      { from: "a1", to: "b2", orientation: "white" },
    ],
  },
  {
    lessonNumber: 6,
    id: 7,
    title: "O Cavalo",
    trail: "recruta",
    clicksToExercise: 3,
    exercises: [
      { from: "d3", to: "f4", orientation: "white" },
      { from: "e4", to: "d6", orientation: "white" },
      { from: "f3", to: "d4", orientation: "white" },
      { from: "f3", to: "e5", orientation: "white" },
    ],
  },
  {
    lessonNumber: 7,
    id: 8,
    title: "O Rei",
    trail: "recruta",
    clicksToExercise: 3,
    exercises: [
      { from: "e1", to: "d2", orientation: "white" },
      { from: "e1", to: "d2", orientation: "white" },
      { from: "e1", to: "e2", orientation: "white" },
    ],
  },
  {
    lessonNumber: 8,
    id: 9,
    title: "Xeque",
    trail: "recruta",
    clicksToExercise: 3,
    exercises: [
      { from: "a1", to: "a8", orientation: "white" },
      { from: "d2", to: "b4", orientation: "white" },
      { from: "e1", to: "e2", orientation: "white" },
      { from: "d1", to: "c1", orientation: "white" },
    ],
  },
  {
    lessonNumber: 9,
    id: 10,
    title: "Xeque-Mate",
    trail: "recruta",
    clicksToExercise: 3,
    exercises: [
      { from: "a1", to: "a8", orientation: "white" },
      { from: "b1", to: "a1", orientation: "white" },
      { from: "a1", to: "a8", orientation: "white" }, // back-rank mate (fixed FEN)
      { from: "c7", to: "a7", orientation: "white" },
    ],
  },
  {
    lessonNumber: 10,
    id: 11,
    title: "Roque",
    trail: "recruta",
    clicksToExercise: 4,
    exercises: [
      { from: "e1", to: "g1", orientation: "white" }, // roque pequeno
      { from: "e1", to: "c1", orientation: "white" }, // roque grande
      { from: "e1", to: "g1", orientation: "white" }, // roque pequeno
    ],
  },
  {
    lessonNumber: 11,
    id: 12,
    title: "Valor das Peças",
    trail: "recruta",
    clicksToExercise: 2,
    exercises: [
      { from: "e2", to: "e6", orientation: "white" },
      { from: "b2", to: "f6", orientation: "white" },
      { from: "c4", to: "d6", orientation: "white" },
    ],
  },
  {
    lessonNumber: 12,
    id: 13,
    title: "Captura e Troca",
    trail: "recruta",
    clicksToExercise: 2,
    exercises: [
      { from: "c3", to: "e5", orientation: "white" },
      { from: "d1", to: "d4", orientation: "white" },
      { from: "e1", to: "f2", orientation: "white" },
      { from: "e3", to: "c4", orientation: "white" },
    ],
  },
  {
    lessonNumber: 13,
    id: 14,
    title: "Controle do Centro",
    trail: "recruta",
    clicksToExercise: 2,
    exercises: [
      { from: "e2", to: "e4", orientation: "white" },
      { from: "b1", to: "c3", orientation: "white" },
      { from: "d2", to: "d4", orientation: "white" },
    ],
  },
  {
    lessonNumber: 14,
    id: 15,
    title: "Desenvolvimento",
    trail: "recruta",
    clicksToExercise: 2,
    exercises: [
      { from: "g1", to: "f3", orientation: "white" },
      { from: "g8", to: "f6", orientation: "black" },
      { from: "e1", to: "g1", orientation: "white" }, // roque
      { from: "f1", to: "b5", orientation: "white" },
    ],
  },
  {
    lessonNumber: 15,
    id: 16,
    title: "Mate do Pastor e Defesa",
    trail: "recruta",
    clicksToExercise: 3,
    exercises: [
      { from: "h5", to: "f7", orientation: "white" },
      { from: "d8", to: "e7", orientation: "black" },
      { from: "b8", to: "c6", orientation: "black" },
    ],
  },
];

// ============================================================
// Soldado (15 aulas)
// ============================================================

const SOLDADO: LessonTestData[] = [
  {
    lessonNumber: 16,
    id: 17,
    title: "Garfo (Fork)",
    trail: "soldado",
    clicksToExercise: 2,
    exercises: [
      { from: "f2", to: "d3", orientation: "white" },
      { from: "d3", to: "d4", orientation: "white" },
      { from: "d2", to: "f3", orientation: "white" },
      { from: "b2", to: "c4", orientation: "white" },
      { from: "a1", to: "a8", orientation: "white" },
    ],
  },
  {
    lessonNumber: 17,
    id: 18,
    title: "Cravada (Pin)",
    trail: "soldado",
    clicksToExercise: 2,
    exercises: [
      { from: "g2", to: "c6", orientation: "white" },
      { from: "d1", to: "d4", orientation: "white" },
      { from: "e5", to: "g7", orientation: "white" },
      { from: "d1", to: "d4", orientation: "white" },
    ],
  },
  {
    lessonNumber: 18,
    id: 19,
    title: "Espeto (Skewer)",
    trail: "soldado",
    clicksToExercise: 2,
    exercises: [
      { from: "b2", to: "e5", orientation: "white" },
      { from: "d1", to: "d4", orientation: "white" },
      { from: "a1", to: "h8", orientation: "white" },
      { from: "d1", to: "d5", orientation: "white" },
    ],
  },
  {
    lessonNumber: 19,
    id: 20,
    title: "Ataque Descoberto",
    trail: "soldado",
    clicksToExercise: 2,
    exercises: [
      { from: "d5", to: "f4", orientation: "white" },
      { from: "d4", to: "f6", orientation: "white" },
      { from: "d7", to: "d8", orientation: "white" }, // promoção auto-queen
      { from: "d5", to: "c7", orientation: "white" },
    ],
  },
  {
    lessonNumber: 20,
    id: 21,
    title: "Ataque Duplo",
    trail: "soldado",
    clicksToExercise: 1,
    exercises: [
      { from: "d1", to: "d8", orientation: "white" },
      { from: "c2", to: "e3", orientation: "white" },
      { from: "e1", to: "a5", orientation: "white" },
      { from: "a1", to: "a8", orientation: "white" },
    ],
  },
  {
    lessonNumber: 21,
    id: 22,
    title: "Peça Pendurada",
    trail: "soldado",
    clicksToExercise: 2,
    exercises: [
      { from: "e1", to: "e6", orientation: "white" },
      { from: "d3", to: "f4", orientation: "white" },
      { from: "c3", to: "e5", orientation: "white" },
    ],
  },
  {
    lessonNumber: 22,
    id: 23,
    title: "Desvio e Atração",
    trail: "soldado",
    clicksToExercise: 2,
    exercises: [
      { from: "e1", to: "e8", orientation: "white" },
      { from: "e2", to: "a6", orientation: "white" },
      { from: "d1", to: "d8", orientation: "white" },
      { from: "e1", to: "e7", orientation: "white" },
    ],
  },
  {
    lessonNumber: 23,
    id: 24,
    title: "Eliminação do Defensor",
    trail: "soldado",
    clicksToExercise: 2,
    exercises: [
      { from: "d2", to: "f4", orientation: "white" },
      { from: "d4", to: "f6", orientation: "white" },
      { from: "e1", to: "d2", orientation: "white" },
      { from: "e1", to: "e3", orientation: "white" },
    ],
  },
  {
    lessonNumber: 24,
    id: 25,
    title: "Sacrifício Tático",
    trail: "soldado",
    clicksToExercise: 2,
    exercises: [
      { from: "a1", to: "a8", orientation: "white" },
      { from: "b1", to: "b7", orientation: "white" },
      { from: "e5", to: "g7", orientation: "white" },
      { from: "e1", to: "e4", orientation: "white" },
      { from: "f7", to: "h8", orientation: "white" },
    ],
  },
  {
    lessonNumber: 25,
    id: 26,
    title: "Promoção de Peão",
    trail: "soldado",
    clicksToExercise: 2,
    exercises: [
      { from: "e7", to: "e8", orientation: "white" }, // promoção auto-queen
      { from: "e7", to: "f8", orientation: "white" }, // sub-promoção (fix migration adds e7f8q)
      { from: "a7", to: "a8", orientation: "white" }, // promoção auto-queen
      { from: "d7", to: "c8", orientation: "white" }, // promoção auto-queen
    ],
  },
  {
    lessonNumber: 26,
    id: 27,
    title: "Finais de Rei e Peão",
    trail: "soldado",
    clicksToExercise: 2,
    exercises: [
      { from: "a4", to: "a5", orientation: "white" },
      { from: "e3", to: "d4", orientation: "white" },
      { from: "e3", to: "e4", orientation: "white" },
      { from: "e3", to: "e2", orientation: "white" },
    ],
  },
  {
    lessonNumber: 27,
    id: 28,
    title: "Mate com Torre e Rei",
    trail: "soldado",
    clicksToExercise: 2,
    exercises: [
      { from: "c7", to: "a7", orientation: "white" },
      { from: "a1", to: "a6", orientation: "white" },
      { from: "a1", to: "a8", orientation: "white" },
    ],
  },
  {
    lessonNumber: 28,
    id: 29,
    title: "Mate com Dama e Rei",
    trail: "soldado",
    clicksToExercise: 2,
    exercises: [
      { from: "b1", to: "a1", orientation: "white" },
      { from: "a1", to: "d4", orientation: "white" },
      { from: "f7", to: "f8", orientation: "white" },
    ],
  },
  {
    lessonNumber: 29,
    id: 30,
    title: "Padrões de Mate",
    trail: "soldado",
    clicksToExercise: 1,
    exercises: [
      { from: "a1", to: "a8", orientation: "white" },
      { from: "f7", to: "h6", orientation: "white" },
      { from: "a1", to: "a8", orientation: "white" },
      { from: "e2", to: "e7", orientation: "white" },
      { from: "d1", to: "d7", orientation: "white" },
    ],
  },
  {
    lessonNumber: 30,
    id: 31,
    title: "Revisão e Desafio Final",
    trail: "soldado",
    clicksToExercise: 1,
    exercises: [
      { from: "e2", to: "d4", orientation: "white" },
      { from: "a1", to: "a8", orientation: "white" },
      { from: "d5", to: "d7", orientation: "white" },
      { from: "c4", to: "f7", orientation: "white" },
      { from: "a2", to: "a4", orientation: "white" },
    ],
  },
];

export const ALL_LESSONS: LessonTestData[] = [...RECRUTA, ...SOLDADO];
export { RECRUTA, SOLDADO };
