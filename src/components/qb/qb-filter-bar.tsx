"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactElement } from "react";
import { useTransition } from "react";
import { Filter } from "@/components/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { QbFilterSelection, QbFilterTree } from "@/lib/actions/qb-uploads";
import { cn } from "@/lib/utils";

/** Sentinel for "no filter"; an empty value would read as an unset select. */
const ALL = "all";

function optionLabel(name: string, count: number): string {
  return `${name} (${count})`;
}

/**
 * The three cascading dropdowns above the uploaded questions.
 *
 * The choice lives in the URL (`?subject=…&chapter=…&topic=…`) so the server
 * can filter the query instead of hiding rows in the browser, and a filtered
 * view can be bookmarked or refreshed without losing its place.
 */
export function QbFilterBar({
  tree,
  selected,
}: {
  readonly tree: QbFilterTree;
  readonly selected: QbFilterSelection;
}): ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const subject = selected.subjectId
    ? (tree.subjects.find((item) => item.id === selected.subjectId) ?? null)
    : null;
  const chapters = subject?.chapters ?? [];
  const chapter = selected.chapterId
    ? (chapters.find((item) => item.id === selected.chapterId) ?? null)
    : null;
  const topics = chapter?.topics ?? [];

  const hasFilter = Boolean(
    selected.subjectId || selected.chapterId || selected.topicId,
  );

  function apply(next: Readonly<Record<string, string>>): void {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(next)) {
      if (value === ALL) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  }

  return (
    <section
      aria-label="প্রশ্ন ফিল্টার"
      aria-busy={isPending}
      className={cn(
        "rounded-2xl border bg-card/60 p-3 transition-opacity sm:p-4",
        isPending && "opacity-60",
      )}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground sm:text-xs">
          <Filter className="size-3.5" aria-hidden="true" />
          বিষয়, অধ্যায় ও টপিক দিয়ে খুঁজুন
        </p>
        {hasFilter ? (
          <button
            type="button"
            onClick={() => apply({ subject: ALL, chapter: ALL, topic: ALL })}
            className="rounded-md px-1.5 py-0.5 text-[11px] font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            ফিল্টার মুছুন
          </button>
        ) : null}
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="px-1 text-[11px] font-bold text-muted-foreground">
            বিষয়
          </span>
          <Select
            value={selected.subjectId ?? ALL}
            onValueChange={(value) =>
              apply({
                subject: String(value ?? ALL),
                chapter: ALL,
                topic: ALL,
              })
            }
          >
            <SelectTrigger className="h-9 w-full bg-background">
              <SelectValue placeholder="সব বিষয়" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>সব বিষয়</SelectItem>
              {tree.subjects.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {optionLabel(item.name, item.count)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <span className="px-1 text-[11px] font-bold text-muted-foreground">
            অধ্যায়
          </span>
          <Select
            value={selected.chapterId ?? ALL}
            disabled={!subject}
            onValueChange={(value) =>
              apply({ chapter: String(value ?? ALL), topic: ALL })
            }
          >
            <SelectTrigger className="h-9 w-full bg-background">
              <SelectValue placeholder="সব অধ্যায়" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>সব অধ্যায়</SelectItem>
              {chapters.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {optionLabel(item.name, item.count)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <span className="px-1 text-[11px] font-bold text-muted-foreground">
            টপিক
          </span>
          <Select
            value={selected.topicId ?? ALL}
            disabled={!chapter}
            onValueChange={(value) => apply({ topic: String(value ?? ALL) })}
          >
            <SelectTrigger className="h-9 w-full bg-background">
              <SelectValue placeholder="সব টপিক" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>সব টপিক</SelectItem>
              {topics.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {optionLabel(item.name, item.count)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
