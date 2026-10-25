"use server";

import type { SQL } from "drizzle-orm";
import { and, desc, eq, exists, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  mcqOptions,
  type QbExamType,
  qbQuestionMeta,
  questions,
} from "@/db/schema";
import {
  QB_PAGE_SIZE,
  type QbCategory,
  type QbCounts,
  type QbOption,
  type QbPage,
  type QbQuery,
  type QbQuestion,
} from "@/lib/qb-browse-types";

/** "varsity" is the label students recognise; the column stores "university". */
const EXAM_TYPE_FOR_CATEGORY: Partial<Record<QbCategory, QbExamType>> = {
  board: "board",
  varsity: "university",
  medical: "medical",
};

function categoryCondition(category: QbCategory): SQL | undefined {
  const examType = EXAM_TYPE_FOR_CATEGORY[category];
  if (!examType) return undefined;
  return exists(
    db
      .select({ id: qbQuestionMeta.id })
      .from(qbQuestionMeta)
      .where(
        and(
          eq(qbQuestionMeta.questionId, questions.id),
          eq(qbQuestionMeta.examType, examType),
        ),
      ),
  );
}

function searchCondition(term: string): SQL | undefined {
  const trimmed = term.trim();
  if (!trimmed) return undefined;
  // Postgres treats %, _ and the backslash itself as wildcards, so a search for
  // "100%" must not silently become a search for everything.
  const pattern = `%${trimmed.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
  return or(
    ilike(questions.questionText, pattern),
    ilike(questions.explanation, pattern),
  );
}

/**
 * The WHERE for one combination of category, toggles and search — every clause
 * ANDs onto the last, which is what lets "board + free" narrow instead of
 * replace. Counting and listing both run through this, so a chip and its page
 * can never disagree.
 */
function conditionFor(
  category: QbCategory,
  free: boolean,
  explained: boolean,
  search: string,
): SQL | undefined {
  const conditions = [
    categoryCondition(category),
    free ? eq(questions.isFree, true) : undefined,
    explained ? sql`${questions.explanation} is not null` : undefined,
    searchCondition(search),
  ].filter((c): c is SQL => c !== undefined);

  return conditions.length > 0 ? and(...conditions) : undefined;
}

async function countWhere(condition?: SQL): Promise<number> {
  const rows = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(questions)
    .where(condition);
  return rows[0]?.value ?? 0;
}

/**
 * Rows behind every control, each reported in the state a student would land in.
 *
 * A category count is taken with the active toggles applied, so picking "board"
 * while "free" is on shows how many free board questions exist. A toggle count
 * is taken with the active category applied, for the same reason. All six run
 * in parallel; on a few thousand rows that is one round trip's worth of work.
 */
export async function getQbCounts(query: {
  readonly category: QbCategory;
  readonly free: boolean;
  readonly explained: boolean;
  readonly search?: string;
}): Promise<QbCounts> {
  const search = query.search ?? "";
  const { free, explained } = query;

  const [all, board, varsity, medical, freeCount, explainedCount] =
    await Promise.all([
      countWhere(conditionFor("all", free, explained, search)),
      countWhere(conditionFor("board", free, explained, search)),
      countWhere(conditionFor("varsity", free, explained, search)),
      countWhere(conditionFor("medical", free, explained, search)),
      countWhere(conditionFor(query.category, true, explained, search)),
      countWhere(conditionFor(query.category, free, true, search)),
    ]);

  return {
    categories: { all, board, varsity, medical },
    free: freeCount,
    explained: explainedCount,
  };
}

/**
 * One page of questions, newest first, each carrying its options and exam tags.
 *
 * The options come back in a second query rather than a join: joining would
 * multiply every question row by its option count, so the offset would count
 * options instead of questions and page 2 would repeat page 1. Exam tags get
 * their own query for the same reason — one question can sit under two exams.
 */
export async function getQbQuestions(query: QbQuery): Promise<QbPage> {
  const requestedPage = Math.max(1, Math.trunc(query.page));
  const where = conditionFor(
    query.category,
    query.free,
    query.explained,
    query.search,
  );

  const [countRows, pageRows] = await Promise.all([
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(questions)
      .where(where),
    db
      .select({
        id: questions.id,
        text: questions.questionText,
        explanation: questions.explanation,
        isFree: questions.isFree,
        source: questions.source,
      })
      .from(questions)
      .where(where)
      .orderBy(desc(questions.createdAt), desc(questions.id))
      .limit(QB_PAGE_SIZE)
      .offset((requestedPage - 1) * QB_PAGE_SIZE),
  ]);

  const total = countRows[0]?.value ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / QB_PAGE_SIZE));
  // Filtering can empty a page that was full a moment ago; clamp so the view
  // never renders a blank screen past the last question.
  const page = Math.min(requestedPage, pageCount);

  if (pageRows.length === 0) {
    return { questions: [], total, page, pageCount };
  }

  const ids = pageRows.map((row) => row.id);

  const [optionRows, metaRows] = await Promise.all([
    db
      .select({
        id: mcqOptions.id,
        questionId: mcqOptions.questionId,
        text: mcqOptions.optionText,
        isCorrect: mcqOptions.isCorrect,
        orderNo: mcqOptions.orderNo,
      })
      .from(mcqOptions)
      .where(inArray(mcqOptions.questionId, ids))
      .orderBy(mcqOptions.orderNo),
    db
      .select({
        questionId: qbQuestionMeta.questionId,
        examType: qbQuestionMeta.examType,
      })
      .from(qbQuestionMeta)
      .where(inArray(qbQuestionMeta.questionId, ids)),
  ]);

  const optionsByQuestion = new Map<string, QbOption[]>();
  for (const row of optionRows) {
    const list = optionsByQuestion.get(row.questionId) ?? [];
    list.push({
      id: row.id,
      text: row.text,
      isCorrect: row.isCorrect,
      orderNo: row.orderNo,
    });
    optionsByQuestion.set(row.questionId, list);
  }

  const examTypesByQuestion = new Map<string, string[]>();
  for (const row of metaRows) {
    if (!row.examType) continue;
    const list = examTypesByQuestion.get(row.questionId) ?? [];
    if (!list.includes(row.examType)) list.push(row.examType);
    examTypesByQuestion.set(row.questionId, list);
  }

  const list: QbQuestion[] = pageRows.map((row) => ({
    id: row.id,
    text: row.text,
    explanation: row.explanation,
    isFree: row.isFree,
    source: row.source,
    examTypes: examTypesByQuestion.get(row.id) ?? [],
    options: optionsByQuestion.get(row.id) ?? [],
  }));

  return { questions: list, total, page, pageCount };
}
