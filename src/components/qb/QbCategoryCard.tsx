import Link from "next/link";
import type { ComponentType } from "react";
import { toBengaliDigits } from "@/lib/calendar-date";
import { cn } from "@/lib/utils";

export interface QbCategoryCardProps {
  readonly href: string;
  readonly title: string;
  readonly description: string;
  readonly questions: number;
  readonly icon: ComponentType<{ className?: string }>;
}

/**
 * One of the five ways into the bank.
 *
 * Deliberately plain: a border, a small icon and a real count. The bank holds
 * thirteen thousand questions, and a page whose job is "pick a door" should not
 * compete with the questions for attention.
 */
export function QbCategoryCard({
  href,
  title,
  description,
  questions,
  icon: Icon,
}: QbCategoryCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-colors",
        "hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:outline-none",
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4.5" />
      </span>

      <h3 className="text-sm leading-snug font-bold text-foreground sm:text-base">
        {title}
      </h3>

      <p className="text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>

      <span className="mt-auto pt-1 text-[11px] font-bold text-muted-foreground sm:text-xs">
        {questions > 0 ? (
          <>
            {toBengaliDigits(questions)} টি প্রশ্ন{" "}
            <span className="text-primary transition-colors group-hover:underline">
              দেখুন
            </span>
          </>
        ) : (
          <span className="italic">এখনো প্রশ্ন যুক্ত হয়নি</span>
        )}
      </span>
    </Link>
  );
}
