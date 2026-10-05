"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EditQuestionForm } from "@/components/admin/forms/edit-question-form";
import { ImportQuestionsForm } from "@/components/admin/forms/import-questions-form";
import { NewQuestionForm } from "@/components/admin/forms/new-question-form";
import {
  ArrowRight2,
  Edit,
  FileDown,
  Search,
  TaskSquare,
  Trash2,
} from "@/components/icons";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useAdminQuestions, useDeleteQuestion } from "@/hooks/use-admin-qb";
import type { Question } from "@/types";

interface AdminQuestionsManagerProps {
  readonly qbSlug: string;
  readonly subjectSlug: string;
  readonly subjectId: string;
  readonly chapterId: string;
  readonly chapterSlug: string;
  readonly chapterName?: string;
  readonly topicId?: string;
  readonly topicName?: string;
  readonly topics?: readonly { id: string; name: string; slug: string }[];
  readonly hideBreadcrumbs?: boolean;
}

const ITEMS_PER_PAGE = 10;

export function AdminQuestionsManager({
  qbSlug,
  subjectSlug,
  subjectId,
  chapterId,
  chapterSlug,
  chapterName,
  topicId,
  topicName,
  topics = [],
  hideBreadcrumbs = false,
}: AdminQuestionsManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [revealedSolutions, setRevealedSolutions] = useState<
    Record<string, boolean>
  >({});
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});

  const [selectedTopic, setSelectedTopic] = useState<string | null>(
    topicId || null,
  );
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: questions, isLoading } = useAdminQuestions({
    chapterId,
    topicId: selectedTopic || undefined,
    type: selectedType || undefined,
  });
  const deleteMutation = useDeleteQuestion();

  const filteredQuestions = useMemo(() => {
    if (!questions) return [];
    if (!searchQuery.trim()) return questions;
    const q = searchQuery.toLowerCase().trim();
    return questions.filter((item) => {
      const text = (
        item.questionText ||
        (item as any).question_text ||
        ""
      ).toLowerCase();
      const source = (item.source || "").toLowerCase();
      return text.includes(q) || source.includes(q);
    });
  }, [questions, searchQuery]);

  const totalQuestions = filteredQuestions.length;
  const totalPages = Math.ceil(totalQuestions / ITEMS_PER_PAGE);

  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedQuestions = filteredQuestions.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const handleSelectOption = (questionId: string, optionId: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const toggleSolution = (questionId: string) => {
    setRevealedSolutions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleDeleteQuestion = async (qId: string) => {
    try {
      await deleteMutation.mutateAsync(qId);
      toast.success("প্রশ্নটি সফলভাবে ডিলিট করা হয়েছে");
    } catch (err: any) {
      toast.error(err.message || "প্রশ্ন ডিলিট করতে সমস্যা হয়েছে");
    }
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

  const displayName = topicName || chapterName || "প্রশ্ন তালিকা";

  return (
    <div className="flex flex-col gap-5 w-full">
      {!hideBreadcrumbs && (
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground flex-wrap">
          <Link
            href="/admin/qb"
            className="hover:text-foreground transition-colors"
          >
            প্রশ্নব্যাংকসমূহ
          </Link>
          <ArrowRight2 className="size-3" />
          <Link
            href={`/admin/qb/${qbSlug}`}
            className="hover:text-foreground transition-colors"
          >
            প্রশ্নব্যাংক
          </Link>
          <ArrowRight2 className="size-3" />
          <Link
            href={`/admin/qb/${qbSlug}/${subjectSlug}`}
            className="hover:text-foreground transition-colors"
          >
            ইউনিট
          </Link>
          <ArrowRight2 className="size-3" />
          <Link
            href={`/admin/qb/${qbSlug}/${subjectSlug}/${chapterSlug}`}
            className="hover:text-foreground transition-colors"
          >
            {chapterName || "সাল"}
          </Link>
          {topicName && (
            <>
              <ArrowRight2 className="size-3" />
              <span className="text-foreground font-semibold">{topicName}</span>
            </>
          )}
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            {displayName} - প্রশ্ন ব্যবস্থাপনা
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            প্রশ্ন দেখুন, নতুন MCQ/CQ প্রশ্ন যোগ করুন, সংশোধন করুন বা ডিলিট করুন।
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setIsImportOpen(true)}
            className="rounded-xl gap-1.5 font-bold text-xs h-9"
          >
            <FileDown className="size-3.5 text-primary" />
            <span>JSON থেকে ইমপোর্ট</span>
          </Button>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-xl gap-1.5 font-bold text-xs h-9 cursor-pointer"
          >
            + নতুন প্রশ্ন যোগ করুন
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-card p-3 rounded-2xl border border-border/70">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="প্রশ্নের বিবরণ বা উৎস দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 h-9 text-xs rounded-xl bg-background"
          />
        </div>

        {/* Topic filter (if chapter has topics and not viewing a fixed single topic) */}
        {!topicId && topics.length > 0 && (
          <div className="w-full sm:w-[200px]">
            <Select
              value={selectedTopic || "all"}
              onValueChange={(val) => {
                setSelectedTopic(val === "all" ? null : val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
                <SelectValue placeholder="সকল টপিক" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সকল টপিক</SelectItem>
                {topics.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
                <SelectItem value="unassigned">টপিক ছাড়া প্রশ্ন</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Type toggle */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => {
              setSelectedType(null);
              setCurrentPage(1);
            }}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              selectedType === null
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            সকল
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedType("mcq");
              setCurrentPage(1);
            }}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              selectedType === "mcq"
                ? "bg-background text-primary shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            MCQ
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedType("cq");
              setCurrentPage(1);
            }}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              selectedType === "cq"
                ? "bg-background text-primary shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            CQ
          </button>
        </div>
      </div>

      {/* Questions list */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
            <TaskSquare className="size-4 text-primary" /> মোট প্রশ্ন (
            {totalQuestions})
          </h3>
          {totalPages > 1 && (
            <span className="text-xs font-medium text-muted-foreground">
              পৃষ্ঠা {safeCurrentPage} / {totalPages}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground bg-card border rounded-2xl">
            <Spinner className="size-6 text-primary" />
            <span className="text-xs">প্রশ্ন লোড হচ্ছে...</span>
          </div>
        ) : totalQuestions === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-card border border-dashed rounded-2xl">
            <p className="text-sm font-semibold">কোনো প্রশ্ন পাওয়া যায়নি।</p>
            <p className="text-xs mt-1 text-muted-foreground/80">
              উপরের &quot;+ নতুন প্রশ্ন যোগ করুন&quot; বাটনে ক্লিক করে প্রশ্ন যুক্ত করতে
              পারেন।
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedQuestions.map((q: Question, idx: number) => (
                <UniversalQuestionCard
                  key={q.id}
                  question={q}
                  questionIndex={startIndex + idx}
                  selectedOptionId={userAnswers[q.id]}
                  isSolutionOpen={Boolean(revealedSolutions[q.id])}
                  onSelectOption={handleSelectOption}
                  onToggleSolution={toggleSolution}
                  footerActions={
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingQuestion(q)}
                        className="text-primary hover:bg-primary/10 gap-1.5 rounded-xl text-xs cursor-pointer"
                      >
                        <Edit className="size-3.5" />
                        <span>এডিট</span>
                      </Button>
                      <DeleteConfirmDialog
                        title="প্রশ্ন ডিলিট নিশ্চিতকরণ"
                        description="আপনি কি নিশ্চিতভাবে এই প্রশ্নটি ডিলিট করতে চান? এই কাজটি আর ফিরিয়ে আনা সম্ভব নয়।"
                        onConfirm={() => handleDeleteQuestion(q.id)}
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 gap-1.5 rounded-xl text-xs cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                            <span>ডিলিট</span>
                          </Button>
                        }
                      />
                    </div>
                  }
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        text="পূর্ববর্তী"
                        onClick={(e) => {
                          e.preventDefault();
                          if (safeCurrentPage > 1) {
                            setCurrentPage(safeCurrentPage - 1);
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
                              setCurrentPage(page);
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
                            setCurrentPage(safeCurrentPage + 1);
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

      {/* Import Questions Dialog */}
      <ResponsiveDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        title="JSON থেকে প্রশ্ন ইমপোর্ট করুন"
        description="নমুনা ফরম্যাট কপি করে অথবা .json ফাইল আপলোড/পেস্ট করে এক ক্লিকে প্রশ্নসমূহ যুক্ত করুন।"
        className="sm:max-w-2xl"
      >
        <ImportQuestionsForm
          chapterId={chapterId}
          topicId={selectedTopic || topicId || undefined}
          topicName={displayName}
          onSuccess={() => setIsImportOpen(false)}
          onCancel={() => setIsImportOpen(false)}
        />
      </ResponsiveDialog>

      {/* New Question Dialog */}
      <ResponsiveDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title={`${displayName} এ নতুন প্রশ্ন`}
        description="প্রশ্নের ধরন, বিবরণ ও উত্তর লিখুন।"
        className="sm:max-w-2xl"
      >
        <NewQuestionForm
          subjectId={subjectId}
          chapterId={chapterId}
          onSuccess={() => setIsCreateOpen(false)}
          onCancel={() => setIsCreateOpen(false)}
        />
      </ResponsiveDialog>

      {/* Edit Question Dialog */}
      <ResponsiveDialog
        open={Boolean(editingQuestion)}
        onOpenChange={(open) => {
          if (!open) setEditingQuestion(null);
        }}
        title="প্রশ্ন এডিট করুন"
        description="প্রশ্নের ধরন, বিবরণ, অপশন বা উত্তর সংশোধন করুন।"
        className="sm:max-w-2xl"
      >
        {editingQuestion && (
          <EditQuestionForm
            question={editingQuestion}
            onSuccess={() => setEditingQuestion(null)}
            onCancel={() => setEditingQuestion(null)}
          />
        )}
      </ResponsiveDialog>
    </div>
  );
}
