"use client";

import { Clock, TaskSquare } from "@/components/icons";
import { Button } from "@/components/ui/button";
import type { BatchExamDetail, ExamDetail } from "@/types";

interface PracticeExamListProps {
  /** Batch exams whose window has already closed → downgraded to practice. */
  readonly expiredBatchExams: readonly BatchExamDetail[];
  /** Open practice exams published for everyone. */
  readonly openPracticeExams: readonly ExamDetail[];
}

export function PracticeExamList({
  expiredBatchExams,
  openPracticeExams,
}: PracticeExamListProps) {
  const expired = expiredBatchExams.filter((be) => be.exam);
  const total = expired.length + openPracticeExams.length;

  if (total === 0) {
    return (
      <div className="col-span-full py-16 sm:py-28 flex flex-col items-center justify-center text-center border border-dashed rounded-2xl sm:rounded-3xl text-muted-foreground bg-muted/15 px-4 sm:px-6">
        <div className="size-12 sm:size-16 rounded-xl sm:rounded-2xl bg-muted/80 flex items-center justify-center mb-3 sm:mb-4">
          <TaskSquare className="size-6 sm:size-8 text-muted-foreground" />
        </div>
        <p className="font-bold text-base sm:text-xl text-foreground">
          কোনো প্র্যাকটিস পরীক্ষা পাওয়া যায়নি
        </p>
        <p className="text-xs sm:text-sm mt-1.5 sm:mt-2 text-muted-foreground max-w-md">
          সময় পেরিয়ে যাওয়া পরীক্ষা এখানে প্র্যাকটিস হিসেবে চলে আসবে।
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {/* Window missed — downgraded to practice */}
      {expired.map((be) => (
        <div
          key={be.id}
          className="border border-border/60 rounded-2xl p-5 sm:p-6 bg-card flex flex-col justify-between gap-5 hover:border-primary/50 transition-colors"
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold text-base sm:text-lg leading-snug">
                {be.exam?.title}
              </h3>
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 px-2.5 py-0.5 text-[11px] font-bold uppercase">
                প্র্যাকটিস
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 font-medium bg-muted/40 px-2.5 py-1 rounded-lg border border-border/40">
                <TaskSquare className="size-3.5 text-primary shrink-0" />{" "}
                {be.exam?.totalMarks} নম্বর
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium bg-muted/40 px-2.5 py-1 rounded-lg border border-border/40">
                <Clock className="size-3.5 text-primary shrink-0" />{" "}
                {be.exam?.durationMinutes} মিনিট
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full h-10 rounded-xl text-sm font-semibold border-border/70 hover:border-primary/50 mt-auto"
            render={<a href={`/exams/${be.exam?.slug}`} />}
          >
            প্র্যাকটিস শুরু করুন →
          </Button>
        </div>
      ))}

      {/* Open to everyone */}
      {openPracticeExams.map((exam) => (
        <div
          key={exam.id}
          className="border border-border/60 rounded-2xl p-5 sm:p-6 bg-card flex flex-col justify-between gap-5 hover:border-primary/50 transition-colors"
        >
          <div className="space-y-3">
            <h3 className="font-bold text-base sm:text-lg leading-snug">
              {exam.title}
            </h3>
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
          <Button
            variant="outline"
            className="w-full h-10 rounded-xl text-sm font-semibold border-border/70 hover:border-primary/50 mt-auto"
            render={<a href={`/exams/${exam.slug}`} />}
          >
            প্র্যাকটিস শুরু করুন →
          </Button>
        </div>
      ))}
    </div>
  );
}
