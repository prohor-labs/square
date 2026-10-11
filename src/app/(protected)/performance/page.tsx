import { headers } from "next/headers";
import Link from "next/link";
import type { ReactElement } from "react";
import { Chart } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { getStudentSubmissions } from "@/lib/actions/student-library";
import { auth } from "@/lib/auth";
import { toBengaliDigits } from "@/lib/calendar-date";

export const dynamic = "force-dynamic";

/** A single stat tile. */
function Stat({
  label,
  value,
  tone,
}: {
  readonly label: string;
  readonly value: string;
  readonly tone: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div
        className={`mb-3 flex size-10 items-center justify-center rounded-xl ${tone}`}
      >
        <Chart className="size-5" />
      </div>
      <p className="text-2xl font-black tabular-nums leading-none md:text-3xl">
        {value}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/** Course, exam and marks for every attempt, as a plain table. */
export default async function PerformancePage(): Promise<ReactElement> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const submissions = userId ? await getStudentSubmissions(userId) : [];
  const done = submissions.filter((s) => s.submittedAt);

  const totalScore = done.reduce((sum, s) => sum + s.score, 0);
  const totalMarks = done.reduce((sum, s) => sum + s.totalMarks, 0);
  const overall =
    totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0;

  const live = done.filter((s) => s.isLiveAttempt);
  const liveScore = live.reduce((sum, s) => sum + s.score, 0);
  const liveMarks = live.reduce((sum, s) => sum + s.totalMarks, 0);
  const livePercent =
    liveMarks > 0 ? Math.round((liveScore / liveMarks) * 100) : 0;

  const totalSeconds = done.reduce((sum, s) => sum + s.timeTakenSeconds, 0);
  const avgMinutes =
    done.length > 0 ? Math.round(totalSeconds / done.length / 60) : 0;

  return (
    <div className="flex w-full max-w-5xl flex-col gap-5 pb-16">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight md:text-3xl">
          পারফরম্যান্স
        </h1>
        <p className="text-xs text-muted-foreground md:text-sm">
          {done.length > 0
            ? `মোট ${toBengaliDigits(done.length)} টি পরীক্ষার ফলাফল থেকে হিসাব করা`
            : "একটি পরীক্ষা দিলে এখানে আপনার ফলাফল দেখা যাবে"}
        </p>
      </div>

      {done.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed bg-muted/10 px-6 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/80 text-primary">
            <Chart className="size-7" />
          </div>
          <p className="text-lg font-bold">এখনো কোনো তথ্য নেই</p>
          <p className="max-w-md text-xs text-muted-foreground md:text-sm">
            প্রথম পরীক্ষাটি দিয়ে দিন — স্কোর, সময় ও সেরা ফলাফল এখানে দেখাতে শুরু করব।
          </p>
          <Link href="/exams">
            <Button className="rounded-xl px-6 font-semibold">পরীক্ষা দিন</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Stat
              label="সর্বমোট স্কোর"
              value={`${toBengaliDigits(overall)}%`}
              tone="bg-emerald-100 text-emerald-700"
            />
            <Stat
              label="লাইভ পরীক্ষা"
              value={`${toBengaliDigits(live.length)} টি`}
              tone="bg-purple-100 text-purple-700"
            />
            <Stat
              label="লাইভ স্কোর"
              value={`${toBengaliDigits(livePercent)}%`}
              tone="bg-pink-100 text-pink-700"
            />
            <Stat
              label="গড় সময়"
              value={`${toBengaliDigits(avgMinutes)} মিনিট`}
              tone="bg-sky-100 text-sky-700"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    কোর্স
                  </th>
                  <th className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    এক্সাম
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    প্রাপ্ত
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    মোট
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    শতাংশ
                  </th>
                </tr>
              </thead>
              <tbody>
                {done.map((s) => {
                  const percent =
                    s.totalMarks > 0
                      ? Math.round((s.score / s.totalMarks) * 100)
                      : 0;
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-3 py-3 font-medium">
                        {s.courseName || "—"}
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/exams/${s.examSlug}/result`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {s.examTitle}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-right font-black tabular-nums">
                        {toBengaliDigits(s.score)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                        {toBengaliDigits(s.totalMarks)}
                      </td>
                      <td className="px-3 py-3 text-right font-bold tabular-nums">
                        {toBengaliDigits(percent)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
