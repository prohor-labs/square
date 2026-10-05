import { cn } from "@/lib/utils";

export type ExamBadgeStatus = "live" | "practice" | "upcoming";

const TONE: Record<ExamBadgeStatus, string> = {
  live: "bg-red-500/15 text-red-600 dark:text-red-400",
  practice: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  upcoming: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

const LABEL: Record<ExamBadgeStatus, string> = {
  live: "লাইভ",
  practice: "প্র্যাকটিস",
  upcoming: "আপকামিং",
};

interface ExamBadgesProps {
  readonly status: ExamBadgeStatus;
  /** Batch / course the exam belongs to. */
  readonly batchName?: string | null;
}

/**
 * Status pill with the course name sitting directly beneath it, so a student
 * can see which course an exam belongs to without opening it. Course names are
 * long, so it gets its own line instead of squeezing the card title.
 */
export function ExamBadges({ status, batchName }: ExamBadgesProps) {
  return (
    <div className="flex shrink-0 flex-col items-end gap-1.5">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase",
          TONE[status],
        )}
      >
        {LABEL[status]}
      </span>
      {batchName && (
        <span className="max-w-[45vw] text-right text-[11px] font-semibold leading-tight text-muted-foreground sm:max-w-[170px]">
          {batchName}
        </span>
      )}
    </div>
  );
}
