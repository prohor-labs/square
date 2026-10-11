"use client";

import type { ReactNode } from "react";
import { notifyNotReady } from "@/lib/not-ready";

/**
 * Stands in for a destination that is on screen but not finished yet. Clicking
 * anywhere inside says so instead of opening an empty page, so the spot never
 * looks broken.
 */
export function NotReadyCard({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <button
      type="button"
      onClick={notifyNotReady}
      className={className}
      title="এই সিস্টেমটি এখনো প্রস্তুত নয়"
    >
      {children}
    </button>
  );
}
