"use server";

import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import {
  mcqOptions,
  type QbExamType,
  qbChapters,
  qbInstitutes,
  qbQuestionMeta,
  qbQuestionTopics,
  qbSubjects,
  qbTopics,
  questions,
} from "@/db/schema";

/**
 * Reading the question bank.
 *
 * Every view in the bank — by board, by university, by year, by subject, by
 * topic — is the same query with a different set of filters. A question is
 * stored once; which pages it appears on is decided entirely here, by joining
 * `qb_question_meta`. Nothing in this file writes, and nothing copies a question
 * to make it show up somewhere new.
 */

// ── Small shared shapes ─────────────────────────────────────────────────────

export interface QbCountRow {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly questions: number;
}

export interface QbCardCounts {
  readonly board: number;
  readonly university: number;
  readonly engineering: number;
  readonly medical: number;
  readonly mixed: number;
  readonly subject: number;
  readonly total: number;
}

/**
 * The six ways in, with a live count on each.
 *
 * A question with no institute counts towards "mixed" rather than being
 * invisible — the archive and the textbook practice sets have no board or year
 * to file them under, and they are still real questions a student can reach.
 */
export async function getQbHomeCards(): Promise<QbCardCounts> {
  const [row] = await db
    .select({
      board: sql<number>`count(*) filter (where ${qbQuestionMeta.examType} = 'board')::int`,
      university: sql<number>`count(*) filter (where ${qbQuestionMeta.examType} = 'university')::int`,
      engineering: sql<number>`count(*) filter (where ${qbQuestionMeta.examType} = 'engineering')::int`,
      medical: sql<number>`count(*) filter (where ${qbQuestionMeta.examType} = 'medical')::int`,
      mixed: sql<number>`count(*) filter (where ${qbQuestionMeta.instituteId} is null)::int`,
      subject: sql<number>`count(*) filter (where ${qbQuestionMeta.subjectId} is not null)::int`,
      total: sql<number>`count(distinct ${qbQuestionMeta.questionId})::int`,
    })
    .from(qbQuestionMeta);

  return {
    board: row.board,
    university: row.university,
    engineering: row.engineering,
    medical: row.medical,
    mixed: row.mixed,
    subject: row.subject,
    total: row.total,
  };
}

// ── Exam-wise navigation ────────────────────────────────────────────────────

export interface QbInstituteRow extends QbCountRow {
  readonly type: QbExamType;
}

export interface QbInstituteWithGroups {
  readonly institute: QbInstituteRow;
  readonly groups: readonly string[];
  readonly years: number;
}

/**
 * Every institute of one exam type, each with the groups and years it holds.
 *
 * The group and year lists are read off the occurrences rather than stored, so
 * adding a paper with a new year needs no maintenance here — it simply appears.
 */
export async function getInstitutesByType(
  type: QbExamType,
): Promise<QbInstituteWithGroups[]> {
  /* Driven from the institutes, not from the questions: the nine boards exist
     whether or not a paper has been filed under them yet, and a board page that
     lists nothing because it is not filled in reads as "this does not exist"
     rather than "nothing has been added here yet".

     Groups and years come back as aggregates rather than as grouped columns —
     one row per institute, with the distinct values it has collected. */
  const rows = await db
    .select({
      id: qbInstitutes.id,
      name: qbInstitutes.name,
      slug: qbInstitutes.slug,
      orderNo: qbInstitutes.orderNo,
      questions: sql<number>`count(distinct ${qbQuestionMeta.questionId})::int`,
      groups: sql<string[]>`
        coalesce(
          array_agg(distinct ${qbQuestionMeta.groupName})
            filter (where ${qbQuestionMeta.groupName} <> ''),
          array[]::text[]
        )
      `,
      years: sql<string[]>`
        coalesce(
          array_agg(distinct ${qbQuestionMeta.year})
            filter (where ${qbQuestionMeta.year} <> ''),
          array[]::text[]
        )
      `,
    })
    .from(qbInstitutes)
    .leftJoin(
      qbQuestionMeta,
      and(
        eq(qbQuestionMeta.instituteId, qbInstitutes.id),
        eq(qbQuestionMeta.examType, type),
      ),
    )
    .where(eq(qbInstitutes.type, type))
    .groupBy(qbInstitutes.id)
    .orderBy(
      desc(sql`count(distinct ${qbQuestionMeta.questionId})`),
      asc(qbInstitutes.orderNo),
    );

  return rows.map((row) => ({
    institute: {
      id: row.id,
      name: row.name,
      slug: row.slug,
      type,
      questions: row.questions,
    },
    groups: [...(row.groups ?? [])].sort(),
    years: (row.years ?? []).length,
  }));
}

