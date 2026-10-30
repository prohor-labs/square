import type { ReactElement } from "react";
import { QbShell } from "@/components/qb/student/qb-shell";

/** Skeleton shown while a shelf is read from the bank. */
export default function QbLoading(): ReactElement {
  return (
    <QbShell>
      <div
        className="flex flex-col gap-6"
        role="status"
        aria-busy="true"
        aria-live="polite"
        aria-label="প্রশ্নব্যাংক লোড হচ্ছে"
      >
        <div className="h-44 animate-pulse rounded-[2rem] border border-border bg-card sm:h-52" />
        <div className="h-11 w-full animate-pulse rounded-full bg-card sm:w-2/3" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton slots
              key={index}
              className="h-32 animate-pulse rounded-2xl border border-border bg-card"
            />
          ))}
        </div>
      </div>
    </QbShell>
  );
}
