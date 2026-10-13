import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import type { QbExamType } from "@/db/schema";
import {
  qbChapters,
  qbInstitutes,
  qbQuestionMeta,
  qbSubjects,
} from "@/db/schema";

/**
 * What an admin picks in the upload form, still as free text.
 *
 * Nothing here is a database id: the uploader types a university or a subject
 * and the resolver below finds or creates the matching row. That is what lets
 * a new subject show up on the site with no code change.
 */
export interface QbMetaInput {
  readonly examType?: QbExamType;
  /** Board / university / engineering institute name. */
  readonly instituteName?: string;
  readonly groupName?: string;
  readonly unitName?: string;
  readonly year?: string;
  readonly subjectName?: string;
  readonly subjectPaper?: string;
  readonly chapterName?: string;
}

/** The same list, resolved to ids — ready to write. */
export interface QbMetaTargets {
  readonly examType: QbExamType | null;
  readonly instituteId: string | null;
  readonly subjectId: string | null;
  readonly chapterId: string | null;
  readonly groupName: string;
  readonly unitName: string;
  readonly year: string;
}

/**
 * Bangla letters survive the slug: `\p{M}` covers the combining vowel signs,
 * without which "ভেক্টর" would become "ভ-ক-টর".
 */
export function qbSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function resolveSubject(
  name: string,
  paper: string,
): Promise<string | null> {
  const slug = qbSlug(`${name}-${paper}`);
  if (!slug) return null;

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

async function resolveChapter(
  subjectId: string,
  name: string,
): Promise<string | null> {
  const slug = qbSlug(name);
  if (!slug) return null;

  const [existing] = await db
    .select({ id: qbChapters.id })
    .from(qbChapters)
    .where(and(eq(qbChapters.subjectId, subjectId), eq(qbChapters.slug, slug)))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(qbChapters)
    .values({ subjectId, name, slug })
    .returning({ id: qbChapters.id });
  return created.id;
}

async function resolveInstitute(
  type: QbExamType,
  name: string,
): Promise<string | null> {
  const slug = qbSlug(`${type}-${name}`);
  if (!slug) return null;

  const [existing] = await db
    .select({ id: qbInstitutes.id })
    .from(qbInstitutes)
    .where(eq(qbInstitutes.slug, slug))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(qbInstitutes)
    .values({ type, name, slug })
    .returning({ id: qbInstitutes.id });
  return created.id;
}

/**
 * Turns the typed-in metadata into ids, creating whatever is missing.
 *
 * A chapter needs its subject, so naming a chapter without a subject is
 * ignored rather than guessed at.
 */
export async function resolveQbMetaTargets(
  input: QbMetaInput,
): Promise<QbMetaTargets> {
  const examType = input.examType ?? null;

  const subjectName = (input.subjectName ?? "").trim();
  const paper = (input.subjectPaper ?? "").trim();
  const subjectId = subjectName
    ? await resolveSubject(subjectName, paper)
    : null;

  const chapterName = (input.chapterName ?? "").trim();
  const chapterId =
    subjectId && chapterName
      ? await resolveChapter(subjectId, chapterName)
      : null;

  const instituteName = (input.instituteName ?? "").trim();
  const instituteId =
    examType && instituteName
      ? await resolveInstitute(examType, instituteName)
      : null;

  return {
    examType,
    instituteId,
    subjectId,
    chapterId,
    groupName: (input.groupName ?? "").trim(),
    unitName: (input.unitName ?? "").trim(),
    year: (input.year ?? "").trim(),
  };
}

/**
 * Files every imported question under the same metadata.
 *
 * Runs inside the caller's transaction so a failed import leaves no half-linked
 * questions behind. The primary key on question_id makes a re-run update the
 * same row instead of creating a second copy.
 */
export async function writeQbMeta(
  tx: Pick<typeof db, "insert">,
  questionIds: readonly string[],
  targets: QbMetaTargets,
): Promise<void> {
  if (questionIds.length === 0) return;

  // Nothing meaningful to record — skip rather than write empty rows.
  if (
    !targets.examType &&
    !targets.instituteId &&
    !targets.subjectId &&
    !targets.chapterId &&
    !targets.groupName &&
    !targets.unitName &&
    !targets.year
  ) {
    return;
  }

  await tx
    .insert(qbQuestionMeta)
    .values(
      questionIds.map((questionId) => ({
        questionId,
        examType: targets.examType,
        instituteId: targets.instituteId,
        groupName: targets.groupName,
        unitName: targets.unitName,
        year: targets.year,
        subjectId: targets.subjectId,
        chapterId: targets.chapterId,
      })),
    )
    .onConflictDoUpdate({
      target: qbQuestionMeta.questionId,
      set: {
        examType: targets.examType,
        instituteId: targets.instituteId,
        groupName: targets.groupName,
        unitName: targets.unitName,
        year: targets.year,
        subjectId: targets.subjectId,
        chapterId: targets.chapterId,
      },
    });
}
