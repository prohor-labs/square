"use server";

import { getCachedSession } from "@/lib/auth-session";
import { searchQb } from "@/lib/qb-catalog";

/**
 * Search as you type.
 *
 * Only the fields the dropdown renders come back, so a keystroke never ships a
 * whole question's markdown or its options to the browser. The real dataset is
 * queried in memory by `searchQb` — there is no hard-coded result list.
 */

export interface QbSearchQuestionHit {
  readonly id: string;
  readonly text: string;
  readonly subject: string;
  readonly chapter: string;
  readonly exam: string;
}

export interface QbSearchNodeHit {
  readonly label: string;
  readonly href: string;
  readonly count: number;
  readonly hint: string;
}

export interface QbSearchPayload {
  readonly questions: readonly QbSearchQuestionHit[];
  readonly nodes: readonly QbSearchNodeHit[];
  readonly totalQuestions: number;
}

const EMPTY: QbSearchPayload = {
  questions: [],
  nodes: [],
  totalQuestions: 0,
};

export async function searchQbAction(term: string): Promise<QbSearchPayload> {
  const session = await getCachedSession();
  if (!session?.user) return EMPTY;

  const trimmed = term.trim().slice(0, 140);
  if (trimmed.length < 2) return EMPTY;

  const result = await searchQb(trimmed);

  return {
    questions: result.questions.slice(0, 8).map((question) => ({
      id: question.id,
      text: question.questionText
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 180),
      subject: [question.subjectName, question.paperName]
        .filter(Boolean)
        .join(" · "),
      chapter: question.chapterName,
      exam: [question.shelves[0]?.university, question.shelves[0]?.year]
        .filter(Boolean)
        .join(" · "),
    })),
    nodes: result.nodes.slice(0, 6),
    totalQuestions: result.totalQuestions,
  };
}
