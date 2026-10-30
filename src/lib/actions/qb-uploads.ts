"use server";

import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import {
  newChapters,
  newCqParts,
  newMcqOptions,
  newQuestionSetItems,
  newQuestionSets,
  newQuestions,
  newSubjects,
  newTopics,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import type { ParsedCsvQuestion } from "@/lib/csv-parser";
import { getQbUploadsData, invalidateQbBankCache } from "@/lib/qb-bank";
import { qbSlug } from "@/lib/qb-meta-write";
import {
  canonicalUnitName,
  canonicalUniversityName,
  normalizeExamYear,
} from "@/lib/qb-universities";

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
  /** The uploaded file this batch belongs to, once it has been created. */
  readonly setId?: string | null;
}

/** Display metadata an admin can edit for one uploaded file. */
export interface QbFileInput {
  readonly setId?: string;
  readonly fileName: string;
  readonly originalFileName?: string;
  readonly university?: string;
  readonly year?: string;
  readonly unit?: string;
}

/** One uploaded file, as shown in the admin list and the student library. */
export interface QbFileSummary {
  readonly id: string;
  readonly fileName: string;
  readonly originalFileName: string;
  readonly university: string;
  readonly year: string;
  readonly unit: string;
  readonly questionCount: number;
  readonly createdAt: string;
}

export interface QbFileUpdateInput {
  readonly id: string;
  readonly fileName: string;
  readonly university: string;
  readonly year: string;
  readonly unit: string;
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

/**
 * One uploaded file a question sits in, as the student shelves see it.
 *
 * A question can belong to several files — the same Physics question can be in
 * a 2023 paper and a 2024 paper — so it carries a list, not a single id.
 */
export interface QbQuestionShelf {
  readonly setId: string;
  readonly fileName: string;
  readonly university: string;
  readonly year: string;
  readonly unit: string;
  /** CSV row order inside that file. */
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
  /** "১ম পত্র" / "২য় পত্র"; blank when the subject has no paper split. */
  readonly paperName: string;
  readonly chapterId: string;
  readonly chapterName: string;
  readonly topicId: string | null;
  readonly topicName: string | null;
  /** Every uploaded file this question was seen in. */
  readonly shelves: readonly QbQuestionShelf[];
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
async function resolveSubjectId(name: string, paper = ""): Promise<string> {
  const trimmedPaper = paper.trim();
  // The paper is part of the identity: "পদার্থবিজ্ঞান · ১ম পত্র" and
  // "পদার্থবিজ্ঞান · ২য় পত্র" are two shelves. A subject with no paper keeps
  // the bare-name slug it has always had, so existing rows are reused.
  const base =
    qbSlug(trimmedPaper ? `${name}-${trimmedPaper}` : name) || "general";

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
    .values({ name, paper: trimmedPaper, slug })
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
 * a question already present in the same chapter is reused and linked to the
 * uploaded file instead of being written twice.
 *
 * The first batch creates the file row and returns its id; later batches pass
 * that id back so one upload stays one file even when it spans many requests.
 */
export async function importQbRowsAction(
  rows: readonly ParsedCsvQuestion[],
  file?: QbFileInput,
  orderOffset = 0,
): Promise<QbUploadResult> {
  await requireAdmin();

  const errors: string[] = [];
  const valid: ParsedCsvQuestion[] = [];
  const validOrder: number[] = [];

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
    validOrder.push(orderOffset + index);
  });

  if (valid.length === 0) {
    return { imported: 0, skipped: 0, errors, setId: file?.setId ?? null };
  }

  // One chapter per subject / chapter / topic combination, resolved once.
  const folders = new Map<
    string,
    { chapterId: string; topicId: string | null }
  >();

  for (const row of valid) {
    const key = rowKey(row);
    if (folders.has(key)) continue;

    // A sheet that names only a paper is really naming its subject — older
    // sheets did that. When both are present the paper becomes its own level.
    const subjectName = (row.subjectName || row.paperName || UNFILED).trim();
    const paperName = row.subjectName ? (row.paperName ?? "").trim() : "";
    const chapterName = (row.chapterName || UNFILED).trim();
    const topicName = (row.topicName ?? "").trim();

    const subjectId = await resolveSubjectId(subjectName, paperName);
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
      id: newQuestions.id,
      chapterId: newQuestions.chapterId,
      questionText: newQuestions.questionText,
    })
    .from(newQuestions)
    .where(inArray(newQuestions.chapterId, chapterIds));

  const questionIdByKey = new Map(
    existing.map((row) => [
      `${row.chapterId}\u0000${row.questionText}`,
      row.id,
    ]),
  );

