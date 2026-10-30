import type { ReactElement, ReactNode } from "react";

/**
 * The student question bank frame.
 *
 * It deliberately uses the site's normal light theme — no dark panel — and only
 * caps the reading width, because the shell already supplies the page padding.
 */
export function QbShell({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="min-h-full w-full bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl pb-20">{children}</div>
    </div>
  );
}
