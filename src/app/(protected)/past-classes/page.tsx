import { headers } from "next/headers";
import Link from "next/link";
import type { ReactElement } from "react";
import { Suspense } from "react";
import { CoursePicker } from "@/components/classes/course-picker";
import { BookOpen } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  getStudentClasses,
  getStudentCourseList,
} from "@/lib/actions/student-library";
import { auth } from "@/lib/auth";
import { toBengaliDigits } from "@/lib/calendar-date";

export const dynamic = "force-dynamic";

/** Pick a course, then see that course's recorded classes. */
export default async function PastClassesPage({
  searchParams,
}: {
  readonly searchParams?: Promise<{ course?: string }>;
}): Promise<ReactElement> {
  const { course } = (await searchParams) ?? {};
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const [courses, classes] = userId
    ? await Promise.all([
        getStudentCourseList(userId),
        getStudentClasses(userId),
      ])
    : [[], []];

  const picked = course ?? "all";
  const recorded = classes.filter(
    (c) => !c.isLive && (picked === "all" || c.batchId === picked),
  );

  return (
    <div className="flex w-full max-w-3xl flex-col gap-5 pb-16">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight md:text-3xl">
          পাস্ট ক্লাস
        </h1>
        <p className="text-xs text-muted-foreground md:text-sm">
          কোর্স বেছে নিয়ে তার রেকর্ডেড ক্লাস দেখুন
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed bg-muted/10 px-6 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/80 text-primary">
            <BookOpen className="size-7" />
          </div>
          <p className="text-lg font-bold">এখনো কোনো কোর্সে ভর্তি হয়নি</p>
          <Link href="/my-courses">
            <Button className="rounded-xl px-6 font-semibold">
              আমার কোর্স দেখুন
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <Suspense fallback={null}>
            <CoursePicker
              value={picked}
              allLabel="সব কোর্স"
              courses={courses.map((c) => ({
                batchId: c.batchId,
                title: c.title,
                count: c.recordedCount,
              }))}
            />
          </Suspense>

          {recorded.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed bg-muted/10 px-6 py-14 text-center">
              <p className="text-base font-bold">
                এই কোর্সে কোনো রেকর্ডেড ক্লাস নেই
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {recorded.map((c) => (
                <Link
                  key={c.id}
                  href={`/my-courses/${c.batchId}`}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <BookOpen className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                      {c.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {c.batchName} · {c.subject} ·{" "}
                      {toBengaliDigits(c.durationMinutes)} মিনিট
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] font-bold uppercase text-muted-foreground">
                    রেকর্ড
                  </span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
