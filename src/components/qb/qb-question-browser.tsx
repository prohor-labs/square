"use client";

import { type ReactElement, useEffect, useMemo, useState } from "react";
import { QbFilterBar } from "@/components/qb/qb-filter-bar";
import { QbUploadList } from "@/components/qb/qb-upload-list";
import type {
  QbFilterSelection,
  QbFilterTree,
  QbUploadedQuestion,
} from "@/lib/actions/qb-uploads";

export interface QbQuestionBrowserProps {
  readonly questions: readonly QbUploadedQuestion[];
  readonly filterTree: QbFilterTree;
  readonly selected: QbFilterSelection;
  readonly allTotal: number;
  /** Matching count from the server. Client filtering recalculates it. */
  readonly total: number;
  readonly clientFilter: boolean;
}

/**
 * The filter bar + question list.
 *
 * For a small bank every card is rendered once and filtering only toggles the
 * `hidden` flag, so changing subject/chapter/topic is instant. For a large
 * bank the page falls back to server-side filtering so the browser does not
 * have to keep every unfiltered card mounted.
 */
export function QbQuestionBrowser({
  questions,
  filterTree,
  selected,
  allTotal,
  total,
  clientFilter,
}: QbQuestionBrowserProps): ReactElement {
  const [localSelected, setLocalSelected] =
    useState<QbFilterSelection>(selected);

  // The URL is the source of truth after a refresh or an edit.
  useEffect(() => {
    if (!clientFilter) return;
    setLocalSelected(selected);
  }, [clientFilter, selected]);

  const activeSelected = clientFilter ? localSelected : selected;

  const visibleIds = useMemo(() => {
    if (!clientFilter) return null;

    const ids = new Set<string>();
    for (const question of questions) {
      if (
        (!localSelected.subjectId ||
          question.subjectId === localSelected.subjectId) &&
        (!localSelected.chapterId ||
          question.chapterId === localSelected.chapterId) &&
        (!localSelected.topicId || question.topicId === localSelected.topicId)
      ) {
        ids.add(question.id);
      }
    }
    return ids;
  }, [clientFilter, localSelected, questions]);

  const displayTotal = clientFilter ? (visibleIds?.size ?? 0) : total;
  const hasVisible = displayTotal > 0;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-extrabold sm:text-base">আপলোড করা প্রশ্ন</h2>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-bold">
          {displayTotal === allTotal
            ? `মোট ${displayTotal} টি`
            : `${displayTotal} / ${allTotal} টি`}
        </span>
      </div>

      <QbFilterBar
        tree={filterTree}
        selected={activeSelected}
        onSelectionChange={clientFilter ? setLocalSelected : undefined}
      />

      {!hasVisible ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center">
          {allTotal > 0 ? (
            <>
              <p className="text-sm font-bold">এই ফিল্টারে কোনো প্রশ্ন নেই</p>
              <p className="mt-1 text-xs text-muted-foreground">
                বিষয়, অধ্যায় বা টপিক বদলে আবার দেখুন।
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold">এখনো কোনো প্রশ্ন আপলোড হয়নি</p>
              <p className="mt-1 text-xs text-muted-foreground">
                প্রশ্ন আপলোড ট্যাব থেকে একটি CSV ফাইল আপলোড করুন।
              </p>
            </>
          )}
        </div>
      ) : null}

      {questions.length > 0 ? (
        <QbUploadList
          questions={questions}
          visibleIds={visibleIds ?? undefined}
        />
      ) : null}

      {!clientFilter && total > questions.length ? (
        <p className="pt-1 text-center text-[11px] text-muted-foreground">
          মোট {total} টির মধ্যে সর্বশেষ {questions.length} টি দেখানো হচ্ছে।
        </p>
      ) : null}
    </section>
  );
}
