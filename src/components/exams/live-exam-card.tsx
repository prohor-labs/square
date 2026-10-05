"use client";

import { ExamBadges } from "@/components/exams/exam-badges";
import { Clock, TaskSquare } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { formatBanglaDateTime } from "@/lib/date";
import type { ExamWindow } from "@/lib/exam-window";
import { cn } from "@/lib/utils";
import type { BatchExamDetail } from "@/types";

interface ExamCardProps {
  readonly batchExam: BatchExamDetail;
  readonly window: ExamWindow;
}

export function LiveExamCard({ batchExam, window }: ExamCardProps) {
  const exam = batchExam.exam;
  if (!exam) return null;

  const isPractice = window.status === "practice";

  // No schedule at all means the admin set no time, so there is nothing to show.
  const hasSchedule = Boolean(window.startsAt || window.endsAt);

  return (
    <div className="border border-border/60 rounded-2xl p-5 sm:p-6 bg-card flex flex-col gap-5 hover:border-primary/50 transition-colors">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-base sm:text-lg leading-snug">
            {exam.title}
          </h3>
          <ExamBadges
            status={isPractice ? "practice" : "live"}
            batchName={batchExam.batch?.name}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-medium bg-muted/40 px-2.5 py-1 rounded-lg border border-border/40">
            <TaskSquare className="size-3.5 text-primary shrink-0" />{" "}
            {exam.totalMarks} নম্বর
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium bg-muted/40 px-2.5 py-1 rounded-lg border border-border/40">
            <Clock className="size-3.5 text-primary shrink-0" />{" "}
            {exam.durationMinutes} মিনিট
          </span>
        </div>
      </div>

      {isPractice ? (
        <div className="text-xs bg-muted/30 p-3.5 rounded-xl border border-border/30">
          <span className="font-medium text-foreground/80">অবস্থা:</span>{" "}
          <span className="font-semibold text-sky-600 dark:text-sky-400">
            সময় পেরিয়ে গেছে
          </span>
        </div>
      ) : (
        hasSchedule && (
          <div className="text-xs bg-muted/30 p-3.5 rounded-xl space-y-1.5 border border-border/30">
            {window.startsAt && (
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-foreground/80">শুরু</span>
                <span>
                  {formatBanglaDateTime(window.startsAt.toISOString())}
                </span>
              </div>
            )}
            {window.endsAt && (
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-foreground/80">শেষ</span>
                <span>{formatBanglaDateTime(window.endsAt.toISOString())}</span>
              </div>
            )}
          </div>
        )
      )}

      <Button
        className={cn("w-full h-10 rounded-xl text-sm font-semibold mt-auto")}
        render={<a href={`/exams/${exam.slug}`} />}
      >
        {isPractice ? "প্র্যাকটিস শুরু করুন" : "বিস্তারিত ও শুরু করুন"} →
      </Button>
    </div>
  );
}
