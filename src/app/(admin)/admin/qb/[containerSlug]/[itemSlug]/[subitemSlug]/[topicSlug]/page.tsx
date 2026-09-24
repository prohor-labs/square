import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminQuestionsManager } from "@/components/admin/admin-questions-manager";
import { ArrowRight2 } from "@/components/icons";
import { db } from "@/db";
import { containers, items, subitems, topics } from "@/db/schema";

export default async function AdminQbQuestionsPage({
  params,
}: {
  readonly params: Promise<{
    containerSlug: string;
    itemSlug: string;
    subitemSlug: string;
    topicSlug: string;
  }>;
}) {
  const { containerSlug, itemSlug, subitemSlug, topicSlug } = await params;

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

  const topic = await db.query.topics.findFirst({
    where: and(eq(topics.subitemId, chapter.id), eq(topics.slug, topicSlug)),
  });

  if (!topic) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground flex-wrap">
        <Link
          href="/admin/qb"
          className="hover:text-foreground transition-colors"
        >
          প্রশ্নব্যাংকসমূহ
        </Link>
        <ArrowRight2 className="size-3" />
        <Link
          href={`/admin/qb/${qb.slug}`}
          className="hover:text-foreground transition-colors"
        >
          {qb.title}
        </Link>
        <ArrowRight2 className="size-3" />
        <Link
          href={`/admin/qb/${qb.slug}/${subject.slug}`}
          className="hover:text-foreground transition-colors"
        >
          {subject.name}
        </Link>
        <ArrowRight2 className="size-3" />
        <Link
          href={`/admin/qb/${qb.slug}/${subject.slug}/${chapter.slug}`}
          className="hover:text-foreground transition-colors"
        >
          {chapter.name}
        </Link>
        <ArrowRight2 className="size-3" />
        <span className="text-foreground font-semibold">{topic.name}</span>
      </div>

      <AdminQuestionsManager
        qbSlug={qb.slug}
        subjectSlug={subject.slug}
        subjectId={subject.id}
        chapterId={chapter.id}
        chapterName={chapter.name}
        topicId={topic.id}
        topicName={topic.name}
        chapterSlug={chapter.slug}
        hideBreadcrumbs
      />
    </div>
  );
}