  const questionRows: (typeof newQuestions.$inferInsert)[] = [];
  const optionRows: (typeof newMcqOptions.$inferInsert)[] = [];
  const partRows: (typeof newCqParts.$inferInsert)[] = [];
  const linkRows: { questionId: string; orderNo: number }[] = [];
  const linkedIds = new Set<string>();
  let skipped = 0;

  for (let index = 0; index < valid.length; index++) {
    const row = valid[index];
    const folder = folders.get(rowKey(row));
    if (!folder) continue;

    const dedupeKey = `${folder.chapterId}\u0000${row.questionText}`;
    let questionId = questionIdByKey.get(dedupeKey);

    if (questionId) {
      skipped++;
    } else {
      const createdQuestionId = crypto.randomUUID();
      questionId = createdQuestionId;
      questionIdByKey.set(dedupeKey, createdQuestionId);

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
        row.mcqOptions?.forEach((opt, optionIndex) => {
          optionRows.push({
            questionId: createdQuestionId,
            optionText: opt.optionText ?? "",
            image: opt.image ?? null,
            isCorrect: opt.isCorrect,
            orderNo: optionIndex + 1,
          });
        });
      } else {
        row.cqParts?.forEach((part, partIndex) => {
          partRows.push({
            questionId: createdQuestionId,
            partKey: part.partKey,
            questionText: part.questionText,
            answerText: part.answerText ?? null,
            marks: part.marks,
            orderNo: partIndex + 1,
          });
        });
      }
    }

    if (!linkedIds.has(questionId)) {
      linkedIds.add(questionId);
      linkRows.push({ questionId, orderNo: validOrder[index] });
    }
  }

  let setId = file?.setId ?? null;

  /*
   * One spelling per university/unit/year. Without this, "ঢাবি" and
   * "ঢাকা বিশ্ববিদ্যালয়" would become two separate groups on the student side.
   */
  const university = canonicalUniversityName(file?.university ?? "");
  const unit = canonicalUnitName(university, file?.unit ?? "");
  const year = normalizeExamYear(file?.year ?? "") || (file?.year ?? "").trim();

  await db.transaction(async (tx) => {
    if (file && !setId) {
      const [created] = await tx
        .insert(newQuestionSets)
        .values({
          fileName:
            file.fileName.trim() ||
            file.originalFileName?.trim() ||
            "আপলোড করা প্রশ্ন",
          originalFileName: (file.originalFileName ?? "").trim(),
          university,
          year,
          unit,
        })
        .returning({ id: newQuestionSets.id });
      setId = created.id;
    }

    for (const batch of chunk(questionRows, 100)) {
      await tx.insert(newQuestions).values(batch);
    }
    for (const batch of chunk(optionRows, 300)) {
      await tx.insert(newMcqOptions).values(batch);
    }
    for (const batch of chunk(partRows, 300)) {
      await tx.insert(newCqParts).values(batch);
    }

    const targetSetId = setId;
    if (targetSetId && linkRows.length > 0) {
      await tx
        .insert(newQuestionSetItems)
        .values(linkRows.map((link) => ({ setId: targetSetId, ...link })))
        .onConflictDoNothing();
    }
  });

  invalidateQbBankCache();
  return { imported: questionRows.length, skipped, errors, setId };
}

/** Everything uploaded from /qb, newest first, optionally filtered. */
export async function getQbUploads(
  filters: QbFilters = {},
  limit = 200,
): Promise<QbUploadsPage> {
  await requireAdmin();
  return getQbUploadsData(filters, limit);
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

  invalidateQbBankCache();
  return { ok: true };
}

/**
 * Renames one uploaded file and moves it to a different student shelf.
 *
 * The original CSV name is never overwritten, so the admin can always tell
 * which sheet a row came from.
 */
export async function updateQbFileAction(
  input: QbFileUpdateInput,
): Promise<QbQuestionActionResult> {
  await requireAdmin();

  const id = input.id.trim();
  const fileName = input.fileName.trim().slice(0, 200);
  if (!id || !fileName) {
    return { ok: false, error: "ফাইলের নাম লিখুন।" };
  }

  const [existing] = await db
    .select({ id: newQuestionSets.id })
    .from(newQuestionSets)
    .where(eq(newQuestionSets.id, id))
    .limit(1);

  if (!existing) {
    return { ok: false, error: "ফাইলটি খুঁজে পাওয়া যায়নি।" };
  }

  const university = canonicalUniversityName(input.university);
  const unit = canonicalUnitName(university, input.unit);
  const year = normalizeExamYear(input.year) || input.year.trim();

  await db
    .update(newQuestionSets)
    .set({
      fileName,
      university: university.slice(0, 120),
      year: year.slice(0, 20),
      unit: unit.slice(0, 80),
      updatedAt: new Date(),
    })
    .where(eq(newQuestionSets.id, id));

  invalidateQbBankCache();
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
  invalidateQbBankCache();
  return { ok: true };
}
