"use server";

import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
} from "drizzle-orm";
import { db } from "@/db";
import {
  cqParts,
  mcqOptions,
  qbChapters,
  qbInstitutes,
  qbQuestionMeta,
  qbSubjects,
  questions,
} from "@/db/schema";
import type { CQPart, MCQOption, Question } from "@/types";

/**
 * The subject-wise view reads the same `qb_question_meta` rows the exam view
 * does — nothing is copied. Every level is derived from the questions that
 * exist, so an option that has no questions never appears.
 */

export interface QbSubjectNode {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly paper: string;
  readonly questions: number;
}

export interface QbChapterNode {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly questions: number;
}

export interface QbExamTypeCount {
  readonly examType: string;
  readonly questions: number;
}

export interface QbInstituteCount {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly type: string;
  readonly questions: number;
}

/** Every subject that has at least one question. */
export async function getSubjectList(): Promise<readonly QbSubjectNode[]> {
  const rows = await db
    .select({
      id: qbSubjects.id,
      slug: qbSubjects.slug,
      name: qbSubjects.name,
      paper: qbSubjects.paper,
      questions: count(qbQuestionMeta.questionId),
    })
    .from(qbSubjects)
    .innerJoin(qbQuestionMeta, eq(qbQuestionMeta.subjectId, qbSubjects.id))
    .groupBy(qbSubjects.id)
    .orderBy(asc(qbSubjects.orderNo), asc(qbSubjects.name));

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    paper: row.paper,
    questions: Number(row.questions),
  }));
}

/** One subject's chapters, those with questions only. */
export async function getChapterList(
  subjectId: string,
): Promise<readonly QbChapterNode[]> {
  const rows = await db
    .select({
      id: qbChapters.id,
      slug: qbChapters.slug,
      name: qbChapters.name,
      questions: count(qbQuestionMeta.questionId),
    })
    .from(qbChapters)
    .innerJoin(qbQuestionMeta, eq(qbQuestionMeta.chapterId, qbChapters.id))
    .where(eq(qbChapters.subjectId, subjectId))
    .groupBy(qbChapters.id)
    .orderBy(asc(qbChapters.orderNo), asc(qbChapters.name));

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    questions: Number(row.questions),
  }));
}

export async function getSubjectBySlug(
  slug: string,
): Promise<QbSubjectNode | null> {
  const [row] = await db
    .select({
      id: qbSubjects.id,
      slug: qbSubjects.slug,
      name: qbSubjects.name,
      paper: qbSubjects.paper,
    })
    .from(qbSubjects)
    .where(eq(qbSubjects.slug, slug))
    .limit(1);
  if (!row) return null;

  const [{ total }] = await db
    .select({ total: count() })
    .from(qbQuestionMeta)
    .where(eq(qbQuestionMeta.subjectId, row.id));

  return { ...row, questions: Number(total) };
}

export async function getChapterBySlug(
  subjectSlug: string,
  chapterSlug: string,
): Promise<{ chapter: QbChapterNode; subject: QbSubjectNode } | null> {
  // A chapter slug is only unique inside its own subject, so both slugs have to
  // match — otherwise /qb/subjects/রসায়ন/জৈব-রসায়ন would open a chapter that
  // belongs to a different subject entirely.
  const [subject] = await db
    .select({
      id: qbSubjects.id,
      slug: qbSubjects.slug,
      name: qbSubjects.name,
      paper: qbSubjects.paper,
    })
    .from(qbSubjects)
    .where(eq(qbSubjects.slug, subjectSlug))
    .limit(1);
  if (!subject) return null;

  const [chapter] = await db
    .select({
      id: qbChapters.id,
      slug: qbChapters.slug,
      name: qbChapters.name,
    })
    .from(qbChapters)
    .where(
      and(
        eq(qbChapters.subjectId, subject.id),
        eq(qbChapters.slug, chapterSlug),
      ),
    )
    .limit(1);
  if (!chapter) return null;

  const [{ total }] = await db
    .select({ total: count() })
    .from(qbQuestionMeta)
    .where(eq(qbQuestionMeta.chapterId, chapter.id));

  return {
    chapter: {
      id: chapter.id,
      slug: chapter.slug,
      name: chapter.name,
      questions: Number(total),
    },
    subject: { ...subject, questions: 0 },
  };
}

/** How a chapter's questions split by exam type — the "All Sources" row. */
export async function getChapterExamTypes(
  chapterId: string,
): Promise<readonly QbExamTypeCount[]> {
  const rows = await db
    .select({
      examType: qbQuestionMeta.examType,
      questions: count(qbQuestionMeta.questionId),
    })
    .from(qbQuestionMeta)
    .where(
      and(
        eq(qbQuestionMeta.chapterId, chapterId),
        isNotNull(qbQuestionMeta.examType),
      ),
    )
    .groupBy(qbQuestionMeta.examType)
    .orderBy(desc(count(qbQuestionMeta.questionId)));

  return rows.map((row) => ({
    examType: String(row.examType),
    questions: Number(row.questions),
  }));
}

/**
 * The boards / universities a chapter's questions come from.
 *
 * Narrowed by exam type when one is given, so choosing "বিশ্ববিদ্যালয়" lists
 * only universities.
 */
export async function getChapterInstitutes(
  chapterId: string,
  examType?: string,
): Promise<readonly QbInstituteCount[]> {
  const rows = await db
    .select({
      id: qbInstitutes.id,
      slug: qbInstitutes.slug,
      name: qbInstitutes.name,
      type: qbInstitutes.type,
      questions: count(qbQuestionMeta.questionId),
    })
    .from(qbQuestionMeta)
    .innerJoin(qbInstitutes, eq(qbInstitutes.id, qbQuestionMeta.instituteId))
    .where(
      examType
        ? and(
            eq(qbQuestionMeta.chapterId, chapterId),
            eq(qbQuestionMeta.examType, examType as never),
          )
        : eq(qbQuestionMeta.chapterId, chapterId),
    )
    .groupBy(qbInstitutes.id)
    .orderBy(desc(count(qbQuestionMeta.questionId)), asc(qbInstitutes.name));

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.type,
    questions: Number(row.questions),
  }));
}

