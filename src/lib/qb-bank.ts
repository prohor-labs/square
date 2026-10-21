import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  newChapters,
  newQuestionSetItems,
  newQuestionSets,
  newQuestions,
  newSubjects,
  newTopics,
} from "@/db/schema";
import type {
  QbFileSummary,
  QbFilterOption,
  QbFilterSelection,
  QbFilters,
  QbFilterTree,
  QbUploadedOption,
  QbUploadedPart,
  QbUploadedQuestion,
  QbUploadsPage,
} from "@/lib/actions/qb-uploads";

/**
 * Read side of the new question bank.
 *
 * The database lives in another region and every round trip costs 150–250 ms,
 * so filtering by fetching one query per dropdown change was slow even with a
 * tiny bank. Instead we read the whole bank once, keep it in this process, and
 * filter in memory. A filter change then costs a few microseconds instead of
 * several network round trips.
 *
 * The snapshot is invalidated by upload/edit/delete, and also expires after a
 * minute so a second app instance cannot stay stale forever.
 */

interface QbBankQuestion extends QbUploadedQuestion {
  readonly subjectOrder: number;
  readonly chapterOrder: number;
  readonly topicOrder: number | null;
}

interface QbBankSnapshot {
  readonly questions: readonly QbBankQuestion[];
  readonly filterTree: QbFilterTree;
}

interface SubjectBucket {
  id: string;
  name: string;
  order: number;
  count: number;
  chapters: Map<string, ChapterBucket>;
}

interface ChapterBucket {
  id: string;
  name: string;
  subjectId: string;
  order: number;
  count: number;
  topics: Map<string, TopicBucket>;
}

interface TopicBucket {
  id: string;
  name: string;
  order: number;
  count: number;
}

interface QbBankState {
  generation: number;
  snapshot?: { value: QbBankSnapshot; expiresAt: number };
  pending?: Promise<QbBankSnapshot>;
}

const globalStore = globalThis as unknown as {
  __squareQbBank?: QbBankState;
};
const bankState: QbBankState = globalStore.__squareQbBank ?? {
  generation: 0,
};
globalStore.__squareQbBank = bankState;

const CACHE_TTL_MS = 60_000;

/** JSON columns come back as arrays, but be tolerant of a string payload. */
function asArray<T>(value: unknown): readonly T[] {
  if (Array.isArray(value)) return value as readonly T[];
  if (typeof value === "string" && value.length > 0) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed as readonly T[];
    } catch {
      // Malformed JSON should not take down the whole bank page.
    }
  }
  return [];
}

function compareFolders(
  a: { order: number; name: string },
  b: { order: number; name: string },
): number {
  return a.order - b.order || a.name.localeCompare(b.name, "bn");
}

