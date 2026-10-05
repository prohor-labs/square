"use client";

import { useEffect, useState } from "react";
import { ExamBadges } from "@/components/exams/exam-badges";
import { Clock, TaskSquare } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { formatBanglaDateTime } from "@/lib/date";
import { formatRemaining, getExamWindow } from "@/lib/exam-window";
import { cn } from "@/lib/utils";
import type { BatchExamDetail } from "@/types";

export interface UpcomingExamCardProps {
  readonly batchExam: BatchExamDetail;
}

export function UpcomingExamCard({ batchExam }: UpcomingExamCardProps) {
  const exam = batchExam.exam;
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!exam) return null;

  const current = now ?? Date.now();
  const window = getExamWindow(batchExam, current);
  const startsInMs = window.startsAt
    ? Math.max(0, window.startsAt.getTime() - current)
    : 0;

  return (
    <div className="border border-border/60 rounded-2xl p-5 sm:p-6 bg-card flex flex-col gap-4 hover:border-amber-500/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold text-base sm:text-lg leading-snug">
          {exam.title}
        </h3>
        <ExamBadges status="upcoming" batchName={batchExam.batch?.name} />
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

      <div className="text-xs bg-muted/30 p-3.5 rounded-xl space-y-1.5 border border-border/30">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium text-foreground/80">শুরু হতে বাকি</span>
          <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {formatRemaining(startsInMs)}
          </span>
        </div>
        {window.startsAt && (
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-foreground/80">শুরু হবে</span>
            <span>{formatBanglaDateTime(window.startsAt.toISOString())}</span>
          </div>
        )}
        {window.endsAt && (
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-foreground/80">শেষ হবে</span>
            <span>{formatBanglaDateTime(window.endsAt.toISOString())}</span>
          </div>
        )}
      </div>

      <Button
        variant="outline"
        disabled
        className={cn(
          "w-full h-10 rounded-xl text-sm font-semibold border-border/70 mt-auto",
        )}
      >
        শুরু হওয়ার অপেক্ষায়
      </Button>
    </div>
  );
}
