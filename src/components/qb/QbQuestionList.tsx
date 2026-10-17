"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Filter } from "@/components/icons";
import { type QbFilterDef, QbFilterPanel } from "@/components/qb/QbFilterPanel";
import { QbQuestionCard } from "@/components/qb/QbQuestionCard";
import { QbPagination, QbSourceTabs } from "@/components/qb/QbSourceTabs";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import type { QbQuestionRow } from "@/lib/actions/qb-library";
import { toBengaliDigits } from "@/lib/calendar-date";

export const QB_PAGE_SIZE = 20;

/**
 * The list page: filters on one side, questions on the other.
 *
 * On a phone the rail would eat the whole screen, so it moves into a drawer
 * behind a button instead of being dropped — a filter a student cannot reach is
 * worse than no filter.
 */
export function QbQuestionList({
  questions,
  total,
  page,
  filters,
  scope,
  sourceTabs = false,
  examTypes = [],
  bookmarkedIds = [],
  canBookmark = false,
  emptyMessage,
  searchActive = false,
}: {
  readonly questions: readonly QbQuestionRow[];
  readonly total: number;
  readonly page: number;
  readonly filters: readonly QbFilterDef[];
  readonly scope?: string;
  readonly sourceTabs?: boolean;
  readonly examTypes?: readonly string[];
  readonly bookmarkedIds?: readonly string[];
  readonly canBookmark?: boolean;
  readonly emptyMessage?: string;
  readonly searchActive?: boolean;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const params = useSearchParams();
  const saved = new Set(bookmarkedIds);

  const rail = (
    <QbFilterPanel
      filters={filters}
      scope={scope}
      onApply={() => setDrawerOpen(false)}
    />
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
      {/* Rail — desktop only; the drawer below is the phone's copy. */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-xl border border-border bg-card p-4">
          {rail}
        </div>
      </aside>

      <div className="min-w-0 space-y-4">
        {sourceTabs && <QbSourceTabs available={examTypes} />}

        {/* Rail — phone. */}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger
            render={
              <Button
                variant="outline"
                className="w-full cursor-pointer lg:hidden"
              >
                <Filter className="size-4" />
                ফিল্টার
                {params.get("q") ? " ও খুঁজবা" : ""}
              </Button>
            }
          />
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>ফিল্টার</DrawerTitle>
            </DrawerHeader>
            <div className="max-h-[70vh] overflow-y-auto px-6 pb-6">{rail}</div>
          </DrawerContent>
        </Drawer>

        {questions.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-14 text-center">
            <p className="text-sm font-bold text-foreground">
              {searchActive ? "কিছু পাওয়া যায়নি" : "এই ফিল্টারে প্রশ্ন নেই"}
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-xs text-muted-foreground">
              {emptyMessage ?? "ফিল্টার একটু কমিয়ে দেখুন, অথবা অন্য কোনো বিষয়ে খুঁজুন।"}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {toBengaliDigits(total)} টি প্রশ্নের মধ্যে{" "}
              {toBengaliDigits(questions.length)} টি দেখানো হচ্ছে
            </p>

            <div className="space-y-3">
              {questions.map((question, index) => (
                <QbQuestionCard
                  key={question.id}
                  question={question}
                  index={index + (page - 1) * QB_PAGE_SIZE}
                  bookmarked={saved.has(question.id)}
                  canBookmark={canBookmark}
                />
              ))}
            </div>

            <QbPagination page={page} total={total} pageSize={QB_PAGE_SIZE} />
          </>
        )}
      </div>
    </div>
  );
}

/** Shown while a page of questions is on its way. */
export function QbQuestionListSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <div className="hidden lg:block">
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: placeholders have no identity
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