/**
 * Units and years still reachable under the current selection.
 *
 * Narrowed by whatever is already chosen, so choosing "বিশ্ববিদ্যালয়" then
 * "ঢাকা বিশ্ববিদ্যালয়" leaves only that university's units and years — and a
 * chapter whose questions name no university still gets its paper split.
 */
export async function getChapterFacets(
  chapterId: string,
  filters: {
    readonly examType?: string;
    readonly instituteId?: string;
  } = {},
): Promise<{ units: readonly string[]; years: readonly string[] }> {
  const conditions = [eq(qbQuestionMeta.chapterId, chapterId)];
  if (filters.examType)
    conditions.push(eq(qbQuestionMeta.examType, filters.examType as never));
  if (filters.instituteId)
    conditions.push(eq(qbQuestionMeta.instituteId, filters.instituteId));

  const rows = await db
    .select({
      unitName: qbQuestionMeta.unitName,
      year: qbQuestionMeta.year,
    })
    .from(qbQuestionMeta)
    .where(and(...conditions));

  const units = new Set<string>();
  const years = new Set<string>();
  for (const row of rows) {
    if (row.unitName) units.add(row.unitName);
    if (row.year) years.add(row.year);
  }

  return {
    units: [...units].sort((a, b) => a.localeCompare(b, "bn")),
    years: [...years].sort().reverse(),
  };
}

/**
 * The questions themselves, with the optional filters applied.
 *
 * Returned in the shape ChapterQuestionsViewer already understands, so the
 * subject-wise view and the exam-wise view render a question through the same
 * card and the same controls.
 */
export async function getChapterQuestions(
  chapterId: string,
  filters: {
    readonly examType?: string;
    readonly instituteId?: string;
    readonly unitName?: string;
    readonly year?: string;
    readonly search?: string;
  } = {},
): Promise<Question[]> {
  const conditions = [eq(qbQuestionMeta.chapterId, chapterId)];

  if (filters.examType)
    conditions.push(eq(qbQuestionMeta.examType, filters.examType as never));
  if (filters.instituteId)
    conditions.push(eq(qbQuestionMeta.instituteId, filters.instituteId));
  if (filters.unitName)
    conditions.push(eq(qbQuestionMeta.unitName, filters.unitName));
  if (filters.year) conditions.push(eq(qbQuestionMeta.year, filters.year));

  const search = filters.search?.trim();
  const where = search
    ? and(...conditions, ilike(questions.questionText, `%${search}%`))
    : and(...conditions);

  const rows = await db
    .select({
      id: questions.id,
      questionText: questions.questionText,
      type: questions.type,
      explanation: questions.explanation,
      source: questions.source,
      standard: questions.standard,
      isFree: questions.isFree,
      topicId: questions.topicId,
      subitemId: questions.subitemId,
    })
    .from(qbQuestionMeta)
    .innerJoin(questions, eq(questions.id, qbQuestionMeta.questionId))
    .where(where)
    .orderBy(asc(questions.id));

  // Options and sub-parts are fetched in two extra queries rather than joined:
  // a left join would multiply the rows by the option count and break the
  // one-row-per-question grouping the maps below rely on.
  const ids = rows.map((row) => row.id);
  const [optionRows, partRows] = ids.length
    ? await Promise.all([
        db
          .select({
            id: mcqOptions.id,
            questionId: mcqOptions.questionId,
            optionText: mcqOptions.optionText,
            isCorrect: mcqOptions.isCorrect,
            orderNo: mcqOptions.orderNo,
          })
          .from(mcqOptions)
          .where(inArray(mcqOptions.questionId, ids))
          .orderBy(asc(mcqOptions.orderNo)),
        db
          .select({
            id: cqParts.id,
            questionId: cqParts.questionId,
            partKey: cqParts.partKey,
            questionText: cqParts.questionText,
            answerText: cqParts.answerText,
            marks: cqParts.marks,
            orderNo: cqParts.orderNo,
          })
          .from(cqParts)
          .where(inArray(cqParts.questionId, ids))
          .orderBy(asc(cqParts.orderNo)),
      ])
    : [[], []];

  const optionsBy = new Map<string, MCQOption[]>();
  for (const option of optionRows) {
    const list = optionsBy.get(option.questionId) ?? [];
    list.push({
      id: option.id,
      questionId: option.questionId,
      optionText: option.optionText,
      isCorrect: option.isCorrect,
      orderNo: option.orderNo,
    });
    optionsBy.set(option.questionId, list);
  }

  const partsBy = new Map<string, CQPart[]>();
  for (const part of partRows) {
    const list = partsBy.get(part.questionId) ?? [];
    list.push({
      id: part.id,
      questionId: part.questionId,
      partKey: part.partKey,
      questionText: part.questionText,
      answerText: part.answerText,
      marks: part.marks,
      orderNo: part.orderNo,
    });
    partsBy.set(part.questionId, list);
  }

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    source: row.source,
    standard: row.standard,
    question_text: row.questionText,
    explanation: row.explanation,
    topic_id: row.topicId,
    subitemId: row.subitemId,
    is_free: row.isFree,
    mcq_options: optionsBy.get(row.id) ?? [],
    cq_parts: partsBy.get(row.id) ?? [],
  }));
}
