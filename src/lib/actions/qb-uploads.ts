"use server";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import {
  newChapters,
  newCqParts,
  newMcqOptions,
  newQuestions,
  newSubjects,
  newTopics,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import type { ParsedCsvQuestion } from "@/lib/csv-parser";
import { qbSlug } from "@/lib/qb-meta-write";

/**
 * The new question bank.
 *
 * Everything uploaded from /qb lives in the `new_*` tables only. The archived
 * bank (`containers` / `questions`) is left completely alone so the exams built
 * on it keep working.
 */

/** Used when a row does not name its subject or chapter. */
const UNFILED = "সাধারণ";

export interface QbUploadResult {
  readonly imported: number;
  readonly skipped: number;
  readonly errors: readonly string[];
}

export interface QbUploadedOption {
  readonly id: string;
  readonly optionText: string;
  readonly image: string | null;
  readonly isCorrect: boolean;
  readonly orderNo: number;
}

export interface QbUploadedPart {
  readonly id: string;
  readonly partKey: string;
  readonly questionText: string;
  readonly answerText: string | null;
  readonly marks: number;
  readonly orderNo: number;
}

export interface QbUploadedQuestion {
  readonly id: string;
  readonly type: "mcq" | "cq";
  readonly source: string;
  readonly standard: string;
  readonly questionText: string;
  readonly questionImage: string | null;
  readonly explanation: string | null;
  readonly explanationImage: string | null;
  readonly subjectId: string;
  readonly subjectName: string;
  readonly chapterId: string;
  readonly chapterName: string;
  readonly topicId: string | null;
  readonly topicName: string | null;
  readonly createdAt: string;
  readonly mcqOptions: readonly QbUploadedOption[];
  readonly cqParts: readonly QbUploadedPart[];
}

/** A subject / chapter / topic the uploaded questions can be filtered by. */
export interface QbFilterOption {
  readonly id: string;
  readonly name: string;
  readonly count: number;
}

export interface QbFilterChapter extends QbFilterOption {
  readonly subjectId: string;
  readonly topics: readonly QbFilterOption[];
}

export interface QbFilterSubject extends QbFilterOption {
  readonly chapters: readonly QbFilterChapter[];
}

export interface QbFilterTree {
  readonly subjects: readonly QbFilterSubject[];
}

/** The ids currently applied, after dropping anything that no longer exists. */
export interface QbFilterSelection {
  readonly subjectId: string | null;
  readonly chapterId: string | null;
  readonly topicId: string | null;
}

export interface QbFilters {
  readonly subjectId?: string;
  readonly chapterId?: string;
  readonly topicId?: string;
}

export interface QbUploadsPage {
  /** Matching the current filter. */
  readonly total: number;
  /** The whole bank, ignoring the filter. */
  readonly allTotal: number;
  /** Newest first; `total` may be larger than this list. */
  readonly questions: readonly QbUploadedQuestion[];
  readonly filterTree: QbFilterTree;
  readonly selected: QbFilterSelection;
}

async function requireAdmin(): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.role !== "admin") {
    throw new Error("শুধুমাত্র অ্যাডমিন প্রশ্ন আপলোড করতে পারেন।");
  }
}

/** A subject is created on first use; slugs are unique across the table. */
async function resolveSubjectId(name: string): Promise<string> {
  const base = qbSlug(name) || "general";

  const [existing] = await db
    .select({ id: newSubjects.id })
    .from(newSubjects)
    .where(eq(newSubjects.slug, base))
    .limit(1);
  if (existing) return existing.id;

  let slug = base;
  let suffix = 2;
  while (
    (
      await db
        .select({ id: newSubjects.id })
        .from(newSubjects)
        .where(eq(newSubjects.slug, slug))
        .limit(1)
    ).length > 0
  ) {
    slug = `${base}-${suffix++}`;
  }

  const [created] = await db
    .insert(newSubjects)
    .values({ name, slug })
    .returning({ id: newSubjects.id });
  return created.id;
}

async function resolveChapterId(
  subjectId: string,
  name: string,
): Promise<string> {
  const slug = qbSlug(name) || "general";

  const [existing] = await db
    .select({ id: newChapters.id })
    .from(newChapters)
    .where(
      and(eq(newChapters.subjectId, subjectId), eq(newChapters.slug, slug)),
    )
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(newChapters)
    .values({ subjectId, name, slug })
    .returning({ id: newChapters.id });
  return created.id;
}

