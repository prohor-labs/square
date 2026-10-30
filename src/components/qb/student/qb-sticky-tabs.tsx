"use client";

import { useEffect, useState } from "react";
import { toBengaliDigits } from "@/lib/calendar-date";
import { cn } from "@/lib/utils";

export interface QbTab {
  readonly id: string;
  readonly label: string;
  readonly count: number;
}

/**
 * The four-section switcher that stays under the search bar.
 *
 * It is a scroll-spy over the sections on the landing page, not a second
 * navigation tree: clicking jumps to the section, and scrolling updates the
 * active chip, so the two always agree.
 */
export function QbStickyTabs({
  tabs,
}: {
  readonly tabs: readonly QbTab[];
}): React.ReactElement {
  const [active, setActive] = useState(tabs[0]?.id ?? "");

  useEffect(() => {
    const elements = tabs
      .map((tab) => document.getElementById(`section-${tab.id}`))
      .filter((element): element is HTMLElement => Boolean(element));
    if (elements.length === 0) return;

    const first = elements[0];
    const root = first?.closest(".overflow-y-auto") ?? null;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const target = visible[0]?.target;
        if (target?.id) setActive(target.id.replace("section-", ""));
      },
      {
        root,
        rootMargin: "-88px 0px -55% 0px",
        threshold: [0, 0.2, 0.5, 0.8],
      },
    );

    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }, [tabs]);

  const jump = (id: string) => {
    const element = document.getElementById(`section-${id}`);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  };

  return (
    <div className="sticky top-0 z-20 -mx-4 mt-5 bg-background/85 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div
        role="tablist"
        aria-label="প্রশ্নব্যাংকের বিভাগ"
        className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab) => {
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`section-${tab.id}`}
              onClick={() => jump(tab.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:px-4 sm:text-sm",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              <span className="whitespace-nowrap">{tab.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-black tabular-nums",
                  selected
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {toBengaliDigits(tab.count)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
