import type { ReactElement, ReactNode } from "react";
import { toBengaliDigits } from "@/lib/calendar-date";

/** Heading shared by every shelf level inside a section. */
export function QbSectionHeading({
  icon,
  eyebrow,
  title,
  description,
  count,
  children,
}: {
  readonly icon: ReactNode;
  readonly eyebrow?: string;
  readonly title: string;
  readonly description?: string;
  readonly count?: number;
  readonly children?: ReactNode;
}): ReactElement {
  return (
    <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-xl font-black leading-tight sm:text-2xl lg:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {count !== undefined ? (
        <span className="shrink-0 self-start rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-black tabular-nums text-muted-foreground">
          {toBengaliDigits(count)}টি প্রশ্ন
        </span>
      ) : null}

      {children}
    </header>
  );
}