async function resolveTopicId(
  chapterId: string,
  name: string,
): Promise<string> {
  const slug = qbSlug(name) || "general";

  const [existing] = await db
    .select({ id: newTopics.id })
    .from(newTopics)
    .where(and(eq(newTopics.chapterId, chapterId), eq(newTopics.slug, slug)))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(newTopics)
    .values({ chapterId, name, slug })
    .returning({ id: newTopics.id });
  return created.id;
}

function rowKey(row: ParsedCsvQuestion): string {
  return [
    row.subjectName?.trim() ?? "",
    row.paperName?.trim() ?? "",
    row.chapterName?.trim() ?? "",
    row.topicName?.trim() ?? "",
  ].join("\u0000");
}

function chunk<T>(list: readonly T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < list.length; i += size) {
    batches.push(list.slice(i, i + size));
  }
  return batches;
}

/**
 * Writes one batch of parsed CSV rows into the `new_*` tables.
 *
 * The screen parses the file in the browser and posts it in batches, so a big
 * sheet never has to fit in one request. Re-sending the same rows is safe:
 * a question already present in the same chapter is skipped.
 */
export async function importQbRowsAction(
  rows: readonly ParsedCsvQuestion[],
): Promise<QbUploadResult> {
  await requireAdmin();

  const errors: string[] = [];
  const valid: ParsedCsvQuestion[] = [];

  rows.forEach((row, index) => {
    const questionText = (row.questionText ?? "").trim();
    if (!questionText) {
      errors.push(`সারি ${index + 1}: প্রশ্নের টেক্সট নেই।`);
      return;
    }
    if (
      row.type === "mcq" &&
      (!row.mcqOptions || row.mcqOptions.length === 0)
    ) {
      errors.push(`সারি ${index + 1}: কোনো অপশন পাওয়া যায়নি।`);
      return;
    }
    valid.push({ ...row, questionText });
  });

  if (valid.length === 0) {
    return { imported: 0, skipped: 0, errors };
  }

  // One chapter per subject / chapter / topic combination, resolved once.
  const folders = new Map<
    string,
    { chapterId: string; topicId: string | null }
  >();

  for (const row of valid) {
    const key = rowKey(row);
    if (folders.has(key)) continue;

    const subjectName = (row.subjectName || row.paperName || UNFILED).trim();
    const chapterName = (row.chapterName || UNFILED).trim();
    const topicName = (row.topicName ?? "").trim();

    const subjectId = await resolveSubjectId(subjectName);
    const chapterId = await resolveChapterId(subjectId, chapterName);
    const topicId = topicName
      ? await resolveTopicId(chapterId, topicName)
      : null;

    folders.set(key, { chapterId, topicId });
  }

  const chapterIds = [
    ...new Set([...folders.values()].map((folder) => folder.chapterId)),
  ];
  const existing = await db
    .select({
      chapterId: newQuestions.chapterId,
      questionText: newQuestions.questionText,
    })
    .from(newQuestions)
    .where(inArray(newQuestions.chapterId, chapterIds));

  const seen = new Set(
    existing.map((row) => `${row.chapterId}\u0000${row.questionText}`),
  );

  const questionRows: (typeof newQuestions.$inferInsert)[] = [];
  const optionRows: (typeof newMcqOptions.$inferInsert)[] = [];
  const partRows: (typeof newCqParts.$inferInsert)[] = [];
  let skipped = 0;

  for (const row of valid) {
    const folder = folders.get(rowKey(row));
    if (!folder) continue;

    const dedupeKey = `${folder.chapterId}\u0000${row.questionText}`;
    if (seen.has(dedupeKey)) {
      skipped++;
      continue;
    }
    seen.add(dedupeKey);

    const questionId = crypto.randomUUID();

    questionRows.push({
      id: questionId,
      chapterId: folder.chapterId,
      topicId: folder.topicId,
      type: row.type,
      source: (row.source || "CSV আপলোড").trim(),
      standard: row.standard,
      questionText: row.questionText,
      questionImage: row.questionImage ?? null,
      explanation: row.explanation ?? null,
      explanationImage: row.explanationImage ?? null,
      isFree: false,
    });

    if (row.type === "mcq") {
      row.mcqOptions?.forEach((opt, index) => {
        optionRows.push({
          questionId,
          optionText: opt.optionText ?? "",
          image: opt.image ?? null,
          isCorrect: opt.isCorrect,
          orderNo: index + 1,
        });
      });
    } else {
      row.cqParts?.forEach((part, index) => {
        partRows.push({
          questionId,
          partKey: part.partKey,
          questionText: part.questionText,
          answerText: part.answerText ?? null,
          marks: part.marks,
          orderNo: index + 1,
        });
      });
    }
  }

  await db.transaction(async (tx) => {
    for (const batch of chunk(questionRows, 100)) {
      await tx.insert(newQuestions).values(batch);
    }
    for (const batch of chunk(optionRows, 300)) {
      await tx.insert(newMcqOptions).values(batch);
    }
    for (const batch of chunk(partRows, 300)) {
      await tx.insert(newCqParts).values(batch);
    }
  });

  return { imported: questionRows.length, skipped, errors };
}

