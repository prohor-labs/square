import { headers } from "next/headers";
import Link from "next/link";
import type { ReactElement } from "react";
import { ArchiveBox } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { getArchivedExams } from "@/lib/actions/student-library";
import { auth } from "@/lib/auth";
import { toBengaliDigits } from "@/lib/calendar-date";

export const dynamic = "force-dynamic";

const STANDARD_LABELS: Record<string, string> = {
  HSC: "HSC বোর্ড",
  Varsity: "ভার্সিটি",
  Engineering: "ইঞ্জিনিয়ারিং",
  Medical: "মেডিকেল",
};

/** Past exams the student's own courses have put in their archive. */
export default async function ArchivePage(): Promise<ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  const list = session?.user ? await getArchivedExams(session.user.id) : [];

  return (
    <div className="flex w-full max-w-3xl flex-col gap-5 pb-16">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight md:text-3xl">
          আর্কাইভ পরীক্ষা
        </h1>
        <p className="text-xs text-muted-foreground md:text-sm">
          {toBengaliDigits(list.length)} টি পরীক্ষা · কোন কোন কোর্সে যুক্ত তা কার্ডেই
          দেখা যাবে
        </p>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed bg-muted/10 px-6 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/80 text-primary">
            <ArchiveBox className="size-7" />
          </div>
          <p className="text-lg font-bold">আর্কাইভে কোনো পরীক্ষা নেই</p>
          <p className="max-w-md text-xs text-muted-foreground md:text-sm">
            অ্যাডমিন প্যানেল থেকে কোনো পরীক্ষা আর্কাইভে যোগ করলে সেটি এখানে দেখা যাবে।
          </p>
          <Link href="/exams">
            <Button className="rounded-xl px-6 font-semibold">
              পরীক্ষা দেখুন
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((exam) => (
            <div
              key={exam.id}
              className="rounded-2xl border border-border bg-card p-4 md:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    {STANDARD_LABELS[exam.standard] ?? exam.standard}
                  </p>
                  <h2 className="mt-0.5 text-base font-bold md:text-lg">
                    {exam.title}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    মোট {toBengaliDigits(exam.totalMarks)} নম্বর ·{" "}
                    {toBengaliDigits(exam.durationMinutes)} মিনিট
                  </p>
                </div>
                <ArchiveBox className="size-5 shrink-0 text-muted-foreground" />
              </div>

              <div className="mt-3 border-t border-border pt-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  কোন কোন কোর্সে যুক্ত
                </p>
                {exam.courses.length === 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    কোনো কোর্সে যুক্ত নয়
                  </p>
                ) : (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {exam.courses.map((course) => (
                      <span
                        key={course}
                        className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                      >
                        {course}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
                <p className="text-[11px] text-muted-foreground">
                  এটি আগের পরীক্ষা — আবার দিতে পারবে
                </p>
                <Link href={`/exams/${exam.slug}`} className="shrink-0">
                  <Button className="rounded-xl px-5 font-semibold">
                    পরীক্ষা দাও
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