/** Only folders that actually hold questions are offered in the filters. */
function buildFilterTree(questions: readonly QbBankQuestion[]): QbFilterTree {
  const subjects = new Map<string, SubjectBucket>();

  for (const question of questions) {
    let subject = subjects.get(question.subjectId);
    if (!subject) {
      subject = {
        id: question.subjectId,
        name: question.subjectName,
        order: question.subjectOrder,
        count: 0,
        chapters: new Map(),
      };
      subjects.set(subject.id, subject);
    }
    subject.count += 1;

    let chapter = subject.chapters.get(question.chapterId);
    if (!chapter) {
      chapter = {
        id: question.chapterId,
        name: question.chapterName,
        subjectId: subject.id,
        order: question.chapterOrder,
        count: 0,
        topics: new Map(),
      };
      subject.chapters.set(chapter.id, chapter);
    }
    chapter.count += 1;

    if (question.topicId) {
      let topic = chapter.topics.get(question.topicId);
      if (!topic) {
        topic = {
          id: question.topicId,
          name: question.topicName ?? "",
          order: question.topicOrder ?? 0,
          count: 0,
        };
        chapter.topics.set(topic.id, topic);
      }
      topic.count += 1;
    }
  }

  return {
    subjects: [...subjects.values()].sort(compareFolders).map((subject) => ({
      id: subject.id,
      name: subject.name,
      count: subject.count,
      chapters: [...subject.chapters.values()]
        .sort(compareFolders)
        .map((chapter) => ({
          id: chapter.id,
          name: chapter.name,
          subjectId: chapter.subjectId,
          count: chapter.count,
          topics: [...chapter.topics.values()].sort(compareFolders).map(
            (topic): QbFilterOption => ({
              id: topic.id,
              name: topic.name,
              count: topic.count,
            }),
          ),
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

async function fetchQbBankSnapshot(): Promise<QbBankSnapshot> {
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
      subjectOrder: newSubjects.orderNo,
      chapterId: newChapters.id,
      chapterName: newChapters.name,
      chapterOrder: newChapters.orderNo,
      topicId: newTopics.id,
      topicName: newTopics.name,
      topicOrder: newTopics.orderNo,
      mcqOptions: sql<QbUploadedOption[]>`coalesce(
        (
          select json_agg(
            json_build_object(
              'id', o.id,
              'optionText', o.option_text,
              'image', o.image,
              'isCorrect', o.is_correct,
              'orderNo', o.order_no
            )
            order by o.order_no
          )
          from new_mcq_options o
          where o.question_id = ${newQuestions.id}
        ),
        '[]'::json
      )`,
      cqParts: sql<QbUploadedPart[]>`coalesce(
        (
          select json_agg(
            json_build_object(
              'id', p.id,
              'partKey', p.part_key,
              'questionText', p.question_text,
              'answerText', p.answer_text,
              'marks', p.marks,
              'orderNo', p.order_no
            )
            order by p.order_no
          )
          from new_cq_parts p
          where p.question_id = ${newQuestions.id}
        ),
        '[]'::json
      )`,
    })
    .from(newQuestions)
    .innerJoin(newChapters, eq(newQuestions.chapterId, newChapters.id))
    .innerJoin(newSubjects, eq(newChapters.subjectId, newSubjects.id))
    .leftJoin(newTopics, eq(newQuestions.topicId, newTopics.id))
    .orderBy(desc(newQuestions.createdAt), desc(newQuestions.id));

  const questions: QbBankQuestion[] = rows.map((row) => ({
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
    subjectOrder: row.subjectOrder,
    chapterId: row.chapterId,
    chapterName: row.chapterName,
    chapterOrder: row.chapterOrder,
    topicId: row.topicId,
    topicName: row.topicName,
    topicOrder: row.topicOrder,
    createdAt: row.createdAt.toISOString(),
    mcqOptions: asArray<QbUploadedOption>(row.mcqOptions),
    cqParts: asArray<QbUploadedPart>(row.cqParts),
  }));

  return { questions, filterTree: buildFilterTree(questions) };
}

async function loadQbBankSnapshot(): Promise<QbBankSnapshot> {
  const cached = bankState.snapshot;
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const pending = bankState.pending;
  if (pending) return pending;

  const generation = bankState.generation;
  const request = fetchQbBankSnapshot()
    .then((value) => {
      if (bankState.generation === generation) {
        bankState.snapshot = { value, expiresAt: Date.now() + CACHE_TTL_MS };
      }
      return value;
    })
    .finally(() => {
      if (bankState.pending === request) bankState.pending = undefined;
    });

  bankState.pending = request;
  return request;
}

/** Call after any write to the new bank so the next read sees it immediately. */
export function invalidateQbBankCache(): void {
  bankState.generation += 1;
  bankState.snapshot = undefined;
  bankState.pending = undefined;
}

/**
 * Everything needed by the client-side question browser: the full bank, plus
 * the selection resolved from the URL. Only used when the bank is small enough
 * to keep every card mounted for instant filtering.
 */
export interface QbBrowserData {
  readonly questions: readonly QbUploadedQuestion[];
  readonly filterTree: QbFilterTree;
  readonly allTotal: number;
  readonly selected: QbFilterSelection;
}

export async function getQbBrowserData(
  filters: QbFilters = {},
): Promise<QbBrowserData> {
  const snapshot = await loadQbBankSnapshot();

  return {
    questions: snapshot.questions,
    filterTree: snapshot.filterTree,
    allTotal: snapshot.questions.length,
    selected: resolveSelection(snapshot.filterTree, filters),
  };
}

/**
 * The filtered page, served from the in-process snapshot.
 *
 * The snapshot is not user-specific (questions are global), so it can be
 * shared by every admin request. Authentication happens before this call.
 */
export async function getQbUploadsData(
  filters: QbFilters = {},
  limit = 200,
): Promise<QbUploadsPage> {
  const snapshot = await loadQbBankSnapshot();
  const selected = resolveSelection(snapshot.filterTree, filters);

  const hasFilter = Boolean(
    selected.subjectId || selected.chapterId || selected.topicId,
  );
  const matching = hasFilter
    ? snapshot.questions.filter(
        (question) =>
          (!selected.subjectId || question.subjectId === selected.subjectId) &&
          (!selected.chapterId || question.chapterId === selected.chapterId) &&
          (!selected.topicId || question.topicId === selected.topicId),
      )
    : snapshot.questions;

  const safeLimit = Number.isFinite(limit)
    ? Math.max(0, Math.trunc(limit))
    : 200;

  return {
    total: matching.length,
    allTotal: snapshot.questions.length,
    questions: matching.slice(0, safeLimit),
    filterTree: snapshot.filterTree,
    selected,
  };
}

/**
 * Uploaded files, newest first, with how many questions each one contains.
 *
 * This is intentionally a small aggregate query instead of loading every
 * question: the student library only needs the shelves and counts until a file
 * is opened.
 */
export async function getQbFileSummaries(): Promise<readonly QbFileSummary[]> {
  const rows = await db
    .select({
      id: newQuestionSets.id,
      fileName: newQuestionSets.fileName,
      originalFileName: newQuestionSets.originalFileName,
      university: newQuestionSets.university,
      year: newQuestionSets.year,
      unit: newQuestionSets.unit,
      createdAt: newQuestionSets.createdAt,
      questionCount: sql<number>`count(${newQuestionSetItems.questionId})::int`,
    })
    .from(newQuestionSets)
    .leftJoin(
      newQuestionSetItems,
      eq(newQuestionSetItems.setId, newQuestionSets.id),
    )
    .groupBy(newQuestionSets.id)
    .orderBy(desc(newQuestionSets.createdAt));

  return rows
    .map((row) => ({
      id: row.id,
      fileName: row.fileName,
      originalFileName: row.originalFileName,
      university: row.university,
      year: row.year,
      unit: row.unit,
      questionCount: Number(row.questionCount) || 0,
      createdAt: row.createdAt.toISOString(),
    }))
    .filter((row) => row.questionCount > 0);
}

export interface QbFileWithQuestions {
  readonly file: QbFileSummary;
  readonly questions: readonly QbUploadedQuestion[];
}

/** One uploaded file and the questions linked to it, in CSV row order. */
export async function getQbFileWithQuestions(
  setId: string,
): Promise<QbFileWithQuestions | null> {
  if (!setId) return null;

  const [file] = await db
    .select({
      id: newQuestionSets.id,
      fileName: newQuestionSets.fileName,
      originalFileName: newQuestionSets.originalFileName,
      university: newQuestionSets.university,
      year: newQuestionSets.year,
      unit: newQuestionSets.unit,
      createdAt: newQuestionSets.createdAt,
    })
    .from(newQuestionSets)
    .where(eq(newQuestionSets.id, setId))
    .limit(1);

  if (!file) return null;

  const [links, snapshot] = await Promise.all([
    db
      .select({
        questionId: newQuestionSetItems.questionId,
        orderNo: newQuestionSetItems.orderNo,
      })
      .from(newQuestionSetItems)
      .where(eq(newQuestionSetItems.setId, setId))
      .orderBy(newQuestionSetItems.orderNo, newQuestionSetItems.questionId),
    loadQbBankSnapshot(),
  ]);

  const questionById = new Map(
    snapshot.questions.map((question) => [question.id, question]),
  );
  const questions = links
    .map((link) => questionById.get(link.questionId))
    .filter((question): question is QbBankQuestion => Boolean(question));

  return {
    file: {
      id: file.id,
      fileName: file.fileName,
      originalFileName: file.originalFileName,
      university: file.university,
      year: file.year,
      unit: file.unit,
      questionCount: questions.length,
      createdAt: file.createdAt.toISOString(),
    },
    questions,
  };
}
