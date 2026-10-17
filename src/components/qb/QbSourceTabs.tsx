"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AngleLeft, AngleRight } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * Which exam a question came from.
 *
 * A tab only appears if the bank actually holds questions from that exam, so a
 * medical student is never shown an empty engineering tab. The "সব উৎস" tab is
 * what makes the point of the page visible: one chapter, four papers, one list.
 */
const TABS = [
  { value: "", label: "সব উৎস" },
  { value: "board", label: "বোর্ড" },
  { value: "medical", label: "মেডিকেল" },
  { value: "university", label: "ভার্সিটি" },
  { value: "engineering", label: "ইঞ্জিনিয়ারিং" },
] as const;

export function QbSourceTabs({
  available,
  className,
}: {
  /** Exam types present in the current result set. */
  readonly available: readonly string[];
  readonly className?: string;
}) {
  const params = useSearchParams();
  const current = params.get("exam") ?? "";

  const shown = TABS.filter(
    (tab) => !tab.value || available.includes(tab.value),
  );
  if (shown.length < 2) return null;

  return (
    <div
      className={cn(
        "-mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0",
        className,
      )}
    >
      <div
        role="tablist"
        aria-label="পরীক্ষার উৎস"
        className="flex w-max min-w-full gap-1 border-b"
      >
        {shown.map((tab) => {
          const next = new URLSearchParams(params.toString());
          if (tab.value) next.set("exam", tab.value);
          else next.delete("exam");
          next.delete("page");

          const active = current === tab.value;
          const search = next.toString();

          return (
            <Link
              key={tab.value || "all"}
              role="tab"
              aria-selected={active}
              href={search ? `?${search}` : "?"}
              scroll={false}
              className={cn(
                "-mb-px shrink-0 border-b-2 px-3 py-2 text-xs font-bold whitespace-nowrap transition-colors sm:text-sm",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Server-side paging.
 *
 * Twenty questions a page: enough that scrolling feels like reading rather than
 * flicking, few enough that the page stays quick on a phone.
 */
export function QbPagination({
  page,
  total,
  pageSize,
}: {
  readonly page: number;
  readonly total: number;
  readonly pageSize: number;
}) {
  const params = useSearchParams();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  const link = (to: number) => {
    const next = new URLSearchParams(params.toString());
    if (to > 1) next.set("page", String(to));
    else next.delete("page");
    const search = next.toString();
    return search ? `?${search}` : "?";
  };

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="পৃষ্ঠা"
      className="flex items-center justify-between gap-3 border-t border-border pt-4"
    >
      <p className="text-xs text-muted-foreground">
        {from}–{to} / {total}
      </p>

      <div className="flex items-center gap-1.5">
        <Link
          href={link(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          tabIndex={page <= 1 ? -1 : undefined}
          className={cn(
            "flex size-8 items-center justify-center rounded-md border border-border transition-colors",
            page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-muted",
          )}
          aria-label="আগের পৃষ্ঠা"
        >
          <AngleLeft className="size-4" />
        </Link>

        <span className="px-1 text-xs font-bold tabular-nums">
          {page} / {pages}
        </span>

        <Link
          href={link(Math.min(pages, page + 1))}
          aria-disabled={page >= pages}
          tabIndex={page >= pages ? -1 : undefined}
          className={cn(
            "flex size-8 items-center justify-center rounded-md border border-border transition-colors",
            page >= pages ? "pointer-events-none opacity-40" : "hover:bg-muted",
          )}
          aria-label="পরের পৃষ্ঠা"
        >
          <AngleRight className="size-4" />
        </Link>
      </div>
    </nav>
  );
}
