import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { TaskSquare } from "@/components/icons";
import { getChapterList, getSubjectBySlug } from "@/lib/actions/qb-subject";
import { toBengaliDigits } from "@/lib/calendar-date";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** One subject's chapters, each with its live question count. */
export default async function QbSubjectPage({
  params,
}: {
  params: Promise<{ subjectSlug: string }>;
}): Promise<ReactElement> {
  const { subjectSlug } = await params;
  const subject = await getSubjectBySlug(subjectSlug);
  if (!subject) notFound();

  const chapters = await getChapterList(subject.id);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pt-2 pb-12 md:py-8">
      <Link
        href="/qb/subjects"
        className="w-fit text-xs font-bold text-primary hover:underline"
      >
        ← সব বিষয়
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
          {subject.name}
          {subject.paper && (
            <span className="text-primary"> · {subject.paper}</span>
          )}
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {toBengaliDigits(chapters.length)} টি অধ্যায় · মোট{" "}
          {toBengaliDigits(subject.questions)} টি প্রশ্ন
        </p>
      </div>

      {chapters.length === 0 ? (
        <div className="rounded-3xl border border-dashed bg-muted/10 px-6 py-16 text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <TaskSquare className="size-7" />
          </div>
          <p className="font-bold">এই বিষয়ে কোনো অধ্যায় নেই</p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            অ্যাডমিন আপলোডের সময় অধ্যায় দিলে সেটি এখানে দেখা যাবে।
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {chapters.map((chapter, index) => (
            <Link
              key={chapter.id}
              href={`/qb/subjects/${subject.slug}/${chapter.slug}`}
              className="group flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-black tabular-nums",
                  index % 2 === 0
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {toBengaliDigits(index + 1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-bold">
                  {chapter.name}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {toBengaliDigits(chapter.questions)} টি প্রশ্ন
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
