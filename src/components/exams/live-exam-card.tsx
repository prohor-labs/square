"use client";

import { Clock, TaskSquare } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { formatBanglaDateTime } from "@/lib/date";
import { type ExamWindow, formatRemaining } from "@/lib/exam-window";
import { cn } from "@/lib/utils";
import type { BatchExamDetail } from "@/types";

interface ExamCardProps {
  readonly batchExam: BatchExamDetail;
  readonly window: ExamWindow;
  readonly now: number | null;
}

export function LiveExamCard({ batchExam, window, now }: ExamCardProps) {
  const exam = batchExam.exam;
  if (!exam) return null;

  const isLive = window.status === "live";
  const isPractice = window.status === "practice";
  const remaining = now === null ? null : Math.max(0, window.remainingMs);

  const badge = isPractice
    ? {
        label: "প্র্যাকটিস",
        className: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
      }
    : {
        label: "লাইভ",
        className: "bg-red-500/15 text-red-600 dark:text-red-400",
      };

  return (
    <div className="border border-border/60 rounded-2xl p-5 sm:p-6 bg-card flex flex-col gap-5 hover:border-primary/50 transition-colors">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-base sm:text-lg leading-snug">
            {exam.title}
          </h3>
          <span
            className={cn(
              "shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase",
              badge.className,
            )}
          >
            {badge.label}
          </span>
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

      {/* Window status */}
      <div className="text-xs bg-muted/30 p-3.5 rounded-xl space-y-1.5 border border-border/30">
        {isLive && remaining !== null && (
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground/80">বাকি</span>
            <span className="font-bold text-red-600 dark:text-red-400 tabular-nums">
              {formatRemaining(remaining)}
            </span>
          </div>
        )}
        {isPractice && (
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground/80">অবস্থা</span>
            <span className="font-semibold text-sky-600 dark:text-sky-400">
              সময় পেরিয়ে গেছে — প্র্যাকটিস হিসেবে দেওয়া হচ্ছে
            </span>
          </div>
        )}
        {window.startsAt && (
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-foreground/80">শুরু</span>
            <span>{formatBanglaDateTime(window.startsAt.toISOString())}</span>
          </div>
        )}
        {window.endsAt && (
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-foreground/80">শেষ</span>
            <span>{formatBanglaDateTime(window.endsAt.toISOString())}</span>
          </div>
        )}
      </div>

      {/* Which batch this exam belongs to — plain text, nothing clickable */}
      {batchExam.batch?.name && (
        <p className="text-sm leading-relaxed">
          <span className="text-muted-foreground">কোন batch ( group ) —</span>{" "}
          <span className="font-bold">{batchExam.batch.name}</span>
        </p>
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