interface QbFolderRow {
  readonly subjectId: string;
  readonly subjectName: string;
  readonly subjectOrder: number;
  readonly chapterId: string;
  readonly chapterName: string;
  readonly chapterOrder: number;
  readonly topicId: string | null;
  readonly topicName: string | null;
  readonly topicOrder: number | null;
  readonly count: number;
}

interface SubjectBucket {
  id: string;
  name: string;
  count: number;
  chapters: Map<string, ChapterBucket>;
}

interface ChapterBucket {
  id: string;
  name: string;
  subjectId: string;
  count: number;
  topics: Map<string, QbFilterOption>;
}

/**
 * Turns the grouped question counts into the three cascading lists.
 *
 * Only folders that actually hold questions are included, so a subject that
 * lost its questions never shows up as an empty choice.
 */
function buildFilterTree(rows: readonly QbFolderRow[]): QbFilterTree {
  const subjects = new Map<string, SubjectBucket>();

  for (const row of rows) {
    let subject = subjects.get(row.subjectId);
    if (!subject) {
      subject = {
        id: row.subjectId,
        name: row.subjectName,
        count: 0,
        chapters: new Map(),
      };
      subjects.set(row.subjectId, subject);
    }
    subject.count += row.count;

    let chapter = subject.chapters.get(row.chapterId);
    if (!chapter) {
      chapter = {
        id: row.chapterId,
        name: row.chapterName,
        subjectId: subject.id,
        count: 0,
        topics: new Map(),
      };
      subject.chapters.set(row.chapterId, chapter);
    }
    chapter.count += row.count;

    if (row.topicId) {
      const topic = chapter.topics.get(row.topicId) ?? {
        id: row.topicId,
        name: row.topicName ?? "",
        count: 0,
      };
      chapter.topics.set(row.topicId, {
        ...topic,
        count: topic.count + row.count,
      });
    }
  }

  return {
    subjects: [...subjects.values()].map((subject) => ({
      id: subject.id,
      name: subject.name,
      count: subject.count,
      chapters: [...subject.chapters.values()].map((chapter) => ({
        id: chapter.id,
        name: chapter.name,
        subjectId: chapter.subjectId,
        count: chapter.count,
        topics: [...chapter.topics.values()],
      })),
    })),
  };
}

/**
 * Keeps only ids that still exist and still belong to their parent, so an old
 * bookmarked URL cannot filter by a deleted chapter.
 */
function resolveSelection(
  tree: QbFilterTree,
  filters: QbFilters,
): QbFilterSelection {
  const subject = filters.subjectId
    ? (tree.subjects.find((item) => item.id === filters.subjectId) ?? null)
    : null;

  const chapterPool = subject
    ? subject.chapters
    : tree.subjects.flatMap((item) => item.chapters);
  const chapter = filters.chapterId
    ? (chapterPool.find((item) => item.id === filters.chapterId) ?? null)
    : null;

  const topic =
    filters.topicId && chapter
      ? (chapter.topics.find((item) => item.id === filters.topicId) ?? null)
      : null;

  const resolvedSubject =
    subject ??
    (chapter
      ? (tree.subjects.find((item) => item.id === chapter.subjectId) ?? null)
      : null);

  return {
    subjectId: resolvedSubject?.id ?? null,
    chapterId: chapter?.id ?? null,
    topicId: topic?.id ?? null,
  };
}

