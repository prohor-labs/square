import Link from "next/link";
import type { ReactElement } from "react";
import { QbEmpty } from "@/components/qb/student/qb-empty";
import { QbQuestionBoard } from "@/components/qb/student/qb-question-board";
import { QB_PAGE_SIZE, type QbQuestionsPage } from "@/lib/qb-catalog";

/**
 * A page of questions with the subject tabs, the answer switch and the pager.
 *
 * Questions arrive already sliced by the server; nothing about the rest of the
 * bank reaches the browser. Only the "show answers" switch lives in the client.
 */
export function QbQuestionList({
  data,
}: {
  readonly data: QbQuestionsPage;
}): ReactElement {
  if (data.questions.length === 0 && data.subjects.length === 0) {
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

  return <QbQuestionBoard data={data} pageSize={QB_PAGE_SIZE} />;
}
