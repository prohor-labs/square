"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Bookmark, Lightbulb } from "@/components/icons";
import { UniversalQuestionCard } from "@/components/shared/UniversalQuestionCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { toggleBookmark } from "@/lib/actions/qb-bookmarks";
import type { QbQuestionRow } from "@/lib/actions/qb-library";
import { toBengaliDigits } from "@/lib/calendar-date";
import { cn } from "@/lib/utils";

/** Bangla names for the exam categories, for the occurrence list. */
const EXAM_LABELS: Record<string, string> = {
  board: "বোর্ড",
  university: "ভার্সিটি",
  engineering: "ইঞ্জিনিয়ারিং",
  medical: "মেডিকেল",
  other: "অন্যান্য",
};

/**
 * One question, on a page that may show it from several directions.
 *
 * A question that appeared in three papers is stored once and listed once here.
 * The papers it came from are folded away behind "পরীক্ষায় এসেছে" rather than
 * repeated above the question, because three badges on one question reads as
 * three questions.
 */
export function QbQuestionCard({
  question,
  index,
  bookmarked = false,
  canBookmark = false,
}: {
  readonly question: QbQuestionRow;
  readonly index: number;
  readonly bookmarked?: boolean;
  readonly canBookmark?: boolean;
}) {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(bookmarked);
  const [selectedOptionId, setSelectedOptionId] = useState<string>();

  const bookmark = useMutation({
    mutationFn: () => toggleBookmark(question.id),
    onSuccess: (result) => {
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setSaved(result.saved);
      queryClient.invalidateQueries({ queryKey: ["qb-bookmarks"] });
      toast.success(result.saved ? "সংরক্ষিত হয়েছে" : "সংরক্ষণ মুছে ফেলা হয়েছে");
    },
    onError: () => toast.error("সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।"),
  });

  // Occurrences with nothing in them say nothing, so they are dropped rather
  // than shown as a blank line.
  const occurrences = question.occurrences.filter(
    (o) => o.instituteName || o.year || o.unitName,
  );

  const headerActions = canBookmark ? (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={() => bookmark.mutate()}
      disabled={bookmark.isPending}
      aria-pressed={saved}
      aria-label={saved ? "সংরক্ষণ থেকে বাদ দিন" : "সংরক্ষণ করুন"}
      title={saved ? "সংরক্ষণ থেকে বাদ দিন" : "সংরক্ষণ করুন"}
      className={cn(
        "size-8 cursor-pointer",
        saved
          ? "text-primary hover:text-primary"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Bookmark className={cn("size-4", saved && "fill-current")} />
    </Button>
  ) : undefined;

  return (
    <article className="space-y-3 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold">
        <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground">
          প্রশ্ন {toBengaliDigits(index + 1)}
        </span>
        {question.subjectName && (
          <span className="truncate text-primary">{question.subjectName}</span>
        )}
        {question.chapterName && (
          <>
            <span className="text-muted-foreground">›</span>
            <span className="truncate text-muted-foreground">
              {question.chapterName}
            </span>
          </>
        )}
      </div>

      <UniversalQuestionCard
        question={{
          id: question.id,
          type: question.type,
          source: question.source,
          standard: "HSC",
          questionText: question.questionText,
          explanation: question.explanation,
          isFree: question.isFree,
          mcq_options: question.options.map((o) => ({
            id: o.id,
            optionText: o.text,
            isCorrect: o.isCorrect,
            orderNo: 0,
          })),
        }}
        minimal
        showCorrectAnswer={Boolean(selectedOptionId)}
        selectedOptionId={selectedOptionId}
        onSelectOption={(_questionId, optionId) =>
          setSelectedOptionId(optionId)
        }
        headerActions={headerActions}
      />

      {/* Where this question was examined. Folded away because on a topic page a
          popular question may have four or five of these. */}
      {occurrences.length > 0 && (
        <Accordion
          // One item, so the root needs no multiple/single setting — a single
          // entry toggles on its own.
          className="border-t border-border/60 pt-2"
        >
          <AccordionItem value="occurrences" className="border-0">
            <AccordionTrigger className="cursor-pointer py-1.5 text-xs font-bold text-muted-foreground hover:no-underline">
              পরীক্ষায় এসেছে ({toBengaliDigits(occurrences.length)})
            </AccordionTrigger>
            <AccordionContent className="pt-1.5">
              <ul className="space-y-1">
                {occurrences.map((occurrence, i) => (
                  <li
                    // Occurrences are rows, not identities — the same paper can
                    // hold the question twice under different units.
                    // biome-ignore lint/suspicious/noArrayIndexKey: no natural key exists
                    key={`${occurrence.instituteName}-${occurrence.year}-${occurrence.unitName}-${i}`}
                    className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground"
                  >
                    {occurrence.examType && (
                      <span className="font-bold text-foreground">
                        {EXAM_LABELS[occurrence.examType] ??
                          occurrence.examType}
                      </span>
                    )}
                    {occurrence.instituteName && (
                      <span>{occurrence.instituteName}</span>
                    )}
                    {occurrence.year && (
                      <span className="tabular-nums">{occurrence.year}</span>
                    )}
                    {occurrence.unitName && (
                      <span className="text-muted-foreground/80">
                        {occurrence.unitName}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {question.explanation && (
        <p className="flex items-start gap-1.5 border-t border-border/60 pt-2 text-xs text-muted-foreground">
          <Lightbulb className="mt-px size-3.5 shrink-0 text-primary" />
          <span className="line-clamp-2">ব্যাখ্যা উত্তর দেখার পর পড়ুন।</span>
        </p>
      )}
    </article>
  );
}
