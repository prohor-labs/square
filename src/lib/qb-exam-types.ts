/**
 * Shapes and limits for the custom exam.
 *
 * Kept apart from `qb-exam.ts` because that module reads the database; the
 * runner is a client component and must only ever import these plain values.
 */

/** Upper bound, so one click cannot ship the whole bank to a phone. */
export const CUSTOM_EXAM_MAX_QUESTIONS = 200;

/** The negative-marking values the form offers. */
export const CUSTOM_EXAM_NEGATIVE = [0, 0.25, 0.5, 1] as const;

/** One option of a custom exam question. */
export interface CustomExamOption {
  readonly id: string;
  readonly text: string;
  readonly image: string | null;
  readonly isCorrect: boolean;
}

/** A question as the exam runner receives it (correct answer included). */
export interface CustomExamQuestion {
  readonly id: string;
  readonly text: string;
  readonly image: string | null;
  readonly explanation: string | null;
  readonly explanationImage: string | null;
  readonly options: readonly CustomExamOption[];
  /** Where the question came from, shown under the stem. */
  readonly context: readonly string[];
}

export interface CustomExam {
  readonly minutes: number;
  /** Marks taken off for each wrong answer. */
  readonly negative: number;
  readonly questions: readonly CustomExamQuestion[];
}

export interface CustomExamRequest {
  readonly section?: string;
  readonly group?: string;
  readonly year?: string;
  readonly subjectId?: string;
  readonly chapterId?: string;
  readonly topicId?: string;
  readonly count?: number;
  readonly minutes?: number;
  readonly negative?: number;
}
