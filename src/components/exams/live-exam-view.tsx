"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ExamOverviewDialog } from "@/components/exams/exam-overview-dialog";
import { ExamSubmitDialog } from "@/components/exams/exam-submit-dialog";
import { Eye } from "@/components/icons";
import { UniversalQuestionCard } from "@/components/shared/UniversalQuestionCard";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitExam } from "@/hooks/use-exam";
import type { ExamDetail } from "@/types";

interface LiveExamViewProps {
  exam: ExamDetail;
  submissionId: string;
  initialTimeLeft: number;
}

export function LiveExamView({
  exam,
  submissionId,
  initialTimeLeft,
}: LiveExamViewProps) {
  const router = useRouter();
  const submitExamMutation = useSubmitExam();

  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);
  const [answers, setAnswers] = useState<
    Record<string, { selectedOptionId?: string; cqAnswerText?: string }>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const examQuestions = exam.examQuestions || [];
  const totalQuestionsCount = examQuestions.length;

  const answeredCount = examQuestions.filter((eq) =>
    Boolean(
      answers[eq.id]?.selectedOptionId || answers[eq.id]?.cqAnswerText?.trim(),
    ),
  ).length;

  const unansweredCount = totalQuestionsCount - answeredCount;

  const prepareSubmitPayload = () => {
    return Object.entries(answers).map(([examQuestionId, ans]) => ({
      examQuestionId,
      selectedOptionId: ans.selectedOptionId,
      cqAnswerText: ans.cqAnswerText,
    }));
  };

  const executeFinalSubmit = async (isAuto = false) => {
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const totalTimeTaken = isAuto
      ? exam.durationMinutes * 60
      : exam.durationMinutes * 60 - timeLeft;

    const res = await submitExamMutation.mutateAsync({
      submissionId,
      responses: prepareSubmitPayload(),
      timeTakenSeconds: totalTimeTaken,
    });

    if (res.success) {
      router.replace(`/exams/${exam.slug}/result?sid=${submissionId}`);
    } else {
      alert(`সাবমিট করতে সমস্যা হয়েছে: ${res.error}`);
      setIsSubmitting(false);
    }
  };

  const executeFinalSubmitRef = useRef(executeFinalSubmit);

  useEffect(() => {
    executeFinalSubmitRef.current = executeFinalSubmit;
  });

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!isSubmitting) executeFinalSubmitRef.current(true);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (!isSubmitting) executeFinalSubmitRef.current(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, isSubmitting]);

  const toBanglaDigits = (str: string | number) => {
    const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(str).replace(
      /[0-9]/g,
      (digit) => bnDigits[Number(digit)] || digit,
    );
  };

  const formatTimerDigits = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return toBanglaDigits(`${pad(m)}:${pad(s)}`);
  };

  const handleSelectMcq = (examQuestionId: string, optionId: string) => {
    setAnswers((prev) => {
      const isAlreadySelected =
        prev[examQuestionId]?.selectedOptionId === optionId;
      return {
        ...prev,
        [examQuestionId]: {
          ...prev[examQuestionId],
          selectedOptionId: isAlreadySelected ? undefined : optionId,
        },
      };
    });
  };

  const handleCqTextChange = (examQuestionId: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [examQuestionId]: {
        ...prev[examQuestionId],
        cqAnswerText: text,
      },
    }));
  };

  const scrollToQuestion = (index: number) => {
    const el = document.getElementById(`exam-q-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const isTimeCritical = timeLeft < 300;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative selection:bg-primary/20 pb-28">
      {/* Top Fixed Sticky Header */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b px-4 py-3 sm:py-4 transition-all shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <h1 className="font-extrabold text-sm sm:text-base md:text-lg truncate tracking-tight">
              {exam.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                উত্তর: {toBanglaDigits(answeredCount)} /{" "}
                {toBanglaDigits(totalQuestionsCount)}
              </span>
              <span>•</span>
              <span>মোট মার্কস: {toBanglaDigits(exam.totalMarks)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOverviewOpen(true)}
              className="gap-1.5 rounded-xl font-bold text-xs h-9"
            >
              <Eye className="size-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">ওভারভিউ</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsConfirmSubmitOpen(true)}
              disabled={isSubmitting || submitExamMutation.isPending}
              className="rounded-xl font-bold text-xs px-4 h-9 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="size-3.5 mr-1.5" /> সাবমিট
                </>
              ) : (
                "জমা দিন"
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Question Scroll Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-2 sm:px-6 pt-3 sm:pt-6 flex flex-col gap-4 sm:gap-8">
        <div className="flex flex-col gap-3 sm:gap-6">
          {examQuestions.map((eq, idx) => {
            if (!eq.question) return null;
            const currentAns = answers[eq.id];
            const isCq = eq.question.type === "cq";

            return (
              <div
                key={eq.id}
                id={`exam-q-${idx}`}
                className="scroll-mt-20 flex flex-col gap-2.5 sm:gap-3"
              >
                <UniversalQuestionCard
                  question={eq.question}
                  questionIndex={idx}
                  selectedOptionId={currentAns?.selectedOptionId}
                  onSelectOption={(_qId, optId) =>
                    handleSelectMcq(eq.id, optId)
                  }
                  showCorrectAnswer={false}
                  hideExplanation={true}
                  hideControls={true}
                  badgeText={`প্রশ্ন ${toBanglaDigits(idx + 1)} • ${toBanglaDigits(eq.marks)} মার্কস`}
                />

                {isCq && (
                  <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2">
                    <label
                      htmlFor={`cq-answer-${eq.id}`}
                      className="text-xs sm:text-sm font-bold text-muted-foreground flex items-center justify-between"
                    >
                      <span>আপনার লিখিত উত্তর লিখুন:</span>
                      <span className="text-[11px] font-normal opacity-70">
                        {currentAns?.cqAnswerText?.length || 0} অক্ষর
                      </span>
                    </label>
                    <Textarea
                      id={`cq-answer-${eq.id}`}
                      rows={5}
                      placeholder="এখানে আপনার বিস্তারিত সমাধান বা উত্তর লিখুন..."
                      value={currentAns?.cqAnswerText || ""}
                      onChange={(e) =>
                        handleCqTextChange(eq.id, e.target.value)
                      }
                      className="rounded-xl resize-y text-xs sm:text-sm leading-relaxed"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* End of questions helper card */}
        <div className="mt-6 border border-dashed border-border/80 rounded-2xl p-6 sm:p-8 bg-muted/20 text-center flex flex-col items-center justify-center gap-3">
          <div className="space-y-1">
            <h3 className="font-bold text-sm sm:text-base text-foreground">
              পরীক্ষা সম্পন্ন করতে প্রস্তুত?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              মোট {toBanglaDigits(totalQuestionsCount)} টির মধ্যে{" "}
              {toBanglaDigits(answeredCount)} টি প্রশ্নের উত্তর দেওয়া হয়েছে।
            </p>
          </div>
          <Button
            onClick={() => setIsConfirmSubmitOpen(true)}
            disabled={isSubmitting || submitExamMutation.isPending}
            className="w-full sm:w-auto rounded-xl px-8 h-11 font-bold text-sm shadow-md"
          >
            {isSubmitting || submitExamMutation.isPending ? (
              <>
                <Spinner className="size-4 mr-2" /> সাবমিট হচ্ছে...
              </>
            ) : (
              "পরীক্ষা জমা দিন"
            )}
          </Button>
        </div>
      </main>

      {/* Floating Control Capsule (Timer + Eye Button) */}
      <div className="fixed bottom-6 right-4 sm:right-8 z-30 flex items-center gap-3 pl-4 sm:pl-5 pr-2 py-2 bg-card/95 backdrop-blur-xl border border-border/80 rounded-full shadow-xl hover:shadow-2xl transition-all">
        {/* Floating Timer */}
        <span
          className={`font-sans font-bold text-base sm:text-lg min-w-[70px] sm:min-w-[80px] text-center tracking-wide select-none tabular-nums transition-colors ${
            isTimeCritical
              ? "text-red-500 animate-pulse font-extrabold"
              : "text-foreground"
          }`}
        >
          {formatTimerDigits(timeLeft)}
        </span>

        {/* Eye/Overview Trigger */}
        <Button
          type="button"
          size="icon"
          variant="secondary"
          onClick={() => setIsOverviewOpen(true)}
          className="size-9 sm:size-10 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all"
        >
          <Eye className="size-4 sm:size-5" />
        </Button>
      </div>

      {/* Overview Modal */}
      <ExamOverviewDialog
        isOpen={isOverviewOpen}
        onOpenChange={setIsOverviewOpen}
        examQuestions={examQuestions}
        answers={answers}
        answeredCount={answeredCount}
        unansweredCount={unansweredCount}
        totalQuestionsCount={totalQuestionsCount}
        toBanglaDigits={toBanglaDigits}
        onScrollToQuestion={scrollToQuestion}
        onSubmitClick={() => setIsConfirmSubmitOpen(true)}
        isSubmitting={isSubmitting}
      />

      {/* Submit Confirmation Modal */}
      <ExamSubmitDialog
        isOpen={isConfirmSubmitOpen}
        onOpenChange={setIsConfirmSubmitOpen}
        answeredCount={answeredCount}
        unansweredCount={unansweredCount}
        totalQuestionsCount={totalQuestionsCount}
        toBanglaDigits={toBanglaDigits}
        onConfirmSubmit={() => executeFinalSubmit(false)}
        isSubmitting={isSubmitting || submitExamMutation.isPending}
      />
    </div>
  );
}
