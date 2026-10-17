"use server";

import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { qbBookmarks, questions } from "@/db/schema";
import { auth } from "@/lib/auth";

/**
 * Bookmarks.
 *
 * Signed in, a bookmark is a row so it is still there next week. Signed out,
 * there is nowhere to put it — so the button is simply not rendered rather than
 * left on the page doing nothing when pressed.
 */

export interface BookmarkState {
  readonly saved: boolean;
  readonly questionId: string;
}

async function currentUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

export async function getBookmarkedQuestionIds(
  questionIds: readonly string[],
): Promise<readonly string[]> {
  const userId = await currentUserId();
  if (!userId || questionIds.length === 0) return [];

  const rows = await db
    .select({ questionId: qbBookmarks.questionId })
    .from(qbBookmarks)
    .where(
      and(
        eq(qbBookmarks.userId, userId),
        inArray(qbBookmarks.questionId, [...questionIds]),
      ),
    );

  return rows.map((r) => r.questionId);
}

/** Adds the bookmark if it is missing, removes it if it is there. */
export async function toggleBookmark(
  questionId: string,
): Promise<{ readonly saved: boolean } | { readonly error: string }> {
  const userId = await currentUserId();
  if (!userId) return { error: "সংরক্ষণ করতে লগইন করুন।" };

  const [existing] = await db
    .select({ questionId: qbBookmarks.questionId })
    .from(qbBookmarks)
    .where(
      and(
        eq(qbBookmarks.userId, userId),
        eq(qbBookmarks.questionId, questionId),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .delete(qbBookmarks)
      .where(
        and(
          eq(qbBookmarks.userId, userId),
          eq(qbBookmarks.questionId, questionId),
        ),
      );
    return { saved: false };
  }

  await db.insert(qbBookmarks).values({ userId, questionId });
  return { saved: true };
}

/** Questions a student saved, newest first, for the saved-questions page. */
export async function getSavedQuestions(limit = 50) {
  const userId = await currentUserId();
  if (!userId) return [];

  return db
    .select({
      id: questions.id,
      type: questions.type,
      questionText: questions.questionText,
      createdAt: qbBookmarks.createdAt,
    })
    .from(qbBookmarks)
    .innerJoin(questions, eq(qbBookmarks.questionId, questions.id))
    .where(eq(qbBookmarks.userId, userId))
    .orderBy(qbBookmarks.createdAt)
    .limit(limit);
}

export async function countSavedQuestions(): Promise<number> {
  const userId = await currentUserId();
  if (!userId) return 0;
  const rows = await db
    .select({ questionId: qbBookmarks.questionId })
    .from(qbBookmarks)
    .where(eq(qbBookmarks.userId, userId));
  return rows.length;
}
