import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminTopicsManager } from "@/components/admin/admin-topics-manager";
import { db } from "@/db";
import { containers, items, subitems, topics } from "@/db/schema";

import type { Item, Subitem, Topic } from "@/types";

export default async function AdminQbTopicsPage({
  params,
}: {
  readonly params: Promise<{
    containerSlug: string;
    itemSlug: string;
    subitemSlug: string;
  }>;
}) {
  const { containerSlug, itemSlug, subitemSlug } = await params;

  const qb = await db.query.containers.findFirst({
    where: eq(containers.slug, containerSlug),
  });

  if (!qb) notFound();

  const subject = await db.query.items.findFirst({
    where: and(eq(items.containerId, qb.id), eq(items.slug, itemSlug)),
  });

  if (!subject) notFound();

  const chapter = await db.query.subitems.findFirst({
    where: and(eq(subitems.itemId, subject.id), eq(subitems.slug, subitemSlug)),
  });

  if (!chapter) notFound();

  const topicList = await db.query.topics.findMany({
    where: eq(topics.subitemId, chapter.id),
    with: {
      questions: true,
    },
  });

  const formattedSubject: Item = {
    ...subject,
    container_id: subject.containerId,
  };

  const formattedChapter: Subitem = {
    ...chapter,
    item_id: chapter.itemId,
    order_no: chapter.orderNo,
    paper: chapter.paper || undefined,
  };

  const formattedTopics: Topic[] = topicList.map((t) => ({
    ...t,
    subitem_id: t.subitemId,
    questions: [{ count: t.questions?.length || 0 }],
  }));

  return (
    <AdminTopicsManager
      qb={qb}
      subject={formattedSubject}
      chapter={formattedChapter}
      initialTopics={formattedTopics}
    />
  );
}
