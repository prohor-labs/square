"use server";

import { asc } from "drizzle-orm";
import { db } from "@/db";
import { containers, items, subitems } from "@/db/schema";

export interface QbChapterNode {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly questions: number;
}

export interface QbUnitNode {
  readonly id: string;
  readonly slug: string;
  /** Display name — see `unitLabel` for why the stored name may be replaced. */
  readonly name: string;
  readonly code: string | null;
  readonly chapters: readonly QbChapterNode[];
  readonly questions: number;
}

export interface QbContainerNode {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly units: readonly QbUnitNode[];
  readonly questions: number;
}

/**
 * The whole question-bank tree with question counts, fetched in four grouped
 * queries rather than per-node lookups — counting by subitem avoids pulling
 * 12,000+ question rows into memory just to count them.
 */
export async function getQbTree(): Promise<QbContainerNode[]> {
  const [containerRows, itemRows, chapterRows, countRows] = await Promise.all([
    db
      .select({
        id: containers.id,
        slug: containers.slug,
        title: containers.title,
      })
      .from(containers)
      .orderBy(asc(containers.createdAt)),
    db
      .select({
        id: items.id,
        slug: items.slug,
        name: items.name,
        code: items.code,
        containerId: items.containerId,
      })
      .from(items)
      .orderBy(asc(items.name)),
    db
      .select({
        id: subitems.id,
        slug: subitems.slug,
        name: subitems.name,
        orderNo: subitems.orderNo,
        itemId: subitems.itemId,
      })
      .from(subitems)
      .orderBy(asc(subitems.orderNo)),
    db.query.questions.findMany({ columns: { subitemId: true } }),
  ]);

  const counts = new Map<string, number>();
  for (const question of countRows) {
    counts.set(question.subitemId, (counts.get(question.subitemId) ?? 0) + 1);
  }

  const chaptersByItem = new Map<string, QbChapterNode[]>();
  for (const chapter of chapterRows) {
    const list = chaptersByItem.get(chapter.itemId) ?? [];
    list.push({
      id: chapter.id,
      slug: chapter.slug,
      name: chapter.name,
      questions: counts.get(chapter.id) ?? 0,
    });
    chaptersByItem.set(chapter.itemId, list);
  }

  const unitsByContainer = new Map<string, QbUnitNode[]>();
  for (const item of itemRows) {
    const chapters = chaptersByItem.get(item.id) ?? [];
    const list = unitsByContainer.get(item.containerId) ?? [];
    list.push({
      id: item.id,
      slug: item.slug,
      name: item.name,
      code: item.code,
      chapters,
      questions: chapters.reduce((sum, c) => sum + c.questions, 0),
    });
    unitsByContainer.set(item.containerId, list);
  }

  return containerRows.map((container) => {
    const units = unitsByContainer.get(container.id) ?? [];
    return {
      ...container,
      units,
      questions: units.reduce((sum, u) => sum + u.questions, 0),
    };
  });
}
