"use client";

import { useMemo, useState } from "react";
import { Lightbulb, Search, TaskSquare, TickCircle } from "@/components/icons";
import { UniversalQuestionCard } from "@/components/shared/UniversalQuestionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Question, Topic } from "@/types";

interface ChapterQuestionsViewerProps {
  readonly topics: Topic[];
  readonly questions: Question[];

  readonly isYearBased?: boolean;
}

const ITEMS_PER_PAGE = 10;

type CategoryFilter = "all" | "hsc" | "varsity" | "engineering" | "medical";

/** Free is a highlight flag only — every question is readable. */
function isFreeQuestion(q: Question): boolean {
  return Boolean(q.isFree || (q as { is_free?: boolean }).is_free);
}
export function ChapterQuestionsViewer({
  topics = [],
  questions = [],

  isYearBased = false,
}: ChapterQuestionsViewerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>("all");
  const [showAnswers, setShowAnswers] = useState(true);
  const [showExplanations, setShowExplanations] = useState(false);

  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [revealedSolutions, setRevealedSolutions] = useState<
    Record<string, boolean>
  >({});
  const [currentPage, setCurrentPage] = useState(1);

  // Counts
  const totalQuestionsCount = questions.length;
  const mcqCount = useMemo(
    () => questions.filter((q) => q.type === "mcq").length,
    [questions],
  );
  const cqCount = useMemo(
    () => questions.filter((q) => q.type === "cq").length,
    [questions],
  );

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Type filter
      if (selectedType && q.type !== selectedType) return false;

      // Topic filter
      if (selectedTopicId) {
        if (selectedTopicId === "unassigned") {
          if (q.topic_id || (q as any).topicId) return false;
        } else {
          if ((q.topic_id || (q as any).topicId) !== selectedTopicId)
            return false;
        }
      }

      // Category filter
      if (selectedCategory !== "all") {
        const std = (q.standard || "").toLowerCase();
        const src = (q.source || "").toLowerCase();

        if (selectedCategory === "hsc") {
          const isHsc =
            std.includes("hsc") ||
            src.includes("বোর্ড") ||
            src.includes("board") ||
            src.includes("ঢাকা") ||
            src.includes("রাজশাহী") ||
            src.includes("চট্টগ্রাম");
          if (!isHsc) return false;
        } else if (selectedCategory === "varsity") {
          const isVarsity =
            std.includes("varsity") ||
            src.includes("ভার্সিটি") ||
            src.includes("ঢাবি") ||
            src.includes("রাবি") ||
            src.includes("জাবি") ||
            src.includes("গুচ্ছ");
          if (!isVarsity) return false;
        } else if (selectedCategory === "engineering") {
          const isEng =
            std.includes("engineering") ||
            src.includes("বুয়েট") ||
            src.includes("buet") ||
            src.includes("কুয়েট") ||
            src.includes("রুয়েট") ||
            src.includes("চুয়েট") ||
            src.includes("ckruet");
          if (!isEng) return false;
        } else if (selectedCategory === "medical") {
          const isMed =
            std.includes("medical") ||
            src.includes("মেডিকেল") ||
            src.includes("dental");
          if (!isMed) return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const qText = (q.question_text || q.questionText || "").toLowerCase();
        const qSource = (q.source || "").toLowerCase();
        const qExp = (q.explanation || "").toLowerCase();
        if (
          !qText.includes(query) &&
          !qSource.includes(query) &&
          !qExp.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [questions, selectedType, selectedTopicId, selectedCategory, searchQuery]);

  // Performance stats for practice mode
  const practiceStats = useMemo(() => {
    let answeredCount = 0;
    let correctCount = 0;
    let wrongCount = 0;

    for (const q of questions) {
      if (q.type !== "mcq") continue;
      const selectedOptId = userAnswers[q.id];
      if (!selectedOptId) continue;

      answeredCount++;
      const options = q.mcq_options || q.mcqOptions || [];
      const chosen = options.find((o) => o.id === selectedOptId);
      const isCorrect = chosen?.is_correct ?? chosen?.isCorrect;
      if (isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }
    }

    const accuracy =
      answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
    return { answeredCount, correctCount, wrongCount, accuracy };
  }, [questions, userAnswers]);

  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE);
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedQuestions = filteredQuestions.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (userAnswers[questionId]) return;
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const toggleSolution = (questionId: string) => {
    setRevealedSolutions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleResetPractice = () => {
    setUserAnswers({});
    setRevealedSolutions({});
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = (): (number | { key: string })[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safeCurrentPage <= 3) {
      return [1, 2, 3, 4, { key: "ellipsis-end" }, totalPages];
    }
    if (safeCurrentPage >= totalPages - 2) {
      return [
        1,
        { key: "ellipsis-start" },
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [
      1,
      { key: "ellipsis-start" },
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      { key: "ellipsis-end" },
      totalPages,
    ];
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Interactive Toolbar */}
      <div className="flex flex-col gap-3.5 bg-card/70 backdrop-blur-sm p-4 sm:p-5 rounded-3xl border border-border/80 shadow-2xs">
        {/* Row 1: Search & Answer/Explanation Controls */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="প্রশ্নের মূলভাব, সূত্র বা বোর্ড দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 h-10 text-xs sm:text-sm rounded-2xl bg-background border-border/70"
            />
          </div>

          {/* Answer & Explanation View Controls (AAP Style) */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Answer Toggle */}
            <div className="flex items-center p-1 rounded-2xl bg-muted/50 border border-border/60">
              <button
                type="button"
                onClick={() => setShowAnswers(true)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  showAnswers
                    ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <TickCircle className="size-3.5" />
                <span>উত্তর সহ</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAnswers(false)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  !showAnswers
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span>উত্তর ছাড়া</span>
              </button>
            </div>

            {/* Explanation Toggle */}
            <div className="flex items-center p-1 rounded-2xl bg-muted/50 border border-border/60">
              <button
                type="button"
                onClick={() => setShowExplanations(true)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  showExplanations
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Lightbulb className="size-3.5" />
                <span>ব্যাখ্যা সহ</span>
              </button>
              <button
                type="button"
                onClick={() => setShowExplanations(false)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  !showExplanations
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span>ব্যাখ্যা ছাড়া</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Type Tabs & Topic Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-border/40">
          {/* Type Tabs */}
          <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => {
                setSelectedType(null);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                selectedType === null
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              সব প্রশ্ন ({totalQuestionsCount})
            </button>
            {mcqCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedType("mcq");
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  selectedType === "mcq"
                    ? "bg-background text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                MCQ ({mcqCount})
              </button>
            )}
            {cqCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedType("cq");
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  selectedType === "cq"
                    ? "bg-background text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                CQ ({cqCount})
              </button>
            )}
          </div>

          {/* Topic filter if available */}
          {topics.length > 0 && (
            <div className="w-full sm:w-[220px]">
              <Select
                value={selectedTopicId ?? "all"}
                onValueChange={(val) => {
                  setSelectedTopicId(val === "all" ? null : val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 rounded-2xl bg-background border-border/70 text-xs font-semibold">
                  <SelectValue placeholder="টপিক নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectGroup>
                    <SelectItem value="all">
                      সকল টপিক ({totalQuestionsCount})
                    </SelectItem>
                    {topics.map((topic) => {
                      const count = questions.filter(
                        (q) => (q.topic_id || (q as any).topicId) === topic.id,
                      ).length;
                      return (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.name} {count > 0 ? `(${count})` : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Row 3: Category Filter Pills (Only for Chapter/Subject-based view, hidden in Year-based/Chorcha style view) */}
        {!isYearBased && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-xs font-bold text-muted-foreground mr-1">
              ক্যাটাগরি:
            </span>
            {[
              { id: "all", label: "সব ক্যাটাগরি" },
              { id: "hsc", label: "HSC বোর্ড" },
              { id: "varsity", label: "ভার্সিটি" },
              { id: "engineering", label: "ইঞ্জিনিয়ারিং" },
              { id: "medical", label: "মেডিকেল" },
            ].map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id as CategoryFilter);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                      : "bg-background text-muted-foreground border-border/70 hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Practice Progress Bar (if in practice mode without answers and questions answered) */}
      {!showAnswers && practiceStats.answeredCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-3 text-xs sm:text-sm font-bold flex-wrap">
            <span className="flex items-center gap-1 text-foreground">
              <TaskSquare className="size-4 text-primary" />
              উত্তর সম্পন্ন: {practiceStats.answeredCount} টি
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-emerald-600">
              সঠিক: {practiceStats.correctCount}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-destructive">
              ভুল: {practiceStats.wrongCount}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-primary">
              সঠিকতার হার: {practiceStats.accuracy}%
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetPractice}
            className="text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5 h-8 rounded-xl cursor-pointer"
          >
            <svg
              className="size-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            পুনরায় অনুশীলন
          </Button>
        </div>
      )}

      {/* Questions list */}
      <div className="flex flex-col gap-4">
        {filteredQuestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-card border border-dashed border-border rounded-3xl space-y-3">
            <p className="text-base font-bold text-foreground">
              এই ফিল্টারে কোনো প্রশ্ন পাওয়া যায়নি
            </p>
            <p className="text-xs text-muted-foreground max-w-md">
              অনুগ্রহ করে অন্য কোনো ক্যাটাগরি, টপিক বা সার্চ কিওয়ার্ড নির্বাচন করে দেখুন।
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedType(null);
                setSelectedTopicId(null);
                setSelectedCategory("all");
              }}
              className="rounded-xl text-xs font-bold mt-2 cursor-pointer"
            >
              সকল ফিল্টার রিসেট করুন
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>
                মোট {filteredQuestions.length} টি প্রশ্নের মধ্যে দেখানো হচ্ছে
              </span>
              {totalPages > 1 && (
                <span>
                  পৃষ্ঠা {safeCurrentPage} / {totalPages}
                </span>
              )}
            </div>

            {paginatedQuestions.map((q: Question, idx: number) => (
              <UniversalQuestionCard
                key={q.id}
                question={q}
                questionIndex={startIndex + idx}
                selectedOptionId={userAnswers[q.id]}
                isSolutionOpen={
                  showExplanations || Boolean(revealedSolutions[q.id])
                }
                showCorrectAnswer={showAnswers ? true : undefined}
                onSelectOption={handleSelectOption}
                onToggleSolution={toggleSolution}
                badgeText={
                  isFreeQuestion(q)
                    ? `\u09ab\u09cd\u09b0\u09bf \u09aa\u09cd\u09b0\u09cd\u09af\u09be\u0995\u09cd\u09a4\u09bf\u09b8 \u2022 \u09aa\u09cd\u09b0\u09b6\u09cd\u09a8 ${startIndex + idx + 1}`
                    : undefined
                }
              />
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        text="পূর্ববর্তী"
                        onClick={(e) => {
                          e.preventDefault();
                          if (safeCurrentPage > 1) {
                            handlePageChange(safeCurrentPage - 1);
                          }
                        }}
                        className={
                          safeCurrentPage <= 1
                            ? "pointer-events-none opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {getPageNumbers().map((item) => {
                      if (typeof item === "object") {
                        return (
                          <PaginationItem key={item.key}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }

                      const page = item;
                      const isActive = page === safeCurrentPage;

                      return (
                        <PaginationItem key={`page-${page}`}>
                          <PaginationLink
                            isActive={isActive}
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(page);
                            }}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        text="পরবর্তী"
                        onClick={(e) => {
                          e.preventDefault();
                          if (safeCurrentPage < totalPages) {
                            handlePageChange(safeCurrentPage + 1);
                          }
                        }}
                        className={
                          safeCurrentPage >= totalPages
                            ? "pointer-events-none opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
