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
  /** Optional list to switch between; the student's own batches. */
  readonly batchOptions?: readonly { id: string; name: string }[];
  readonly selectedBatchId?: string;
  readonly onBatchChange?: (batchId: string) => void;
}

export function LiveExamCard({
  batchExam,
  window,
  now,
  batchOptions,
  selectedBatchId,
  onBatchChange,
}: ExamCardProps) {
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
        {isLive && (
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            সময়ের মধ্যে দিলে ফলাফল মেরিট লিস্টে যুক্ত হবে। সময়ের বাইরে দিলে এটি
            প্র্যাকটিস হিসেবে গণ্য হবে।
          </p>
        )}
      </div>

      {/* Which batch this exam is for */}
      {(batchOptions?.length ?? 0) > 1 ? (
        <div className="space-y-1.5">
          <label
            htmlFor={`batch-${batchExam.id}`}
            className="text-xs font-semibold text-muted-foreground"
          >
            কোন batch
          </label>
          <select
            id={`batch-${batchExam.id}`}
            value={selectedBatchId ?? batchExam.batchId}
            onChange={(e) => onBatchChange?.(e.target.value)}
            className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {batchOptions?.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      ) : batchOptions && batchOptions.length === 1 ? (
        <div className="text-xs bg-muted/20 px-3.5 py-2.5 rounded-xl border border-border/40">
          <span className="font-medium text-muted-foreground">কোন batch:</span>{" "}
          <span className="font-bold">{batchOptions[0]?.name}</span>
        </div>
      ) : null}

      <Button
        className={cn("w-full h-10 rounded-xl text-sm font-semibold mt-auto")}
        render={<a href={`/exams/${exam.slug}`} />}
      >
        {isPractice ? "প্র্যাকটিস শুরু করুন" : "বিস্তারিত ও শুরু করুন"} →
      </Button>
    </div>
  );
}