export interface QbFacet {
  readonly value: string;
  readonly label: string;
  readonly questions: number;
}

/** Years, groups and units that actually occur under an institute. */
export async function getInstituteFacets(instituteId: string): Promise<{
  years: QbFacet[];
  groups: QbFacet[];
  units: QbFacet[];
}> {
  const rows = await db
    .select({
      year: qbQuestionMeta.year,
      groupName: qbQuestionMeta.groupName,
      unitName: qbQuestionMeta.unitName,
      n: sql<number>`count(distinct ${qbQuestionMeta.questionId})::int`,
    })
    .from(qbQuestionMeta)
    .where(eq(qbQuestionMeta.instituteId, instituteId))
    .groupBy(
      qbQuestionMeta.year,
      qbQuestionMeta.groupName,
      qbQuestionMeta.unitName,
    );

  const tally = (
    pick: (r: (typeof rows)[number]) => string,
  ): Map<string, number> => {
    const map = new Map<string, number>();
    for (const row of rows) {
      const key = pick(row);
      if (!key) continue;
      map.set(key, Math.max(map.get(key) ?? 0, row.n));
    }
    return map;
  };

  // Sorting years newest-first where they look like years, alphabetically otherwise.
  const sort = (a: string, b: string) => {
    const na = Number(a);
    const nb = Number(b);
    const aYear = Number.isFinite(na);
    const bYear = Number.isFinite(nb);
    if (aYear && bYear) return nb - na;
    if (aYear) return -1;
    if (bYear) return 1;
    return a.localeCompare(b, "bn");
  };

  const toFacets = (map: Map<string, number>) =>
    [...map.entries()]
      .map(([value, questions]) => ({ value, label: value, questions }))
      .sort((a, b) => sort(a.value, b.value));

  return {
    years: toFacets(tally((r) => r.year)),
    groups: toFacets(tally((r) => r.groupName)),
    units: toFacets(tally((r) => r.unitName)),
  };
}

// ── Subject-wise navigation ─────────────────────────────────────────────────

export async function getSubjectsWithCounts(): Promise<QbCountRow[]> {
  return db
    .select({
      id: qbSubjects.id,
      name: qbSubjects.name,
      slug: qbSubjects.slug,
      questions: sql<number>`count(distinct ${qbQuestionMeta.questionId})::int`,
    })
    .from(qbSubjects)
    .leftJoin(qbQuestionMeta, eq(qbQuestionMeta.subjectId, qbSubjects.id))
    .groupBy(qbSubjects.id)
    .orderBy(
      desc(sql`count(distinct ${qbQuestionMeta.questionId})`),
      asc(qbSubjects.name),
    );
}

export async function getChaptersWithCounts(
  subjectId: string,
): Promise<QbCountRow[]> {
  return db
    .select({
      id: qbChapters.id,
      name: qbChapters.name,
      slug: qbChapters.slug,
      questions: sql<number>`count(distinct ${qbQuestionMeta.questionId})::int`,
    })
    .from(qbChapters)
    .leftJoin(qbQuestionMeta, eq(qbQuestionMeta.chapterId, qbChapters.id))
    .where(eq(qbChapters.subjectId, subjectId))
    .groupBy(qbChapters.id)
    .orderBy(asc(qbChapters.orderNo), asc(qbChapters.name));
}