/** Everything uploaded from /qb, newest first, optionally filtered. */
export async function getQbUploads(
  filters: QbFilters = {},
  limit = 200,
): Promise<QbUploadsPage> {
  await requireAdmin();

  const folderRows = await db
    .select({
      subjectId: newSubjects.id,
      subjectName: newSubjects.name,
      subjectOrder: newSubjects.orderNo,
      chapterId: newChapters.id,
      chapterName: newChapters.name,
      chapterOrder: newChapters.orderNo,
      topicId: newTopics.id,
      topicName: newTopics.name,
      topicOrder: newTopics.orderNo,
      count: sql<number>`count(*)::int`,
    })
    .from(newQuestions)
    .innerJoin(newChapters, eq(newQuestions.chapterId, newChapters.id))
    .innerJoin(newSubjects, eq(newChapters.subjectId, newSubjects.id))
    .leftJoin(newTopics, eq(newQuestions.topicId, newTopics.id))
    .groupBy(
      newSubjects.id,
      newSubjects.name,
      newSubjects.orderNo,
      newChapters.id,
      newChapters.name,
      newChapters.orderNo,
      newTopics.id,
      newTopics.name,
      newTopics.orderNo,
    )
    .orderBy(
      newSubjects.orderNo,
      newSubjects.name,
      newChapters.orderNo,
      newChapters.name,
      newTopics.orderNo,
      newTopics.name,
    );

  const filterTree = buildFilterTree(folderRows);
  const selected = resolveSelection(filterTree, filters);
  const allTotal = filterTree.subjects.reduce(
    (sum, subject) => sum + subject.count,
    0,
  );

  const conditions = [
    selected.subjectId
      ? eq(newChapters.subjectId, selected.subjectId)
      : undefined,
    selected.chapterId
      ? eq(newQuestions.chapterId, selected.chapterId)
      : undefined,
    selected.topicId ? eq(newQuestions.topicId, selected.topicId) : undefined,
  ].filter((condition) => condition !== undefined);

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(newQuestions)
    .innerJoin(newChapters, eq(newQuestions.chapterId, newChapters.id))
    .where(where);

  const rows = await db
    .select({
      id: newQuestions.id,
      type: newQuestions.type,
      source: newQuestions.source,
      standard: newQuestions.standard,
      questionText: newQuestions.questionText,
      questionImage: newQuestions.questionImage,
      explanation: newQuestions.explanation,
      explanationImage: newQuestions.explanationImage,
      createdAt: newQuestions.createdAt,
      subjectId: newSubjects.id,
      subjectName: newSubjects.name,
      chapterId: newChapters.id,
      chapterName: newChapters.name,
      topicId: newTopics.id,
      topicName: newTopics.name,
    })
    .from(newQuestions)
    .innerJoin(newChapters, eq(newQuestions.chapterId, newChapters.id))
    .innerJoin(newSubjects, eq(newChapters.subjectId, newSubjects.id))
    .leftJoin(newTopics, eq(newQuestions.topicId, newTopics.id))
    .where(where)
    .orderBy(desc(newQuestions.createdAt))
    .limit(limit);

  const total = countRow?.count ?? rows.length;

  if (rows.length === 0) {
    return { total, allTotal, questions: [], filterTree, selected };
  }

  const questionIds = rows.map((row) => row.id);

  const [allOptions, allParts] = await Promise.all([
    db
      .select({
        id: newMcqOptions.id,
        questionId: newMcqOptions.questionId,
        optionText: newMcqOptions.optionText,
        image: newMcqOptions.image,
        isCorrect: newMcqOptions.isCorrect,
        orderNo: newMcqOptions.orderNo,
      })
      .from(newMcqOptions)
      .where(inArray(newMcqOptions.questionId, questionIds))
      .orderBy(newMcqOptions.orderNo),
    db
      .select({
        id: newCqParts.id,
        questionId: newCqParts.questionId,
        partKey: newCqParts.partKey,
        questionText: newCqParts.questionText,
        answerText: newCqParts.answerText,
        marks: newCqParts.marks,
        orderNo: newCqParts.orderNo,
      })
      .from(newCqParts)
      .where(inArray(newCqParts.questionId, questionIds))
      .orderBy(newCqParts.orderNo),
  ]);

  const optionsByQuestion = new Map<string, QbUploadedOption[]>();
  for (const option of allOptions) {
    const list = optionsByQuestion.get(option.questionId) ?? [];
    list.push({
      id: option.id,
      optionText: option.optionText,
      image: option.image,
      isCorrect: option.isCorrect,
      orderNo: option.orderNo,
    });
    optionsByQuestion.set(option.questionId, list);
  }

  const partsByQuestion = new Map<string, QbUploadedPart[]>();
  for (const part of allParts) {
    const list = partsByQuestion.get(part.questionId) ?? [];
    list.push({
      id: part.id,
      partKey: part.partKey,
      questionText: part.questionText,
      answerText: part.answerText,
      marks: part.marks,
      orderNo: part.orderNo,
    });
    partsByQuestion.set(part.questionId, list);
  }

  return {
    total,
    allTotal,
    filterTree,
    selected,
    questions: rows.map((row) => ({
      id: row.id,
      type: row.type,
      source: row.source,
      standard: row.standard,
      questionText: row.questionText,
      questionImage: row.questionImage,
      explanation: row.explanation,
      explanationImage: row.explanationImage,
      subjectId: row.subjectId,
      subjectName: row.subjectName,
      chapterId: row.chapterId,
      chapterName: row.chapterName,
      topicId: row.topicId,
      topicName: row.topicName,
      createdAt: row.createdAt.toISOString(),
      mcqOptions: optionsByQuestion.get(row.id) ?? [],
      cqParts: partsByQuestion.get(row.id) ?? [],
    })),
  };
}

