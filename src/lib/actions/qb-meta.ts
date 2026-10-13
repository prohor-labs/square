"use server";

import { and, asc, count, desc, eq, isNotNull, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import {
  qbChapters,
  qbInstitutes,
  qbQuestionMeta,
  qbSubjects,
  questions,
} from "@/db/schema";
import { auth } from "@/lib/auth";

export interface QbSubjectNode {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly paper: string;
  readonly questions: number;
}

export interface QbChapterNodeMeta {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly questions: number;
}

export interface QbSourceCount {
  readonly examType: string;
  readonly questions: number;
}

/** Distinct filters offered under a chapter, with live counts. */
export interface QbChapterFacets {
  readonly sources: readonly QbSourceCount[];
  readonly institutes: readonly {
    readonly id: string;
    readonly name: string;
    readonly questions: number;
  }[];
}

/**
 * Every subject that actually has questions, ordered for display.
 *
 * Built from a single grouped query so a subject with no questions never
 * appears — new subjects appear the moment an admin uploads into them.
 */
export async function getQbSubjects(): Promise<readonly QbSubjectNode[]> {
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

/** Chapters of one subject, with the questions filed under each. */
export async function getQbChapters(
  subjectId: string,
): Promise<readonly QbChapterNodeMeta[]> {
  const rows = await db
    .select({
      id: qbChapters.id,
      slug: qbChapters.slug,
      name: qbChapters.name,
      questions: count(qbQuestionMeta.questionId),
    })
    .from(qbChapters)
    .leftJoin(qbQuestionMeta, eq(qbQuestionMeta.chapterId, qbChapters.id))
    .where(eq(qbChapters.subjectId, subjectId))
    .groupBy(qbChapters.id)
    .orderBy(asc(qbChapters.orderNo), asc(qbChapters.name));

  // A chapter with no questions is noise on the page.
  return rows
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      questions: Number(row.questions),
    }))
    .filter((row) => row.questions > 0);
}

/**
 * Where a chapter's questions came from — the "All Sources" screen.
 *
 * Both facets come from the same `qb_question_meta` rows the exam views read,
 * so the numbers can never disagree.
 */
export async function getQbChapterFacets(
  chapterId: string,
): Promise<QbChapterFacets> {
  const [sourceRows, instituteRows] = await Promise.all([
    db
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
      .orderBy(desc(count(qbQuestionMeta.questionId))),
    db
      .select({
        id: qbInstitutes.id,
        name: qbInstitutes.name,
        questions: count(qbQuestionMeta.questionId),
      })
      .from(qbQuestionMeta)
      .innerJoin(qbInstitutes, eq(qbInstitutes.id, qbQuestionMeta.instituteId))
      .where(eq(qbQuestionMeta.chapterId, chapterId))
      .groupBy(qbInstitutes.id)
      .orderBy(desc(count(qbQuestionMeta.questionId)), asc(qbInstitutes.name)),
  ]);

  return {
    sources: sourceRows.map((row) => ({
      examType: String(row.examType),
      questions: Number(row.questions),
    })),
    institutes: instituteRows.map((row) => ({
      id: row.id,
      name: row.name,
      questions: Number(row.questions),
    })),
  };
}

/**
 * Fetches or creates a subject by name + paper.
 *
 * Uploads are free text, so the same subject can arrive spelled two ways; one
 * row per spelling keeps the list clean without the admin having to check
 * first.
 */
export async function upsertQbSubject(input: {
  readonly name: string;
  readonly paper?: string;
}): Promise<string> {
  const name = input.name.trim();
  const paper = (input.paper ?? "").trim();
  if (!name) throw new Error("Subject name is required");

  const slug = slugify(`${name}-${paper}`);
  const [existing] = await db
    .select({ id: qbSubjects.id })
    .from(qbSubjects)
    .where(eq(qbSubjects.slug, slug))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(qbSubjects)
    .values({ name, paper, slug })
    .returning({ id: qbSubjects.id });
  return created.id;
}

