import type { ReactElement } from "react";
import { QbBreadcrumb } from "@/components/qb/QbBreadcrumb";
import { QbQuestionList } from "@/components/qb/QbQuestionList";
import { QbSearchBar } from "@/components/qb/QbSearchBar";
import { getBookmarkedQuestionIds } from "@/lib/actions/qb-bookmarks";
import { listQbQuestions } from "@/lib/actions/qb-library";
import { toBengaliDigits } from "@/lib/calendar-date";
import { BASE_FILTERS, parseQbQuery } from "@/lib/qb-page";

export const dynamic = "force-dynamic";

/**
 * Search results.
 *
 * The search box rewrites the query string, so the results arrive from the
 * server — the same path a crawl or a shared link takes — and the page stays
 * indexable rather than existing only inside a component's state.
 */
export default async function QbSearchPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<ReactElement> {
  const raw = (await searchParams) ?? {};
  const params = new URLSearchParams(
    Object.entries(raw).flatMap(([k, v]) =>
      typeof v === "string" ? [[k, v] as [string, string]] : [],
    ),
  );

  const { filters, page } = parseQbQuery(params);
  const query = filters.search?.trim() ?? "";

  const { rows, total } = query
    ? await listQbQuestions(filters)
    : { rows: [], total: 0 };
  const bookmarkedIds = await getBookmarkedQuestionIds(rows.map((r) => r.id));

  return (
    <div className="flex w-full max-w-6xl flex-col gap-5 pb-12 pt-2 md:py-8">
      <QbBreadcrumb
        items={[{ label: "প্রশ্নব্যাংক", href: "/qb" }, { label: "খুঁজুন" }]}
      />

      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          প্রশ্ন খুঁজুন
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {query ? (
            <>
              &ldquo;{query}&rdquo; · {toBengaliDigits(total)} টি প্রশ্ন পাওয়া গেছে
            </>
          ) : (
            "প্রশ্নের লেখা, বিষয়, অধ্যায়, টপিক, বোর্ড, বিশ্ববিদ্যালয় বা সাল দিয়ে খুঁজুন"
          )}
        </p>
      </div>

      <QbSearchBar className="max-w-2xl" autoFocus />

      {query ? (
        <QbQuestionList
          questions={rows}
          total={total}
          page={page}
          filters={BASE_FILTERS}
          bookmarkedIds={bookmarkedIds}
          canBookmark
          searchActive
          emptyMessage="অন্য কিছু দিয়ে খুঁজে দেখুন — বিষয়ের নাম, অধ্য্যায়ের শিরোনাম বা পরীক্ষার সাল।"
        />
      ) : (
        <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-14 text-center">
          <p className="text-sm font-bold text-foreground">
            উপরের ঘরে কিছু লিখুন
          </p>
          <p className="mx-auto mt-1.5 max-w-sm text-xs text-muted-foreground">
            খুঁজবার লেখা মিলিয়ে ফল আসবে, আর সাথে প্রশ্নটি কোন বোর্ড ও কোন সালে এসেছে তাও
            দেখা যাবে।
          </p>
        </div>
      )}
    </div>
  );
}
