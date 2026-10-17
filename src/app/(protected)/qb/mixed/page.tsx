import type { ReactElement } from "react";
import { QbBreadcrumb } from "@/components/qb/QbBreadcrumb";
import { QbQuestionList } from "@/components/qb/QbQuestionList";
import { getBookmarkedQuestionIds } from "@/lib/actions/qb-bookmarks";
import { listQbQuestions } from "@/lib/actions/qb-library";
import { toBengaliDigits } from "@/lib/calendar-date";
import { BASE_FILTERS, parseQbQuery } from "@/lib/qb-page";

export const dynamic = "force-dynamic";

/**
 * The questions no single exam owns.
 *
 * The textbook practice sets and the archive have a subject but no board, and
 * no board but no subject. Rather than file them under a board they never sat
 * for, they are gathered here — which is also where a question lands if its
 * metadata is still incomplete.
 */
export default async function QbMixedPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<ReactElement> {
  const params = new URLSearchParams(
    Object.entries((await searchParams) ?? {}).flatMap(([k, v]) =>
      typeof v === "string" ? [[k, v] as [string, string]] : [],
    ),
  );
  params.set("unfiled", "1");

  const { filters, page } = parseQbQuery(params);
  const { rows, total } = await listQbQuestions(filters);
  const bookmarkedIds = await getBookmarkedQuestionIds(rows.map((r) => r.id));

  return (
    <div className="flex w-full max-w-6xl flex-col gap-5 pb-12 pt-2 md:py-8">
      <QbBreadcrumb
        items={[
          { label: "প্রশ্নব্যাংক", href: "/qb" },
          { label: "বিভিন্ন পরীক্ষার প্রশ্ন" },
        ]}
      />

      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          বিভিন্ন পরীক্ষার প্রশ্ন
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          যেগুলো কোনো একটি বোর্ড বা বিশ্ববিদ্যালয়ের নামে নয় · মোট{" "}
          {toBengaliDigits(total)} টি
        </p>
      </div>

      <QbQuestionList
        questions={rows}
        total={total}
        page={page}
        filters={BASE_FILTERS}
        bookmarkedIds={bookmarkedIds}
        canBookmark={bookmarkedIds.length > 0 || true}
        emptyMessage="এখনো এভাবে কোনো প্রশ্ন যুক্ত হয়নি।"
      />
    </div>
  );
}