/** Same contract as `upsertQbSubject`, for a chapter inside a subject. */
export async function upsertQbChapter(input: {
  readonly subjectId: string;
  readonly name: string;
}): Promise<string> {
  const name = input.name.trim();
  if (!name) throw new Error("Chapter name is required");

  const slug = slugify(`${name}-${input.subjectId.slice(0, 6)}`);
  const [existing] = await db
    .select({ id: qbChapters.id })
    .from(qbChapters)
    .where(eq(qbChapters.slug, slug))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(qbChapters)
    .values({ subjectId: input.subjectId, name, slug })
    .returning({ id: qbChapters.id });
  return created.id;
}

/** Same contract as `upsertQbSubject`, for a board / university / institute. */
export async function upsertQbInstitute(input: {
  readonly type: "board" | "university" | "engineering" | "medical" | "other";
  readonly name: string;
}): Promise<string> {
  const name = input.name.trim();
  if (!name) throw new Error("Institute name is required");

  const slug = slugify(`${input.type}-${name}`);
  const [existing] = await db
    .select({ id: qbInstitutes.id })
    .from(qbInstitutes)
    .where(eq(qbInstitutes.slug, slug))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(qbInstitutes)
    .values({ type: input.type, name, slug })
    .returning({ id: qbInstitutes.id });
  return created.id;
}

/**
 * Files one question under its metadata.
 *
 * The write is keyed on question_id, so re-running an import updates the same
 * row instead of creating a second copy — the "one question, one record" rule
 * holds at the database level, not just in the UI.
 */
export async function setQbQuestionMeta(input: {
  readonly questionId: string;
  readonly examType?:
    | "board"
    | "university"
    | "engineering"
    | "medical"
    | "other";
  readonly instituteId?: string | null;
  readonly groupName?: string;
  readonly unitName?: string;
  readonly year?: string;
  readonly subjectId?: string | null;
  readonly chapterId?: string | null;
}): Promise<void> {
  await db
    .insert(qbQuestionMeta)
    .values({
      questionId: input.questionId,
      examType: input.examType ?? null,
      instituteId: input.instituteId ?? null,
      groupName: input.groupName?.trim() ?? "",
      unitName: input.unitName?.trim() ?? "",
      year: input.year?.trim() ?? "",
      subjectId: input.subjectId ?? null,
      chapterId: input.chapterId ?? null,
    })
    .onConflictDoUpdate({
      target: qbQuestionMeta.questionId,
      set: {
        examType: input.examType ?? null,
        instituteId: input.instituteId ?? null,
        groupName: input.groupName?.trim() ?? "",
        unitName: input.unitName?.trim() ?? "",
        year: input.year?.trim() ?? "",
        subjectId: input.subjectId ?? null,
        chapterId: input.chapterId ?? null,
      },
    });
}

/** How many questions carry metadata at all — used by the admin overview. */
export async function getQbMetaStats(): Promise<{
  readonly questions: number;
  readonly withMeta: number;
  readonly withSubject: number;
  readonly withChapter: number;
}> {
  const [stats] = await db.execute<{
    questions: number;
    withMeta: number;
    withSubject: number;
    withChapter: number;
  }>(sql`
    SELECT
      (SELECT count(*)::int FROM ${questions}) AS "questions",
      (SELECT count(*)::int FROM ${qbQuestionMeta}) AS "withMeta",
      (SELECT count(*)::int FROM ${qbQuestionMeta} WHERE subject_id IS NOT NULL) AS "withSubject",
      (SELECT count(*)::int FROM ${qbQuestionMeta} WHERE chapter_id IS NOT NULL) AS "withChapter"
  `);

  return {
    questions: Number(stats.questions),
    withMeta: Number(stats.withMeta),
    withSubject: Number(stats.withSubject),
    withChapter: Number(stats.withChapter),
  };
}

/**
 * Latin-friendly slug that keeps Bangla letters intact.
 *
 * `\p{M}` matters: Bangla vowel signs are combining marks, so without them a
 * name like "ভেক্টর" would slug to "ভ-ক-টর".
 */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Re-exported so the admin form can check the session without a second call. */
export async function requireAdminForQbMeta(): Promise<boolean> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.role === "admin";
}
