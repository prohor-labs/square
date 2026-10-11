"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import { batchArchivedExams, exams } from "@/db/schema";
import { auth } from "@/lib/auth";

export interface ArchiveExamOption {
  readonly id: string;
  readonly title: string;
  readonly standard: string;
  /** True when this batch already keeps the exam on its archive list. */
  readonly archived: boolean;
}

async function requireAdmin(): Promise<boolean> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.role === "admin";
}

/** Every exam, newest first, flagged with whether this batch has it archived. */
export async function getBatchArchiveOptionsAction(
  batchId: string,
): Promise<readonly ArchiveExamOption[]> {
  if (!(await requireAdmin())) return [];

  const rows = await db
    .select({
      id: exams.id,
      title: exams.title,
      standard: exams.standard,
      archived: batchArchivedExams.id,
    })
    .from(exams)
    .leftJoin(
      batchArchivedExams,
      and(
        eq(batchArchivedExams.examId, exams.id),
        eq(batchArchivedExams.batchId, batchId),
      ),
    )
    .orderBy(asc(exams.title));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    standard: row.standard,
    archived: Boolean(row.archived),
  }));
}

/** Ticks or unticks one exam on a batch's archive list. */
export async function setBatchArchiveAction(
  batchId: string,
  examId: string,
  archived: boolean,
): Promise<{ success: boolean; error?: string }> {
  if (!(await requireAdmin())) {
    return { success: false, error: "অননুমোদিত অ্যাক্সেস।" };
  }

  if (archived) {
    // A repeat tick must not raise the unique index.
    await db
      .insert(batchArchivedExams)
      .values({ batchId, examId })
      .onConflictDoNothing();
  } else {
    await db
      .delete(batchArchivedExams)
      .where(
        and(
          eq(batchArchivedExams.batchId, batchId),
          eq(batchArchivedExams.examId, examId),
        ),
      );
  }

  revalidatePath("/archive");
  revalidatePath(`/admin/batches/${batchId}`);
  return { success: true };
}
