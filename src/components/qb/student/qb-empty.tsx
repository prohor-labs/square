import type { ReactElement, ReactNode } from "react";
import { Search } from "@/components/icons";

/**
 * The empty / no-match state. One component so every shelf speaks the same
 * voice and never shows a fake question or a made-up year.
 */
export function QbEmpty({
  title,
  body,
  action,
}: {
  readonly title: string;
  readonly body: string;
  readonly action?: ReactNode;
}): ReactElement {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-muted/40 px-6 py-14 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Search className="size-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-base font-extrabold">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
        {body}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