const STANDARDS = ["HSC", "Varsity", "Engineering", "Medical"] as const;
const CQ_PART_KEYS = ["a", "b", "c", "d"] as const;

export interface QbQuestionOptionInput {
  readonly optionText: string;
  readonly image: string | null;
  readonly isCorrect: boolean;
}

export interface QbQuestionPartInput {
  readonly questionText: string;
  readonly answerText: string | null;
  readonly marks: number;
}

export interface QbQuestionUpdateInput {
  readonly id: string;
  readonly questionText: string;
  readonly questionImage: string | null;
  readonly explanation: string | null;
  readonly explanationImage: string | null;
  readonly source: string;
  readonly standard: string;
  readonly subjectName: string;
  readonly chapterName: string;
  readonly topicName: string | null;
  readonly options?: readonly QbQuestionOptionInput[];
  readonly parts?: readonly QbQuestionPartInput[];
}

export interface QbQuestionActionResult {
  readonly ok: boolean;
  readonly error?: string;
}

function cleanText(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanMarks(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(100, Math.max(1, Math.trunc(value)));
}

export interface QbMetaTopic {
  readonly id: string;
  readonly name: string;
}

export interface QbMetaChapter {
  readonly id: string;
  readonly name: string;
  readonly topics: readonly QbMetaTopic[];
}

export interface QbMetaSubject {
  readonly id: string;
  readonly name: string;
  readonly chapters: readonly QbMetaChapter[];
}

/**
 * Every folder in the new bank, as a tree.
 *
 * The edit form uses this to offer cascading dropdowns: picking a subject
 * narrows the chapters, and picking a chapter narrows the topics. Ids are
 * used so two chapters with the same name in different subjects never get
 * mixed up.
 */
export interface QbMetaOptions {
  readonly subjects: readonly QbMetaSubject[];
}

/** Existing folder tree, offered as dropdown choices in the edit form. */
export async function getQbMetaOptionsAction(): Promise<QbMetaOptions> {
  await requireAdmin();

  const [subjectRows, chapterRows, topicRows] = await Promise.all([
    db
      .select({ id: newSubjects.id, name: newSubjects.name })
      .from(newSubjects)
      .orderBy(newSubjects.orderNo, newSubjects.name),
    db
      .select({
        id: newChapters.id,
        name: newChapters.name,
        subjectId: newChapters.subjectId,
      })
      .from(newChapters)
      .orderBy(newChapters.orderNo, newChapters.name),
    db
      .select({
        id: newTopics.id,
        name: newTopics.name,
        chapterId: newTopics.chapterId,
      })
      .from(newTopics)
      .orderBy(newTopics.orderNo, newTopics.name),
  ]);

  const topicsByChapter = new Map<string, QbMetaTopic[]>();
  for (const row of topicRows) {
    const list = topicsByChapter.get(row.chapterId) ?? [];
    list.push({ id: row.id, name: row.name });
    topicsByChapter.set(row.chapterId, list);
  }

  const chaptersBySubject = new Map<string, QbMetaChapter[]>();
  for (const row of chapterRows) {
    const list = chaptersBySubject.get(row.subjectId) ?? [];
    list.push({
      id: row.id,
      name: row.name,
      topics: topicsByChapter.get(row.id) ?? [],
    });
    chaptersBySubject.set(row.subjectId, list);
  }

  return {
    subjects: subjectRows.map((row) => ({
      id: row.id,
      name: row.name,
      chapters: chaptersBySubject.get(row.id) ?? [],
    })),
  };
}

/**
 * Edits one uploaded question in place.
 *
 * The type never changes here: an MCQ stays an MCQ, a CQ stays a CQ. Its
 * options (or parts) are replaced as a set, which keeps the order and the
 * correct-answer flags exactly as the form showed them.
 */
export async function updateQbQuestionAction(
  input: QbQuestionUpdateInput,
): Promise<QbQuestionActionResult> {
  await requireAdmin();

  const [existing] = await db
    .select({ id: newQuestions.id, type: newQuestions.type })
    .from(newQuestions)
    .where(eq(newQuestions.id, input.id))
    .limit(1);

  if (!existing) {
    return { ok: false, error: "প্রশ্নটি খুঁজে পাওয়া যায়নি।" };
  }

  const questionText = input.questionText.trim();
  if (!questionText) {
    return { ok: false, error: "প্রশ্নের টেক্সট লিখুন।" };
  }

  const options =
    existing.type === "mcq"
      ? (input.options ?? [])
          .map((option) => ({
            optionText: option.optionText.trim(),
            image: cleanText(option.image),
            isCorrect: option.isCorrect === true,
          }))
          .filter(
            (option) => option.optionText.length > 0 || option.image !== null,
          )
      : [];

  if (existing.type === "mcq") {
    if (options.length < 2) {
      return { ok: false, error: "কমপক্ষে দুইটি অপশন দিন।" };
    }
    if (!options.some((option) => option.isCorrect)) {
      return { ok: false, error: "কমপক্ষে একটি সঠিক উত্তর বাছুন।" };
    }
  }

  const parts =
    existing.type === "cq"
      ? (input.parts ?? [])
          .map((part) => ({
            questionText: part.questionText.trim(),
            answerText: cleanText(part.answerText),
            marks: cleanMarks(part.marks),
          }))
          .filter((part) => part.questionText.length > 0)
          .slice(0, CQ_PART_KEYS.length)
      : [];

  if (existing.type === "cq" && parts.length === 0) {
    return { ok: false, error: "কমপক্ষে একটি অংশ (ক) লিখুন।" };
  }

  const standard = STANDARDS.find((item) => item === input.standard) ?? "HSC";
  const subjectName = input.subjectName.trim() || UNFILED;
  const chapterName = input.chapterName.trim() || UNFILED;
  const topicName = input.topicName?.trim() ?? "";

  const subjectId = await resolveSubjectId(subjectName);
  const chapterId = await resolveChapterId(subjectId, chapterName);
  const topicId = topicName ? await resolveTopicId(chapterId, topicName) : null;

  await db.transaction(async (tx) => {
    await tx
      .update(newQuestions)
      .set({
        chapterId,
        topicId,
        questionText,
        questionImage: cleanText(input.questionImage),
        explanation: cleanText(input.explanation),
        explanationImage: cleanText(input.explanationImage),
        source: input.source.trim(),
        standard,
      })
      .where(eq(newQuestions.id, existing.id));

    if (existing.type === "mcq") {
      await tx
        .delete(newMcqOptions)
        .where(eq(newMcqOptions.questionId, existing.id));

      if (options.length > 0) {
        await tx.insert(newMcqOptions).values(
          options.map((option, index) => ({
            questionId: existing.id,
            optionText: option.optionText,
            image: option.image,
            isCorrect: option.isCorrect,
            orderNo: index + 1,
          })),
        );
      }
    } else {
      await tx.delete(newCqParts).where(eq(newCqParts.questionId, existing.id));

      if (parts.length > 0) {
        await tx.insert(newCqParts).values(
          parts.map((part, index) => ({
            questionId: existing.id,
            partKey: CQ_PART_KEYS[index] ?? String(index + 1),
            questionText: part.questionText,
            answerText: part.answerText,
            marks: part.marks,
            orderNo: index + 1,
          })),
        );
      }
    }
  });

  return { ok: true };
}

/** Deletes one question; its options and CQ parts cascade with it. */
export async function deleteQbQuestionAction(
  id: string,
): Promise<QbQuestionActionResult> {
  await requireAdmin();

  const [existing] = await db
    .select({ id: newQuestions.id })
    .from(newQuestions)
    .where(eq(newQuestions.id, id))
    .limit(1);

  if (!existing) {
    return { ok: false, error: "প্রশ্নটি খুঁজে পাওয়া যায়নি।" };
  }

  await db.delete(newQuestions).where(eq(newQuestions.id, id));
  return { ok: true };
}
