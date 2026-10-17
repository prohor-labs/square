import type { ReactElement } from "react";
import { QbBreadcrumb } from "@/components/qb/QbBreadcrumb";
import { QbFilterPanel } from "@/components/qb/QbFilterPanel";
import { QbPracticeRunner } from "@/components/qb/QbPracticeRunner";
import {
  getSubjectsWithCounts,
  listQbQuestions,
} from "@/lib/actions/qb-library";
import { getChapterList } from "@/lib/actions/qb-subject";
import { toBengaliDigits } from "@/lib/calendar-date";
import { BASE_FILTERS, facetFilter, parseQbQuery } from "@/lib/qb-page";

export const dynamic = "force-dynamic";

/** Ten at a time — enough to settle into, few enough to finish in one sitting. */
const SESSION_SIZE = 10;

/**
 * Practice mode.
 *
 * Picks a slice of the bank and hands it over one question at a time. It reuses
 * the bank's own questions rather than being a second exam system: no timer, no
 * score, no attempt tracking, nothing to get out of step with the real exams.
 */
export default async function QbPracticePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<ReactElement> {
  const query = new URLSearchParams(
    Object.entries((await searchParams) ?? {}).flatMap(([k, v]) =>
      typeof v === "string" ? [[k, v] as [string, string]] : [],
    ),
  );

  const { filters } = parseQbQuery(query);
  const subjects = await getSubjectsWithCounts();

  // A chosen subject is pinned rather than filtered, so its chapters can be
  // offered as their own filter.
  const chapters =
    filters.subjectId && filters.subjectId !== "all"
      ? await getChapterList(filters.subjectId)
      : [];

  const { rows, total } = await listQbQuestions({
    ...filters,
    limit: SESSION_SIZE,
    offset: 0,
  });

  const rail = [
    ...BASE_FILTERS,
    {
      param: "subject",
      label: "বিষয়",
      options: subjects.map((s) => ({
        value: s.id,
        label: s.name,
        questions: s.questions,
      })),
    },
    ...(chapters.length > 0
      ? [
          facetFilter(
            "chapter",
            "অধ্যায়",
            chapters.map((c) => ({
              value: c.id,
              label: c.name,
              questions: c.questions,
            })),
          ),
        ]
      : []),
  ];

  return (
    <div className="flex w-full max-w-6xl flex-col gap-5 pb-12 pt-2 md:py-8">
      <QbBreadcrumb
        items={[{ label: "প্রশ্নব্যাংক", href: "/qb" }, { label: "প্র্যাকটিস মোড" }]}
      />

      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          প্র্যাকটিস মোড
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          বিষয় বেছে নিয়ে একটির পর একটি প্রশ্নের উত্তর দাও। উত্তর দেওয়ার পরে সঠিক উত্তর
          ও ব্যাখ্যা খুলবে।
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-xl border border-border bg-card p-4">
            <QbFilterPanel filters={rail} />
          </div>
        </aside>

        <div className="min-w-0">
          <p className="mb-3 text-xs text-muted-foreground">
            {total > 0 ? (
              <>
                এই সেটে {toBengaliDigits(Math.min(total, SESSION_SIZE))} টি প্রশ্ন
                {total > SESSION_SIZE &&
                  ` · মোট ${toBengaliDigits(total)} টি থেকে প্রথমগুলো`}
              </>
            ) : (
              "ফিল্টার বদলে দেখুন"
            )}
          </p>

          <QbPracticeRunner questions={rows} />
        </div>
      </div>
    </div>
  );
}