export async function getChapterBySlug(
  subjectSlug: string,
  chapterSlug: string,
): Promise<{ subject: QbCountRow; chapter: QbCountRow } | null> {
  const [row] = await db
    .select({
      subjectId: qbSubjects.id,
      subjectName: qbSubjects.name,
      subjectSlug: qbSubjects.slug,
      chapterId: qbChapters.id,
      chapterName: qbChapters.name,
      chapterSlug: qbChapters.slug,
    })
    .from(qbChapters)
    .innerJoin(qbSubjects, eq(qbChapters.subjectId, qbSubjects.id))
    .where(
      and(eq(qbSubjects.slug, subjectSlug), eq(qbChapters.slug, chapterSlug)),
    )
    .limit(1);

  if (!row) return null;

  const [counts] = await db
    .select({
      subjectQuestions: sql<number>`count(distinct ${qbQuestionMeta.questionId}) filter (where ${qbQuestionMeta.subjectId} = ${row.subjectId})::int`,
      chapterQuestions: sql<number>`count(distinct ${qbQuestionMeta.questionId}) filter (where ${qbQuestionMeta.chapterId} = ${row.chapterId})::int`,
    })
    .from(qbQuestionMeta);

  return {
    subject: {
      id: row.subjectId,
      name: row.subjectName,
      slug: row.subjectSlug,
      questions: counts.subjectQuestions,
    },
    chapter: {
      id: row.chapterId,
      name: row.chapterName,
      slug: row.chapterSlug,
      questions: counts.chapterQuestions,
    },
  };
}

// ── Topics ──────────────────────────────────────────────────────────────────

export async function getTopicsWithCounts(
  chapterId: string,
): Promise<QbCountRow[]> {
  return db
    .select({
      id: qbTopics.id,
      name: qbTopics.name,
      slug: qbTopics.slug,
      questions: sql<number>`count(distinct ${qbQuestionTopics.questionId})::int`,
    })
    .from(qbTopics)
    .leftJoin(qbQuestionTopics, eq(qbQuestionTopics.topicId, qbTopics.id))
    .where(eq(qbTopics.chapterId, chapterId))
    .groupBy(qbTopics.id)
    .orderBy(asc(qbTopics.name));
}

export async function getTopicBySlug(topicSlug: string): Promise<{
  topic: QbCountRow;
  chapter: QbCountRow;
  subject: QbCountRow;
} | null> {
  const [row] = await db
    .select({
      topicId: qbTopics.id,
      topicName: qbTopics.name,
      topicSlug: qbTopics.slug,
      chapterId: qbChapters.id,
      chapterName: qbChapters.name,
      chapterSlug: qbChapters.slug,
      subjectId: qbSubjects.id,
      subjectName: qbSubjects.name,
      subjectSlug: qbSubjects.slug,
    })
    .from(qbTopics)
    .innerJoin(qbChapters, eq(qbTopics.chapterId, qbChapters.id))
    .innerJoin(qbSubjects, eq(qbChapters.subjectId, qbSubjects.id))
    .where(eq(qbTopics.slug, topicSlug))
    .limit(1);

  if (!row) return null;

  const [n] = await db
    .select({
      n: sql<number>`count(distinct ${qbQuestionTopics.questionId})::int`,
    })
    .from(qbQuestionTopics)
    .where(eq(qbQuestionTopics.topicId, row.topicId));

  return {
    topic: {
      id: row.topicId,
      name: row.topicName,
      slug: row.topicSlug,
      questions: n.n,
    },
    chapter: {
      id: row.chapterId,
      name: row.chapterName,
      slug: row.chapterSlug,
      questions: 0,
    },
    subject: {
      id: row.subjectId,
      name: row.subjectName,
      slug: row.subjectSlug,
      questions: 0,
    },
  };
}

// ── The one listing query ───────────────────────────────────────────────────

/** Every way a page can narrow the list. All are optional. */
export interface QbQuestionFilters {
  readonly instituteId?: string;
  readonly examType?: QbExamType;
  readonly year?: string;
  readonly groupName?: string;
  readonly unitName?: string;
  readonly subjectId?: string;
  readonly chapterId?: string;
  readonly topicId?: string;
  /** True to list questions that carry no institute — the archive and the
      textbook practice sets, which no board or year owns. */
  readonly onlyUnfiled?: boolean;
  readonly type?: "mcq" | "cq";
  readonly search?: string;
  readonly limit?: number;
  readonly offset?: number;
}

