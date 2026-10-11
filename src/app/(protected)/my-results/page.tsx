import { headers } from "next/headers";
import Link from "next/link";
import type { ReactElement } from "react";
import { ArrowRight2, Clipboard } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { getStudentSubmissions } from "@/lib/actions/student-library";
import { auth } from "@/lib/auth";
import { toBengaliDigits } from "@/lib/calendar-date";

export const dynamic = "force-dynamic";

/** Every attempt the student has submitted, with a link to the full result. */
export default async function MyResultsPage(): Promise<ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const submissions = userId ? await getStudentSubmissions(userId) : [];

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto pb-16 pt-1 sm:pt-4 gap-5 px-2 sm:px-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          আগের পরীক্ষা
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          মোট {toBengaliDigits(submissions.length)} টি অ্যাটেম্পট
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center border border-dashed rounded-3xl bg-muted/10 px-6">
          <div className="size-14 rounded-2xl bg-muted/80 flex items-center justify-center mb-4 text-primary">
            <Clipboard className="size-7" />
          </div>
          <p className="font-bold text-lg">এখনো কোনো পরীক্ষা দেননি</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-md">
            পরীক্ষা দিলে সেটার ফলাফল এখানে দেখতে পাবেন।
          </p>
          <Link href="/exams" className="mt-6">
            <Button className="rounded-xl px-6 h-11 text-sm font-semibold">
              পরীক্ষার তালিকা দেখুন
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 sm:gap-3">
          {submissions.map((s) => {
            const percent =
              s.totalMarks > 0 ? (s.score / s.totalMarks) * 100 : 0;
            return (
              <Link
                key={s.id}
                href={`/exams/${s.examSlug}/result`}
                className="group flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-3 sm:p-4 shadow-xs hover:border-primary/50 transition-all"
              >
                <div className="size-12 shrink-0 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clipboard className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm sm:text-base truncate">
                    {s.examTitle}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {toBengaliDigits(s.score)} / {toBengaliDigits(s.totalMarks)}{" "}
                    মার্কস
                    {s.submittedAt
                      ? ` · ${toBengaliDigits(s.submittedAt.toLocaleDateString("bn-BD"))}`
                      : ""}
                    {!s.isLiveAttempt ? " · প্র্যাকটিস" : ""}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-black text-foreground tabular-nums">
                  {toBengaliDigits(percent.toFixed(0))}%
                </span>
                <ArrowRight2 className="size-4 text-muted-foreground shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
