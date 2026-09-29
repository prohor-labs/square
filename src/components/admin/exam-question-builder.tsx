"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Add,
  ArrowLeft2,
  Category,
  DocumentDownload,
  Eye,
  FileDown,
  Flash,
  Search,
  TaskSquare,
  TickCircle,
  Trash2,
} from "@/components/icons";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { UniversalQuestionCard } from "@/components/shared/UniversalQuestionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  addMultipleQuestionsToExamAction,
  addQuestionToExamAction,
  importQuestionsDirectlyToExamAction,
  removeQuestionFromExamAction,
  reorderExamQuestionsAction,
  togglePublishExamAction,
} from "@/lib/actions/admin-exam";
import type { HierarchyContainer } from "@/lib/actions/universal-qb";
import type { ExamDetail, ExamQuestion, Question } from "@/types";

interface ExamWithQuestions extends ExamDetail {
  examQuestions: ExamQuestion[];
}

interface ExamQuestionBuilderProps {
  exam: ExamWithQuestions;
  questions: Question[];
  hierarchy?: HierarchyContainer[];
}

export function ExamQuestionBuilder({
  exam,
  questions,
  hierarchy = [],
}: ExamQuestionBuilderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [isPublished, setIsPublished] = useState(Boolean(exam.isPublished));

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("all");
  const [selectedChapterId, setSelectedChapterId] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  // Selection for bulk adding
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // JSON Import Modal State
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonTargetChapter, setJsonTargetChapter] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonImporting, setJsonImporting] = useState(false);

  // Extract all subjects and chapters from hierarchy for filters
  const { allSubjects, allChapters } = useMemo(() => {
    const subs: Array<{ id: string; name: string }> = [];
    const chaps: Array<{ id: string; name: string; subjectId: string }> = [];

    for (const container of hierarchy) {
      for (const sub of container.subjects || []) {
        subs.push({ id: sub.id, name: sub.name });
        for (const ch of sub.chapters || []) {
          chaps.push({ id: ch.id, name: ch.name, subjectId: sub.id });
        }
      }
    }

    return { allSubjects: subs, allChapters: chaps };
  }, [hierarchy]);

  // Filtered chapters based on selected subject
  const availableChapters = useMemo(() => {
    if (selectedSubjectId === "all") return allChapters;
    return allChapters.filter((c) => c.subjectId === selectedSubjectId);
  }, [allChapters, selectedSubjectId]);

  const assignedQuestionIds = useMemo(
    () => new Set(exam.examQuestions.map((eq) => eq.questionId)),
    [exam.examQuestions],
  );

  const availableQuestions = useMemo(() => {
    const allowedChapterIds =
      selectedSubjectId !== "all"
        ? new Set(availableChapters.map((c) => c.id))
        : null;

    return questions.filter((q) => {
      if (assignedQuestionIds.has(q.id)) return false;

      if (selectedType !== "all" && q.type !== selectedType) return false;

      if (selectedChapterId !== "all") {
        if (q.subitemId !== selectedChapterId) return false;
      } else if (allowedChapterIds !== null) {
        if (!q.subitemId || !allowedChapterIds.has(q.subitemId)) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const textMatch = q.questionText?.toLowerCase().includes(query);
        const sourceMatch = q.source?.toLowerCase().includes(query);
        if (!textMatch && !sourceMatch) return false;
      }

      return true;
    });
  }, [
    questions,
    assignedQuestionIds,
    selectedType,
    selectedSubjectId,
    selectedChapterId,
    availableChapters,
    searchQuery,
  ]);

  // Bulk toggle
  const toggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const selectAllFiltered = () => {
    if (selectedQuestionIds.length === availableQuestions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(availableQuestions.map((q) => q.id));
    }
  };

  // Add Single Question
  async function handleAddQuestion(questionId: string) {
    setLoading(true);
    const nextOrderNo = exam.examQuestions.length + 1;
    await addQuestionToExamAction(exam.id, questionId, nextOrderNo, 1);
    setLoading(false);
    router.refresh();
  }

  // Add Bulk Questions
  async function handleAddSelectedQuestions() {
    if (!selectedQuestionIds.length) return;
    setLoading(true);
    await addMultipleQuestionsToExamAction(exam.id, selectedQuestionIds);
    setSelectedQuestionIds([]);
    setLoading(false);
    router.refresh();
  }

  // Move / Reorder
  async function handleMove(index: number, direction: "up" | "down") {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === exam.examQuestions.length - 1) return;

    const newArr = [...exam.examQuestions];
    const swapIdx = direction === "up" ? index - 1 : index + 1;

    const temp = newArr[index];
    newArr[index] = newArr[swapIdx];
    newArr[swapIdx] = temp;

    setLoading(true);
    await reorderExamQuestionsAction(
      exam.id,
      newArr.map((eq) => eq.id),
    );
    setLoading(false);
    router.refresh();
  }

  // Toggle Publish
  async function handleTogglePublish() {
    setPublishLoading(true);
    const nextState = !isPublished;
    const res = await togglePublishExamAction(exam.id, nextState);
    if (res.success) {
      setIsPublished(nextState);
    }
    setPublishLoading(false);
    router.refresh();
  }

  // JSON / CSV Import Handler
  async function handleJsonImport(e: React.FormEvent) {
    e.preventDefault();
    setJsonError(null);

    const trimmed = jsonText.trim();
    if (!trimmed) {
      setJsonError("দয়া করে JSON অথবা CSV ডেটা পেস্ট করুন।");
      return;
    }

    let list: any[] = [];

    // Check if input is CSV format
    if (!trimmed.startsWith("[") && !trimmed.startsWith("{") && trimmed.includes(",")) {
      try {
        const { parseQuestionsCsv } = await import("@/lib/csv-parser");
        const parsedCsv = parseQuestionsCsv(trimmed);
        if (parsedCsv && parsedCsv.length > 0) {
          list = parsedCsv;
        }
      } catch {
        // fallback to json parser
      }
    }

    if (!list.length) {
      let parsed: any;
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        // Try CSV fallback
        try {
          const { parseQuestionsCsv } = await import("@/lib/csv-parser");
          const parsedCsv = parseQuestionsCsv(trimmed);
          if (parsedCsv && parsedCsv.length > 0) {
            list = parsedCsv;
          } else {
            throw new Error();
          }
        } catch {
          setJsonError("ভুল JSON বা CSV ফরম্যাট! দয়া করে সঠিক ভ্যালিড JSON অথবা CSV পেস্ট করুন।");
          return;
        }
      }

      if (parsed) {
        if (Array.isArray(parsed)) {
          list = parsed;
        } else if (parsed && typeof parsed === "object") {
          if (Array.isArray(parsed.questions)) {
            list = parsed.questions;
          } else if (Array.isArray(parsed.data)) {
            list = parsed.data;
          } else {
            list = [parsed];
          }
        }
      }
    }

    if (!list.length) {
      setJsonError("ফাইল বা টেক্সটে কোনো প্রশ্ন পাওয়া যায়নি।");
      return;
    }

    setJsonImporting(true);
    const res = await importQuestionsDirectlyToExamAction(
      exam.id,
      list,
      jsonTargetChapter || undefined,
    );
    setJsonImporting(false);

    if (res.success) {
      setJsonModalOpen(false);
      setJsonText("");
      router.refresh();
    } else {
      setJsonError(res.error || "প্রশ্ন ইমপোর্ট করতে ব্যর্থ হয়েছে।");
    }
  }


  const totalCalculatedMarks = exam.examQuestions.reduce(
    (acc, curr) => acc + (curr.marks || 1),
    0,
  );

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-12 pt-2 md:py-6 gap-6">
      {/* Top Banner / Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-card border border-border/80 rounded-2xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/exams"
              className="p-1.5 rounded-lg border hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            >
              <ArrowLeft2 className="size-4" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {exam.title}
            </h1>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                isPublished
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
              }`}
            >
              {isPublished ? "Published" : "Draft"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-3 pt-0.5">
            <span>মোট প্রশ্ন: <b>{exam.examQuestions.length} টি</b></span>
            <span>•</span>
            <span>নির্ধারিত মোট মার্কস: <b>{exam.totalMarks}</b> (যোগকৃত: {totalCalculatedMarks})</span>
            <span>•</span>
            <span>সময়: <b>{exam.durationMinutes} মিনিট</b></span>
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={() => setJsonModalOpen(true)}
            className="rounded-xl gap-1.5 font-bold cursor-pointer text-xs h-9 sm:h-10"
          >
            <Flash className="size-3.5 text-amber-500" />
            সরাসরি JSON প্রশ্ন ইনপুট
          </Button>

          <Button
            type="button"
            onClick={handleTogglePublish}
            disabled={publishLoading}
            variant={isPublished ? "outline" : "default"}
            className={`rounded-xl gap-1.5 font-extrabold cursor-pointer text-xs sm:text-sm h-9 sm:h-10 ${
              isPublished
                ? "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {publishLoading ? (
              <Spinner className="size-4" />
            ) : isPublished ? (
              <>
                <TickCircle className="size-4" /> এক্সাম প্রকাশিত (Unpublish)
              </>
            ) : (
              <>
                <Eye className="size-4" /> এখনই পাবলিশ করুন
              </>
            )}
          </Button>

          <Button
            render={<Link href="/admin/exams" />}
            variant="secondary"
            className="rounded-xl font-bold text-xs h-9 sm:h-10"
          >
            সম্পন্ন
          </Button>
        </div>
      </div>

      {/* Main Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Filterable Question Bank (Col Span 7) */}
        <div className="lg:col-span-7 flex flex-col border border-border/80 rounded-2xl bg-card overflow-hidden shadow-2xs">
          {/* Header & Filter Controls */}
          <div className="p-4 border-b space-y-3 bg-muted/20">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Category className="size-4 text-primary" />
                <h3 className="font-bold text-sm">
                  প্রশ্ন ব্যাংক ({availableQuestions.length} টি প্রশ্ন পাওয়া গেছে)
                </h3>
              </div>

              {availableQuestions.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={selectAllFiltered}
                    className="text-xs h-8 px-2.5 rounded-lg font-semibold"
                  >
                    {selectedQuestionIds.length === availableQuestions.length
                      ? "সব বাতিল"
                      : "সব নির্বাচন"}
                  </Button>
                  {selectedQuestionIds.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddSelectedQuestions}
                      disabled={loading}
                      className="text-xs h-8 px-3 rounded-lg font-bold gap-1 cursor-pointer"
                    >
                      <Add className="size-3.5" />
                      যুক্ত করুন ({selectedQuestionIds.length})
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Filter Row 1: Search & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-8 relative">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="প্রশ্নের বিষয়বস্তু বা উৎস দিয়ে খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs rounded-xl"
                />
              </div>
              <div className="sm:col-span-4">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border bg-background text-xs"
                >
                  <option value="all">সকল ধরন (All)</option>
                  <option value="mcq">MCQ</option>
                  <option value="cq">CQ / সৃজনশীল</option>
                </select>
              </div>
            </div>

            {/* Filter Row 2: Subject & Chapter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setSelectedChapterId("all");
                }}
                className="w-full h-9 px-3 rounded-xl border bg-background text-xs"
              >
                <option value="all">সকল বিষয় (All Subjects)</option>
                {allSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedChapterId}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border bg-background text-xs"
              >
                <option value="all">সকল অধ্যায় (All Chapters)</option>
                {availableChapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Question List */}
          <div className="max-h-[620px] overflow-y-auto p-4 space-y-4">
            {availableQuestions.map((q) => {
              const isSelected = selectedQuestionIds.includes(q.id);
              return (
                <div
                  key={q.id}
                  className={`rounded-2xl transition-all ${
                    isSelected
                      ? "ring-2 ring-primary ring-offset-2 bg-primary/5"
                      : ""
                  }`}
                >
                  <UniversalQuestionCard
                    question={q}
                    minimal={false}
                    showCorrectAnswer={true}
                    headerActions={
                      <div className="flex items-center gap-2">
                        <label
                          className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer bg-muted/60 hover:bg-muted px-2.5 py-1 rounded-lg border border-border/50 select-none"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectQuestion(q.id)}
                            className="size-3.5 rounded cursor-pointer text-primary"
                          />
                          <span>সিলেক্ট</span>
                        </label>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddQuestion(q.id);
                          }}
                          disabled={loading}
                          className="h-7 px-3 rounded-lg text-xs font-bold shrink-0 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <Add className="size-3 mr-1" /> যোগ
                        </Button>
                      </div>
                    }
                  />
                </div>
              );
            })}

            {availableQuestions.length === 0 && (
              <div className="text-center text-muted-foreground py-16 space-y-2">
                <Category className="size-10 mx-auto text-muted-foreground/40" />
                <p className="text-sm font-bold text-foreground">
                  কোনো প্রশ্ন অবশিষ্ট বা খুঁজে পাওয়া যায়নি
                </p>
                <p className="text-xs max-w-xs mx-auto">
                  ফিল্টার পরিবর্তন করুন অথবা সরাসরি JSON ইনপুট বাটন ব্যবহার করে নতুন প্রশ্ন যুক্ত করুন।
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Selected Exam Questions (Col Span 5) */}
        <div className="lg:col-span-5 flex flex-col border border-border/80 rounded-2xl bg-card overflow-hidden shadow-2xs">
          <div className="p-4 border-b font-bold bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TaskSquare className="size-4 text-primary" />
              <span>এই পরীক্ষার প্রশ্নসমূহ ({exam.examQuestions.length})</span>
            </div>
            <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              মোট মার্কস: {totalCalculatedMarks}
            </span>
          </div>

          <div className="max-h-[620px] overflow-y-auto p-4 space-y-4">
            {exam.examQuestions.map((eq, idx) => {
              if (!eq.question) return null;
              return (
                <div key={eq.id} className="relative">
                  <UniversalQuestionCard
                    question={eq.question}
                    questionIndex={idx}
                    minimal={false}
                    showCorrectAnswer={true}
                    badgeText={`প্রশ্ন ${idx + 1} (মার্কস: ${eq.marks})`}
                    headerActions={
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center bg-muted/60 rounded-lg p-0.5 border border-border/50">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => handleMove(idx, "up")}
                            disabled={idx === 0 || loading}
                          >
                            ▲
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => handleMove(idx, "down")}
                            disabled={
                              idx === exam.examQuestions.length - 1 || loading
                            }
                          >
                            ▼
                          </Button>
                        </div>
                        <DeleteConfirmDialog
                          title="প্রশ্ন ডিলিট নিশ্চিতকরণ"
                          description="আপনি কি নিশ্চিত এই পরীক্ষা থেকে প্রশ্নটি সরাতে চান?"
                          onConfirm={async () => {
                            setLoading(true);
                            await removeQuestionFromExamAction(eq.id, exam.id);
                            setLoading(false);
                            router.refresh();
                          }}
                          trigger={
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={loading}
                              className="size-7 p-0 text-destructive hover:bg-destructive/10 cursor-pointer rounded-lg shrink-0"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          }
                        />
                      </div>
                    }
                  />
                </div>
              );
            })}

            {exam.examQuestions.length === 0 && (
              <div className="text-center text-muted-foreground py-16 space-y-2">
                <TaskSquare className="size-10 mx-auto text-muted-foreground/40" />
                <p className="text-sm font-bold text-foreground">
                  কোনো প্রশ্ন এখনো যোগ করা হয়নি
                </p>
                <p className="text-xs">
                  বাম পাশ থেকে প্রশ্ন সিলেক্ট করে যোগ করুন অথবা সরাসরি JSON ইনপুট করুন।
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* JSON / CSV Import Dialog */}
      <ResponsiveDialog
        open={jsonModalOpen}
        onOpenChange={setJsonModalOpen}
        title="সরাসরি JSON বা CSV প্রশ্ন ইনপুট ও এক্সামে যুক্ত করুন"
        description="JSON বা CSV ফরম্যাটে প্রশ্ন পেস্ট করে অথবা ফাইল আপলোড করে এক ক্লিকে প্রশ্ন তৈরি ও এই পরীক্ষায় যোগ করুন।"
        className="sm:max-w-[640px]"
      >
        <form onSubmit={handleJsonImport} className="space-y-4 py-2">
          {jsonError && (
            <div className="p-3 text-xs font-semibold rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
              {jsonError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="target-chap">অধ্যায় নির্বাচন (ঐচ্ছিক)</Label>
            <select
              id="target-chap"
              value={jsonTargetChapter}
              onChange={(e) => setJsonTargetChapter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border bg-background text-xs"
            >
              <option value="">ডিফল্ট / প্রথম অধ্যায়</option>
              {allChapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload Zone */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold">ফাইল আপলোড (.json / .csv)</Label>
            <div className="border border-dashed border-border/80 hover:border-primary/50 rounded-2xl p-3 flex items-center justify-between gap-3 bg-muted/15 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <FileDown className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground">
                    কম্পিউটার থেকে ফাইল সিলেক্ট করুন
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    .json বা .csv ফাইল সমর্থিত
                  </span>
                </div>
              </div>

              <input
                type="file"
                id="exam-file-input"
                accept=".json,.csv,application/json,text/csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const fileName = file.name.toLowerCase();
                  const reader = new FileReader();
                  reader.onload = async (event) => {
                    const content = event.target?.result as string;
                    if (!content) return;
                    if (fileName.endsWith(".csv") || file.type.includes("csv")) {
                      const { parseQuestionsCsv } = await import("@/lib/csv-parser");
                      const parsedCsv = parseQuestionsCsv(content);
                      if (parsedCsv && parsedCsv.length > 0) {
                        setJsonText(JSON.stringify(parsedCsv, null, 2));
                      } else {
                        setJsonText(content);
                      }
                    } else {
                      setJsonText(content);
                    }
                  };
                  reader.readAsText(file);
                }}
                className="hidden"
              />

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => document.getElementById("exam-file-input")?.click()}
                className="rounded-xl text-xs font-bold shrink-0 gap-1.5 h-8"
              >
                <DocumentDownload className="size-3.5" />
                <span>ফাইল সিলেক্ট</span>
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <Label htmlFor="json-input">অথবা JSON / CSV ডেটা পেস্ট করুন *</Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setJsonText(
                      JSON.stringify(
                        [
                          {
                            questionText: "ভেক্টর রাশির ডট গুণনের মান সর্বোচ্চ কখন হয়?",
                            type: "mcq",
                            standard: "HSC",
                            source: "Board Exam",
                            marks: 1,
                            explanation: "যখন মধ্যবর্তী কোণ 0 ডিগ্রি হয় তখন cos(0) = 1।",
                            mcqOptions: [
                              { optionText: "0° কোণে", isCorrect: true },
                              { optionText: "90° কোণে", isCorrect: false },
                              { optionText: "180° কোণে", isCorrect: false },
                              { optionText: "45° কোণে", isCorrect: false },
                            ],
                          },
                        ],
                        null,
                        2,
                      ),
                    );
                  }}
                  className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  JSON নমুনা
                </button>
                <span className="text-muted-foreground text-[10px]">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setJsonText(
                      `questions,option1,option2,option3,option4,answer,explanation,type,section
"লাইসোসোম প্রথম কে আবিষ্কার করেন?","Robert Brown","De Duve","Robert Hook","Camilo Golgi",2,"ডি ডুভ ১৯৫৫ সালে লাইসোসোম আবিষ্কার করেন।",mcq,Biology
"কোষের DNA তে নাইট্রোজেনাস ক্ষারগুলো কীভাবে সজ্জিত থাকে?","A=T এবং G≡C","A=T এবং C-G","A=G এবং C-T","C=T এবং A≡G",1,"DNA এর ক্ষারগুলো A=T ও G≡C দ্বারা যুক্ত থাকে।",mcq,Biology`,
                    );
                  }}
                  className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  CSV নমুনা
                </button>
              </div>
            </div>
            <Textarea
              id="json-input"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="JSON অ্যারে অথবা CSV ডেটা এখানে পেস্ট করুন..."
              required
              className="font-mono text-xs min-h-[200px] rounded-xl"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setJsonModalOpen(false)}
              disabled={jsonImporting}
              className="rounded-xl"
            >
              বাতিল
            </Button>
            <Button
              type="submit"
              disabled={jsonImporting}
              className="rounded-xl font-bold cursor-pointer"
            >
              {jsonImporting ? (
                <>
                  <Spinner className="mr-2" /> ইমপোর্ট হচ্ছে...
                </>
              ) : (
                "ইমপোর্ট ও এক্সামে যোগ করুন"
              )}
            </Button>
          </div>
        </form>
      </ResponsiveDialog>

    </div>
  );
}
