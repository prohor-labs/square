"use client";

import { type ReactElement, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { Lightbulb } from "@/components/icons";
import { markdownComponents, sanitizeQuestionContent } from "@/lib/question-content";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CQPart, MCQOption, Question } from "@/types";

const OPTION_KEYS = ["ক", "খ", "গ", "ঘ", "ঙ"];

export interface UniversalQuestionCardProps {
  readonly question: Question;
  readonly questionIndex?: number;
  readonly selectedOptionId?: string;
  readonly isSolutionOpen?: boolean;
  readonly showCorrectAnswer?: boolean;
  readonly disableOptionChange?: boolean;
  readonly minimal?: boolean;
  readonly onSelectOption?: (questionId: string, optionId: string) => void;
  readonly onToggleSolution?: (questionId: string) => void;
  readonly hideHeaderBadge?: boolean;
  readonly hideExplanation?: boolean;
  readonly hideControls?: boolean;
  readonly badgeText?: string;
  readonly headerActions?: React.ReactNode;
  readonly footerActions?: React.ReactNode;
  readonly children?: React.ReactNode;
}

export function UniversalQuestionCard({
  question,
  questionIndex,
  selectedOptionId,
  isSolutionOpen = false,
  showCorrectAnswer,
  disableOptionChange = false,
  minimal = false,
  onSelectOption,
  onToggleSolution,
  hideHeaderBadge = false,
  hideExplanation = false,
  hideControls = false,
  badgeText,
  headerActions,
  footerActions,
  children,
}: UniversalQuestionCardProps): ReactElement {
  // If showCorrectAnswer is not explicitly provided, infer: show evaluation if selectedOptionId is provided AND option has is_correct info
  const hasEvaluationInfo = Boolean(
    (question.mcq_options || question.mcqOptions)?.some(
      (o: MCQOption) => o.is_correct !== undefined || o.isCorrect !== undefined,
    ),
  );
  const shouldEvaluate =
    showCorrectAnswer ?? (Boolean(selectedOptionId) && hasEvaluationInfo);

  const [internalSolutionOpen, setInternalSolutionOpen] = useState(false);
  const resolvedSolutionOpen = onToggleSolution
    ? isSolutionOpen
    : (isSolutionOpen || internalSolutionOpen);

  const handleToggle = () => {
    if (onToggleSolution) {
      onToggleSolution(question.id);
    } else {
      setInternalSolutionOpen((prev) => !prev);
    }
  };

  const isAnswered = Boolean(selectedOptionId);
  const questionText = question.question_text || question.questionText || "";
  const type = question.type;

  return (
    <div
      className={cn(
        "bg-card border border-border/70 rounded-xl sm:rounded-3xl p-3 sm:p-6 transition-all duration-200",
        "shadow-xs hover:border-border",
      )}
    >
      {/* Header: Index, Badges, and Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 mb-2.5 sm:mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {badgeText ? (
            <span className="text-xs sm:text-sm font-bold text-foreground/80">
              {badgeText}
            </span>
          ) : (
            questionIndex !== undefined && (
              <span className="text-xs sm:text-sm font-bold text-foreground/80">
                প্রশ্ন {questionIndex + 1}
              </span>
            )
          )}
          {!minimal && (
            <>
              <span className="text-[11px] sm:text-xs uppercase font-bold text-primary">
                {type}
              </span>
              {!hideHeaderBadge &&
                question.source &&
                !["csv import", "exam import", "custom", "null", "undefined"].includes(
                  question.source.trim().toLowerCase(),
                ) && (
                  <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">
                    • {question.source}
                  </span>
                )}
              {question.standard && (
                <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">
                  • {question.standard}
                </span>
              )}
              {(question.isFree || question.is_free) && (
                <span className="text-[10px] sm:text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                  উন্মুক্ত
                </span>
              )}
            </>
          )}
        </div>
        {headerActions && (
          <div className="flex items-center gap-2">{headerActions}</div>
        )}
      </div>

      {/* Question Text / Stem */}
      <div className="text-[13.5px] sm:text-base font-medium text-foreground leading-relaxed mb-3.5 sm:mb-5 [&_p]:m-0">
        <ReactMarkdown
          remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
          rehypePlugins={[rehypeRaw, rehypeKatex]}
          components={markdownComponents}
        >
          {sanitizeQuestionContent(questionText)}
        </ReactMarkdown>
      </div>

      {/* MCQ Options */}
      {type === "mcq" && (question.mcq_options || question.mcqOptions) && (
        <div className="flex flex-col gap-2 sm:gap-2.5 w-full">
          {[...((question.mcq_options || question.mcqOptions) ?? [])]
            .sort(
              (a: MCQOption, b: MCQOption) =>
                (a.order_no ?? a.orderNo ?? 0) - (b.order_no ?? b.orderNo ?? 0),
            )
            .map((opt: MCQOption, idx: number) => {
              const isSelected = selectedOptionId === opt.id;
              const isCorrect = opt.is_correct ?? opt.isCorrect ?? false;
              const optText = opt.option_text || opt.optionText || "";

              // Live Exam Mode (no answer evaluation, lock after single selection)
              if (!shouldEvaluate) {
                return (
                  <button
                    type="button"
                    key={opt.id}
                    disabled={isAnswered || disableOptionChange}
                    onClick={() => onSelectOption?.(question.id, opt.id)}
                    className={cn(
                      "p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-[13px] sm:text-sm flex items-center gap-2.5 sm:gap-3 border text-left w-full transition-all",
                      isSelected
                        ? "bg-primary/10 border-primary text-primary font-semibold ring-1 ring-primary shadow-xs cursor-default"
                        : isAnswered
                          ? "bg-muted/20 text-muted-foreground/60 border-border/30 opacity-60 cursor-not-allowed"
                          : "bg-muted/30 hover:bg-muted/70 hover:border-primary/40 text-foreground border-border/50 cursor-pointer active:scale-[0.99]",
                    )}
                  >
                    <span
                      className={cn(
                        "size-6 sm:size-7 rounded-full flex items-center justify-center font-bold text-[11px] sm:text-xs shrink-0 border transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : isAnswered
                            ? "bg-muted/50 text-muted-foreground/60 border-border/40"
                            : "bg-background text-foreground border-border",
                      )}
                    >
                      {OPTION_KEYS[idx] || idx + 1}
                    </span>
                    <div className="flex-1 [&_p]:m-0 font-medium">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
                        rehypePlugins={[rehypeRaw, rehypeKatex]}
                        components={markdownComponents}
                      >
                        {sanitizeQuestionContent(optText)}
                      </ReactMarkdown>
                    </div>
                  </button>
                );
              }

              // Evaluated Mode (shows correct/incorrect)
              const isRevealedCorrect =
                (showCorrectAnswer || isAnswered) && isCorrect;
              const isRevealedWrong = isAnswered && isSelected && !isCorrect;
              const isRevealedInactive =
                (showCorrectAnswer || isAnswered) && !isCorrect && !isSelected;

              return (
                <button
                  type="button"
                  key={opt.id}
                  disabled={
                    showCorrectAnswer || isAnswered || disableOptionChange
                  }
                  onClick={() => onSelectOption?.(question.id, opt.id)}
                  className={cn(
                    "p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-[13px] sm:text-sm flex items-center gap-2.5 sm:gap-3 border text-left w-full transition-all active:scale-[0.99]",
                    !showCorrectAnswer &&
                      !isAnswered &&
                      "bg-muted/30 hover:bg-muted/70 hover:border-primary/40 text-foreground border-border/50 cursor-pointer",
                    isRevealedCorrect &&
                      "bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs",
                    isRevealedWrong &&
                      "bg-destructive/15 border-destructive/50 text-destructive font-semibold",
                    isRevealedInactive &&
                      "bg-muted/20 text-muted-foreground border-border/30 opacity-70",
                  )}
                >
                  <span
                    className={cn(
                      "size-6 sm:size-7 rounded-full flex items-center justify-center font-bold text-[11px] sm:text-xs shrink-0 border transition-colors",
                      !showCorrectAnswer &&
                        !isAnswered &&
                        "bg-background text-foreground border-border",
                      isRevealedCorrect &&
                        "bg-emerald-500 text-white border-emerald-500",
                      isRevealedWrong &&
                        "bg-destructive text-white border-destructive",
                      isRevealedInactive &&
                        "bg-muted text-muted-foreground border-border/40",
                    )}
                  >
                    {OPTION_KEYS[idx] || idx + 1}
                  </span>
                  <div className="flex-1 [&_p]:m-0 font-medium">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
                      rehypePlugins={[rehypeRaw, rehypeKatex]}
                      components={markdownComponents}
                    >
                      {sanitizeQuestionContent(optText)}
                    </ReactMarkdown>
                  </div>
                </button>
              );
            })}
        </div>
      )}

      {children}

      {/* CQ Parts */}
      {type === "cq" && (question.cq_parts || question.cqParts) && (
        <Accordion
          multiple
          defaultValue={
            showCorrectAnswer || isSolutionOpen
              ? ((question.cq_parts || question.cqParts) ?? []).map(
                  (p: CQPart) => p.id,
                )
              : undefined
          }
          key={`${question.id}-${Boolean(showCorrectAnswer)}-${Boolean(isSolutionOpen)}`}
          className="w-full flex flex-col gap-2 sm:gap-2.5 mt-3"
        >
          {[...((question.cq_parts || question.cqParts) ?? [])]
            .sort(
              (a: CQPart, b: CQPart) =>
                (a.order_no ?? a.orderNo ?? 0) - (b.order_no ?? b.orderNo ?? 0),
            )
            .map((part: CQPart) => {
              const pText = part.question_text || part.questionText || "";
              const aText = part.answer_text || part.answerText || "";
              const pKey = part.part_key || part.partKey || "a";

              return (
                <AccordionItem
                  key={part.id}
                  value={part.id}
                  className="bg-muted/20 rounded-xl sm:rounded-2xl border border-border/30 px-3 sm:px-4 py-1"
                >
                  <AccordionTrigger className="py-2.5 sm:py-3 hover:no-underline flex items-start gap-2.5 sm:gap-3 text-left">
                    <span className="font-bold text-primary text-xs sm:text-sm flex-shrink-0 mt-0.5">
                      ({pKey})
                    </span>
                    <div className="text-[13px] sm:text-sm md:text-base flex-1 [&_p]:m-0 font-normal">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
                        rehypePlugins={[rehypeRaw, rehypeKatex]}
                        components={markdownComponents}
                      >
                        {sanitizeQuestionContent(pText)}
                      </ReactMarkdown>
                    </div>
                  </AccordionTrigger>

                  {aText && (
                    <AccordionContent className="pt-1 pb-3 text-xs sm:text-sm text-foreground/90 [&_p]:m-0">
                      <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
                          rehypePlugins={[rehypeRaw, rehypeKatex]}
                          components={markdownComponents}
                        >
                          {sanitizeQuestionContent(aText)}
                        </ReactMarkdown>
                      </div>
                    </AccordionContent>
                  )}
                </AccordionItem>
              );
            })}
        </Accordion>
      )}

      {/* Explanation / Solution / Footer */}
      {!hideControls && (question.explanation || footerActions) && (
        <div className="mt-3 pt-2.5 border-t border-dashed border-border/40 flex flex-wrap items-center justify-between gap-2">
          {!hideExplanation && question.explanation ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              className="text-[11px] sm:text-xs font-bold text-primary hover:text-primary hover:bg-primary/10 rounded-lg gap-1.5 h-7 sm:h-8 px-2 sm:px-2.5"
            >
              <Lightbulb className="size-3 sm:size-3.5" />
              {resolvedSolutionOpen ? "ব্যাখ্যা লুকান" : "ব্যাখ্যা / সমাধান দেখুন"}
            </Button>
          ) : (
            <div />
          )}

          {footerActions && (
            <div className="flex items-center gap-2">{footerActions}</div>
          )}
        </div>
      )}

      {!hideExplanation && question.explanation && resolvedSolutionOpen && (
        <div className="mt-2.5 p-3 sm:p-4 bg-primary/5 rounded-xl sm:rounded-2xl border border-primary/10 animate-in fade-in slide-in-from-top-2">
          <p className="text-[10px] sm:text-xs font-bold text-primary uppercase mb-1">
            ব্যাখ্যা / সমাধান
          </p>
          <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed [&_p]:m-0">
            <ReactMarkdown
              remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
              rehypePlugins={[rehypeRaw, rehypeKatex]}
              components={markdownComponents}
            >
              {sanitizeQuestionContent(question.explanation)}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
