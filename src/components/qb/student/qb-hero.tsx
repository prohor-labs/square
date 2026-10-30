import type { ReactElement } from "react";
import { QbSearchBox } from "@/components/qb/student/qb-search-box";

/**
 * The landing hero: title and one search box.
 *
 * It intentionally shows no counters — the numbers belong to the sections and
 * cards below, where they always sit next to the thing they describe.
 */
export function QbHero(): ReactElement {
  return (
    <header className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-primary/[0.08] via-card to-card px-5 py-8 sm:px-9 sm:py-11">
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
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-3 py-1 text-[11px] font-bold text-primary">
          <span
            className="size-1.5 rounded-full bg-primary"
            aria-hidden="true"
          />
          বাংলা + ইংরেজি সার্চ
        </span>
        <h1 className="mt-3 text-3xl font-black leading-[1.15] sm:text-4xl lg:text-5xl">
          প্রশ্নব্যাংক
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          বিশ্ববিদ্যালয়, ইঞ্জিনিয়ারিং, মেডিকেল আর বিষয় — যেভাবে খুঁজতে চান সেভাবেই প্রশ্ন ও
          উত্তর। বাংলা, ইংরেজি বা দুটো মিশিয়েও লিখতে পারেন।
        </p>

        <div className="mt-6 max-w-3xl">
          <QbSearchBox />
        </div>
      </div>
    </header>
  );
}