/** Where a question was actually examined — the chips on a question card. */
export interface QbOccurrence {
  readonly examType: QbExamType | null;
  readonly instituteName: string | null;
  readonly year: string;
  readonly unitName: string;
  readonly groupName: string;
}

export interface QbQuestionRow {
  readonly id: string;
  readonly type: "mcq" | "cq";
  readonly questionText: string;
  readonly explanation: string | null;
  readonly isFree: boolean;
  readonly source: string;
  readonly options: readonly {
    readonly id: string;
    readonly text: string;
    readonly isCorrect: boolean;
  }[];
  readonly occurrences: readonly QbOccurrence[];
  readonly subjectName: string | null;
  readonly chapterName: string | null;
}

/** Narrows `qb_question_meta` down to the occurrences a filter matches. */
function occurrenceFilter(filters: QbQuestionFilters) {
  const conditions = [];

  if (filters.onlyUnfiled) {
    return eq(qbQuestionMeta.instituteId, null as unknown as string);
  }
  if (filters.instituteId) {
    conditions.push(eq(qbQuestionMeta.instituteId, filters.instituteId));
  }
  if (filters.examType)
    conditions.push(eq(qbQuestionMeta.examType, filters.examType));
  if (filters.year) conditions.push(eq(qbQuestionMeta.year, filters.year));
  if (filters.groupName)
    conditions.push(eq(qbQuestionMeta.groupName, filters.groupName));
  if (filters.unitName)
    conditions.push(eq(qbQuestionMeta.unitName, filters.unitName));
  if (filters.subjectId)
    conditions.push(eq(qbQuestionMeta.subjectId, filters.subjectId));
  if (filters.chapterId)
    conditions.push(eq(qbQuestionMeta.chapterId, filters.chapterId));

  return conditions.length ? and(...conditions) : undefined;
}

/**
 * Lists questions, once each, with every place they were examined.
 *
 * A question that sat in two papers of the same search still appears once — the
 * match is on the question, not the occurrence, so nothing on the page can look
 * like a duplicate of itself. The papers it matched are listed as chips instead.
 */
