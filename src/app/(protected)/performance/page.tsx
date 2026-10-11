import { headers } from "next/headers";
import Link from "next/link";
import type { ReactElement } from "react";
import { Chart, Clock, StatusUp, Trophy } from "@/components/icons";
import { ScoreChart } from "@/components/performance/score-chart";
import { Button } from "@/components/ui/button";
import { getStudentSubmissions } from "@/lib/actions/student-library";
import { auth } from "@/lib/auth";
import { toBengaliDigits } from "@/lib/calendar-date";

export const dynamic = "force-dynamic";

/** A stat tile — one number the student can hold on to. */
function Stat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs">
      <div
        className={`size-10 rounded-xl flex items-center justify-center mb-3 ${tone}`}
      >
        {icon}
      </div>
      <p className="text-2xl sm:text-3xl font-black tabular-nums leading-none">
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-1.5">{label}</p>
    </div>
  );
}

/**
 * What the student's own attempts add up to. Every figure is derived from
 * `exam_submissions` — nothing is estimated.
 */
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

  const best = done.reduce<(typeof done)[number] | null>(
    (top, s) =>
      top === null ||
      s.score / (s.totalMarks || 1) > top.score / (top.totalMarks || 1)
        ? s
        : top,
    null,
  );

  const hasData = done.length > 0;

  /* Chart reads newest on the right, so the list is reversed here. */
  const chartData = [...done].reverse().map((s) => ({
    label:
      s.examTitle.length > 14 ? `${s.examTitle.slice(0, 13)}…` : s.examTitle,
    percent: s.totalMarks > 0 ? Math.round((s.score / s.totalMarks) * 100) : 0,
    score: s.score,
  }));

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto pb-16 pt-1 sm:pt-4 gap-5 px-2 sm:px-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          পারফরম্যান্স
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {hasData
            ? `মোট ${toBengaliDigits(done.length)} টি পরীক্ষার ফলাফল থেকে হিসাব করা`
            : "একটি পরীক্ষা দিলে এখানে আপনার ফলাফল দেখা যাবে"}
        </p>
      </div>

      {hasData ? (
        <>
          <ScoreChart data={chartData} />

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Stat
              label="সর্বমোট স্কোর"
              value={`${toBengaliDigits(overall)}%`}
              tone="bg-emerald-100 text-emerald-700"
              icon={<Chart className="size-5" />}
            />
            <Stat
              label="লাইভ পরীক্ষা"
              value={`${toBengaliDigits(live.length)} টি`}
              tone="bg-purple-100 text-purple-700"
              icon={<StatusUp className="size-5" />}
            />
            <Stat
              label="লাইভ স্কোর"
              value={`${toBengaliDigits(livePercent)}%`}
              tone="bg-pink-100 text-pink-700"
              icon={<Trophy className="size-5" />}
            />
            <Stat
              label="গড় সময়"
              value={`${toBengaliDigits(avgMinutes)} মিনিট`}
              tone="bg-sky-100 text-sky-700"
              icon={<Clock className="size-5" />}
            />
          </div>

          {best && (
            <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-indigo-600 to-fuchsia-600 p-5 text-white shadow-xs">
              <p className="text-[11px] font-bold uppercase opacity-80">
                সেরা ফলাফল
              </p>
              <p className="text-lg font-black mt-1">{best.examTitle}</p>
              <p className="text-sm opacity-90 mt-0.5">
                {toBengaliDigits(best.score)} /{" "}
                {toBengaliDigits(best.totalMarks)} মার্কস ·{" "}
                {toBengaliDigits(
                  Math.round((best.score / (best.totalMarks || 1)) * 100),
                )}
                %
              </p>
              <Link
                href={`/exams/${best.examSlug}/result`}
                className="inline-flex mt-3 text-xs font-bold bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-3 py-1.5"
              >
                বিস্তারিত দেখুন
              </Link>
            </div>
          )}

          <Link
            href="/my-results"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            সব ফলাফল দেখুন
          </Link>
        </>
      ) : (
        <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center border border-dashed rounded-3xl bg-muted/10 px-6">
          <div className="size-14 rounded-2xl bg-muted/80 flex items-center justify-center mb-4 text-primary">
            <Chart className="size-7" />
          </div>
          <p className="font-bold text-lg">এখনো কোনো তথ্য নেই</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-md">
            প্রথম পরীক্ষাটি দিয়ে দিন — স্কোর, সময় ও সেরা ফলাফল এখানে দেখাতে শুরু করব।
          </p>
          <Link href="/exams" className="mt-6">
            <Button className="rounded-xl px-6 h-11 text-sm font-semibold">
              পরীক্ষা দিন
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
