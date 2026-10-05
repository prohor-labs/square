import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { ChapterQuestionsViewer } from "@/components/qb/ChapterQuestionsViewer";
import { db } from "@/db";
import { items, questions, subitems, topics } from "@/db/schema";
import { checkQbContainerAccess } from "@/lib/actions/qb-access";
import { getBankMeta, resolveBankSlug } from "@/lib/question-bank";

export default async function QbChapterPage({
  params,
}: {
  readonly params: Promise<{
    containerSlug: string;
    itemSlug: string;
    subitemSlug: string;
  }>;
}): Promise<ReactElement> {
  const { containerSlug, itemSlug, subitemSlug } = await params;

  const accessInfo = await checkQbContainerAccess(containerSlug);
  if (!accessInfo.exists || !accessInfo.container) {
    notFound();
  }

  const qb = accessInfo.container;
  const _bank = getBankMeta(resolveBankSlug(qb.slug));

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
    orderBy: (topics, { asc }) => [asc(topics.name)],
  });

  const questionList = await db.query.questions.findMany({
    where: eq(questions.subitemId, chapter.id),
    with: {
      mcqOptions: true,
      cqParts: true,
    },
    orderBy: (questions, { desc }) => [desc(questions.createdAt)],
  });

  const formattedQuestions = questionList.map((q) => ({
    ...q,
    subitem_id: q.subitemId,
    topic_id: q.topicId || undefined,
    question_text: q.questionText,
    explanation: q.explanation || undefined,
    is_free: q.isFree,
    isFree: q.isFree,
    mcq_options: q.mcqOptions.map((opt) => ({
      ...opt,
      question_id: opt.questionId,
      option_text: opt.optionText,
      is_correct: opt.isCorrect,
      order_no: opt.orderNo,
    })),
    cq_parts: q.cqParts.map((pt) => ({
      ...pt,
      question_id: pt.questionId,
      part_key: pt.partKey,
      question_text: pt.questionText,
      answer_text: pt.answerText || undefined,
      marks: pt.marks,
      order_no: pt.orderNo,
    })),
  }));

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-12 pt-2 md:py-8">
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-muted-foreground mb-2 flex-wrap">
          <Link href="/qb" className="hover:text-primary transition-colors">
            প্রশ্নব্যাংক
          </Link>
          <span>/</span>
          <Link
            href={`/qb/${qb.slug}`}
            className="hover:text-primary transition-colors"
          >
            {qb.title}
          </Link>
          {subject.name !== "সালসমূহ" && subject.name !== "Years" && (
            <>
              <span>/</span>
              <Link
                href={`/qb/${qb.slug}/${subject.slug}`}
                className="hover:text-primary transition-colors"
              >
                {subject.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground">{chapter.name}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground">
              {chapter.name} - প্রশ্নসমূহ
            </h1>
            <p className="text-muted-foreground text-sm md:text-base mt-1">
              {subject.name === "সালসমূহ" || subject.name === "Years"
                ? `${qb.title} (${chapter.name}) এর প্রশ্নসমূহ অনুশীলন করুন`
                : "টপিক অনুযায়ী ফিল্টার করে প্রশ্নগুলো অনুশীলন করুন"}
            </p>
          </div>
        </div>
      </div>

      <div>
        <ChapterQuestionsViewer
          topics={topicList || []}
          questions={formattedQuestions || []}
        />
      </div>
    </div>
  );
}
