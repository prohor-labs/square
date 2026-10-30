import type { ReactElement } from "react";
import { QbSearchBox } from "@/components/qb/student/qb-search-box";

/**
 * The landing hero: just the search box.
 *
 * It intentionally shows no title and no counters — the sections below carry
 * the words, and every number sits next to the thing it describes.
 */
export function QbHero(): ReactElement {
  return (
    <header className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-primary/[0.08] via-card to-card px-4 py-5 sm:px-8 sm:py-7">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)",
          backgroundSize: "20px 20px",
          maskImage:
            "radial-gradient(ellipse 70% 90% at 85% 0%, black, transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 90% at 85% 0%, black, transparent 72%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-1/3 size-56 rounded-full bg-primary/[0.05] blur-3xl"
      />

      <div className="relative">
        <h1 className="sr-only">প্রশ্নব্যাংক</h1>
        <div className="mx-auto max-w-3xl">
          <QbSearchBox />
        </div>
      </div>
    </header>
  );
}
