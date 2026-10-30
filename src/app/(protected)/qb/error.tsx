"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Danger } from "@/components/icons";
import { QbShell } from "@/components/qb/student/qb-shell";

/** Error boundary for every `/qb` shelf, in the same charcoal shell. */
export default function QbError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <QbShell>
      <div className="mx-auto max-w-lg rounded-3xl border border-border bg-card px-6 py-12 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
          <Danger className="size-5" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-lg font-black">প্রশ্নব্যাংক লোড করা যায়নি</h1>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন — আপনার পড়া বা ফিল্টার হারাবে না।
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            আবার চেষ্টা করুন
          </button>
          <Link
            href="/qb"
            className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            প্রশ্নব্যাংকে ফিরুন
          </Link>
        </div>
      </div>
    </QbShell>
  );
}
