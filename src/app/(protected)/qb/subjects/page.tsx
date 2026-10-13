import Link from "next/link";
import type { ReactElement } from "react";
import { TaskSquare } from "@/components/icons";
import { getSubjectList } from "@/lib/actions/qb-subject";
import { toBengaliDigits } from "@/lib/calendar-date";

export const dynamic = "force-dynamic";

/**
 * Subject-wise entry point.
 *
 * Every card is a subject that already has questions — a subject with none is
 * never listed, so the page needs no maintenance as the bank grows.
 */
export default async function QbSubjectsPage(): Promise<ReactElement> {
  const subjects = await getSubjectList();
  const total = subjects.reduce((sum, s) => sum + s.questions, 0);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pt-2 pb-12 md:py-8">
      <Link
        href="/qb"
        className="w-fit text-xs font-bold text-primary hover:underline"
      >
        ← প্রশ্নব্যাংকে ফিরে যান
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
          বিষয়ভিত্তিক প্রশ্নব্যাংক
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {toBengaliDigits(subjects.length)} টি বিষয় · মোট{" "}
          {toBengaliDigits(total)} টি প্রশ্ন
        </p>
      </div>

      {subjects.length === 0 ? (
        <div className="rounded-3xl border border-dashed bg-muted/10 px-6 py-16 text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <TaskSquare className="size-7" />
          </div>
          <p className="font-bold">এখনো কোনো বিষয়ভিত্তিক প্রশ্ন যোগ হয়নি</p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            অ্যাডমিন আপলোডের সময় বিষয় ও অধ্যায় দিলে সেগুলো এখানে দেখা যাবে।
          </p>
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/qb/subjects/${subject.slug}`}
              className="group flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <TaskSquare className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-bold">
                  {subject.name}
                  {subject.paper && (
                    <span className="font-semibold text-primary">
                      {" "}
                      · {subject.paper}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {toBengaliDigits(subject.questions)} টি প্রশ্ন
                </span>
              </span>
              <span className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5">
                ›
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