export async function listQbQuestions(
  filters: QbQuestionFilters = {},
): Promise<{ rows: QbQuestionRow[]; total: number }> {
  const limit = Math.min(filters.limit ?? 24, 100);
  const offset = filters.offset ?? 0;

  /* Topics live in their own join table, so they are resolved to a question id
     list first rather than joined into the occurrence query. */
  let topicQuestionIds: string[] | null = null;
  if (filters.topicId) {
    const topicRows = await db
      .select({ questionId: qbQuestionTopics.questionId })
      .from(qbQuestionTopics)
      .where(eq(qbQuestionTopics.topicId, filters.topicId));
    topicQuestionIds = topicRows.map((r) => r.questionId);
    if (topicQuestionIds.length === 0) return { rows: [], total: 0 };
  }

  const search = filters.search?.trim();
  const where = occurrenceFilter(filters);

  const idQuery = db
    .selectDistinct({ questionId: qbQuestionMeta.questionId })
    .from(qbQuestionMeta);

  // The topic list and the page filters meet here: a question has to satisfy
  // both to be on the page.
  const ids = await (() => {
    if (topicQuestionIds && where) {
      return idQuery.where(
        and(where, inArray(qbQuestionMeta.questionId, topicQuestionIds)),
      );
    }
    if (topicQuestionIds) {
      return idQuery.where(
        inArray(qbQuestionMeta.questionId, topicQuestionIds),
      );
    }
    return where ? idQuery.where(where) : idQuery;
  })();

  const questionIds = ids.map((r: { questionId: string }) => r.questionId);
  if (questionIds.length === 0) return { rows: [], total: 0 };

  const conditions = [inArray(questions.id, questionIds)];
  if (filters.type) conditions.push(eq(questions.type, filters.type));
  if (search) {
    const like = `%${search}%`;
    conditions.push(
      or(
        ilike(questions.questionText, like),
        ilike(questions.source, like),
        ilike(questions.explanation, like),
      )!,
    );
  }
  const questionWhere = and(...conditions);

  const [totalRow] = await db
    .select({ n: count() })
    .from(questions)
    .where(questionWhere);

  const base = db
    .select({
      id: questions.id,
      type: questions.type,
      questionText: questions.questionText,
      explanation: questions.explanation,
      isFree: questions.isFree,
      source: questions.source,
    })
    .from(questions)
    .where(questionWhere)
    .orderBy(desc(questions.createdAt))
    .limit(limit)
    .offset(offset);

  const selected = await base;

  if (selected.length === 0) return { rows: [], total: totalRow.n };

  const selectedIds = selected.map((q) => q.id);

  /* Everything the returned questions are attached to — the whole point of
     storing one copy is being able to show all of its papers at once. */
  const [options, occurrences, subjects, chapters] = await Promise.all([
    db
      .select({
        questionId: mcqOptions.questionId,
        id: mcqOptions.id,
        text: mcqOptions.optionText,
        isCorrect: mcqOptions.isCorrect,
      })
      .from(mcqOptions)
      .where(inArray(mcqOptions.questionId, selectedIds))
      .orderBy(asc(mcqOptions.orderNo)),
    db
      .select({
        questionId: qbQuestionMeta.questionId,
        examType: qbQuestionMeta.examType,
        instituteName: qbInstitutes.name,
        year: qbQuestionMeta.year,
        unitName: qbQuestionMeta.unitName,
        groupName: qbQuestionMeta.groupName,
      })
      .from(qbQuestionMeta)
      .leftJoin(qbInstitutes, eq(qbQuestionMeta.instituteId, qbInstitutes.id))
      .where(inArray(qbQuestionMeta.questionId, selectedIds)),
    db
      .selectDistinct({
        questionId: qbQuestionMeta.questionId,
        name: qbSubjects.name,
      })
      .from(qbQuestionMeta)
      .innerJoin(qbSubjects, eq(qbQuestionMeta.subjectId, qbSubjects.id))
      .where(inArray(qbQuestionMeta.questionId, selectedIds)),
    db
      .selectDistinct({
        questionId: qbQuestionMeta.questionId,
        name: qbChapters.name,
      })
      .from(qbQuestionMeta)
      .innerJoin(qbChapters, eq(qbQuestionMeta.chapterId, qbChapters.id))
      .where(inArray(qbQuestionMeta.questionId, selectedIds)),
  ]);

  type Option = { id: string; text: string; isCorrect: boolean };
  const optionsBy = new Map<string, Option[]>();
  for (const o of options) {
    const list = optionsBy.get(o.questionId) ?? [];
    list.push({ id: o.id, text: o.text, isCorrect: o.isCorrect });
    optionsBy.set(o.questionId, list);
  }

  const occurrencesBy = new Map<string, QbOccurrence[]>();
  for (const o of occurrences) {
    const list = occurrencesBy.get(o.questionId) ?? [];
    list.push({
      examType: o.examType,
      instituteName: o.instituteName,
      year: o.year,
      unitName: o.unitName,
      groupName: o.groupName,
    });
    occurrencesBy.set(o.questionId, list);
  }

  const subjectBy = new Map(subjects.map((s) => [s.questionId, s.name]));
  const chapterBy = new Map(chapters.map((c) => [c.questionId, c.name]));

  return {
    total: totalRow.n,
    rows: selected.map((q) => ({
      ...q,
      options: optionsBy.get(q.id) ?? [],
      occurrences: occurrencesBy.get(q.id) ?? [],
      subjectName: subjectBy.get(q.id) ?? null,
      chapterName: chapterBy.get(q.id) ?? null,
    })),
  };
}

/** Free-text search across question text and the metadata around it. */
export async function searchQbQuestions(
  search: string,
  limit = 24,
): Promise<{ rows: QbQuestionRow[]; total: number }> {
  return listQbQuestions({ search, limit });
}
