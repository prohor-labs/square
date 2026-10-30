import Link from "next/link";
import type { ReactElement } from "react";
import { QbEmpty } from "@/components/qb/student/qb-empty";
import { QbPagination } from "@/components/qb/student/qb-pagination";
import { QbQuestionCard } from "@/components/qb/student/qb-question-card";
import { toBengaliDigits } from "@/lib/calendar-date";
import { QB_PAGE_SIZE, type QbQuestionsPage } from "@/lib/qb-catalog";

/**
 * A page of questions with the pager underneath.
 *
 * Questions arrive already sliced by the server; nothing about the rest of the
 * bank reaches the browser.
 */
export function QbQuestionList({
  data,
}: {
  readonly data: QbQuestionsPage;
}): ReactElement {
  if (data.questions.length === 0) {
    return (
      <QbEmpty
        title={data.emptyTitle}
        body={data.emptyBody}
        action={
          <Link
            href="/qb"
            className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground transition hover:bg-primary/90"
          >
            প্রশ্নব্যাংকে ফিরুন
          </Link>
        }
      />
    );
  }

  const offset = (data.page - 1) * QB_PAGE_SIZE;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs font-semibold text-muted-foreground">
        মোট {toBengaliDigits(data.total)}টি প্রশ্নের মধ্যে{" "}
        {toBengaliDigits(offset + 1)}–
        {toBengaliDigits(Math.min(offset + data.questions.length, data.total))}
        টি দেখানো হচ্ছে
      </p>

      <ol className="flex flex-col gap-5">
        {data.questions.map((question, index) => (
          <QbQuestionCard
            key={question.id}
            question={question}
            index={offset + index + 1}
          />
        ))}
      </ol>

      <QbPagination
        basePath={data.basePath}
        page={data.page}
        pageCount={data.pageCount}
      />
    </div>
  );
}
